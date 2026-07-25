"use client";

import React, { useEffect, useRef, useState } from 'react';
import { X, Navigation } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useUserLocation } from '@/components/map/hooks/useUserLocation';
import { useMapStore } from '@/stores/useMapStore';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { DroppedPinMarker } from '@/components/map/DroppedPinMarker';
import { UserLocationMarker } from '@/components/map/UserLocationMarker';
import { SearchSheet } from '@/components/map/SearchSheet/SearchSheet';
import { LocationPickerBottomSheet } from './LocationPickerBottomSheet';

interface LocationPickerMapProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationSelect: (location: { latitude: number; longitude: number; locationName?: string | null }) => void;
    initialLocation?: { latitude: number; longitude: number } | null;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
    isOpen,
    onClose,
    onLocationSelect,
    initialLocation,
}) => {
    const { dict } = useI18n();
    const { mapTheme } = useMapStore();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const { userLocation, centerOnLocation } = useUserLocation(mapRef);
    const { droppedPin, setDroppedPin, showDroppedPinSheet, setShowDroppedPinSheet, setShowBottomSheet } = useMapStore();
    const [showPickerSheet, setShowPickerSheet] = useState(false);
    const longPressTimer = useRef<number | null>(null);
    const longPressLocation = useRef<{ lat: number; lng: number } | null>(null);

    // Initialize map once when modal opens (do not remount on pin / GPS updates)
    useEffect(() => {
        if (!isOpen || !mapContainerRef.current || mapRef.current) return;

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

        const styleMap: Record<string, string> = {
            'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
            'satellite': 'mapbox://styles/mapbox/satellite-v9',
            'dark': 'mapbox://styles/mapbox/dark-v11',
        };
        const theme = mapTheme === 'standard' ? 'outdoors' : mapTheme;
        const style = styleMap[theme] || styleMap['outdoors'];

        const hasInitial =
            initialLocation?.latitude != null && initialLocation?.longitude != null;

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style,
            center: hasInitial
                ? [initialLocation.longitude, initialLocation.latitude]
                : [0, 0],
            zoom: hasInitial ? 14 : 2,
            preserveDrawingBuffer: true,
            trackResize: true,
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
        // Only create/destroy with open state — theme changes use setStyle below
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    // Center once when GPS arrives (only if no initial location was provided)
    const hasCenteredRef = useRef(false);
    useEffect(() => {
        if (!isOpen || !mapRef.current || hasCenteredRef.current) return;
        if (initialLocation?.latitude != null && initialLocation?.longitude != null) {
            hasCenteredRef.current = true;
            return;
        }
        if (!userLocation) return;

        hasCenteredRef.current = true;
        const run = () => {
            mapRef.current?.flyTo({
                center: [userLocation.lng, userLocation.lat],
                zoom: 14,
                essential: true,
            });
        };
        if (mapRef.current.loaded()) run();
        else mapRef.current.once('load', run);
    }, [isOpen, userLocation, initialLocation]);

    useEffect(() => {
        if (!isOpen) {
            hasCenteredRef.current = false;
        }
    }, [isOpen]);

    // Update map style when theme changes
    useEffect(() => {
        if (!mapRef.current || !isOpen) return;
        const styleMap: Record<string, string> = {
            'outdoors': 'mapbox://styles/mapbox/outdoors-v12',
            'satellite': 'mapbox://styles/mapbox/satellite-v9',
            'dark': 'mapbox://styles/mapbox/dark-v11',
        };
        const theme = mapTheme === 'standard' ? 'outdoors' : mapTheme;
        const style = styleMap[theme] || styleMap['outdoors'];
        mapRef.current.setStyle(style);
    }, [mapTheme, isOpen]);


    // Resize map when modal opens
    useEffect(() => {
        if (!isOpen || !mapRef.current) return;

        const resizeMap = () => {
            if (mapRef.current && typeof mapRef.current.resize === 'function') {
                mapRef.current.resize();
            }
        };

        // Resize after a short delay to ensure DOM is ready
        const timeoutId = setTimeout(resizeMap, 100);

        // Also resize when map loads
        if (mapRef.current) {
            if (mapRef.current.loaded()) {
                resizeMap();
            } else {
                mapRef.current.once('load', resizeMap);
            }
        }

        return () => clearTimeout(timeoutId);
    }, [isOpen]);

    // Handle tap and hold to drop pin
    useEffect(() => {
        if (!mapRef.current || !isOpen) return;

        const handleTouchStart = (e: mapboxgl.MapTouchEvent) => {
            if (e.lngLat) {
                longPressLocation.current = {
                    lat: e.lngLat.lat,
                    lng: e.lngLat.lng,
                };
                // Start long press timer (500ms)
                longPressTimer.current = window.setTimeout(() => {
                    if (longPressLocation.current) {
                        setDroppedPin(longPressLocation.current);
                        setShowPickerSheet(true);
                    }
                }, 500);
            }
        };

        const handleTouchEnd = () => {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            longPressLocation.current = null;
        };

        const handleTouchMove = () => {
            // Cancel long press if user moves finger
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            longPressLocation.current = null;
        };

        // Also handle mouse for desktop (right-click or long press simulation)
        const handleContextMenu = (e: mapboxgl.MapMouseEvent) => {
            e.preventDefault();
            if (e.lngLat) {
                setDroppedPin({
                    lat: e.lngLat.lat,
                    lng: e.lngLat.lng,
                });
                setShowPickerSheet(true);
            }
        };

        mapRef.current.on('touchstart', handleTouchStart);
        mapRef.current.on('touchend', handleTouchEnd);
        mapRef.current.on('touchmove', handleTouchMove);
        mapRef.current.on('contextmenu', handleContextMenu);

        return () => {
            if (mapRef.current) {
                mapRef.current.off('touchstart', handleTouchStart);
                mapRef.current.off('touchend', handleTouchEnd);
                mapRef.current.off('touchmove', handleTouchMove);
                mapRef.current.off('contextmenu', handleContextMenu);
            }
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
            }
        };
    }, [isOpen, setDroppedPin]);

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

    // Handle use location from bottom sheet
    const handleUseLocation = () => {
        if (droppedPin) {
            onLocationSelect({
                latitude: droppedPin.lat,
                longitude: droppedPin.lng,
                locationName: null, // Will be fetched if needed
            });
            setShowPickerSheet(false);
            setDroppedPin(null);
            onClose();
        }
    };

    // Handle cancel
    const handleCancel = () => {
        setShowPickerSheet(false);
        setDroppedPin(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex flex-col h-screen bg-zinc-950 text-zinc-100 relative">
            <div ref={mapContainerRef} className="flex-1 relative" />

            {/* Close Button */}
            <button
                onClick={onClose}
                className="fixed top-4 left-4 z-[210] bg-black/40 backdrop-blur-md rounded-full p-2 text-white hover:bg-black/60 transition-colors"
            >
                <X size={20} />
            </button>

            {/* Center Location Button - Right side only (SearchSheet has its own search button) */}
            <button
                onClick={centerOnLocation}
                className="fixed right-4 bottom-24 z-[210] bg-black/40 backdrop-blur-md rounded-full p-3 text-white hover:bg-black/60 transition-colors"
            >
                <Navigation size={20} />
            </button>

            {/* Tap and Hold Notification */}
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[210] bg-black/60 backdrop-blur-md rounded-lg px-4 py-2">
                <p className="text-white text-sm font-medium">
                    {dict.tapAndHoldToDropPin || 'Tap and hold to drop pin'}
                </p>
            </div>

            {/* Dropped Pin Marker */}
            {droppedPin && <DroppedPinMarker map={mapRef} location={droppedPin} />}

            {/* User Location Marker */}
            {userLocation && <UserLocationMarker map={mapRef} userLocation={userLocation} />}

            {/* Search Sheet - Always visible in location picker mode */}
            <div className="fixed bottom-0 left-0 right-0 z-[210] pointer-events-none">
                <div className="pointer-events-auto">
                    <SearchSheet
                        dict={dict}
                        map={mapRef}
                        userLocation={userLocation}
                        onLocationSelect={handleSearchLocationSelect}
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

