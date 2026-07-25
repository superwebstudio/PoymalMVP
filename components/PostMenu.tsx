"use client";

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Edit, Trash2, Pin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useProfileStore } from '@/stores/useProfileStore';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface PostMenuProps {
    catchId: string;
    userId: string; // The ID of the user who owns the post
    isPinned?: boolean;
    onDeleteSuccess?: () => void;
    onPinSuccess?: () => void;
}

export const PostMenu: React.FC<PostMenuProps> = ({ catchId, userId, isPinned, onDeleteSuccess, onPinSuccess }) => {
    const { dict } = useI18n();
    const router = useRouter();
    const { addNotification } = useNotificationStore();
    const { updateCatch, removeCatch } = useProfileStore();
    const [isOpen, setIsOpen] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showPinReplaceConfirm, setShowPinReplaceConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPinning, setIsPinning] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
    const { userId: currentUserId } = useUserStore();

    const isOwner = currentUserId === userId;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        router.push(`/catch/${catchId}/edit`);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/catch/${catchId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (response.ok) {
                removeCatch(catchId);
                addNotification({
                    message: dict.deleteSuccess || 'Catch deleted successfully!',
                    type: 'success',
                });
                setShowDeleteConfirm(false);
                onDeleteSuccess?.();
            } else {
                let message = dict.deleteFailed || 'Failed to delete catch';
                try {
                    const errorJson = (await response.json()) as { error?: string };
                    if (errorJson.error) message = errorJson.error;
                } catch {
                    // ignore
                }
                addNotification({
                    message,
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('Delete error:', error);
            addNotification({
                message: dict.deleteFailed || 'Failed to delete catch',
                type: 'error',
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handlePinClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(false);

        // If unpinning, proceed directly
        if (isPinned) {
            await handlePinToggle(false);
            return;
        }

        // If pinning, check for existing pinned catch
        try {
            const checkResponse = await fetch(`/api/catch/${catchId}/pin`, {
                method: 'GET',
                credentials: 'include',
            });

            if (checkResponse.ok) {
                const { hasPinned } = await checkResponse.json();

                if (hasPinned) {
                    // Show confirmation dialog
                    setShowPinReplaceConfirm(true);
                } else {
                    // No existing pinned catch, proceed directly
                    await handlePinToggle(false);
                }
            } else {
                // If check fails, proceed anyway
                await handlePinToggle(false);
            }
        } catch (error) {
            console.error('Check pinned catch error:', error);
            // If check fails, proceed anyway
            await handlePinToggle(false);
        }
    };

    const handlePinToggle = async (replace: boolean) => {
        setIsPinning(true);

        // Optimistically update UI
        const newPinStatus = !isPinned;
        updateCatch(catchId, { isPinned: newPinStatus } as any);

        try {
            const response = await fetch(`/api/catch/${catchId}/pin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ replace }),
            });

            if (response.ok) {
                addNotification({
                    message: isPinned ? (dict.unpinnedSuccess || 'Catch unpinned!') : (dict.pinnedSuccess || 'Catch pinned to profile!'),
                    type: 'success',
                });
                setShowPinReplaceConfirm(false);
                // Refresh the page to ensure data consistency
                router.refresh();
                onPinSuccess?.(); // Call callback if provided
            } else {
                // Revert optimistic update on error
                updateCatch(catchId, { isPinned: isPinned } as any);
                const error = await response.json();
                addNotification({
                    message: error.error || dict.pinFailed || 'Failed to toggle pin status',
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('Pin toggle error:', error);
            addNotification({
                message: dict.pinFailed || 'Failed to toggle pin status',
                type: 'error',
            });
        } finally {
            setIsPinning(false);
        }
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
        setIsOpen(!isOpen);
    };

    if (!isOwner) return null;

    const menuContent = isOpen && menuPosition && typeof window !== 'undefined' ? createPortal(
        <div
            ref={menuRef}
            className="fixed w-48 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl z-[9999] overflow-hidden"
            style={{
                top: `${menuPosition.top}px`,
                right: `${menuPosition.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                onClick={handleEdit}
                className="flex items-center gap-3 w-full px-4 py-2 text-left text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
                <Edit size={18} />
                <span>{dict.edit || 'Edit'}</span>
            </button>
            <button
                onClick={handlePinClick}
                className="flex items-center gap-3 w-full px-4 py-2 text-left text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
                <Pin size={18} />
                <span>{isPinned ? (dict.unpinFromProfile || 'Unpin from Profile') : (dict.pinToProfile || 'Pin to Profile')}</span>
            </button>
            <button
                onClick={handleDeleteClick}
                className="flex items-center gap-3 w-full px-4 py-2 text-left text-red-400 hover:bg-red-900/20 transition-colors"
            >
                <Trash2 size={18} />
                <span>{dict.delete || 'Delete'}</span>
            </button>
        </div>,
        document.body
    ) : null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="p-1 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400"
            >
                <MoreHorizontal size={20} />
            </button>
            {menuContent}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title={dict.confirmDelete || 'Are you sure you want to delete this catch?'}
                message={dict.confirmDeleteMessage || 'This action cannot be undone.'}
                confirmLabel={dict.delete || 'Delete'}
                cancelLabel={dict.cancel || 'Cancel'}
                confirmVariant="danger"
                isLoading={isDeleting}
            />
            <ConfirmDialog
                isOpen={showPinReplaceConfirm}
                onClose={() => setShowPinReplaceConfirm(false)}
                onConfirm={() => handlePinToggle(true)}
                title={dict.replacePinnedPost || 'Replace Pinned Post?'}
                message={dict.replacePinnedPostMessage || 'You already have a pinned post. Pinning this post will replace the current pinned post.'}
                confirmLabel={dict.replace || 'Replace'}
                cancelLabel={dict.cancel || 'Cancel'}
                confirmVariant="primary"
                isLoading={isPinning}
            />
        </>
    );
};
