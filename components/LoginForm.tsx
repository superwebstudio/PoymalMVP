"use client";

import Image from 'next/image';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

interface LoginFormProps {
  initialError: string | null;
  nextPath: string;
}

interface ApiError {
  error?: string;
}

interface VerifyResponse extends ApiError {
  redirectTo?: string;
}

export function LoginForm({ initialError, nextPath }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  function getReferralCode(): string | null {
    const value = window.localStorage.getItem('referral_code');
    return value?.startsWith('FISH-') ? value : null;
  }

  function continueWithGoogle(): void {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ next: nextPath });
    const referralCode = getReferralCode();
    if (referralCode) {
      params.set('referralCode', referralCode);
    }
    window.location.assign(`/api/auth/google?${params.toString()}`);
  }

  async function requestCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as ApiError;

      if (!response.ok) {
        setError(data.error ?? 'Unable to send a sign-in code');
        return;
      }

      setStep('code');
    } catch {
      setError('Unable to send a sign-in code');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          email,
          next: nextPath,
          referralCode: getReferralCode(),
        }),
      });
      const data = (await response.json()) as VerifyResponse;

      if (!response.ok) {
        setError(data.error ?? 'Unable to complete sign-in');
        return;
      }

      window.localStorage.removeItem('referral_code');
      window.location.assign(data.redirectTo ?? '/');
    } catch {
      setError('Unable to complete sign-in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10 text-zinc-100">
      <section className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Image
            src="/logo-max.svg"
            alt="Poymal"
            width={180}
            height={72}
            priority
            className="mx-auto mb-7 h-auto w-40"
          />
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome to Poymal</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Sign in or create an account — same email flow either way.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/20">
          {step === 'email' ? (
            <div className="space-y-5">
              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
                  <path
                    fill="#4285F4"
                    d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.4a4.6 4.6 0 0 1-2 3v2.8h3.3c1.9-1.8 2.9-4.4 2.9-7.9Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.8c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.9A10 10 0 0 0 12 22Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.5 13.7a6 6 0 0 1 0-3.4V7.4H3.1a10 10 0 0 0 0 9.2l3.4-2.9Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 6.2c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3.1 7.4l3.4 2.9A5.9 5.9 0 0 1 12 6.2Z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-800" />
                <span className="text-xs uppercase tracking-wider text-zinc-500">or</span>
                <div className="h-px flex-1 bg-zinc-800" />
              </div>

              <form onSubmit={requestCode} className="space-y-3">
                <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-3 pl-11 pr-4 text-white outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Sending code…' : 'Email me a code'}
                </button>
                <p className="text-center text-xs text-zinc-500">
                  Works for both new and existing accounts.
                </p>
              </form>
            </div>
          ) : (
            <form onSubmit={verifyCode} className="space-y-5">
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setError(null);
                }}
                className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Use another email
              </button>

              <div>
                <h2 className="text-xl font-semibold text-white">Check your email</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Enter the sign-in code sent to <span className="text-zinc-200">{email}</span>.
                </p>
              </div>

              <div>
                <label htmlFor="code" className="mb-2 block text-sm font-medium text-zinc-300">
                  Sign-in code
                </label>
                <input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="000000"
                  required
                  minLength={6}
                  maxLength={8}
                  autoFocus
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-center text-2xl font-semibold tracking-[0.35em] text-white outline-none transition-colors placeholder:text-zinc-700 focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Continue'}
              </button>
            </form>
          )}

          {error ? (
            <p role="alert" className="mt-4 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-zinc-500">
          <ShieldCheck size={14} aria-hidden="true" />
          Secure sign-in. No password required.
        </p>
      </section>
    </main>
  );
}
