import Link from 'next/link';

export default function FollowsNotFound(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-center text-zinc-200">
      <p>Connections not found.</p>
      <Link
        href="/"
        className="rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500"
      >
        Go home
      </Link>
    </div>
  );
}
