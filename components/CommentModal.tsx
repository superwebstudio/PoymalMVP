"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Reply, Trash2, Heart } from 'lucide-react';
import { Sheet } from 'react-modal-sheet';
import { useI18n } from '@/lib/useI18n';
import Link from 'next/link';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { Backdrop } from '@/components/ui/Backdrop';
import { CachedImage } from '@/components/CachedImage';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  catchId: string;
  postAuthor: {
    id: string;
    firstName?: string;
    username?: string;
  };
  currentUserId?: string;
  onCommentAdded?: () => void;
  replyingToCommentId?: string | null;
  replyingToUser?: {
    id: string;
    firstName?: string;
    username?: string;
  } | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    firstName?: string;
    username?: string;
    photoUrl?: string;
    isPro?: boolean;
  };
  parentId?: string | null;
  likesCount?: number;
  likedByMe?: boolean;
}

export const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  catchId,
  postAuthor,
  currentUserId,
  onCommentAdded,
  replyingToCommentId: initialReplyingToCommentId = null,
  replyingToUser: initialReplyingToUser = null,
}) => {
  const { dict } = useI18n();
  const { addNotification } = useNotificationStore();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(initialReplyingToCommentId);
  const [replyingToUser, setReplyingToUser] = useState<{ id: string; firstName?: string; username?: string; } | null>(initialReplyingToUser);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [showContent, setShowContent] = useState(false);
  const hasScrolledRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    setReplyingToCommentId(initialReplyingToCommentId);
    setReplyingToUser(initialReplyingToUser);
  }, [initialReplyingToCommentId, initialReplyingToUser, isOpen]);

  useEffect(() => {
    if (isOpen && catchId) {
      hasScrolledRef.current = false;
      isInitialLoadRef.current = true;
      fetchComments();
    } else {
      hasScrolledRef.current = false;
      isInitialLoadRef.current = true;
    }
  }, [isOpen, catchId]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [isOpen, replyingToCommentId]);

  // Only scroll after sheet has fully opened and comments have loaded, and only once per open
  useEffect(() => {
    if (isOpen && comments.length > 0 && !loadingComments && !hasScrolledRef.current && showContent) {
      // Wait for sheet animation to complete and content to stabilize before scrolling
      const timer = setTimeout(() => {
        if (commentsEndRef.current) {
          // Use requestAnimationFrame to ensure DOM is fully rendered
          requestAnimationFrame(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            hasScrolledRef.current = true;
            isInitialLoadRef.current = false;
          });
        }
      }, 600); // Wait for sheet animation (~350ms) plus content render time
      return () => clearTimeout(timer);
    }
  }, [isOpen, comments, loadingComments, showContent]);

  const fetchComments = async () => {
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
  };

  useEffect(() => {
    if (isOpen) {
      // Delay content rendering slightly
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const handleTagUser = (username: string) => {
    const currentText = comment;
    const newText = currentText ? `${currentText} @${username} ` : `@${username} `;
    setComment(newText);
    textareaRef.current?.focus();
  };

  const handleReply = (comment: Comment) => {
    setReplyingToCommentId(comment.id);
    setReplyingToUser({
      id: comment.user.id,
      firstName: comment.user.firstName,
      username: comment.user.username,
    });
    textareaRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!comment.trim() || !currentUserId) return;

    setIsSubmitting(true);
    try {
      const content = replyingToUser
        ? `@${replyingToUser.username || replyingToUser.firstName} ${comment.trim()}`
        : comment.trim();

      const response = await fetch(`/api/catch/${catchId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          content,
          parentId: replyingToCommentId,
        }),
      });

      if (response.ok) {
        setComment('');
        setReplyingToCommentId(null);
        setReplyingToUser(null);
        hasScrolledRef.current = false;
        await fetchComments();
        onCommentAdded?.();
        // Keep the sheet open so the user can keep chatting
        requestAnimationFrame(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
          hasScrolledRef.current = true;
        });
      } else {
        const error = await response.json();
        addNotification({
          message: error.error || 'Failed to post comment',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      addNotification({
        message: 'Failed to post comment',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId || deletingCommentId) return;

    setDeletingCommentId(commentId);
    try {
      const response = await fetch(
        `/api/catch/${catchId}/comment?commentId=${commentId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        onCommentAdded?.();
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to delete comment' }));
        addNotification({
          message: error.error || 'Failed to delete comment',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      addNotification({
        message: 'Failed to delete comment',
        type: 'error',
      });
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleToggleLike = async (commentId: string) => {
    if (!currentUserId) return;

    const prev = comments;
    setComments((list) =>
      list.map((c) => {
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
        setComments(prev);
        return;
      }
      const data = (await response.json()) as { likedByMe: boolean; likesCount: number };
      setComments((list) =>
        list.map((c) =>
          c.id === commentId
            ? { ...c, likedByMe: data.likedByMe, likesCount: data.likesCount }
            : c,
        ),
      );
    } catch {
      setComments(prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatCommentContent = (content: string) => {
    // Simple mention highlighting
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-sky-400 font-medium">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Custom backdrop */}
      <Backdrop
        isOpen={isOpen}
        onClose={onClose}
        blur={false}
        zIndex={40}
      />

      {showContent && (
        <Sheet
          isOpen={isOpen}
          onClose={onClose}
          snapPoints={[0, 0.65, 0.85, 1]}
          initialSnap={3}
        >
          <Sheet.Container
            style={{
              backgroundColor: '#18181b',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderColor: 'rgb(39, 39, 42)',
              borderWidth: '1px',
              zIndex: 50, // Make sure container is above custom backdrop
            }}
            className="!bg-zinc-900/95 !backdrop-blur-md"
          >
            <Sheet.Header>
              <div className="flex justify-center py-3">
                <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-4 pb-2">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">
                    {replyingToUser
                      ? `${dict.replyingTo || 'Replying to'} ${replyingToUser.firstName || replyingToUser.username || 'user'}`
                      : `${dict.replyingTo || 'Replying to'} ${postAuthor.firstName || postAuthor.username || 'user'}`
                    }
                  </p>
                  <h3 className="text-lg font-bold text-zinc-100">{dict.addComment || 'Add Comment'}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400"
                >
                  <X size={20} />
                </button>
              </div>
            </Sheet.Header>

            <Sheet.Content disableScroll className="!flex !flex-col !h-full !overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Comments List */}
                <div className="flex-1 overflow-y-auto px-4 py-4" style={{ minHeight: 0 }}>
                  {loadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500">
                      <p>{dict.beFirstToComment || 'No comments yet'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4 pb-4">
                      {comments.filter((c) => !c.parentId).map((commentItem) => {
                        const replies = comments.filter((c) => c.parentId === commentItem.id);
                        const renderRow = (item: Comment, isReply = false) => (
                          <div
                            key={item.id}
                            className={`flex gap-3 ${isReply ? 'ml-8 border-l border-zinc-800 pl-3' : ''}`}
                          >
                            <Link href={`/user/${item.user.id}`} className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
                                {item.user.photoUrl ? (
                                  <CachedImage
                                    src={item.user.photoUrl}
                                    alt=""
                                    className="h-full w-full"
                                    sizes="40px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                                    {item.user.firstName?.[0] || item.user.username?.[0] || '?'}
                                  </div>
                                )}
                              </div>
                            </Link>
                            <div className="relative min-w-0 flex-1">
                              <div className="mb-1 flex items-center gap-2 pr-8">
                                <Link href={`/user/${item.user.id}`} className="text-sm font-semibold text-zinc-200">
                                  {item.user.firstName || item.user.username || 'User'}
                                </Link>
                                {item.user.isPro && (
                                  <span className="rounded border border-yellow-500/30 bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-400">
                                    PRO
                                  </span>
                                )}
                                <span className="text-xs text-zinc-500">
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                                {currentUserId && item.user.id === currentUserId && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(item.id)}
                                    disabled={deletingCommentId === item.id}
                                    aria-label={dict.delete || 'Delete'}
                                    className="absolute top-0 right-0 rounded-full p-1 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                                  >
                                    {deletingCommentId === item.id ? (
                                      <div className="h-3.5 w-3.5 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
                                    ) : (
                                      <Trash2 size={14} />
                                    )}
                                  </button>
                                )}
                              </div>
                              <p className="whitespace-pre-wrap text-sm text-zinc-300">
                                {formatCommentContent(item.content)}
                              </p>
                              <div className="mt-2 flex items-center gap-3">
                                {currentUserId && (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleLike(item.id)}
                                    className={`flex items-center gap-1 text-xs transition-colors ${
                                      item.likedByMe ? 'text-red-400' : 'text-zinc-500 hover:text-red-400'
                                    }`}
                                  >
                                    <Heart size={14} className={item.likedByMe ? 'fill-red-400' : ''} />
                                    {(item.likesCount ?? 0) > 0 && <span>{item.likesCount}</span>}
                                  </button>
                                )}
                                {currentUserId && (
                                  <button
                                    type="button"
                                    onClick={() => handleReply(item)}
                                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
                                  >
                                    <Reply size={12} />
                                    {dict.reply || 'Reply'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );

                        return (
                          <div key={commentItem.id} className="space-y-3">
                            {renderRow(commentItem)}
                            {replies.map((reply) => renderRow(reply, true))}
                          </div>
                        );
                      })}
                      <div ref={commentsEndRef} />
                    </div>
                  )}
                </div>

                {/* Comment Input - Fixed at Bottom */}
                <div
                  className="border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm px-4 pt-4 flex-shrink-0"
                  style={{
                    paddingBottom: 'max(32px, calc(32px + env(safe-area-inset-bottom)))'
                  }}
                >
                  {replyingToCommentId && replyingToUser && (
                    <div className="flex items-center justify-between mb-2 p-2 bg-zinc-800 rounded-lg">
                      <span className="text-xs text-zinc-400">
                        Replying to {replyingToUser.firstName || replyingToUser.username}
                      </span>
                      <button
                        onClick={() => {
                          setReplyingToCommentId(null);
                          setReplyingToUser(null);
                        }}
                        className="text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={textareaRef}
                      value={comment}
                      onChange={(e) => {
                        setComment(e.target.value);
                        // Auto-resize textarea
                        if (textareaRef.current) {
                          textareaRef.current.style.height = 'auto';
                          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={replyingToUser
                        ? `Reply to ${replyingToUser.firstName || replyingToUser.username}...`
                        : dict.writeComment || 'Write a comment...'
                      }
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sky-500 transition-colors resize-none overflow-y-auto leading-relaxed"
                      style={{
                        minHeight: '48px',
                        maxHeight: '120px',
                        height: '48px'
                      }}
                      rows={1}
                    />

                    <button
                      onClick={handleSubmit}
                      disabled={!comment.trim() || isSubmitting}
                      className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </Sheet.Content>
          </Sheet.Container>
        </Sheet>
      )}
    </>
  );
};
