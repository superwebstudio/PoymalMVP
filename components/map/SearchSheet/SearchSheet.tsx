"use client";

import React from 'react';
import { X, Plus, Star, Search, CloudSun, Sun, Fish } from 'lucide-react';
import { Sheet } from 'react-modal-sheet';
import { useUserStore } from '@/stores/useUserStore';
import { useMapStore } from '@/stores/useMapStore';
import { useSavedLocationsStore } from '@/stores/useSavedLocationsStore';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useLocationSearch } from '../hooks/useLocationSearch';
import { useSelectedLocation } from '../hooks/useSelectedLocation';
import { useGestureSheet } from '../hooks/useGestureSheet';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { MapStyleGrid } from './MapStyleGrid';
import { SavedLocationsList } from '../SavedLocationsList';
import { TelegramBackButton } from '@/components/TelegramBackButton';
import { BiteForecastCard } from '../weather/BiteForecastCard';
import { WeatherSummaryGrid } from '../weather/WeatherSummaryGrid';
import { MarineConditions } from '../weather/MarineConditions';
import { TideChart } from '../weather/TideChart';
import { Backdrop } from '@/components/ui/Backdrop';

interface SearchSheetProps {
    dict: any;
    map?: React.MutableRefObject<any>;
    onLocationSelect?: (location: { lat: number; lng: number; name: string | null }) => void;
    disableBackdrop?: boolean;
    userLocation?: { lat: number; lng: number } | null;
}

