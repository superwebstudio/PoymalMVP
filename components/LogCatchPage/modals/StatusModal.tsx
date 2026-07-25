import React from 'react';
import { Modal } from '@/components/Modal';
import { useLogStore } from '@/stores/useLogStore';
import { useI18n } from '@/lib/useI18n';

export const StatusModal: React.FC = () => {
    const store = useLogStore();
    const { modalState } = store;
    const { dict } = useI18n();

    return (
        <Modal isOpen={modalState.isOpen} onClose={store.closeModal} title={modalState.isSuccess ? (dict.success || 'Success') : (dict.error || 'Error')}>
            <p className="text-zinc-300">{modalState.message}</p>
            <button onClick={store.closeModal} className="mt-4 w-full bg-sky-600 text-white font-bold py-3 rounded-lg">
                {dict.ok || 'OK'}
            </button>
        </Modal>
    );
};


