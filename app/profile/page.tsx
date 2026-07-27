import { getUserProfile } from '@/app/api/user/_service';
import { getCurrentUserSummary } from '@/lib/get-current-user-summary';
import ProfilePageClient from './page.client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const currentUser = await getCurrentUserSummary();
  const initialUser = currentUser?.id
    ? await getUserProfile(currentUser.id)
    : null;

  return <ProfilePageClient initialUser={initialUser as never} />;
}