export function SearchSheet({
    dict,
    map,
    onLocationSelect,
    disableBackdrop = false,
    userLocation = null,
}: SearchSheetProps) {
    const { userId } = useUserStore();
    const { locations: savedLocations, deleteLocation, renameLocation } = useSavedLocationsStore();

    const {
        searchQuery,
        mapTheme,
        isBottomNavVisible,
        showSavedLocationsView,
        filters,
        setSearchQuery,
        setMapTheme,
        setShowSavedLocationsView,
        setFilters,
        setShowSearchSheet,
    } = useMapStore();

    // State + refs - declare before useLocationSearch to avoid temporal dead zone
    const [showBackdrop, setShowBackdrop] = React.useState(false);
    const closeTimerRef = React.useRef<number | null>(null);
    const [view, setView] = React.useState<'main' | 'savedLocations' | 'weather'>('main');
    const [weatherLocation, setWeatherLocation] = React.useState<{ lat: number; lng: number; name: string | null } | null>(null);
    const weatherSectionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
    const prevWeatherSections = React.useRef<Set<string>>(new Set());
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [showFishingTypeMenu, setShowFishingTypeMenu] = React.useState(false);
    const fishingTypeMenuRef = React.useRef<HTMLDivElement>(null);

    // Close fishing type menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fishingTypeMenuRef.current && !fishingTypeMenuRef.current.contains(event.target as Node)) {
                setShowFishingTypeMenu(false);
            }
        };

        if (showFishingTypeMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showFishingTypeMenu]);

    const fallbackMapRef = React.useRef<any>(null);
    const mapRef = map ?? fallbackMapRef;
    const { locationSearchResults, isSearchingLocation } = useLocationSearch(
        (showSavedLocationsView || view === 'weather') ? '' : searchQuery
    );
    const { setSelectedLocation } = useSelectedLocation(mapRef);

    const {
        isOpen,
        handleCloseSheet,
        handleOpenSheet,
    } = useGestureSheet();

    const {
        weatherData,
        marineData,
        solunarData,
        tideData,
        loading: weatherLoading,
        error: weatherError,
        locationName: weatherLocationName,
        expandedSections: weatherExpandedSections,
        toggleSection: toggleWeatherSection,
        isCoastal: weatherIsCoastal,
        fetchBasicInfo,
        fetchWeatherData,
    } = useWeatherStore();

    const filteredSavedLocations = React.useMemo(() => {
        if (!showSavedLocationsView || !searchQuery.trim()) {
            return savedLocations;
        }
        const query = searchQuery.toLowerCase();
        return savedLocations.filter(loc =>
            loc.name?.toLowerCase().includes(query) ||
            loc.latitude.toString().includes(query) ||
            loc.longitude.toString().includes(query)
        );
    }, [savedLocations, searchQuery, showSavedLocationsView]);

    // Smooth open: backdrop first, then sheet
    const openSmooth = React.useCallback(() => {
        // Ensure backdrop mounts first frame, then open sheet
        setShowBackdrop(true);
        requestAnimationFrame(() => {
            handleOpenSheet();
        });
    }, [handleOpenSheet]);

    // Smooth close: sheet first, then backdrop fades out
    const closeSmooth = React.useCallback(() => {
        // Close sheet immediately, keep backdrop until fade completes
        handleCloseSheet();
        if (closeTimerRef.current) {
            window.clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = window.setTimeout(() => {
            setShowBackdrop(false);
            // Reset view when closing
            setView('main');
            setWeatherLocation(null);
            closeTimerRef.current = null;
        }, 320); // Match CSS transition duration
    }, [handleCloseSheet]);

    // Cleanup timer on unmount
    React.useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                window.clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    // Sync search open state so My Catches sheet can hide while search is up
    React.useEffect(() => {
        setShowSearchSheet(isOpen);
        return () => {
            setShowSearchSheet(false);
        };
    }, [isOpen, setShowSearchSheet]);

    // Sync view with showSavedLocationsView when sheet opens
    const prevIsOpenRef = React.useRef(false);
    React.useEffect(() => {
        // Only sync when sheet transitions from closed to open
        if (isOpen && !prevIsOpenRef.current && showSavedLocationsView) {
            setView('savedLocations');
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, showSavedLocationsView]);

    // Sync showSavedLocationsView with view state to keep them in sync
    React.useEffect(() => {
        if (view === 'savedLocations' && !showSavedLocationsView) {
            setShowSavedLocationsView(true);
        } else if (view === 'main' && showSavedLocationsView) {
            setShowSavedLocationsView(false);
        }
    }, [view, showSavedLocationsView, setShowSavedLocationsView]);

    // Fetch weather when weather view opens
    React.useEffect(() => {
        if (view === 'weather' && weatherLocation) {
            fetchBasicInfo(weatherLocation.lat, weatherLocation.lng);
            fetchWeatherData(weatherLocation.lat, weatherLocation.lng);
        }
    }, [view, weatherLocation, fetchBasicInfo, fetchWeatherData]);

    // Handle weather section scrolling
    React.useEffect(() => {
        const newlyOpened = Array.from(weatherExpandedSections).find((section) => !prevWeatherSections.current.has(section));
        if (newlyOpened) {
            const sectionElement = weatherSectionRefs.current[newlyOpened];
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
        prevWeatherSections.current = new Set(weatherExpandedSections);
    }, [weatherExpandedSections]);

    const getWeatherIcon = React.useCallback(() => {
        return weatherData ? <Sun size={16} /> : <CloudSun size={16} />;
    }, [weatherData]);

    const displayWeatherLocationName = weatherLocation?.name || weatherLocationName ||
        (weatherLocation ? `${weatherLocation.lat.toFixed(4)}, ${weatherLocation.lng.toFixed(4)}` : 'Unknown Location');

    const handleLocationSelectWithClose = React.useCallback((feature: any) => {
        if (feature.type === 'species') {
            // Handle species selection
            const { setSelectedSpecies, setShowNearbySheet, setSelectedPlace } = useMapStore.getState();
            setSelectedSpecies(feature.species);
            setSelectedPlace({ name: feature.species });
            setShowNearbySheet(true);
            closeSmooth();
        } else {
            // Handle location selection — always flyTo from feature coords
            const center = feature.center;
            const lng = Array.isArray(center) ? center[0] : feature.geometry?.coordinates?.[0];
            const lat = Array.isArray(center) ? center[1] : feature.geometry?.coordinates?.[1];
            const name = feature.place_name ?? null;

            if (typeof lng === 'number' && typeof lat === 'number' && mapRef.current) {
                const runFly = () => {
                    mapRef.current?.flyTo({
                        center: [lng, lat],
                        zoom: 12,
                        duration: 1500,
                        essential: true,
                    });
                };
                if (mapRef.current.loaded()) {
                    runFly();
                } else {
                    mapRef.current.once('load', runFly);
                }
            }

            setSelectedLocation(feature);
            if (typeof lng === 'number' && typeof lat === 'number') {
                useMapStore.getState().setSearchQuery(name || '');
                onLocationSelect?.({ lat, lng, name });
            }
            closeSmooth();
            setTimeout(() => {
                if (mapRef.current && typeof mapRef.current.resize === 'function') {
                    mapRef.current.resize();
                }
            }, 250);
        }
    }, [setSelectedLocation, closeSmooth, mapRef, onLocationSelect]);

    const showSearchResults = !showSavedLocationsView && locationSearchResults.length > 0;
    const bottomOffset = isBottomNavVisible ? 120 : 24;

    return (
        <>
            {!isOpen && (
                <button
                    onClick={openSmooth}
                    className="fixed right-4 z-40 bg-black/40 backdrop-blur-md rounded-full p-4 text-white hover:bg-black/60 transition-colors"
                    style={{ bottom: `${bottomOffset}px` }}
                >
                    <Search size={24} />
                </button>
            )}

            {showBackdrop && !disableBackdrop && (
                <Backdrop
                    isOpen={isOpen}
                    onClose={closeSmooth}
                    blur={true}
                    zIndex={90}
                />
            )}

            <Sheet
                isOpen={isOpen}
                onClose={closeSmooth}
                snapPoints={[0, 1]}
                initialSnap={1}
                style={{ zIndex: 200 }}
            >
                <Sheet.Container
                    data-search-sheet
                    className="pointer-events-auto"
                    style={{
                        backgroundColor: '#18181b',
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        borderColor: 'rgb(39, 39, 42)',
                        borderWidth: '1px',
                    }}
                >
                    <Sheet.Header>
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeSmooth();
                            }}
                            className="absolute top-4 right-4 z-[100]  rounded-full p-3 text-zinc-300  transition-colors pointer-events-auto touch-manipulation"
                            style={{ zIndex: 100 }}
                        >
                            <X size={25} />
                        </button>
                    </Sheet.Header>

                    <Sheet.Content className="px-4 pb-4 overflow-y-auto">
                        <div className="flex flex-col min-h-full mt-10">
                            {/* Search Bar */}
                            <div className="relative mb-2 shrink-0">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    onFocus={() => { }}
                                    onBlur={() => { }}
                                    onClick={() => { }}
                                    placeholder={
                                        showSavedLocationsView
                                            ? (dict.searchSavedLocations || "Search saved locations...")
                                            : (dict.searchLocation || "Search location...")
                                    }
                                    isSearching={showSavedLocationsView ? false : isSearchingLocation}
                                    inputRef={searchInputRef}
                                    isSheetCollapsed={false}
                                />

                                {/* Search Results Overlay */}
                                {showSearchResults && (
                                    <div
                                        className="absolute left-0 right-0 z-50 bg-zinc-900 rounded-xl border border-zinc-700 shadow-xl"
                                        style={{
                                            marginTop: '-0.5rem',
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                        }}
                                    >
                                        <SearchResults
                                            results={locationSearchResults}
                                            onSelect={handleLocationSelectWithClose}
                                            dict={dict}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 pb-8">
                                {view === 'weather' ? (
                                    <div className="space-y-4">
                                        <TelegramBackButton
                                            onClick={() => {
                                                setView('savedLocations');
                                                setWeatherLocation(null);
                                            }}
                                        />

                                        {/* Weather Header */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                {getWeatherIcon()}
                                                <h3 className="text-lg font-semibold text-white">{dict.weather || 'Weather'}</h3>
                                            </div>
                                            {displayWeatherLocationName && (
                                                <p className="text-sm text-zinc-400">{displayWeatherLocationName}</p>
                                            )}
                                        </div>

                                        {weatherLoading && (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                                            </div>
                                        )}

                                        {weatherError && (
                                            <div className="text-red-400 text-sm text-center py-4">{weatherError}</div>
                                        )}

                                        {!weatherLoading && !weatherError && weatherData && (
                                            <div className="space-y-3 pb-8">
                                                {solunarData && (
                                                    <BiteForecastCard
                                                        dict={dict}
                                                        solunarData={solunarData}
                                                        weatherData={weatherData}
                                                    />
                                                )}

                                                <WeatherSummaryGrid dict={dict} weatherData={weatherData} />

                                                {marineData && (
                                                    <div ref={(el) => { weatherSectionRefs.current['marine'] = el; }}>
                                                        <MarineConditions
                                                            dict={dict}
                                                            data={marineData}
                                                            isOpen={weatherExpandedSections.has('marine')}
                                                            onToggle={toggleWeatherSection}
                                                        />
                                                    </div>
                                                )}

                                                {tideData && weatherIsCoastal && (
                                                    <div ref={(el) => { weatherSectionRefs.current['tide'] = el; }}>
                                                        <TideChart
                                                            dict={dict}
                                                            data={tideData}
                                                            isOpen={weatherExpandedSections.has('tide')}
                                                            onToggle={toggleWeatherSection}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!weatherLoading && !weatherError && !weatherData && (
                                            <div className="text-center py-12 text-zinc-400">
                                                {dict.noWeatherData || 'No weather data available'}
                                            </div>
                                        )}
                                    </div>
                                ) : showSavedLocationsView || view === 'savedLocations' ? (
                                    <div className="space-y-4">
                                        <TelegramBackButton
                                            onClick={() => {
                                                // Reset both state sources to ensure we go back to main view
                                                setView('main');
                                                setSearchQuery('');
                                                // setShowSavedLocationsView will be synced by useEffect above
                                            }}
                                        />

                                        {filteredSavedLocations.length === 0 ? (
                                            <div className="text-center py-8 text-zinc-500">
                                                {searchQuery.trim()
                                                    ? (dict.noSavedLocationsFound || "No saved locations found")
                                                    : (dict.noSavedLocations || "No saved locations yet")
                                                }
                                            </div>
                                        ) : (
                                            <SavedLocationsList
                                                locations={filteredSavedLocations}
                                                onSelect={(loc) => {
                                                    if (mapRef.current) {
                                                        mapRef.current.flyTo({
                                                            center: [loc.lng, loc.lat],
                                                            zoom: 14,
                                                            essential: true
                                                        });
                                                    }
                                                    closeSmooth();
                                                }}
                                                onLocationClick={(loc) => {
                                                    // Close search sheet first
                                                    closeSmooth();

                                                    // Then open saved location sheet
                                                    setTimeout(() => {
                                                        const { setSelectedSavedLocation, setShowSavedLocationSheet } = useMapStore.getState();
                                                        setSelectedSavedLocation(loc);
                                                        setShowSavedLocationSheet(true);

                                                        if (mapRef.current) {
                                                            mapRef.current.flyTo({
                                                                center: [loc.longitude, loc.latitude],
                                                                zoom: 14,
                                                                essential: true
                                                            });
                                                        }
                                                    }, 300);
                                                }}
                                                onDelete={(id) => deleteLocation({ id }).catch(console.error)}
                                                onRename={(id, name) => renameLocation({ id, name }).catch(console.error)}
                                                onWeatherClick={(loc) => {
                                                    setWeatherLocation(loc);
                                                    setView('weather');
                                                }}
                                                dict={dict}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-6">
                                            <button
                                                onClick={() => {
                                                    setShowSavedLocationsView(true);
                                                    setView('savedLocations');
                                                }}
                                                className="w-full flex items-center justify-between bg-zinc-800/40 hover:bg-zinc-800/60 p-4 rounded-2xl transition-all duration-200 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center group-hover:bg-yellow-500/20 transition-colors">
                                                        <Star size={20} className="text-yellow-500" />
                                                    </div>
                                                    <div className="text-left">
                                                        <h4 className="font-semibold text-zinc-200">{dict.savedLocations || "My Saved Locations"}</h4>
                                                        <p className="text-xs text-zinc-400">{savedLocations.length} {dict.locations || "locations"}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        </div>

                                        <MapStyleGrid
                                            mapTheme={mapTheme}
                                            onSelect={(theme) => {
                                                const validTheme = theme === 'standard' ? 'outdoors' : theme;
                                                setMapTheme(validTheme);
                                                const userId = useUserStore.getState().userId;
                                                if (userId) {
                                                    fetch('/api/user/preferences', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                        },
                                                        credentials: 'include',
                                                        body: JSON.stringify({ mapTheme: validTheme }),
                                                    }).catch(console.error);
                                                }
                                            }}
                                            dict={dict}
                                        />

                                        {/* Fishing Type Selector */}
                                        <div className="mb-4">
                                            <div className="relative" ref={fishingTypeMenuRef}>
                                                <button
                                                    onClick={() => setShowFishingTypeMenu(!showFishingTypeMenu)}
                                                    className="w-full flex items-center justify-between bg-zinc-800/40 hover:bg-zinc-800/60 p-4 rounded-2xl transition-all duration-200"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center">
                                                            <Fish size={20} className="text-sky-500" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h4 className="font-semibold text-zinc-200">{dict.fishingType || "Fishing Type"}</h4>
                                                            <p className="text-xs text-zinc-400">
                                                                {filters.fishingType
                                                                    ? (dict[filters.fishingType] || filters.fishingType)
                                                                    : (dict.allTypes || "All types")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className={`transform transition-transform ${showFishingTypeMenu ? 'rotate-180' : ''}`}>
                                                        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </button>

                                                {showFishingTypeMenu && (
                                                    <div className="absolute left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                                                        {[
                                                            { value: null, label: dict.allTypes || 'All types' },
                                                            { value: 'freshwater', label: dict.freshwater || 'Freshwater (lakes, rivers, ponds)' },
                                                            { value: 'saltwater', label: dict.saltwater || 'Saltwater/Sea (ocean, coastal)' },
                                                            { value: 'ice', label: dict.iceFishing || 'Ice fishing' },
                                                            { value: 'fly', label: dict.flyFishing || 'Fly fishing' },
                                                            { value: 'kayak', label: dict.kayakBoatFishing || 'Kayak/Boat fishing' },
                                                            { value: 'shore', label: dict.shoreBankFishing || 'Shore/Bank fishing' },
                                                        ].map((option) => (
                                                            <button
                                                                key={option.value || 'all'}
                                                                onClick={() => {
                                                                    setFilters({ ...filters, fishingType: option.value });
                                                                    setShowFishingTypeMenu(false);
                                                                }}
                                                                className={`w-full text-left px-4 py-3 text-sm transition-colors ${filters.fishingType === option.value
                                                                    ? 'bg-sky-600/20 text-sky-300'
                                                                    : 'text-zinc-300 hover:bg-zinc-800'
                                                                    }`}
                                                            >
                                                                {option.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <button
                                                onClick={() => window.location.href = `/log?lat=${userLocation?.lat}&lng=${userLocation?.lng}`}
                                                className="w-full bg-sky-600 hover:bg-sky-500 text-white py-4 px-4 rounded-2xl shadow-xl shadow-sky-900/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 font-bold text-base"
                                            >
                                                <Plus size={22} />
                                                <span>{userLocation ? (dict.logCatchHere || "Log Catch at My Location") : (dict.logCatch || "Log Catch")}</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </Sheet.Content>
                </Sheet.Container>
            </Sheet>
        </>
    );
}
