import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useLogStore } from '@/stores/useLogStore';

export const ImagePreviewModal: React.FC = () => {
    const store = useLogStore();
    const { enlargedImage } = store;

    if (!enlargedImage) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 z-[200]"
                onClick={() => store.setEnlargedImage(null)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="fixed inset-0 z-[210] flex items-center justify-center p-4"
                onClick={() => store.setEnlargedImage(null)}
            >
                <div
                    className="relative max-w-full max-h-full"
                    onClick={(e) => e.stopPropagation()}
                >
                    <img
                        src={enlargedImage}
                        alt="Enlarged fish"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                    />
                    <button
                        type="button"
                        onClick={() => store.setEnlargedImage(null)}
                        className="absolute top-4 right-4 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};










