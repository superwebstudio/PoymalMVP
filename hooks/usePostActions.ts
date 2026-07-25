import { useState, useCallback, useEffect, useRef } from 'react';
import { usePostStore } from '@/stores/usePostStore';
import { useUserStore } from '@/stores/useUserStore';

/**
 * Single source of truth for post like state.
 * This hook manages ALL like state - no other component should initialize the store.
 */
export function usePostActions(catchId: string) {
    const { userId } = useUserStore();
    const { updateLikes, initializePost } = usePostStore();

    // Subscribe to store reactively
    const posts = usePostStore((state) => state.posts);
    const postData = posts.get(catchId);

    const [isUpdating, setIsUpdating] = useState(false);
    const fetchedRef = useRef(false);

    // Fetch from API if no data in store (handles direct navigation to detail page)
    useEffect(() => {
        if (!postData && catchId && userId && !fetchedRef.current) {
            fetchedRef.current = true;

            const fetchState = async () => {
                try {
                    const response = await fetch(`/api/catch/${catchId}/reaction`, {
                        credentials: 'include',
                    });
                    if (response.ok) {
                        const data = await response.json();
                        initializePost(catchId, {
                            likesCount: data.likesCount ?? data.reactions?.length ?? 0,
                            commentsCount: 0,
                            isLiked: data.hasLiked ?? false,
                        });
                    }
                } catch (error) {
                    console.error('Error fetching like state:', error);
                }
            };
            fetchState();
        }
    }, [catchId, userId, postData, initializePost]);

    // Reset fetch ref when catchId changes
    useEffect(() => {
        fetchedRef.current = false;
    }, [catchId]);

    const liked = postData?.isLiked ?? false;
    const likesCount = postData?.likesCount ?? 0;

    const toggleLike = useCallback(async () => {
        if (!userId || isUpdating) return;

        // Optimistic update
        const wasLiked = liked;
        const oldCount = likesCount;
        const newLiked = !wasLiked;
        const newCount = newLiked ? oldCount + 1 : Math.max(0, oldCount - 1);

        // Update store immediately for instant feedback
        updateLikes(catchId, newCount, newLiked);
        setIsUpdating(true);

        try {
            const response = await fetch(`/api/catch/${catchId}/reaction`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emoji: '❤️' }),
            });

            if (response.ok) {
                const data = await response.json();
                // Use server values - this is the truth
                updateLikes(catchId, data.likesCount ?? 0, data.hasLiked ?? false);
            } else {
                // Revert on error
                updateLikes(catchId, oldCount, wasLiked);
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            updateLikes(catchId, oldCount, wasLiked);
        } finally {
            setIsUpdating(false);
        }
    }, [catchId, userId, liked, likesCount, isUpdating, updateLikes]);

    return {
        liked,
        likesCount,
        commentsCount: postData?.commentsCount ?? 0,
        toggleLike,
        isUpdating
    };
}
