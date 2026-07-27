import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications | Ulov',
  description: 'Likes and comments on your posts',
};

export const dynamic = 'force-dynamic';

export default function NotificationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
