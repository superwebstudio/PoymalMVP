import React, { useRef } from 'react';
import { FishCard } from './FishCard';

interface FishCarouselProps {
    allCatches: any[];
    activeShareId: string | null;
    handleShare: (id: string) => void;
    handleSendMessage: () => void;
    setShowFishDetailsId: (id: string) => void;
    onImageClick: (url: string) => void;
    shareMenuRef: React.RefObject<HTMLDivElement | null>;
    dict: any;
    description?: string;
}

export const FishCarousel: React.FC<FishCarouselProps> = ({
    allCatches,
    activeShareId,
    handleShare,
    handleSendMessage,
    setShowFishDetailsId,
    onImageClick,
    shareMenuRef,
    dict,
    description,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const hasSingleEntry = allCatches.length === 1;

    return (
        <div>
            <div
                ref={scrollContainerRef}
                className={hasSingleEntry
                    ? "w-full"
                    : "flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                }
                style={hasSingleEntry ? {} : { scrollSnapType: 'x mandatory' }}
                data-carousel-container="true"
                onScroll={(e) => {
                    const container = e.currentTarget;
                    const index = Math.round(container.scrollLeft / container.offsetWidth);
                    container.setAttribute('data-carousel-index', index.toString());
                }}
            >
                {allCatches.map((fish, index) => {
                    // Ensure unique key - use ID if valid, otherwise use index with a prefix
                    const uniqueKey = fish?.id && fish.id.trim() !== ''
                        ? fish.id
                        : `fish-${index}-${fish?.createdAt || Date.now()}`;

                    return (
                        <FishCard
                            key={uniqueKey}
                            fish={fish}
                            activeShareId={activeShareId}
                            handleShare={handleShare}
                            handleSendMessage={handleSendMessage}
                            setShowFishDetailsId={setShowFishDetailsId}
                            onImageClick={onImageClick}
                            shareMenuRef={shareMenuRef}
                            dict={dict}
                            isFullWidth={hasSingleEntry}
                        />
                    );
                })}
            </div>

            {description && (
                <div className="px-1 mt-4">
                    <p className="text-zinc-300 text-base leading-relaxed">{description}</p>
                </div>
            )}
        </div>
    );
};

