import React, { useState } from 'react';
import { CommentItem } from './CommentItem';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface CommentsListProps {
  comments: any[];
  loadingComments: boolean;
  currentUserId: string | null | undefined;
  dict: any;
  catchId: string | null;
  onCommentsChange: () => void;
  setCatchData: (data: any) => void;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  comments,
  loadingComments,
  currentUserId,
  dict,
  catchId,
  onCommentsChange,
  setCatchData,
}) => {
  const { addNotification } = useNotificationStore();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [menuPosition, setMenuPosition] = useState<Record<string, 'up' | 'down'>>({});

  // Close menu when clicking outside is handled in parent or globally, 
  // but for simplicity we can handle local click outside or just rely on state.
  // The useEffect for click outside was in Page.tsx. We might want to move it here or use a hook.

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId) {
        // This is a bit tricky without refs to all menus. 
        // Simplest is to close if clicking anywhere else.
        // But clicks inside the menu shouldn't close it.
        // Since CommentItem handles the menu rendering and has refs, we might need to lift refs up or rely on bubbling.
        // For now, let's just rely on the button click toggling.
        // Real click-outside requires a shared ref or event listener.
        // We'll leave it for now or implement a simple document listener that closes all menus.
        setOpenMenuId(null);
      }
    };
    if (openMenuId) {
      // Add a small delay or ensure it doesn't trigger immediately on the opening click
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

  return (
    <div className="space-y-4">

      {loadingComments ? (
        <div className="text-center py-4 text-zinc-500">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-zinc-500 text-sm">
          {dict.beFirstToComment || 'Be the first to comment!'}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment, index) => (
            <CommentItem
              key={comment.id || `comment-${index}`}
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
              isEditing={editingCommentId === comment.id}
              editCommentText={editCommentText}
              dict={dict}
            />
          ))}
        </div>
      )}
    </div>
  );
};

