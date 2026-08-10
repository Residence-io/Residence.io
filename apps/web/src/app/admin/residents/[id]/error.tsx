'use client';

export default function ResidentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 max-w-lg w-full">
        <h2 className="text-lg font-bold text-red-800">
          Failed to load resident
        </h2>
        <p className="mt-2 text-sm text-red-700">
          {error.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          className="mt-4 rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          onClick={reset}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
