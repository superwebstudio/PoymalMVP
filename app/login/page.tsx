import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { getCurrentUser } from '@/lib/get-current-user';
import { getSafeRedirect } from '@/lib/supabase-auth-server';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    next?: string;
  }>;
}

function getErrorMessage(error: string | undefined): string | null {
  if (!error) {
    return null;
  }

  if (error === 'configuration') {
    return 'Sign-in is not configured yet.';
  }

  return 'Google sign-in could not be completed. Please try again.';
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [currentUser, params] = await Promise.all([getCurrentUser(), searchParams]);
  const nextPath = getSafeRedirect(params.next);

  if (currentUser) {
    redirect(nextPath);
  }

  return (
    <LoginForm
      initialError={getErrorMessage(params.error)}
      nextPath={nextPath}
    />
  );
}
