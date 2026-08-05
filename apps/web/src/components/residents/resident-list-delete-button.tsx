'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api-client';

export function ResidentListDeleteButton({
  residentId,
  residentName,
  csrfToken,
}: {
  residentId: string;
  residentName: string;
  csrfToken: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function deleteResident() {
    const reason = window.prompt(`Reason for deleting ${residentName}`);
    if (!reason?.trim() || !window.confirm(`Delete ${residentName}?`)) return;

    setBusy(true);
    try {
      const response = await fetch(
        `${API_URL}/residents/${residentId}/archive`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({ reason: reason.trim() }),
        },
      );
      const result = (await response.json().catch(() => ({}))) as {
        message?: string;
      };
      if (!response.ok) {
        throw new Error(result.message ?? 'Resident could not be deleted.');
      }
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : 'Resident could not be deleted.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={`Delete Resident ${residentName}`}
      title="Delete Resident"
      disabled={busy}
      className="rounded p-1 text-red-700 hover:bg-red-50 disabled:opacity-50"
      onClick={() => void deleteResident()}
    >
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6V4h8v2" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19 6l-1 14H6L5 6"
        />
      </svg>
    </button>
  );
}
