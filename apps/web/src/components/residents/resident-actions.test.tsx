import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResidentActions } from './resident-actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const base = {
  residentId: '14e6b1c0-1b6b-4a46-8808-c675dcf62058',
  csrfToken: 'csrf',
  residentStatus: 'ACTIVE',
  hasActiveOccupancy: true,
  hasActiveCard: false,
  cardOutdated: false,
  hasProfilePhotograph: false,
  hasAccount: false,
  canUpdate: true,
  canManageStatus: true,
  canArchive: true,
  canManageDocuments: true,
  canManageCard: true,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ResidentActions', () => {
  it('shows only actions valid for an active resident without an account or card', () => {
    render(<ResidentActions {...base} />);
    expect(
      screen.getByRole('button', { name: 'Create Login Account' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Generate ID Card' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Suspend' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Activate' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Revoke ID Card' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Action completed.')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Upload supporting document'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Lifecycle actions')).not.toBeInTheDocument();
  });

  it('shows replacement, regeneration, and revocation for current assets', () => {
    render(
      <ResidentActions
        {...base}
        accountStatus="ACTIVE"
        hasAccount
        hasActiveCard
        hasProfilePhotograph
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Replace Resident Photograph' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Regenerate ID Card' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Revoke ID Card' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Create Login Account' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Make Login Inactive' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Activate Login Account' }),
    ).not.toBeInTheDocument();
  });

  it('uploads a resident photograph from the ID-card actions', async () => {
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    render(<ResidentActions {...base} />);
    const photograph = new File(['photo'], 'resident.jpg', {
      type: 'image/jpeg',
    });

    const input = screen.getByLabelText('Resident photograph');
    fireEvent.change(input, {
      target: { files: [photograph] },
    });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    const [url, options] = request.mock.calls[0]!;
    expect(url).toContain(`/residents/${base.residentId}/documents`);
    expect(options?.method).toBe('POST');
    expect((options?.body as FormData).get('category')).toBe(
      'PROFILE_PHOTOGRAPH',
    );
    expect(options?.body).toBeInstanceOf(FormData);
  });

  it('activates a suspended login without asking for a reason', async () => {
    const prompt = vi.spyOn(window, 'prompt');
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    render(<ResidentActions {...base} accountStatus="SUSPENDED" hasAccount />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Activate Login Account' }),
    );

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    expect(prompt).not.toHaveBeenCalled();
    prompt.mockRestore();
    request.mockRestore();
  });

  it('suspends an active login without asking for a reason', async () => {
    const prompt = vi.spyOn(window, 'prompt');
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    render(<ResidentActions {...base} accountStatus="ACTIVE" hasAccount />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Make Login Inactive' }),
    );

    await waitFor(() => expect(request).toHaveBeenCalledOnce());
    expect(prompt).not.toHaveBeenCalled();
    prompt.mockRestore();
    request.mockRestore();
  });
});
