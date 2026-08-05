import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  Public,
  RequirePermissions,
} from '../authorization/authorization.decorators';
import { CurrentUser } from '../authorization/current-user.decorator';
import type { RequestUser } from '../common/request-context';
import {
  DecisionDto,
  FinanceQueryDto,
  PaymentDto,
  RefundDto,
  ResidentPaymentDto,
} from './dto/finance.dto';
import { FinanceService } from './finance.service';
@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly finance: FinanceService) {}
  @Post() @RequirePermissions('PAYMENT_RECORD') record(
    @CurrentUser() user: RequestUser,
    @Body() dto: PaymentDto,
  ) {
    return this.finance.recordPayment(user, dto);
  }
  @Post('me') initiate(
    @CurrentUser() user: RequestUser,
    @Body() dto: ResidentPaymentDto,
  ) {
    return this.finance.recordPayment(user, dto, undefined);
  }
  @Public()
  @Post('provider-callbacks/development')
  providerCallback(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-provider-signature') signature?: string,
  ) {
    return this.finance.processProviderCallback(
      request.rawBody,
      signature ?? '',
    );
  }
  @Get() @RequirePermissions('BILLING_DUE_READ') list(
    @CurrentUser() user: RequestUser,
    @Query() query: FinanceQueryDto,
  ) {
    return this.finance.listPayments(user, query);
  }
  @Get(':id') detail(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.finance.payment(user, id);
  }
  @Post(':id/proof')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('proof', { limits: { files: 1, fileSize: 20_000_000 } }),
  )
  proof(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.finance.storeProof(user, id, file);
  }
  @Get(':id/proofs/:proofId')
  async downloadProof(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('proofId', ParseUUIDPipe) proofId: string,
    @Res() response: Response,
  ) {
    const file = await this.finance.downloadProof(user, id, proofId);
    response.setHeader('Content-Type', file.mediaType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName.replace(/["\r\n]/g, '_')}"`,
    );
    response.send(file.buffer);
  }
  @Post(':id/verify') @RequirePermissions('PAYMENT_VERIFY') verify(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.finance.verifyPayment(user, id);
  }
  @Post(':id/reject') @RequirePermissions('PAYMENT_VERIFY') reject(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionDto,
  ) {
    return this.finance.rejectPayment(user, id, dto.reason);
  }
  @Post(':id/reverse') @RequirePermissions('PAYMENT_REVERSE') reverse(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecisionDto,
  ) {
    return this.finance.reverse(user, id, dto.reason, dto.idempotencyKey);
  }
  @Post(':id/refunds') @RequirePermissions('PAYMENT_REVERSE') refund(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundDto,
  ) {
    return this.finance.refund(user, id, dto);
  }
}
