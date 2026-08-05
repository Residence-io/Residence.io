'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';

export function NotificationActions({
  csrfToken,
  mode,
  initial,
}: {
  csrfToken: string;
  mode: 'compose' | 'announcement' | 'preferences';
  initial?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const data = new FormData(event.currentTarget);
    let path = '/notifications/compose';
    let method = 'POST';
    let body: Record<string, unknown>;
    if (mode === 'preferences') {
      path = '/notifications/preferences';
      method = 'PATCH';
      body = {
        emailEnabled: data.get('emailEnabled') === 'on',
        smsEnabled: data.get('smsEnabled') === 'on',
        inAppEnabled: true,
        paymentReminders: data.get('paymentReminders') === 'on',
        generalAnnouncements: data.get('generalAnnouncements') === 'on',
        maintenanceUpdates: data.get('maintenanceUpdates') === 'on',
        complaintUpdates: data.get('complaintUpdates') === 'on',
        optionalEvents: data.get('optionalEvents') === 'on',
        preferredLanguage: String(data.get('preferredLanguage') || 'en'),
      };
    } else if (mode === 'announcement') {
      path = '/notifications/announcements';
      body = {
        subject: data.get('subject'),
        message: data.get('message'),
        category: data.get('category'),
        priority: data.get('emergency') === 'on' ? 'EMERGENCY' : 'NORMAL',
        channels: ['IN_APP'],
        audienceType: 'ALL_RESIDENTS',
        audienceCriteria: {},
        requiresAcknowledgment: data.get('requiresAcknowledgment') === 'on',
        emergency: data.get('emergency') === 'on',
        idempotencyKey: crypto.randomUUID(),
      };
    } else {
      body = {
        notificationType: 'CUSTOM_ADMINISTRATIVE_NOTIFICATION',
        subject: data.get('subject'),
        message: data.get('message'),
        channels: ['IN_APP'],
        userIds: String(data.get('userIds'))
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        priority: 'NORMAL',
        idempotencyKey: crypto.randomUUID(),
      };
    }
    const response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      setError(result?.message ?? 'The request could not be completed.');
      setBusy(false);
      return;
    }
    router.push(
      mode === 'preferences'
        ? '/resident/notifications'
        : mode === 'announcement'
          ? '/admin/announcements'
          : '/admin/notifications',
    );
    router.refresh();
  }
  const checked = (name: string) => initial?.[name] !== false;
  return (
    <form onSubmit={submit} className="space-y-4">
      {mode === 'preferences' ? (
        <>
          {[
            'emailEnabled',
            'smsEnabled',
            'paymentReminders',
            'generalAnnouncements',
            'maintenanceUpdates',
            'complaintUpdates',
            'optionalEvents',
          ].map((name) => (
            <label className="flex gap-3" key={name}>
              <input
                type="checkbox"
                name={name}
                defaultChecked={checked(name)}
              />
              {name.replace(/([A-Z])/g, ' $1')}
            </label>
          ))}
          <label className="block">
            Preferred language
            <input
              name="preferredLanguage"
              defaultValue={String(initial?.preferredLanguage ?? 'en')}
              className="mt-1 block rounded-xl border px-3 py-2"
            />
          </label>
        </>
      ) : (
        <>
          <label className="block">
            Subject
            <input
              required
              name="subject"
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <label className="block">
            Message
            <textarea
              required
              name="message"
              rows={8}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          {mode === 'compose' ? (
            <label className="block">
              Recipient user IDs (comma separated)
              <input
                required
                name="userIds"
                className="mt-1 w-full rounded-xl border px-3 py-2"
              />
            </label>
          ) : (
            <>
              <label className="block">
                Category
                <select
                  name="category"
                  className="mt-1 block rounded-xl border px-3 py-2"
                >
                  <option>GENERAL_INFORMATION</option>
                  <option>ROAD_MAINTENANCE</option>
                  <option>WATER_INTERRUPTION</option>
                  <option>SECURITY_NOTICE</option>
                  <option>EMERGENCY</option>
                </select>
              </label>
              <label className="flex gap-3">
                <input type="checkbox" name="requiresAcknowledgment" />
                Requires acknowledgment
              </label>
              <label className="flex gap-3">
                <input type="checkbox" name="emergency" />
                Emergency alert (restricted permission)
              </label>
            </>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <button
        disabled={busy}
        className="rounded-xl bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Confirm'}
      </button>
    </form>
  );
}
