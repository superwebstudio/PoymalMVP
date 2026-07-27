'use client';

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center text-zinc-200">
      <p>Could not load search.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500"
      >
        Try again
      </button>
    </div>
  );
}
