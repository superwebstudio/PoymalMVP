import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in | Ulov',
  description: 'Sign in to Ulov with Google or a secure email code.',
};

interface LoginLayoutProps {
  children: React.ReactNode;
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return children;
}
