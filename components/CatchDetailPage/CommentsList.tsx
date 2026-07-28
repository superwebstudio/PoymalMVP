import React, { useState } from 'react';
import { CommentItem, type CommentLikeState } from './CommentItem';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface CommentsListProps {
  comments: CommentLikeState[];
  loadingComments: boolean;
  currentUserId: string | null | undefined;
  dict: Record<string, string>;
  catchId: string | null;
  onCommentsChange: () => void;
  setCatchData: (data: unknown) => void;
  onReply?: (comment: CommentLikeState) => void;
  onCommentLiked?: () => void;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  loadingComments,
  currentUserId,
  dict,
  catchId,
  onCommentsChange,
  setCatchData,
  onReply,
  onCommentLiked,
}) => {
  const { addNotification } = useNotificationStore();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [menuPosition, setMenuPosition] = useState<Record<string, 'up' | 'down'>>({});
  const [localComments, setLocalComments] = useState<CommentLikeState[] | null>(null);

  const displayComments = localComments ?? comments;

  React.useEffect(() => {
    setLocalComments(null);
  }, [comments]);

  React.useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) setOpenMenuId(null);
    };
    if (openMenuId) {
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const handleDelete = async (commentId: string) => {
    if (!catchId) return;
    try {
      const response = await fetch(`/api/catch/${catchId}/comment?commentId=${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        onCommentsChange();
        const refreshResponse = await fetch(`/api/catch/${catchId}/get`);
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          setCatchData(data);
        }
      } else {
        addNotification({
          message: 'Failed to delete comment',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      addNotification({
        message: 'Failed to delete comment',
        type: 'error',
      });
    }
  };

  const handleUpdate = async (commentId: string, text: string) => {
    if (!catchId) return;
    try {
      const response = await fetch(`/api/catch/${catchId}/comment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          commentId: commentId,
          content: text.trim(),
        }),
      });
      if (response.ok) {
        setEditingCommentId(null);
        setEditCommentText('');
        onCommentsChange();
      } else {
        addNotification({
          message: 'Failed to update comment',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      addNotification({
        message: 'Failed to update comment',
        type: 'error',
      });
    }
  };

  const handleToggleLike = async (commentId: string) => {
    if (!catchId || !currentUserId) return;

    const prev = displayComments;
    setLocalComments(
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const liked = Boolean(c.likedByMe);
        return {
          ...c,
          likedByMe: !liked,
          likesCount: Math.max(0, (c.likesCount ?? 0) + (liked ? -1 : 1)),
        };
      }),
    );

    try {
      const response = await fetch(`/api/catch/${catchId}/comment/${commentId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        setLocalComments(prev);
        return;
      }
      const data = (await response.json()) as { likedByMe: boolean; likesCount: number };
      setLocalComments((current) =>
        (current ?? prev).map((c) =>
          c.id === commentId
            ? { ...c, likedByMe: data.likedByMe, likesCount: data.likesCount }
            : c,
        ),
      );
      onCommentLiked?.();
    } catch {
      setLocalComments(prev);
    }
  };

  const roots = displayComments.filter((c) => !c.parentId);
  const repliesByParent = displayComments.reduce<Record<string, CommentLikeState[]>>((acc, c) => {
    if (!c.parentId) return acc;
    if (!acc[c.parentId]) acc[c.parentId] = [];
    acc[c.parentId].push(c);
    return acc;
  }, {});

  const renderComment = (comment: CommentLikeState, isReply = false) => (
    <div key={comment.id} className="space-y-3">
      <CommentItem
        comment={comment}
        currentUserId={currentUserId}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        setEditingCommentId={setEditingCommentId}
        setEditCommentText={setEditCommentText}
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onReply={onReply}
        onToggleLike={handleToggleLike}
        isEditing={editingCommentId === comment.id}
        editCommentText={editCommentText}
        dict={dict}
        isReply={isReply}
      />
      {(repliesByParent[comment.id] || []).map((reply) => renderComment(reply, true))}
    </div>
  );

  return (
    <div className="space-y-4">
      {loadingComments ? (
        <div className="text-center py-4 text-zinc-500">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : displayComments.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          {dict.beFirstToComment || 'Be the first to comment!'}
        </div>
      ) : (
        <div className="space-y-4">{roots.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  );
};
