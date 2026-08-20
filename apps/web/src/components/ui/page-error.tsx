'use client';

import { CircleAlert } from 'lucide-react';

export function PageError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <CircleAlert aria-hidden className="mx-auto text-red-600" size={30} />
      <h1 className="mt-4 text-xl font-bold text-slate-950">
        This page could not be loaded
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        The data service did not respond as expected. Your records were not
        changed.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        Try again
      </button>
    </div>
  );
}
