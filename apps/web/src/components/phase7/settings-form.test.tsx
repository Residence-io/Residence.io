import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsForm } from './settings-form';

const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

describe('SettingsForm', () => {
  afterEach(() => vi.restoreAllMocks());

  it('submits the current optimistic-lock version and displays success', async () => {
    const request = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));
    render(
      <SettingsForm
        section="society"
        initial={{ name: 'Residence' }}
        version={3}
        fields={[{ name: 'name', label: 'Society name', required: true }]}
        csrfToken="csrf"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await screen.findByText('Settings saved and audited.');
    const init = request.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(init.body))).toMatchObject({ version: 3 });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });
});
