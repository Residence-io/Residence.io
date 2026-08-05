import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResidentListDeleteButton } from './resident-list-delete-button';

const refresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

describe('ResidentListDeleteButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    refresh.mockReset();
  });

  it('confirms and archives the selected resident', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Duplicate demo resident');
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    render(
      <ResidentListDeleteButton
        csrfToken="csrf"
        residentId="14e6b1c0-1b6b-4a46-8808-c675dcf62058"
        residentName="Demo Resident"
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Delete Resident Demo Resident',
      }),
    );

    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    expect(request).toHaveBeenCalledWith(
      expect.stringContaining(
        '/residents/14e6b1c0-1b6b-4a46-8808-c675dcf62058/archive',
      ),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
