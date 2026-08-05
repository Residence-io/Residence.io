import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ComplaintSubmissionDto,
  MaintenanceSubmissionDto,
  RatingDto,
  TicketTransitionDto,
} from './dto/ticket.dto';

describe('Phase 5 ticket validation', () => {
  const validCategory = '11111111-1111-4111-8111-111111111111';
  it('accepts a valid complaint submission', async () =>
    expect(
      await validate(
        plainToInstance(ComplaintSubmissionDto, {
          categoryId: validCategory,
          subject: 'Noise concern',
          description: 'Sustained excessive noise after quiet hours.',
          urgency: 'NORMAL',
          privacy: 'RESTRICTED',
        }),
      ),
    ).toHaveLength(0));
  it('rejects short complaint content and unknown privacy', async () =>
    expect(
      (
        await validate(
          plainToInstance(ComplaintSubmissionDto, {
            categoryId: validCategory,
            subject: 'x',
            description: 'short',
            urgency: 'NORMAL',
            privacy: 'PUBLIC',
          }),
        )
      ).length,
    ).toBeGreaterThan(0));
  it('accepts a maintenance request with consent', async () =>
    expect(
      await validate(
        plainToInstance(MaintenanceSubmissionDto, {
          categoryId: validCategory,
          subject: 'Leaking pipe',
          description: 'Water is leaking beneath the kitchen sink.',
          exactLocation: 'Kitchen',
          urgency: 'HIGH',
          contactDisclosureConsent: true,
        }),
      ),
    ).toHaveLength(0));
  it('rejects invalid maintenance urgency', async () =>
    expect(
      (
        await validate(
          plainToInstance(MaintenanceSubmissionDto, {
            categoryId: validCategory,
            subject: 'Issue',
            description: 'A detailed maintenance problem is present.',
            exactLocation: 'Unit',
            urgency: 'CRITICAL',
            contactDisclosureConsent: false,
          }),
        )
      ).length,
    ).toBeGreaterThan(0));
  it('requires valid one-to-five ratings', async () =>
    expect(
      (
        await validate(
          plainToInstance(RatingDto, {
            overall: 6,
            serviceQuality: 5,
            timeliness: 5,
            professionalBehaviour: 5,
          }),
        )
      ).length,
    ).toBeGreaterThan(0));
  it('requires a reason and optimistic version for transitions', async () =>
    expect(
      (
        await validate(
          plainToInstance(TicketTransitionDto, { reason: '', version: -1 }),
        )
      ).length,
    ).toBeGreaterThan(0));
});
