import React from 'react';
import { X } from 'lucide-react';
import { CachedImage } from '@/components/CachedImage';

interface FullscreenImageProps {
  imageUrl: string | null;
  species?: string | null;
  onClose: () => void;
}

export const FullscreenImage: React.FC<FullscreenImageProps> = ({
  imageUrl,
  species,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-zinc-400 transition-colors z-10"
      >
        <X size={32} />
      </button>
      <CachedImage
        src={imageUrl}
        alt={species || 'Catch'}
        className="max-w-full max-h-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};










