import { useEffect, useMemo } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { usePostStore } from '@/stores/usePostStore';
import { useCatchStore } from '@/stores/useCatchStore';

interface UseCatchDataProps {
    catchId: string | null;
}

export function useCatchData({ catchId }: UseCatchDataProps) {
    const { catchData, setCatchData, relatedCatches, setRelatedCatches, loading, setLoading } = useCatchStore();
    const { userId: currentUserId } = useUserStore();
    const { initializePost } = usePostStore();

    useEffect(() => {
        if (!catchId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/catch/${catchId}/get`);
                if (response.ok) {
                    const data = await response.json();
                    setCatchData(data);

                    if (data.createdAt && data.userId && !data.isTextOnly) {
                        try {
                            const relatedResponse = await fetch(
                                `/api/catch/${catchId}/related?userId=${data.userId}&createdAt=${data.createdAt}&location=${encodeURIComponent(data.location || '')}`
                            );
                            if (relatedResponse.ok) {
                                const related = await relatedResponse.json();
                                setRelatedCatches(related.filter((c: any) => c.id !== catchId));
                            }
                        } catch (err) {
                            console.error('Error fetching related catches:', err);
                        }
                    }

                    initializePost(catchId, {
                        likesCount: data._count?.likes || 0,
                        commentsCount: data._count?.comments || 0,
                        isLiked: data.reactions?.some((r: any) => r.userId === currentUserId && r.emoji === '❤️') || false,
                        species: data.species || undefined,
                        imageUrl: data.imageUrl || undefined,
                    });
                }
            } catch (error) {
                console.error('Error fetching catch:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [catchId, currentUserId, initializePost, setCatchData, setRelatedCatches, setLoading]);

    const allCatches = useMemo(() => {
        if (!catchData) return [];
        const all = [catchData, ...relatedCatches].filter(item => item && item.id); // Filter out items without IDs
        const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
        return unique.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }, [catchData, relatedCatches]);

    return { catchData, setCatchData, relatedCatches, allCatches, loading };
}
