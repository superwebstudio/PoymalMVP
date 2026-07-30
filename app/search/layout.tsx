import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search | Poymal',
  description: 'Search people, catches, and bait mixes',
};

export const dynamic = 'force-dynamic';

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactNode {
  return children;
}
