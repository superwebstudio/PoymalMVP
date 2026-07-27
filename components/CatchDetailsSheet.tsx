"use client";

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Fish, MapPin, Plus, Star } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useMapStore } from '@/stores/useMapStore';
import { useUserStore } from '@/stores/useUserStore';
import { useSavedLocationsStore } from '@/stores/useSavedLocationsStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { cn } from '@/lib/utils';
import { Sheet } from 'react-modal-sheet';
import { Backdrop } from '@/components/ui/Backdrop';
import { CachedImage } from '@/components/CachedImage';

export function CatchDetailsSheet() {
    const { dict } = useI18n();
    const { userId } = useUserStore();
    const { createLocation, locations, deleteLocation } = useSavedLocationsStore();
    const { addNotification } = useNotificationStore();
    const {
        selectedCatch,
        showBottomSheet,
        isMinimizedSheet,
        closeCatchDetailsSheet,
        handleViewCatchDetails,
    } = useMapStore();

    const [showContent, setShowContent] = useState(false);

    const isOwner = selectedCatch?.user?.id === userId;

    useEffect(() => {
        if (showBottomSheet) {
            const timer = setTimeout(() => setShowContent(true), 50);
            return () => clearTimeout(timer);
        } else {
            setShowContent(false);
        }
    }, [showBottomSheet]);

    const savedLocation = React.useMemo(() => {
        if (!selectedCatch || !locations) return null;
        return locations.find(l =>
            Math.abs(l.latitude - selectedCatch.latitude) < 0.00001 &&
            Math.abs(l.longitude - selectedCatch.longitude) < 0.00001
        );
    }, [selectedCatch, locations]);

    const isSaved = !!savedLocation;

    const handleToggleSave = async () => {
        if (!selectedCatch) return;

        if (isSaved && savedLocation) {
            await deleteLocation({ id: savedLocation.id });
            addNotification({ message: 'Removed from My Spots', type: 'info' });
        } else {
            await createLocation({
                name: selectedCatch.species ? `${selectedCatch.species} Catch` : 'Catch Location',
                latitude: selectedCatch.latitude,
                longitude: selectedCatch.longitude
            });
            addNotification({
                message: 'Saved to My Spots',
                type: 'success',
                action: {
                    label: 'Undo',
                    onClick: () => handleToggleSave()
                }
            });
        }
    };

    if (!selectedCatch) return null;

    return (
        <>
            {/* Non-blocking dim — map markers stay tappable above the sheet */}
            <Backdrop
                isOpen={showBottomSheet}
                onClose={closeCatchDetailsSheet}
                blur={false}
                zIndex={40}
                pointerEvents={false}
            />

            {showContent && (
                <Sheet
                    isOpen={showBottomSheet}
                    onClose={closeCatchDetailsSheet}
                    snapPoints={[0, 0.4, 0.6, 1]}
                    initialSnap={1}
                >
                    <Sheet.Container
                        className="!bg-zinc-900 border-t border-zinc-800 rounded-t-2xl"
                        style={{ zIndex: 50 }}
                    >
                        <Sheet.Header>
                            <div className="flex justify-center py-3">
                                <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
                            </div>
                            <div className={cn("p-4", isMinimizedSheet && "p-3")}>
                                <div className={cn("flex items-center justify-between", isMinimizedSheet ? "mb-3" : "mb-4")}>
                                    <h3 className={cn("font-bold text-zinc-200", isMinimizedSheet ? "text-base" : "text-lg")}>
                                        {selectedCatch.species || dict.catch}
                                    </h3>
                                    <button
                                        onClick={closeCatchDetailsSheet}
                                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {selectedCatch.imageUrl && !isMinimizedSheet && (
                                    <CachedImage
                                        src={selectedCatch.imageUrl}
                                        alt={selectedCatch.species || 'Catch'}
                                        className="mb-4 h-48 w-full rounded-lg"
                                        sizes="(max-width: 768px) 100vw, 480px"
                                    />
                                )}

                                <div className={cn("space-y-2", isMinimizedSheet ? "mb-3" : "mb-4")}>
                                    {!isMinimizedSheet && (
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <Fish size={16} />
                                            <span>{selectedCatch.species || dict.unknownSpecies}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                                        <MapPin size={16} />
                                        <span>
                                            {selectedCatch.latitude.toFixed(4)}, {selectedCatch.longitude.toFixed(4)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewCatchDetails(selectedCatch.id)}
                                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 px-4 rounded-xl transition-colors font-medium"
                                    >
                                        {dict.viewDetails}
                                    </button>

                                    {!isOwner && userId && (
                                        <button
                                            onClick={handleToggleSave}
                                            className={cn(
                                                "py-3 px-4 rounded-xl transition-all duration-200",
                                                isSaved
                                                    ? "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                                                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                                            )}
                                        >
                                            <Star size={20} fill={isSaved ? "currentColor" : "none"} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </Sheet.Header>
                    </Sheet.Container>
                </Sheet>
            )}
        </>
    );
}

