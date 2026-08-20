import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResidentRelatedAddButton } from './resident-related-add-button';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResidentRelatedAddButton vehicle form', () => {
  it('submits only vehicle type, number plate, and name', async () => {
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    render(
      <ResidentRelatedAddButton
        csrfToken="csrf"
        kind="vehicle"
        residentId="14e6b1c0-1b6b-4a46-8808-c675dcf62058"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));
    fireEvent.change(screen.getByLabelText('Vehicle type'), {
      target: { value: 'CAR' },
    });
    fireEvent.change(screen.getByLabelText('Vehicle number plate'), {
      target: { value: 'ABC-123' },
    });
    fireEvent.change(screen.getByLabelText('Vehicle name'), {
      target: { value: 'Civic' },
    });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    const [, options] = request.mock.calls[0]!;
    expect(JSON.parse(String(options?.body))).toEqual({
      type: 'CAR',
      name: 'Civic',
      registrationNumber: 'ABC-123',
    });
  });
});
