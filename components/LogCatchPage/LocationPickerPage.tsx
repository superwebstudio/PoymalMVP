"use client";

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Navigation, X } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserLocation } from '@/components/map/hooks/useUserLocation';
import { useMapInitialization } from '@/components/map/hooks/useMapInitialization';
import { useMapLongPress } from '@/components/map/hooks/useMapLongPress';
import { useMapStore } from '@/stores/useMapStore';
import { useLogStore } from '@/stores/useLogStore';
import { DroppedPinMarker } from '@/components/map/DroppedPinMarker';
import { UserLocationMarker } from '@/components/map/UserLocationMarker';
import { SearchSheet } from '@/components/map/SearchSheet/SearchSheet';
import { LocationPickerBottomSheet } from './LocationPickerBottomSheet';

export const LocationPickerPage: React.FC = () => {
    const { dict } = useI18n();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { mapTheme } = useMapStore();
    const { setSelectedLocation } = useLogStore();
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Get initial location from query params (primitives — stable across re-renders)
    const initialLat = searchParams?.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const initialLng = searchParams?.get('lng') ? parseFloat(searchParams.get('lng')!) : null;
    const hasValidInitial =
        initialLat != null &&
        initialLng != null &&
        !Number.isNaN(initialLat) &&
        !Number.isNaN(initialLng);

    // Initialize map first
    const mapRef = useMapInitialization({
        mapTheme,
        initialCenter: hasValidInitial ? [initialLng, initialLat] : [0, 0],
        initialZoom: hasValidInitial ? 14 : 2,
        mapContainerRef,
        preserveDrawingBuffer: true,
        trackResize: true,
    });

    // Get user location and update map center
    const { userLocation, centerOnLocation } = useUserLocation(mapRef);
    const hasCenteredRef = useRef(hasValidInitial);

    // Center once on open — never again when dropping a pin (that re-renders the page)
    useEffect(() => {
        if (!mapRef.current || hasCenteredRef.current) return;

        const flyOnce = (lng: number, lat: number) => {
            if (hasCenteredRef.current || !mapRef.current) return;
            hasCenteredRef.current = true;
            mapRef.current.flyTo({
                center: [lng, lat],
                zoom: 14,
                essential: true,
            });
        };

        if (hasValidInitial) {
            const run = () => flyOnce(initialLng!, initialLat!);
            if (mapRef.current.loaded()) run();
            else mapRef.current.once('load', run);
            return;
        }

        if (!userLocation) return;

        const run = () => flyOnce(userLocation.lng, userLocation.lat);
        if (mapRef.current.loaded()) run();
        else mapRef.current.once('load', run);
    }, [hasValidInitial, initialLat, initialLng, userLocation, mapRef]);
    const { droppedPin, setDroppedPin } = useMapStore();
    const [showPickerSheet, setShowPickerSheet] = useState(false);
    const [showTapHoldNotification, setShowTapHoldNotification] = useState(true);

    // Handle tap and hold to drop pin
    useMapLongPress({
        map: mapRef,
        onLongPress: (location) => {
            setDroppedPin(location);
            setShowPickerSheet(true);
        },
        enabled: true,
        duration: 500,
        moveThreshold: 0.001,
        excludedSelectors: ['[data-search-sheet]', '.react-modal-sheet-container'],
    });

    // Handle location selection from search
    const handleSearchLocationSelect = (location: { lat: number; lng: number; name: string | null }) => {
        setDroppedPin({
            lat: location.lat,
            lng: location.lng,
        });
        setShowPickerSheet(true);
        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [location.lng, location.lat],
                zoom: 14,
                essential: true,
            });
        }
    };

    // Handle use location from bottom sheet - navigate back with location
    const handleUseLocation = () => {
        if (droppedPin) {
            setSelectedLocation({
                latitude: droppedPin.lat,
                longitude: droppedPin.lng,
                locationName: null,
            });
            setShowPickerSheet(false);
            setDroppedPin(null);
            // Navigate back to log page
            router.back();
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setShowPickerSheet(false);
        setDroppedPin(null);
    };

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 relative">
            <div ref={mapContainerRef} className="flex-1 relative" />

            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="fixed top-4 left-4 z-[210] bg-black/40 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/60 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>

            {/* Center Location Button - Right side, above SearchSheet with proper spacing */}
            <button
                onClick={centerOnLocation}
                className="fixed right-4 z-[220] bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-colors"
                style={{ bottom: '180px' }}
            >
                <Navigation size={20} />
            </button>

            {/* Tap and Hold Notification */}
            {showTapHoldNotification && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[190] bg-black/60 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-3">
                    <p className="text-white text-sm font-medium">
                        {dict.tapAndHoldToDropPin || 'Tap and hold to drop pin'}
                    </p>
                    <button
                        onClick={() => setShowTapHoldNotification(false)}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Dropped Pin Marker */}
            {droppedPin && <DroppedPinMarker map={mapRef} location={droppedPin} />}

            {/* User Location Marker */}
            {userLocation && <UserLocationMarker map={mapRef} userLocation={userLocation} />}

            {/* Search Sheet - Always visible, but don't block map interactions */}
            <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-none">
                <div className="pointer-events-auto" style={{ pointerEvents: 'auto' }}>
                    <SearchSheet
                        dict={dict}
                        map={mapRef}
                        userLocation={userLocation}
                        onLocationSelect={handleSearchLocationSelect}
                        disableBackdrop={true}
                    />
                </div>
            </div>

            {/* Location Picker Bottom Sheet */}
            {showPickerSheet && droppedPin && (
                <LocationPickerBottomSheet
                    dict={dict}
                    location={droppedPin}
                    onUseLocation={handleUseLocation}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
};

