"use client";

import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useI18n } from '@/lib/useI18n';
import { useUserStore } from '@/stores/useUserStore';
import { useMapStore } from '@/stores/useMapStore';
import { useSavedLocationsStore } from '@/stores/useSavedLocationsStore';
import { WeatherWidget } from '@/components/map/WeatherWidget';
import { CatchDetailsSheet } from '@/components/CatchDetailsSheet';
import { BottomNav } from '@/components/BottomNav';
import { MapContainer } from '@/components/map/MapContainer';
import { MapControls } from '@/components/map/MapControls';
import { UserLocationMarker } from '@/components/map/UserLocationMarker';
import { CatchMarkers } from '@/components/map/CatchMarkers';
import { CatchHeatmap } from '@/components/map/CatchHeatmap';
import { SearchSheet } from '@/components/map/SearchSheet/SearchSheet';
import { getAccessTier } from '@/lib/access-tier';
import { useMapInitialization } from '@/components/map/hooks/useMapInitialization';
import { useMapLongPress } from '@/components/map/hooks/useMapLongPress';
import { useUserLocation } from '@/components/map/hooks/useUserLocation';
import { useMapCatches } from '@/components/map/hooks/useMapCatches';
import { useSelectedLocation } from '@/components/map/hooks/useSelectedLocation';
import { DroppedPinSheet } from '@/components/map/DroppedPinSheet';
import { SavedLocationMarkers } from '@/components/map/SavedLocationMarkers';
import { DroppedPinMarker } from '@/components/map/DroppedPinMarker';
import { FocusLocationMarker } from '@/components/map/FocusLocationMarker';
import { SavedLocationSheet } from '@/components/map/SavedLocationSheet';
import { NearbyCatchesSheet } from '@/components/map/NearbyCatchesSheet';
import { MyCatchesSheet } from '@/components/map/MyCatchesSheet';
import { LiveCatchMarkers } from '@/components/map/LiveCatchMarkers';
import { LiveCatchToasts } from '@/components/map/LiveCatchToasts';
import { MapModeSwitcher } from '@/components/map/MapModeSwitcher';
import { useLiveCatchFeed } from '@/components/map/hooks/useLiveCatchFeed';
import { useLiveMapStore } from '@/stores/useLiveMapStore';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { simulateLiveCatchActivity } from '@/lib/simulate-live-catches';
import type { MapCatch } from '@/components/map/hooks/useCatchMarkers';

interface MapPageClientProps {
    initialSavedLocations: any[];
}

