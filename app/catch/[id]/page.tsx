import { getCatch, getRelatedCatches } from '@/app/api/catch/_service';
import CatchDetailPageClient from './page.client';

export const dynamic = 'force-dynamic';

type CatchDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ returnTo?: string }>;
};

export default async function CatchDetailPage({
  params,
  searchParams,
}: CatchDetailPageProps): Promise<React.JSX.Element> {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const initialCatchData = await getCatch(id);

  // Related catches only needed for multi-fish posts; skip when unnecessary
  const initialRelatedCatches =
    initialCatchData && !initialCatchData.isTextOnly
      ? await getRelatedCatches(
          id,
          initialCatchData.userId,
          initialCatchData.createdAt,
          initialCatchData.location,
        )
      : [];

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
