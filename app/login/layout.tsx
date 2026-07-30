import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in | Poymal',
  description: 'Sign in to Poymal with Google or a secure email code.',
};

interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return children;
}
