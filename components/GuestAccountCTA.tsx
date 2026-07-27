'use client';

import Link from 'next/link';
import { BottomNav } from '@/components/BottomNav';

type GuestAccountCTAProps = {
  variant: 'log' | 'profile';
};

const COPY = {
  log: {
    title: 'Create an account to log your first catch.',
    body: 'Save species, weight, location, and build a fishing journal you can come back to.',
    cta: 'Create account',
  },
  profile: {
    title: 'Create an account to build your fishing journal.',
    body: 'Track your catches, follow anglers, and keep your spots and stats in one place.',
    cta: 'Create account',
  },
} as const;

function LogIllustration(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 320 220"
      className="mx-auto h-auto w-full max-w-sm"
      aria-hidden
    >
      <defs>
        <linearGradient id="logSky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0c4a6e" />
          <stop offset="100%" stopColor="#082f49" />
        </linearGradient>
        <linearGradient id="logWater" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="24" fill="url(#logSky)" />
      <path
        d="M0 140 C40 120, 80 160, 120 145 C160 130, 200 155, 240 140 C280 125, 300 145, 320 135 L320 220 L0 220 Z"
        fill="url(#logWater)"
      />
      <ellipse cx="210" cy="118" rx="54" ry="18" fill="#0369a1" opacity="0.45" />
      <path
        d="M150 112 C170 95, 210 95, 235 112 C250 122, 245 138, 225 142 C200 148, 165 145, 150 132 C142 124, 142 118, 150 112 Z"
        fill="#7dd3fc"
      />
      <path
        d="M235 112 L262 104 L248 122 Z"
        fill="#38bdf8"
      />
      <circle cx="168" cy="118" r="3" fill="#0f172a" />
      <path
        d="M95 70 L95 145"
        stroke="#94a3b8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M95 70 C120 70, 140 90, 150 112"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="95" cy="70" r="5" fill="#e2e8f0" />
    </svg>
  );
}

function ProfileIllustration(): React.JSX.Element {
  return (
    <svg
      viewBox="0 0 320 220"
      className="mx-auto h-auto w-full max-w-sm"
      aria-hidden
    >
      <defs>
        <linearGradient id="profileBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#14532d" />
          <stop offset="100%" stopColor="#052e16" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="24" fill="url(#profileBg)" />
      <rect x="48" y="42" width="224" height="148" rx="18" fill="#052e16" stroke="#166534" strokeWidth="2" />
      <circle cx="110" cy="95" r="28" fill="#15803d" />
      <circle cx="110" cy="95" r="18" fill="#86efac" />
      <rect x="152" y="78" width="96" height="10" rx="5" fill="#4ade80" opacity="0.9" />
      <rect x="152" y="98" width="72" height="8" rx="4" fill="#22c55e" opacity="0.55" />
      <rect x="70" y="140" width="54" height="28" rx="8" fill="#166534" />
      <rect x="134" y="140" width="54" height="28" rx="8" fill="#166534" />
      <rect x="198" y="140" width="54" height="28" rx="8" fill="#166534" />
      <text x="97" y="159" textAnchor="middle" fill="#86efac" fontSize="11" fontFamily="system-ui">12</text>
      <text x="161" y="159" textAnchor="middle" fill="#86efac" fontSize="11" fontFamily="system-ui">4.2</text>
      <text x="225" y="159" textAnchor="middle" fill="#86efac" fontSize="11" fontFamily="system-ui">8</text>
    </svg>
  );
}

export function GuestAccountCTA({
  variant,
}: GuestAccountCTAProps): React.JSX.Element {
  const copy = COPY[variant];
  const next = variant === 'log' ? '/log' : '/profile';

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 pb-[80px] text-zinc-100">
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-8">
          {variant === 'log' ? <LogIllustration /> : <ProfileIllustration />}
        </div>
        <h1 className="text-balance text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {copy.title}
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-zinc-400 sm:text-base">
          {copy.body}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="rounded-xl bg-sky-600 px-5 py-3.5 text-center text-base font-semibold text-white transition-colors hover:bg-sky-500"
          >
            {copy.cta}
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-3.5 text-center text-base font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            Browse the feed
          </Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