export default function MapPageClient({ initialSavedLocations }: MapPageClientProps) {
    const { dict } = useI18n();
    const { userId, currentUser } = useUserStore();
    const accessTier = getAccessTier(
        userId ? { id: userId, isPro: currentUser?.isPro } : null,
    );
    const searchParams = useSearchParams();

    // Local state
    const [mapCenter, setMapCenter] = React.useState<{ lat: number; lng: number } | null>(null);

    // Hydrate Saved Locations from server
    const initializedRef = useRef(false);
    useEffect(() => {
        if (!initializedRef.current && initialSavedLocations) {
            useSavedLocationsStore.setState({ locations: initialSavedLocations });
            initializedRef.current = true;
        }
    }, [initialSavedLocations]);

    // Data Fetching
    const { locations: savedLocations, fetchLocations } = useSavedLocationsStore();

    // Always fetch from server on mount to ensure fresh data
    useEffect(() => {
        if (userId && initializedRef.current) {
            fetchLocations(userId).catch(console.error);
        }
    }, [userId, fetchLocations]);

    // Map store
    const {
        mode,
        mapTheme,
        filters,
        droppedPin,
        focusPin,
        selectedCatch,
        isBottomNavVisible,
        selectedSpecies,
        selectedPlace,
        showNearbySheet,
        showBottomSheet,
        showDroppedPinSheet,
        showSavedLocationSheet,
        showSavedLocationsView,
        setMode,
        setDroppedPin,
        setFocusPin,
        setShowDroppedPinSheet,
        setShowBottomSheet,
        setIsBottomNavVisible,
        handleCatchClick,
        setSelectedSavedLocation,
        setShowSavedLocationSheet,
        setShowSavedLocationsView,
        setShowNearbySheet,
        setSelectedPlace,
        setSelectedSpecies,
        closeDroppedPinSheet,
        closeCatchDetailsSheet,
    } = useMapStore();

    // Close all open sheets before opening nearby catches sheet
    const handleOpenNearbySheet = () => {
        const hasOpenSheets = showBottomSheet || showDroppedPinSheet || showSavedLocationSheet || showSavedLocationsView;

        if (hasOpenSheets) {
            // Close all sheets first
            if (showBottomSheet) {
                closeCatchDetailsSheet();
            }
            if (showDroppedPinSheet) {
                closeDroppedPinSheet();
            }
            if (showSavedLocationSheet) {
                setShowSavedLocationSheet(false);
            }
            if (showSavedLocationsView) {
                setShowSavedLocationsView(false);
            }
            // Small delay to allow sheets to close before opening nearby sheet
            setTimeout(() => {
                setShowNearbySheet(true);
            }, 100);
        } else {
            setShowNearbySheet(true);
        }
    };

    const handleToggleNearbySheet = () => {
        if (showNearbySheet) {
            setShowNearbySheet(false);
            setSelectedPlace(null);
            setSelectedSpecies(null);
            return;
        }

        setSelectedPlace(null);
        setSelectedSpecies(null);
        handleOpenNearbySheet();
    };

    const handleCenterLocation = () => {
        if (showNearbySheet) {
            setShowNearbySheet(false);
            setSelectedPlace(null);
            setSelectedSpecies(null);
        }
        if (showBottomSheet) {
            closeCatchDetailsSheet();
        }
        if (showDroppedPinSheet) {
            closeDroppedPinSheet();
        }
        if (showSavedLocationSheet) {
            setShowSavedLocationSheet(false);
        }

        centerOnLocation();
    };

    // Track map bounds and zoom for species filtering
    const [mapBounds, setMapBounds] = React.useState<{ minLat: number; maxLat: number; minLng: number; maxLng: number } | null>(null);
    const [mapZoom, setMapZoom] = React.useState<number>(10);
    const [mapReady, setMapReady] = React.useState(false);

    // Hooks
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useMapInitialization({
        mapTheme,
        initialCenter: [0, 0],
        initialZoom: 2,
        mapContainerRef: mapContainer,
        preserveDrawingBuffer: true,
        trackResize: false,
    });

    // Track when map is ready
    useEffect(() => {
        if (map.current && map.current.loaded()) {
            setMapReady(true);
        } else if (map.current) {
            map.current.once('load', () => setMapReady(true));
        }
    }, [map]);
    const { userLocation, centerOnLocation } = useUserLocation(map);
    const { catches, loading: catchesLoading, locationMode, mergeCatches, upsertCatch } = useMapCatches(mode, filters, userId, selectedSpecies, mapBounds, mapZoom);
    const showExactMarkers = mode === 'my-spots' || locationMode === 'exact';
    const showHeatmap = mode !== 'my-spots' && locationMode === 'heatmap';
    const { setSelectedLocation } = useSelectedLocation(map);
    const liveMode = useLiveMapStore((state) => state.liveMode);
    const toggleLiveMode = useLiveMapStore((state) => state.toggleLiveMode);
    const weatherExpanded = useWeatherStore((state) => state.isExpanded);
    const showSearchSheet = useMapStore((state) => state.showSearchSheet);

    useLiveCatchFeed({
        map,
        knownCatches: catches,
        onNewCatches: mergeCatches,
    });

    // Optional demo: only when ?liveDemo=1 (avoids fake network/marker churn by default)
    const liveDemoRanRef = useRef(false);
    useEffect(() => {
        const wantsDemo = searchParams.get('liveDemo') === '1';
        if (!liveMode || !wantsDemo) {
            liveDemoRanRef.current = false;
            return;
        }
        if (liveDemoRanRef.current) return;

        const mapInstance = map.current;
        if (!mapInstance) return;

        liveDemoRanRef.current = true;

        if (mapInstance.getZoom() < 11) {
            mapInstance.easeTo({ zoom: 12, duration: 600 });
        }

        const center = mapInstance.getCenter();
        const cancel = simulateLiveCatchActivity(
            { lat: center.lat, lng: center.lng },
            mergeCatches,
        );

        return cancel;
    }, [liveMode, map, mergeCatches, searchParams]);

    // My Catches: keep the current map viewport and drop markers in place
    // (do not auto-fitBounds / fly away from where the user is looking)

    const handleModeChange = (nextMode: typeof mode) => {
        if (accessTier === 'guest' && nextMode === 'my-spots') {
            return;
        }
        setMode(nextMode);
        if (nextMode === 'my-spots') {
            setShowNearbySheet(false);
            setSelectedPlace(null);
            setSelectedSpecies(null);
            if (showBottomSheet) {
                closeCatchDetailsSheet();
            }
            if (showDroppedPinSheet) {
                closeDroppedPinSheet();
            }
        }
    };

    const handleLiveCatchClick = (catchItem: MapCatch) => {
        handleCatchClick(catchItem, map);
    };

    const handleLiveClusterClick = (
        clusterCatches: MapCatch[],
        latitude: number,
        longitude: number,
    ) => {
        mergeCatches(clusterCatches);
        setSelectedPlace({ name: '', lat: latitude, lng: longitude });
        setMapCenter({ lat: latitude, lng: longitude });
        if (map.current) {
            map.current.flyTo({
                center: [longitude, latitude],
                zoom: Math.max(map.current.getZoom(), 12),
                duration: 800,
                essential: true,
            });
        }
        handleOpenNearbySheet();
    };

    // Track map center, bounds, and zoom
    useEffect(() => {
        const mapInstance = map.current;
        if (!mapInstance) return;

        const updateMapState = () => {
            const center = mapInstance.getCenter();
            const bounds = mapInstance.getBounds();
            const zoom = mapInstance.getZoom();

            setMapCenter({ lat: center.lat, lng: center.lng });
            setMapZoom(zoom);

            // Update bounds for species filtering
            if (selectedSpecies && bounds) {
                setMapBounds({
                    minLat: bounds.getSouth(),
                    maxLat: bounds.getNorth(),
                    minLng: bounds.getWest(),
                    maxLng: bounds.getEast(),
                });
            } else {
                setMapBounds(null);
            }
        };

        mapInstance.on('moveend', updateMapState);
        mapInstance.on('zoomend', updateMapState);
        // Initial set
        updateMapState();

        return () => {
            mapInstance.off('moveend', updateMapState);
            mapInstance.off('zoomend', updateMapState);
        };
    }, [map, selectedSpecies]);

    // Tap empty map to dismiss nearby / catch detail sheets (markers handle their own clicks)
    useEffect(() => {
        const mapInstance = map.current;
        if (!mapInstance || (!showNearbySheet && !showBottomSheet)) return;

        const handleMapClick = () => {
            if (showNearbySheet) {
                setShowNearbySheet(false);
                setSelectedPlace(null);
                setSelectedSpecies(null);
            }
            if (showBottomSheet) {
                closeCatchDetailsSheet();
            }
        };

        mapInstance.on('click', handleMapClick);
        return () => {
            mapInstance.off('click', handleMapClick);
        };
    }, [
        map,
        showNearbySheet,
        showBottomSheet,
        setShowNearbySheet,
        setSelectedPlace,
        setSelectedSpecies,
        closeCatchDetailsSheet,
    ]);

    // Track if we've handled query params to prevent user location from overriding
    const hasHandledQueryParams = useRef(false);

    // Reset query params handler when searchParams change
    useEffect(() => {
        hasHandledQueryParams.current = false;
    }, [searchParams?.toString()]);

    // Handle lat/lng and catchId from URL query params (from catch detail page)
    useEffect(() => {
        if (!searchParams || hasHandledQueryParams.current) return;

        const lat = searchParams.get('lat');
        const lng = searchParams.get('lng');
        const catchId = searchParams.get('catchId');

        if (!lat || !lng) return;

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);

        if (isNaN(latitude) || isNaN(longitude)) return;

        hasHandledQueryParams.current = true;

        // Function to center map and fetch catch if needed
        const handleQueryParams = () => {
            if (!map.current) {
                // Retry if map isn't ready yet
                setTimeout(handleQueryParams, 100);
                return;
            }

            // If catchId is provided, fetch and show the catch in catch details sheet (reuse existing sheet)
            if (catchId) {
                // Clear other sheets; mark the location with a focus pin
                useMapStore.getState().setDroppedPin(null);
                useMapStore.getState().setShowDroppedPinSheet(false);
                useMapStore.getState().setShowSavedLocationSheet(false);
                useMapStore.getState().setSelectedSavedLocation(null);
                useMapStore.getState().setFocusPin({ lat: latitude, lng: longitude });

                // Center map on the catch location
                map.current.flyTo({
                    center: [longitude, latitude],
                    zoom: 14,
                    duration: 1500,
                    essential: true,
                });

                const fetchAndShowCatch = async () => {
                    try {
                        const response = await fetch(`/api/catch/${catchId}/get`, {
                            credentials: 'include',
                        });
                        if (response.ok) {
                            const catchData = await response.json();
                            // Convert to MapCatch format expected by the store
                            const mapCatch = {
                                id: catchData.id,
                                species: catchData.species,
                                latitude: catchData.latitude,
                                longitude: catchData.longitude,
                                imageUrl: catchData.imageUrl,
                                createdAt: catchData.createdAt,
                                user: catchData.user,
                                _count: catchData._count || { likes: 0, comments: 0 },
                            };
                            upsertCatch(mapCatch);
                            // Use the exact same catch details sheet component that opens when clicking catches on map
                            // This is the CatchDetailsSheet component rendered at the bottom of the map page
                            // Set isMinimizedSheet to false to show the full sheet with image, same as clicking catches on map
                            useMapStore.getState().setSelectedCatch(mapCatch);
                            useMapStore.getState().setShowBottomSheet(true);
                            useMapStore.getState().setIsMinimizedSheet(false);
                        }
                    } catch (error) {
                        console.error('Error fetching catch:', error);
                    }
                };
                // Wait for map animation to complete
                setTimeout(fetchAndShowCatch, 1600);
            } else {
                // Only drop a pin if no catchId (user wants to save location)
                useMapStore.getState().setFocusPin(null);
                // Center map on the location
                map.current.flyTo({
                    center: [longitude, latitude],
                    zoom: 14,
                    duration: 1500,
                    essential: true,
                });
                setDroppedPin({ lat: latitude, lng: longitude });
            }
        };

        // Wait for map to be ready
        if (mapReady && map.current) {
            handleQueryParams();
        } else if (map.current) {
            // Wait for map to load
            map.current.once('load', () => {
                setMapReady(true);
                handleQueryParams();
            });
        }
    }, [searchParams, mapReady, map, setDroppedPin, setFocusPin, upsertCatch, userId]);

    // Handle Map Long Press (Drop Pin) using shared hook
    useMapLongPress({
        map,
        onLongPress: (location) => {
            // Prevent placing pin if dropped pin sheet or saved location sheet is open
            if (showDroppedPinSheet || showSavedLocationSheet) {
                return;
            }

            // Double-check that sheets are still closed before placing pin
            const currentState = useMapStore.getState();
            if (currentState.showDroppedPinSheet || currentState.showSavedLocationSheet || currentState.showBottomSheet) {
                return;
            }

            setDroppedPin(location);
            setShowDroppedPinSheet(true);
            setShowBottomSheet(false);
            useMapStore.getState().setSelectedCatch(null);
            useMapStore.getState().setFocusPin(null);
        },
        enabled: accessTier !== 'guest' && !showDroppedPinSheet && !showSavedLocationSheet,
        duration: 500,
        moveThreshold: 0.001,
        excludedSelectors: ['.mapboxgl-marker', '.bottom-sheet-container', 'button', '.weather-widget'],
    });

    // Load/Save Map Theme & Data
    React.useEffect(() => {
        // Only fetch if not already hydrated (or if changed)
        if (userId && !initialSavedLocations) {
            fetchLocations(userId);
        }
    }, [userId, fetchLocations, initialSavedLocations]);

    return (
        <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 relative">
            <MapContainer mapTheme={mapTheme} mapContainerRef={mapContainer} />

            <MapModeSwitcher mode={mode} onModeChange={handleModeChange} tier={accessTier} />

            {/* Show saved locations only in "my-spots" mode */}
            {mode === 'my-spots' && accessTier !== 'guest' && (
                <SavedLocationMarkers
                    map={map}
                    locations={savedLocations}
                    onLocationClick={(loc) => {
                        setSelectedSavedLocation(loc);
                        setShowSavedLocationSheet(true);
                        if (map.current) {
                            map.current.flyTo({
                                center: [loc.longitude, loc.latitude],
                                zoom: 14,
                                essential: true
                            });
                        }
                    }}
                />
            )}

            <DroppedPinMarker map={map} location={accessTier === 'guest' ? null : droppedPin} />
            <FocusLocationMarker map={map} location={focusPin} />

            {userLocation && accessTier !== 'guest' && (
                <WeatherWidget
                    latitude={userLocation.lat}
                    longitude={userLocation.lng}
                />
            )}

            <MapControls
                isBottomNavVisible={isBottomNavVisible}
                onToggleBottomNav={() => setIsBottomNavVisible(!isBottomNavVisible)}
                onCenterLocation={handleCenterLocation}
                onShowNearby={handleToggleNearbySheet}
                liveMode={liveMode}
                onToggleLiveMode={accessTier === 'guest' ? undefined : toggleLiveMode}
                showRecenter={!showNearbySheet}
            />

            {userLocation && <UserLocationMarker map={map} userLocation={userLocation} />}

            {showExactMarkers && (
            <CatchMarkers
                map={map}
                catches={catches}
                mode={mode}
                onCatchClick={(catchItem) => handleCatchClick(catchItem, map)}
                currentUserId={userId}
                selectedCatchId={selectedCatch?.id}
            />
            )}

            <CatchHeatmap map={map} catches={catches} enabled={showHeatmap} />
            {liveMode && (
                <>
                    <LiveCatchMarkers
                        map={map}
                        onCatchClick={handleLiveCatchClick}
                        onClusterClick={handleLiveClusterClick}
                    />
                    <LiveCatchToasts
                        onCatchClick={handleLiveCatchClick}
                        onClusterClick={handleLiveClusterClick}
                    />
                </>
            )}

            <SearchSheet
                dict={dict}
                map={map}
                userLocation={userLocation}
                onLocationSelect={(location) => {
                    setSelectedPlace({
                        name: location.name || '',
                        lat: location.lat,
                        lng: location.lng,
                    });
                    setMapCenter({ lat: location.lat, lng: location.lng });
                    handleOpenNearbySheet();
                }}
            />
            {mapCenter && (
                <NearbyCatchesSheet
                    catches={catches}
                    userLocation={
                        selectedPlace?.lat != null && selectedPlace?.lng != null
                            ? { lat: selectedPlace.lat, lng: selectedPlace.lng }
                            : mapCenter
                    }
                    placeName={selectedPlace?.name}
                    selectedSpecies={selectedSpecies}
                    isOpen={showNearbySheet && mode !== 'my-spots'}
                    skipAutoZoom={selectedPlace?.lat != null && selectedPlace?.lng != null}
                    onClose={() => {
                        setShowNearbySheet(false);
                        setSelectedPlace(null);
                        setSelectedSpecies(null);
                    }}
                    onCatchClick={(catchItem) => {
                        if (!showExactMarkers) {
                            window.location.href = '/pro';
                            return;
                        }
                        setShowNearbySheet(false);
                        handleCatchClick(catchItem as MapCatch, map);
                    }}
                    onZoomToCatches={(bounds) => {
                        if (!map.current || !bounds) return;
                        map.current.fitBounds(
                            [[bounds.minLng, bounds.minLat], [bounds.maxLng, bounds.maxLat]],
                            { padding: 50, duration: 1000 }
                        );
                    }}
                />
            )}

            {accessTier !== 'guest' && <DroppedPinSheet />}
            {accessTier !== 'guest' && <SavedLocationSheet />}
            {showExactMarkers && <CatchDetailsSheet />}
            <BottomNav isVisible={isBottomNavVisible} />

            <MyCatchesSheet
                isOpen={mode === 'my-spots' && accessTier !== 'guest' && !weatherExpanded && !showSearchSheet}
                catches={catches}
                onCatchClick={(catchItem) => handleCatchClick(catchItem, map)}
                onClose={() => setMode('hotspots')}
            />
        </div>
    );
}

