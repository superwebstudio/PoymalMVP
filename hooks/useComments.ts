import { useState, useEffect, useCallback } from 'react';

export function useComments(catchId: string | null) {
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!catchId) return;
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/catch/${catchId}/comment`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  }, [catchId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, setComments, loadingComments, fetchComments };
}










