import React from 'react';
import { Modal } from '@/components/Modal';
import { useLogStore } from '@/stores/useLogStore';

interface DeleteConfirmModalProps {
    dict: any;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ dict }) => {
    const store = useLogStore();
    const { deleteConfirmId } = store;

    const confirmDelete = () => {
        if (deleteConfirmId) {
            store.setFishEntries(prev => prev.filter(item => item.id !== deleteConfirmId));
            store.setDeleteConfirmId(null);
        }
    };

    return (
        <Modal
            isOpen={deleteConfirmId !== null}
            onClose={() => store.setDeleteConfirmId(null)}
            title={dict.confirmDelete || 'Confirm Delete'}
        >
            <p className="text-zinc-300">{dict.confirmDeleteCatchEntry || 'Are you sure you want to remove this fish entry?'}</p>
            <div className="mt-4 flex gap-3">
                <button
                    onClick={() => store.setDeleteConfirmId(null)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                    {dict.cancel || 'Cancel'}
                </button>
                <button
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                    {dict.delete || 'Delete'}
                </button>
            </div>
        </Modal>
    );
};










