'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { generateTemporaryPassword } from './resident-registration-form';

const field =
  'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-950';

type ResidentActionsProps = {
  residentId: string;
  csrfToken: string;
  residentStatus: string;
  hasActiveOccupancy: boolean;
  hasActiveCard: boolean;
  cardOutdated: boolean;
  hasProfilePhotograph: boolean;
  hasAccount: boolean;
  accountStatus?: string;
  accountEmail?: string;
  accountUsername?: string;
  canUpdate: boolean;
  canManageStatus: boolean;
  canArchive: boolean;
  canManageDocuments: boolean;
  canManageCard: boolean;
};

export function ResidentActions(props: ResidentActionsProps) {
  const {
    residentId,
    csrfToken,
    residentStatus,
    hasActiveCard,
    hasActiveOccupancy,
    hasProfilePhotograph,
    hasAccount,
    accountStatus,
    accountEmail,
    accountUsername,
    canUpdate,
    canManageStatus,
    canArchive,
    canManageDocuments,
    canManageCard,
  } = props;
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    email: string;
    password: string;
  } | null>(null);
  const router = useRouter();

  async function post(
    path: string,
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(
        `${API_URL}/residents/${residentId}/${path}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify(body),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) throw new Error(result.message ?? 'Action failed.');
      setMessage(successMessage);
      setTemporaryPassword('');
      setShowPassword(false);
      setShowAccountForm(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhotograph(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    form.set('category', 'PROFILE_PHOTOGRAPH');
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(
        `${API_URL}/residents/${residentId}/documents`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'x-csrf-token': csrfToken },
          body: form,
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) throw new Error(result.message ?? 'Upload failed.');
      setMessage(
        hasProfilePhotograph
          ? 'Resident photograph replaced successfully.'
          : 'Resident photograph added successfully.',
      );
      formElement.reset();
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  function generatePassword() {
    setTemporaryPassword(generateTemporaryPassword());
    setShowPassword(true);
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950"
          role="status"
        >
          {message}
        </p>
      )}

      {canUpdate && !hasAccount && (
        <Card>
          <h2 className="font-bold">Create login account</h2>
          <p className="mt-1 text-sm text-slate-600">
            No login account exists for this resident.
          </p>
          {!showAccountForm ? (
            <Button className="mt-4" onClick={() => setShowAccountForm(true)}>
              Create Login Account
            </Button>
          ) : (
            <form
              className="mt-4 grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const uname = String(data.get('username') ?? '');
                const uemail = String(data.get('email') ?? '');
                setBusy(true);
                setMessage('');
                try {
                  const response = await fetch(
                    `${API_URL}/residents/${residentId}/account`,
                    {
                      method: 'POST',
                      credentials: 'include',
                      headers: {
                        'content-type': 'application/json',
                        'x-csrf-token': csrfToken,
                      },
                      body: JSON.stringify({
                        username: uname,
                        email: uemail,
                        active: data.get('active') === 'on',
                        temporaryPassword,
                      }),
                    },
                  );
                  const result = (await response.json().catch(() => ({}))) as {
                    message?: string;
                  };
                  if (!response.ok)
                    throw new Error(
                      result.message ?? 'Account creation failed.',
                    );
                  setCreatedCredentials({
                    username: uname,
                    email: uemail,
                    password: temporaryPassword,
                  });
                  setShowPassword(true);
                  setShowAccountForm(false);
                  setMessage('');
                  router.refresh();
                } catch (err) {
                  setMessage(
                    err instanceof Error ? err.message : 'Action failed.',
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Username
                <input
                  className={field}
                  name="username"
                  pattern="[A-Za-z0-9._-]{3,100}"
                  required
                />
              </label>
              <label>
                Account email
                <input
                  className={field}
                  name="email"
                  type="email"
                  defaultValue={accountEmail}
                  required
                />
              </label>
              <label className="md:col-span-2">
                Temporary password
                <input
                  className={field}
                  type={showPassword ? 'text' : 'password'}
                  value={temporaryPassword}
                  onChange={(event) => setTemporaryPassword(event.target.value)}
                  minLength={12}
                  required
                  autoComplete="new-password"
                />
              </label>
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button type="button" onClick={generatePassword}>
                  {temporaryPassword
                    ? 'Regenerate Password'
                    : 'Generate Password'}
                </Button>
                <Button
                  type="button"
                  disabled={!temporaryPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
                <Button
                  type="button"
                  disabled={!temporaryPassword}
                  onClick={() =>
                    void navigator.clipboard.writeText(temporaryPassword)
                  }
                >
                  Copy
                </Button>
              </div>
              <label className="flex items-center gap-2 md:col-span-2">
                <input name="active" type="checkbox" defaultChecked />
                Activate account
              </label>
              <div className="flex gap-2 md:col-span-2">
                <Button disabled={busy || temporaryPassword.length < 12}>
                  Create Account
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setShowAccountForm(false);
                    setTemporaryPassword('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {canUpdate && hasAccount && (
        <Card>
          <h2 className="font-bold">Login account</h2>

          {/* Credentials display */}
          <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-slate-500">Email</span>
              <span className="font-mono">
                {createdCredentials?.email ?? accountEmail ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-slate-500">Username</span>
              <span className="font-mono">
                {createdCredentials?.username ?? accountUsername ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-slate-500">Password</span>
              <input
                className="min-h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1 font-mono text-sm"
                type={showPassword ? 'text' : 'password'}
                value={createdCredentials?.password ?? temporaryPassword ?? ''}
                readOnly
                placeholder="Generate a new temporary password below"
              />
              <button
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100"
                onClick={() => setShowPassword((v) => !v)}
                type="button"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <button
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-1 text-xs font-medium hover:bg-slate-100"
                onClick={() => {
                  const pw = createdCredentials?.password ?? temporaryPassword;
                  if (pw) void navigator.clipboard.writeText(pw);
                }}
                type="button"
              >
                Copy
              </button>
              <button
                className="shrink-0 rounded-lg bg-blue-700 px-3 py-1 text-xs font-medium text-white hover:bg-blue-800"
                onClick={() => {
                  const pw = generateTemporaryPassword();
                  setTemporaryPassword(pw);
                  if (createdCredentials)
                    setCreatedCredentials({
                      ...createdCredentials,
                      password: pw,
                    });
                  setShowPassword(true);
                }}
                type="button"
              >
                ↻ Regenerate
              </button>
            </div>
            {(createdCredentials?.password ?? temporaryPassword) && (
              <p className="text-xs text-amber-700">
                ⚠ Share this password securely — it cannot be retrieved later.
              </p>
            )}
          </div>

          {temporaryPassword && !createdCredentials && (
            <div className="mt-3">
              <Button
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt(
                    'Reason for setting the new temporary password',
                  );
                  if (reason)
                    void post(
                      'account/temporary-password',
                      { temporaryPassword, reason },
                      'A new temporary password was set and active sessions were revoked.',
                    );
                }}
              >
                Set Temporary Password
              </Button>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={busy} onClick={generatePassword}>
              {temporaryPassword
                ? 'Regenerate Temporary Password'
                : 'Generate New Temporary Password'}
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                const reason = window.prompt('Reason for revoking sessions');
                if (reason)
                  void post(
                    'account/revoke-sessions',
                    { reason },
                    'Resident sessions revoked successfully.',
                  );
              }}
            >
              Revoke Sessions
            </Button>
            <Button
              disabled={busy}
              onClick={() => {
                const reason = window.prompt(
                  'Reason for forcing password reset',
                );
                if (reason)
                  void post(
                    'account/force-password-reset',
                    { reason },
                    'Password reset required and active sessions revoked.',
                  );
              }}
            >
              Force Password Reset
            </Button>
            {accountStatus === 'ACTIVE' ? (
              <Button
                disabled={busy}
                onClick={() =>
                  void post(
                    'account/status/SUSPENDED',
                    { reason: 'Account made inactive by administrator' },
                    'Resident login account made inactive successfully.',
                  )
                }
              >
                Make Login Inactive
              </Button>
            ) : (
              <Button
                disabled={busy}
                onClick={() =>
                  void post(
                    'account/status/ACTIVE',
                    { reason: 'Account reactivated by administrator' },
                    'Resident login account activated successfully.',
                  )
                }
              >
                Activate Login Account
              </Button>
            )}
          </div>
          {temporaryPassword && (
            <div className="mt-4 max-w-xl">
              <label>
                New temporary password
                <input
                  className={field}
                  type={showPassword ? 'text' : 'password'}
                  value={temporaryPassword}
                  readOnly
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
                <Button
                  type="button"
                  onClick={() =>
                    void navigator.clipboard.writeText(temporaryPassword)
                  }
                >
                  Copy
                </Button>
                <Button
                  disabled={busy}
                  type="button"
                  onClick={() => {
                    const reason = window.prompt(
                      'Reason for setting the new temporary password',
                    );
                    if (reason)
                      void post(
                        'account/temporary-password',
                        { temporaryPassword, reason },
                        'A new temporary password was set and active sessions were revoked.',
                      );
                  }}
                >
                  Set Temporary Password
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {canManageStatus && (
        <Card>
          <h2 className="font-bold">Resident status</h2>
          <p className="mt-1 text-sm text-slate-600">
            Current status: <strong>{residentStatus}</strong>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {residentStatus === 'INACTIVE' && (
              <Button
                disabled={busy}
                onClick={() =>
                  void post(
                    'status/ACTIVE',
                    { reason: 'Activated by administrator' },
                    'Resident activated successfully.',
                  )
                }
              >
                Activate Resident
              </Button>
            )}
            {residentStatus === 'ACTIVE' && (
              <Button
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt(
                    'Reason for suspending resident',
                  );
                  if (reason)
                    void post(
                      'status/SUSPENDED',
                      { reason },
                      'Resident suspended successfully.',
                    );
                }}
              >
                Suspend Resident
              </Button>
            )}
            {residentStatus === 'SUSPENDED' && (
              <Button
                disabled={busy}
                onClick={() =>
                  void post(
                    'status/ACTIVE',
                    { reason: 'Reactivated by administrator' },
                    'Resident reactivated successfully.',
                  )
                }
              >
                Reactivate Resident
              </Button>
            )}
            {hasActiveOccupancy && (
              <Button
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt('Reason for move-out');
                  if (reason)
                    void post(
                      'status/MOVED_OUT',
                      { reason },
                      'Resident marked as moved out successfully.',
                    );
                }}
              >
                Mark as Moved Out
              </Button>
            )}
          </div>
        </Card>
      )}

      {canArchive && (
        <Card>
          <h2 className="font-bold">Archive resident</h2>
          <p className="mt-1 text-sm text-slate-600">
            Archiving removes the resident from active lists. This action cannot
            be undone easily.
          </p>
          <div className="mt-4">
            <Button
              disabled={busy || residentStatus === 'ACTIVE'}
              onClick={() => {
                const reason = window.prompt(
                  'Reason for archiving this resident',
                );
                if (reason)
                  void post(
                    'status/ARCHIVED',
                    { reason },
                    'Resident archived successfully.',
                  );
              }}
            >
              Archive Resident
            </Button>
            {residentStatus === 'ACTIVE' && (
              <p className="mt-2 text-sm text-slate-500">
                Resident must be inactive or moved out before archiving.
              </p>
            )}
          </div>
        </Card>
      )}

      {canManageCard && (
        <Card>
          <h2 className="font-bold">ID-card actions</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={busy}
              onClick={() =>
                void post(
                  'id-card',
                  {
                    reason: hasActiveCard
                      ? 'Administrator requested regeneration'
                      : 'Initial generation',
                  },
                  hasActiveCard
                    ? 'ID card regenerated successfully.'
                    : 'ID card generated successfully.',
                )
              }
            >
              {hasActiveCard ? 'Regenerate ID Card' : 'Generate ID Card'}
            </Button>
            {hasActiveCard && (
              <Button
                disabled={busy}
                onClick={() => {
                  const reason = window.prompt('Revocation reason');
                  if (reason)
                    void post(
                      'id-card/revoke',
                      { reason },
                      'ID card revoked successfully.',
                    );
                }}
              >
                Revoke ID Card
              </Button>
            )}
          </div>
          {canManageDocuments && (
            <form
              className="mt-4 flex flex-wrap gap-2"
              onSubmit={uploadPhotograph}
            >
              <input
                aria-label="Resident photograph"
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2"
                type="file"
                name="file"
                accept="image/png,image/jpeg"
                required
              />
              <Button disabled={busy}>
                {hasProfilePhotograph
                  ? 'Replace Resident Photograph'
                  : 'Add Resident Photograph'}
              </Button>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
