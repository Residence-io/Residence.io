import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateResidentDto } from './resident.dto';

const valid = {
  fullName: 'Resident Owner',
  primaryPhone: '+923001234567',
  unitId: '14e6b1c0-1b6b-4a46-8808-c675dcf62058',
  occupancyType: 'OWNER',
  moveInDate: '2026-07-14',
  monthlyFee: '5000.00',
  householdSize: 1,
};
describe('CreateResidentDto', () => {
  it('accepts an owner registration and rejects missing tenant fields', async () => {
    expect(
      await validate(plainToInstance(CreateResidentDto, valid)),
    ).toHaveLength(0);
    const errors = await validate(
      plainToInstance(CreateResidentDto, { ...valid, occupancyType: 'TENANT' }),
    );
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        'propertyOwnerName',
        'propertyOwnerPhone',
        'tenancyStartDate',
        'tenancyEndDate',
      ]),
    );
  });
  it('rejects malformed money and vehicle registrations', async () => {
    const errors = await validate(
      plainToInstance(CreateResidentDto, {
        ...valid,
        monthlyFee: '-1',
        vehicles: [{ type: 'Car', registrationNumber: '../bad' }],
      }),
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});
