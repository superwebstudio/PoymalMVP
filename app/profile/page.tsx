import { getUserProfile } from '@/app/api/user/_service';
import { getCurrentUser } from '@/lib/get-current-user';
import ProfilePageClient from './page.client';

export const dynamic = 'force-dynamic';

// Server Component
export default async function ProfilePage() {
    const currentUser = await getCurrentUser();
    
    let initialUser = null;
    if (currentUser?.id) {
        initialUser = await getUserProfile(currentUser.id);
    }

    return (
        <ProfilePageClient initialUser={initialUser} />
    );
}
