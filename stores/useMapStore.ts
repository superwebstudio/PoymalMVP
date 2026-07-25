import { create } from 'zustand';
import { MapMode } from '@/components/map/hooks/useCatchMarkers';
import { MapCatch } from '@/components/map/hooks/useMapCatches';
import { SavedLocation } from '@/stores/useSavedLocationsStore';

interface MapStore {
    // Map state
    mode: MapMode;
    mapTheme: string;
    searchQuery: string;
    filters: {
        dateFrom: string;
        dateTo: string;
        species?: string[];
        fishingType?: string | null;
    };

    // UI State - Selected Items
    selectedCatch: MapCatch | null;
    selectedSavedLocation: SavedLocation | null;
    droppedPin: { lat: number; lng: number } | null;
    focusPin: { lat: number; lng: number } | null;
    selectedSpecies: string | null; // Selected fish species for filtering
    selectedPlace: { name: string; lat?: number; lng?: number } | null;

    // UI State - Sheet Visibility
    showBottomSheet: boolean; // Catch Details
    showDroppedPinSheet: boolean;
    showSavedLocationSheet: boolean;
    showSavedLocationsView: boolean; // List view in search sheet
    openSavedLocationWeatherView: boolean; // Flag to open weather view in SavedLocationSheet
    showNearbySheet: boolean; // Nearby catches sheet
    isMinimizedSheet: boolean; // Minimized version of catch details sheet
    showSearchSheet: boolean; // Map search sheet open

    // UI State - General
    isBottomNavVisible: boolean;
    weatherExpanded: boolean;

    // Actions
    setMode: (mode: MapMode) => void;
    setMapTheme: (theme: string) => void;
    setSearchQuery: (query: string) => void;
    setFilters: (filters: Partial<{ dateFrom: string; dateTo: string; species?: string[]; fishingType?: string | null }>) => void;

    setSelectedCatch: (catchItem: MapCatch | null) => void;
    setSelectedSavedLocation: (location: SavedLocation | null) => void;
    setDroppedPin: (pin: { lat: number; lng: number } | null) => void;
    setFocusPin: (pin: { lat: number; lng: number } | null) => void;
    setSelectedSpecies: (species: string | null) => void;
    setSelectedPlace: (place: { name: string; lat?: number; lng?: number } | null) => void;

    setShowBottomSheet: (show: boolean) => void;
    setShowDroppedPinSheet: (show: boolean) => void;
    setShowSavedLocationSheet: (show: boolean) => void;
    setShowSavedLocationsView: (show: boolean) => void;
    setOpenSavedLocationWeatherView: (open: boolean) => void;
    setShowNearbySheet: (show: boolean) => void;
    setIsMinimizedSheet: (minimized: boolean) => void;
    setShowSearchSheet: (show: boolean) => void;

    setIsBottomNavVisible: (visible: boolean) => void;
    setWeatherExpanded: (expanded: boolean) => void;

    // Complex UI Actions
    handleCatchClick: (catchItem: MapCatch, map: React.MutableRefObject<any>) => void;

    // Sheet closing helpers
    closeDroppedPinSheet: () => void;
    closeCatchDetailsSheet: () => void;
    handleViewCatchDetails: (catchId: string) => void;
    handleLogCatchAtLocation: () => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
    // Initial state
    mode: 'hotspots',
    mapTheme: 'outdoors',
    searchQuery: '',
    filters: {
        dateFrom: '',
        dateTo: '',
    },
    selectedCatch: null,
    selectedSavedLocation: null,
    droppedPin: null,
    focusPin: null,
    selectedSpecies: null,
    selectedPlace: null,
    showBottomSheet: false,
    showDroppedPinSheet: false,
    showSavedLocationSheet: false,
    showSavedLocationsView: false,
    openSavedLocationWeatherView: false,
    showNearbySheet: false,
    isMinimizedSheet: false,
    showSearchSheet: false,
    isBottomNavVisible: true,
    weatherExpanded: false,

    // Setters
    setMode: (mode) => set({ mode }),
    setMapTheme: (theme) => set({ mapTheme: theme }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),

    setSelectedCatch: (catchItem) => set({ selectedCatch: catchItem }),
    setSelectedSavedLocation: (location) => set({ selectedSavedLocation: location }),
    setDroppedPin: (pin) => set({ droppedPin: pin }),
    setFocusPin: (pin) => set({ focusPin: pin }),
    setSelectedSpecies: (species) => set({ selectedSpecies: species }),
    setSelectedPlace: (place) => set({ selectedPlace: place }),

    setShowBottomSheet: (show) => set({ showBottomSheet: show }),
    setShowDroppedPinSheet: (show) => set({ showDroppedPinSheet: show }),
    setShowSavedLocationSheet: (show) => set({ showSavedLocationSheet: show }),
    setShowSavedLocationsView: (show) => set({ showSavedLocationsView: show }),
    setOpenSavedLocationWeatherView: (open) => set({ openSavedLocationWeatherView: open }),
    setShowNearbySheet: (show) => set({ showNearbySheet: show }),
    setIsMinimizedSheet: (minimized) => set({ isMinimizedSheet: minimized }),
    setShowSearchSheet: (show) => set({ showSearchSheet: show }),

    setIsBottomNavVisible: (visible) => set({ isBottomNavVisible: visible }),
    setWeatherExpanded: (expanded) => set({ weatherExpanded: expanded }),

    // Complex Actions
    handleCatchClick: (catchItem, map) => {
        // Close nearby catches sheet if open, then open catch details
        set({
            selectedCatch: catchItem,
            showBottomSheet: true,
            isMinimizedSheet: false,
            showNearbySheet: false, // Close nearby catches sheet
            focusPin:
                catchItem.latitude != null && catchItem.longitude != null
                    ? { lat: catchItem.latitude, lng: catchItem.longitude }
                    : null,
        });

        if (map?.current && catchItem.latitude && catchItem.longitude) {
            const flyToLocation = () => {
                if (!map.current) return;
                const viewportHeight = window.innerHeight;

                map.current.flyTo({
                    center: [catchItem.longitude, catchItem.latitude],
                    zoom: 12,
                    duration: 1500,
                    essential: true,
                    padding: {
                        top: 0,
                        right: 0,
                        bottom: viewportHeight * 0.35,
                        left: 0
                    }
                });
            };

            if (map.current.loaded()) {
                flyToLocation();
            } else {
                map.current.once('load', flyToLocation);
            }
        }
    },

    closeDroppedPinSheet: () => {
        set({ showDroppedPinSheet: false, droppedPin: null });
    },

    closeCatchDetailsSheet: () => {
        set({ showBottomSheet: false, isMinimizedSheet: false });
        setTimeout(() => {
            set({ selectedCatch: null });
        }, 300);
    },

    handleViewCatchDetails: (catchId: string) => {
        window.location.href = `/catch/${catchId}`;
    },

    handleLogCatchAtLocation: () => {
        const catchData = get().selectedCatch;
        if (catchData?.latitude && catchData?.longitude) {
            window.location.href = `/log?lat=${catchData.latitude}&lng=${catchData.longitude}`;
        }
    },
}));
