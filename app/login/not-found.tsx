import Link from 'next/link';

export default function LoginNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 text-zinc-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-white">Sign-in page not found</h1>
        <Link href="/login" className="mt-4 inline-block text-sky-400 hover:text-sky-300">
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
