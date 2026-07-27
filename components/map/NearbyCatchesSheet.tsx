import { useEffect, useMemo, useState, useRef } from 'react';
import { MapPin, Navigation, Clock, Calendar, Fish, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { cn } from '@/lib/utils';
import { CachedImage } from '@/components/CachedImage';

interface Catch {
    id: string;
    species: string | null;
    weight?: number | null;
    length?: number | null;
    latitude: number | null;
    longitude: number | null;
    createdAt: string;
    imageUrl?: string | null;
    distance?: number;
}

interface NearbyCatchesSheetProps {
    catches: Catch[];
    userLocation: { lat: number; lng: number } | null;
    onCatchClick: (catchItem: Catch) => void;
    isOpen: boolean;
    onClose: () => void;
    onZoomToCatches?: (bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) => void;
    placeName?: string | null;
    selectedSpecies?: string | null;
    /** When true, skip auto fitBounds (e.g. search already flew to the place) */
    skipAutoZoom?: boolean;
}

export function NearbyCatchesSheet({ catches, userLocation, onCatchClick, isOpen, onClose, onZoomToCatches, placeName, selectedSpecies, skipAutoZoom = false }: NearbyCatchesSheetProps) {
    const { dict } = useI18n();
    const [maxDistance, setMaxDistance] = useState(50);
    const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'all' | '5kg+'>('all');
    const [visibleCatches, setVisibleCatches] = useState<Catch[]>(catches);

    // Calculate distance between two points in km
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    // Update visible catches when catches prop changes
    useEffect(() => {
        setVisibleCatches(catches);
    }, [catches]);

    // Sort and filter catches
    const sortedCatches = useMemo(() => {
        if (!userLocation || visibleCatches.length === 0) {
            return [];
        }

        let filtered = [...visibleCatches]
            .filter(catchItem => catchItem.latitude != null && catchItem.longitude != null)
            .map(catchItem => {
                const distance = calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    catchItem.latitude!,
                    catchItem.longitude!
                );
                return { ...catchItem, distance };
            });

        // Apply time filter
        const now = new Date();
        if (timeFilter === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(c => new Date(c.createdAt) >= weekAgo);
        } else if (timeFilter === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(c => new Date(c.createdAt) >= monthAgo);
        } else if (timeFilter === '5kg+') {
            filtered = filtered.filter(c => c.weight && c.weight >= 5);
        }

        return filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }, [visibleCatches, userLocation, timeFilter]);

    // Auto-zoom to show all catches within range when sheet first opens
    const hasZoomedRef = useRef(false);
    useEffect(() => {
        if (!isOpen) {
            hasZoomedRef.current = false;
            return;
        }

        if (skipAutoZoom) {
            hasZoomedRef.current = true;
            return;
        }

        if (hasZoomedRef.current || !userLocation || sortedCatches.length === 0 || !onZoomToCatches) return;

        // Filter catches within maxDistance
        const nearbyCatches = sortedCatches.filter(c => (c.distance || 0) <= maxDistance);
        if (nearbyCatches.length === 0) return;

        // Calculate bounds
        const lats = nearbyCatches.map(c => c.latitude!).filter(lat => lat != null);
        const lngs = nearbyCatches.map(c => c.longitude!).filter(lng => lng != null);

        if (lats.length === 0 || lngs.length === 0) return;

        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);

        // Add padding
        const latPadding = (maxLat - minLat) * 0.1 || 0.01;
        const lngPadding = (maxLng - minLng) * 0.1 || 0.01;

        onZoomToCatches({
            minLat: minLat - latPadding,
            maxLat: maxLat + latPadding,
            minLng: minLng - lngPadding,
            maxLng: maxLng + lngPadding,
        });

        hasZoomedRef.current = true;
    }, [isOpen, sortedCatches, userLocation, onZoomToCatches, maxDistance, skipAutoZoom]);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " " + dict.yearsAgo;
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " " + dict.monthsAgo;
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " " + dict.daysAgo;
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " " + dict.hoursAgo;
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " " + dict.minutesAgo;
        return dict.justNow;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-[140] bg-zinc-900/70 backdrop-blur-sm rounded-t-3xl max-h-[60vh] flex flex-col shadow-2xl"
                    >


                        <div className="px-4 py-3 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {selectedSpecies ? (
                                        <>
                                            <Fish size={18} className="text-blue-400" />
                                            {selectedSpecies}
                                        </>
                                    ) : (
                                        <>
                                            <Navigation size={18} className="text-blue-400" />
                                            {placeName ? `Nearby ${placeName}` : (dict.nearbyCatchesTitle || 'Nearby Catches')}
                                        </>
                                    )}
                                </h3>
                                <p className="text-xs text-zinc-400 ml-6">
                                    {sortedCatches.filter(c => (c.distance || 0) <= maxDistance).length} {dict.catchesFound || 'catches found'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-zinc-300 hover:text-zinc-400 transition-colors p-1"
                            >
                                <X size={25} />
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="px-4 pb-2 space-y-2">
                            {/* Distance Filter */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
                                {[10, 20, 50, 100].map(dist => (
                                    <button
                                        key={dist}
                                        onClick={() => setMaxDistance(dist)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border",
                                            maxDistance === dist
                                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                                : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800"
                                        )}
                                    >
                                        {dist}km
                                    </button>
                                ))}
                            </div>
                            
                            {/* Time/Size Filters */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
                                {[
                                    { id: 'week', label: dict.thisWeek || 'This Week' },
                                    { id: 'month', label: dict.thisMonth || 'This Month' },
                                    { id: '5kg+', label: '5kg+' },
                                    { id: 'all', label: dict.allTime || 'All Time' },
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setTimeFilter(filter.id as any)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap border",
                                            timeFilter === filter.id
                                                ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                                                : "bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800"
                                        )}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 p-4 space-y-3">
                            {sortedCatches.length > 0 ? (
                                sortedCatches
                                    .filter((c: any) => (c.distance || 0) <= maxDistance)
                                    .map((catchItem: any) => (
                                        <button
                                            key={catchItem.id}
                                            onClick={() => onCatchClick(catchItem)}
                                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 flex items-center gap-3 hover:bg-zinc-800 transition-colors text-left"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-zinc-700 flex-shrink-0 overflow-hidden">
                                                {catchItem.imageUrl ? (
                                                    <CachedImage
                                                      src={catchItem.imageUrl}
                                                      alt={catchItem.species || 'Catch'}
                                                      className="h-full w-full"
                                                      sizes="48px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Fish size={20} className="text-zinc-500" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-zinc-200 truncate">{catchItem.species || dict.unknownSpecies || 'Unknown Species'}</h4>
                                                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Navigation size={10} />
                                                        {catchItem.distance < 1
                                                            ? `${(catchItem.distance * 1000).toFixed(0)}m`
                                                            : `${catchItem.distance.toFixed(1)}km`}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        {formatTimeAgo(catchItem.createdAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                            ) : (
                                <div className="text-center py-8 text-zinc-500">
                                    {dict.noCatchesFoundNearby || 'No catches found nearby'}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

