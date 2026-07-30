import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connections | Poymal',
  description: 'Followers and following',
};

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default function FollowsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return children;
}
