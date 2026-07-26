import { getCatch, getRelatedCatches } from '@/app/api/catch/_service';
import CatchDetailPageClient from './page.client';

export const dynamic = 'force-dynamic';

// Server Component
export default async function CatchDetailPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams?: Promise<{ returnTo?: string }> 
}) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  
  // Fetch data on server
  const initialCatchData = await getCatch(id);
  
  let initialRelatedCatches: any[] = [];
  if (initialCatchData) {
    // We need to decide what default "userId" or params to use for related catches if we want them SSR'd
    // The client hook used: userId, createdAt, location from the catch data itself
    initialRelatedCatches = await getRelatedCatches(
      id,
      initialCatchData.userId,
      initialCatchData.createdAt,
      initialCatchData.location
    );
  }

  // Determine returnTo on server if possible, otherwise pass what we have
  // Note: document.referrer is not available on server, so we rely on searchParams or default
  const initialReturnTo = resolvedSearchParams.returnTo || '/';

  return (
    <CatchDetailPageClient 
      catchId={id}
      initialCatchData={initialCatchData}
      initialRelatedCatches={initialRelatedCatches}
      initialReturnTo={initialReturnTo}
    />
  );
}
