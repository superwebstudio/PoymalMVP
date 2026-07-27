import React from 'react';
import { Share2, MessageCircle, Fish, Anchor } from 'lucide-react';
import { FaFish } from 'react-icons/fa';
import { CachedImage } from '@/components/CachedImage';

interface FishCardProps {
    fish: any;
    activeShareId: string | null;
    handleShare: (id: string) => void;
    handleSendMessage: () => void;
    setShowFishDetailsId: (id: string) => void;
    onImageClick: (url: string) => void;
    shareMenuRef: React.RefObject<HTMLDivElement | null>;
    dict: any;
    isFullWidth?: boolean;
}

export const FishCard: React.FC<FishCardProps> = ({
    fish,
    activeShareId,
    handleShare,
    handleSendMessage,
    setShowFishDetailsId,
    onImageClick,
    shareMenuRef,
    dict,
    isFullWidth = false,
}) => {
    return (
        <div
            className={`relative bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden ${
                isFullWidth 
                    ? 'w-full' 
                    : 'flex-shrink-0 w-[280px]'
            }`}
            style={isFullWidth ? {} : { scrollSnapAlign: 'start' }}
        >
            {fish.imageUrl ? (
                <div className={`relative w-full ${isFullWidth ? 'aspect-[4/3]' : 'aspect-square'} bg-zinc-800`}>
                    <CachedImage
                        src={fish.imageUrl}
                        alt={fish.species || 'Catch'}
                        className="h-full w-full"
                        sizes={isFullWidth ? '(max-width: 768px) 100vw, 640px' : '280px'}
                        priority={isFullWidth}
                        onClick={() => onImageClick(fish.imageUrl)}
                    />
                </div>
            ) : (
                <div className={`${isFullWidth ? 'w-full aspect-[4/3]' : 'aspect-square'} flex items-center justify-center bg-zinc-800`}>
                    <Fish size={48} className="text-zinc-600" />
                </div>
            )}
            <div className="p-4">
                <h3 className="text-xl font-bold text-zinc-100">{fish.species || 'Unknown'}</h3>
                {fish.scientificName && (
                    <p className="text-xs text-zinc-500 italic mt-1">{fish.scientificName}</p>
                )}
                <div className="flex gap-4 mt-3 text-sm">
                    {fish.weight && (
                        <div>
                            <span className="text-zinc-400">{dict.weight}:</span>
                            <span className="ml-1 font-semibold text-zinc-200">{fish.weight} {dict.kg}</span>
                        </div>
                    )}
                    {fish.length && (
                        <div>
                            <span className="text-zinc-400">{dict.length}:</span>
                            <span className="ml-1 font-semibold text-zinc-200">{fish.length} {dict.cm}</span>
                        </div>
                    )}
                </div>

                {(fish.bait || fish.method) && (
                    <div className="flex gap-4 mt-3 text-sm">
                        {fish.bait && (
                            <div key="bait" className="flex items-center gap-1">
                                <FaFish size={14} className="text-orange-400" />
                                <span className="text-zinc-400">{dict.bait}:</span>
                                <span className="ml-1 font-semibold text-zinc-200">{fish.bait}</span>
                            </div>
                        )}
                        {fish.method && (
                            <div key="method" className="flex items-center gap-1">
                                <Anchor size={14} className="text-blue-400" />
                                <span className="text-zinc-400">{dict.method}:</span>
                                <span className="ml-1 font-semibold text-zinc-200">{fish.method}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Share Button on Card */}
            <div className="absolute top-2 right-2 z-10">
                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleShare(fish.id);
                        }}
                        className="bg-black/40 backdrop-blur-sm rounded-full p-2 text-white hover:bg-black/60 transition-colors"
                    >
                        <Share2 size={18} />
                    </button>
                    {activeShareId === fish.id && (
                        <div ref={shareMenuRef} className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50">
                            <button onClick={handleSendMessage} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800 text-zinc-300 transition-colors whitespace-nowrap">
                                <MessageCircle size={18} />
                                <span>Send as Message</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

