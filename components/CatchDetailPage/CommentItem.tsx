import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface CommentItemProps {
  comment: any;
  currentUserId: string | null | undefined;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
  setEditingCommentId: (id: string | null) => void;
  setEditCommentText: (text: string) => void;
  menuPosition: Record<string, 'up' | 'down'>;
  setMenuPosition: (pos: Record<string, 'up' | 'down'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  isEditing: boolean;
  editCommentText: string;
  dict: any;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  openMenuId,
  setOpenMenuId,
  setEditingCommentId,
  setEditCommentText,
  menuPosition,
  setMenuPosition,
  onDelete,
  onUpdate,
  isEditing,
  editCommentText,
  dict,
}) => {
  const isCommentOwner = comment.user.id === currentUserId;
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const commentRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Scroll into view when editing starts, accounting for keyboard
  React.useEffect(() => {
    if (isEditing && commentRef.current) {
      // Wait for keyboard to open and edit UI to render
      const scrollToComment = () => {
        if (!commentRef.current) return;
        
        const element = commentRef.current;
        const viewportHeight = window.innerHeight;
        
        // Use Visual Viewport API if available (most accurate for keyboard detection)
        const visualViewport = (window as any).visualViewport;
        let availableHeight = viewportHeight;
        let offsetY = 0;
        
        if (visualViewport) {
          // Visual viewport gives us the actual visible area
          availableHeight = visualViewport.height;
          offsetY = visualViewport.offsetTop;
        } else {
          // Fallback: estimate keyboard height (typically 300-400px on mobile)
          const estimatedKeyboardHeight = Math.min(viewportHeight * 0.4, 400);
          availableHeight = viewportHeight - estimatedKeyboardHeight;
        }
        
        // Get element position relative to document
        const elementRect = element.getBoundingClientRect();
        const absoluteElementTop = elementRect.top + window.pageYOffset + offsetY;
        
        // Position comment in upper portion of visible area (above keyboard)
        // Target: position comment at 25% from top of visible viewport
        const targetPosition = absoluteElementTop - (availableHeight * 0.25);
        
        window.scrollTo({
          top: Math.max(0, targetPosition),
          behavior: 'smooth'
        });
      };
      
      // Initial scroll after short delay
      setTimeout(scrollToComment, 200);
      
      // Also listen for visual viewport resize (keyboard opening/closing)
      if ((window as any).visualViewport) {
        const handleResize = () => {
          setTimeout(scrollToComment, 100);
        };
        (window as any).visualViewport.addEventListener('resize', handleResize);
        return () => {
          (window as any).visualViewport?.removeEventListener('resize', handleResize);
        };
      }
    }
  }, [isEditing]);

  const formatCommentContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-blue-400 font-medium">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div ref={commentRef} className="flex gap-3">
      <Link href={`/user/${comment.user.id}`} className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden">
          {comment.user.photoUrl ? (
            <CachedImage
              src={comment.user.photoUrl}
              alt={comment.user.username || 'User'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
              {comment.user.firstName?.[0] || comment.user.username?.[0] || '?'}
            </div>
          )}
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/user/${comment.user.id}`} className="font-semibold text-zinc-200 hover:text-blue-400 text-sm">
            {comment.user.firstName || comment.user.username || 'User'}
          </Link>
          {comment.user.isPro && (
            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-500/30">
              PRO
            </span>
          )}
          <span className="text-xs text-zinc-500">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
          {isCommentOwner && (
            <div className="relative ml-auto" ref={menuRef}>
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.stopPropagation();
                  if (openMenuId === comment.id) {
                    setOpenMenuId(null);
                  } else {
                    if (buttonRef.current) {
                      const rect = buttonRef.current.getBoundingClientRect();
                      const bottomNavHeight = 70;
                      const menuHeight = 80;
                      const spaceBelow = window.innerHeight - rect.bottom - bottomNavHeight;
                      const spaceAbove = rect.top;
                      const isNearBottom = rect.bottom > window.innerHeight * 0.7;

                      if ((spaceBelow < menuHeight && spaceAbove > menuHeight) || (isNearBottom && spaceAbove > menuHeight)) {
                        setMenuPosition({ ...menuPosition, [comment.id]: 'up' });
                      } else {
                        setMenuPosition({ ...menuPosition, [comment.id]: 'down' });
                      }
                    }
                    setOpenMenuId(comment.id);
                  }
                }}
                className="p-1 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400"
              >
                <MoreHorizontal size={16} />
              </button>
              {openMenuId === comment.id && (
                <div className={`absolute right-0 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 overflow-hidden ${menuPosition[comment.id] === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCommentId(comment.id);
                      setEditCommentText(comment.content.replace(/^@\w+\s+/, ''));
                      setOpenMenuId(null);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-zinc-200 hover:bg-zinc-700 transition-colors text-sm"
                  >
                    <Edit size={14} />
                    <span>{dict.edit || 'Edit'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(null);
                      setShowDeleteConfirm(true);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-red-400 hover:bg-red-900/20 transition-colors text-sm"
                  >
                    <Trash2 size={14} />
                    <span>{dict.delete || 'Delete'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white text-sm focus:outline-none resize-none"
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => onUpdate(comment.id, editCommentText)}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-sm"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingCommentId(null);
                  setEditCommentText('');
                }}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-zinc-300 text-sm">
            {formatCommentContent(comment.content)}
          </p>
        )}
      </div>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          onDelete(comment.id);
        }}
        title={dict.confirmDelete || 'Are you sure?'}
        message={dict.confirmDeleteComment || 'This comment will be permanently deleted.'}
        confirmLabel={dict.delete || 'Delete'}
        cancelLabel={dict.cancel || 'Cancel'}
        confirmVariant="danger"
      />
    </div>
  );
};

