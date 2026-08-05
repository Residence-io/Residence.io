import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PropertyCreateButton } from './property-create-button';

const push = vi.fn();
const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

describe('PropertyCreateButton', () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.restoreAllMocks();
  });

  it('creates a property through the secured API and opens its detail page', async () => {
    const request = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'property-id' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    );
    render(<PropertyCreateButton csrfToken="csrf" />);

    fireEvent.click(screen.getByRole('button', { name: 'Add Property' }));
    fireEvent.change(screen.getByLabelText('Block'), {
      target: { value: 'B' },
    });
    fireEvent.change(screen.getByLabelText('Property Number'), {
      target: { value: '202' },
    });
    fireEvent.change(screen.getByLabelText('Property Type'), {
      target: { value: 'APARTMENT' },
    });
    fireEvent.change(screen.getByLabelText('Street'), {
      target: { value: 'Main Street' },
    });
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining('/properties'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
          'x-csrf-token': 'csrf',
        },
        body: JSON.stringify({
          block: 'B',
          street: 'Main Street',
          propertyNumber: '202',
          type: 'APARTMENT',
        }),
      }),
    );
    expect(push).toHaveBeenCalledWith('/admin/properties/property-id');
    expect(refresh).toHaveBeenCalled();
  });
});
