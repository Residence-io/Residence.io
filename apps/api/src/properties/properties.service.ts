import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import type { RequestUser } from '../common/request-context';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePropertyDto,
  CreateUnitDto,
  PropertyQueryDto,
} from './dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: RequestUser, query: PropertyQueryDto) {
    const where: Prisma.PropertyWhereInput = {
      societyId: user.societyId,
      archivedAt: null,
      ...(query.block
        ? { block: { equals: query.block, mode: 'insensitive' } }
        : {}),
      ...(query.search
        ? {
            OR: [
              {
                propertyNumber: { contains: query.search, mode: 'insensitive' },
              },
              { street: { contains: query.search, mode: 'insensitive' } },
              {
                units: {
                  some: {
                    unitNumber: { contains: query.search, mode: 'insensitive' },
                  },
                },
              },
            ],
          }
        : {}),
    };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.property.count({ where }),
      this.prisma.property.findMany({
        where,
        include: {
          units: {
            where: { archivedAt: null },
            include: {
              occupancies: {
                where: { endDate: null },
                select: { residentId: true, occupancyType: true },
              },
            },
            orderBy: { unitNumber: 'asc' },
          },
        },
        orderBy: [{ block: 'asc' }, { propertyNumber: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async detail(user: RequestUser, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, societyId: user.societyId },
      include: {
        units: {
          include: {
            occupancies: {
              include: {
                resident: {
                  select: {
                    id: true,
                    residentNumber: true,
                    fullName: true,
                    status: true,
                  },
                },
              },
              orderBy: { startDate: 'desc' },
            },
          },
          orderBy: { unitNumber: 'asc' },
        },
      },
    });
    if (!property) throw new NotFoundException('Property not found.');
    return property;
  }

  async create(user: RequestUser, dto: CreatePropertyDto) {
    try {
      return await this.prisma.property.create({
        data: {
          societyId: user.societyId,
          block: dto.block.trim(),
          street: dto.street?.trim(),
          propertyNumber: dto.propertyNumber.trim(),
          normalizedAddressKey: this.addressKey(
            dto.block,
            dto.street,
            dto.propertyNumber,
          ),
          type: dto.type,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException('That property already exists.');
      throw error;
    }
  }

  async createUnit(user: RequestUser, dto: CreateUnitDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: dto.propertyId, societyId: user.societyId, active: true },
    });
    if (!property) throw new NotFoundException('Property not found.');
    try {
      return await this.prisma.unit.create({
        data: {
          propertyId: property.id,
          unitNumber: dto.unitNumber.trim(),
          normalizedUnitNumber: dto.unitNumber
            .replace(/\s+/g, '')
            .toUpperCase(),
          parkingInformation: dto.parkingInformation?.trim(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      )
        throw new ConflictException(
          'That unit already exists on the property.',
        );
      throw error;
    }
  }

  private addressKey(
    block: string,
    street: string | undefined,
    number: string,
  ) {
    return [block, street ?? '', number]
      .map((value) => value.replace(/\s+/g, '').toUpperCase())
      .join('|');
  }
}
