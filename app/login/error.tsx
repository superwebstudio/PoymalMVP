"use client";

interface LoginErrorProps {
  reset: () => void;
}

export default function LoginError({ reset }: LoginErrorProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <h1 className="text-xl font-semibold text-white">Sign-in unavailable</h1>
        <p className="mt-2 text-sm text-zinc-400">The sign-in page could not be loaded.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-500"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
