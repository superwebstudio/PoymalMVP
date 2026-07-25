import { create } from 'zustand';
import { useUserStore } from './useUserStore';

export interface SavedLocation {
    id: string;
    latitude: number;
    longitude: number;
    name: string | null;
    createdAt?: string;
}

interface SavedLocationsStore {
    locations: SavedLocation[];
    loading: boolean;
    error: string | null;

    // Actions
    addLocation: (location: Omit<SavedLocation, 'id' | 'createdAt'>) => void;
    removeLocation: (id: string) => void;
    updateLocationName: (id: string, name: string | null) => void;
    setLocations: (locations: SavedLocation[]) => void;

    // Async actions with server sync
    createLocation: (location: { name: string | null; latitude: number; longitude: number }) => Promise<SavedLocation>;
    deleteLocation: (data: { id: string }) => Promise<void>;
    renameLocation: (data: { id: string; name: string | null }) => Promise<void>;
    fetchLocations: (userId: string) => Promise<void>;

    // Loading states
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
}

export const useSavedLocationsStore = create<SavedLocationsStore>()(
    (set, get) => ({
        locations: [],
        loading: false,
        error: null,

        addLocation: (location) => {
            const newLocation: SavedLocation = {
                ...location,
                id: `temp-${Date.now()}`,
                createdAt: new Date().toISOString(),
            };
            set((state) => ({
                locations: [...state.locations, newLocation],
            }));
        },

        removeLocation: (id) => {
            set((state) => ({
                locations: state.locations.filter((loc) => loc.id !== id),
            }));
        },

        updateLocationName: (id, name) => {
            set((state) => ({
                locations: state.locations.map((loc) =>
                    loc.id === id ? { ...loc, name } : loc
                ),
            }));
        },

        setLocations: (locations) => set({ locations }),

        createLocation: async (location) => {
            const userId = useUserStore.getState().userId;
            if (!userId) throw new Error('User not authenticated');

            const payload = {
                ...location,
                name: location.name?.trim() || 'Saved Location',
            };

            const tempId = `temp-${Date.now()}`;
            const optimisticLocation: SavedLocation = {
                ...payload,
                id: tempId,
                createdAt: new Date().toISOString(),
            };

            set((state) => ({
                locations: [...state.locations, optimisticLocation],
            }));

            try {
                const response = await fetch('/api/saved-locations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(payload),
                });

                if (response.status === 409) {
                    // Already saved — keep optimistic pin and sync from server
                    await get().fetchLocations(userId);
                    const existing = get().locations.find(
                        (loc) =>
                            Math.abs(loc.latitude - payload.latitude) < 0.0001 &&
                            Math.abs(loc.longitude - payload.longitude) < 0.0001
                    );
                    if (existing) return existing;
                    return optimisticLocation;
                }

                if (!response.ok) {
                    let message = 'Failed to create location';
                    try {
                        const errorJson = (await response.json()) as { error?: string };
                        if (errorJson.error) message = errorJson.error;
                    } catch {
                        // ignore parse errors
                    }
                    throw new Error(message);
                }

                const serverLocation = (await response.json()) as SavedLocation;

                set((state) => ({
                    locations: state.locations.map((loc) =>
                        loc.id === tempId ? serverLocation : loc
                    ),
                }));

                get().fetchLocations(userId).catch(console.error);

                return serverLocation;
            } catch (error) {
                get().removeLocation(tempId);
                throw error;
            }
        },

        deleteLocation: async (data: { id: string }) => {
            const { id } = data;
            const userId = useUserStore.getState().userId;
            if (!userId) throw new Error('User not authenticated');

            // Optimistically remove from local state
            const locationToDelete = get().locations.find((loc) => loc.id === id);
            if (locationToDelete) {
                get().removeLocation(id);
            }

            try {
                const response = await fetch(`/api/saved-locations/${id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (!response.ok) {
                    let errorMessage = 'Failed to delete location';
                    try {
                        const errorText = await response.text();
                        if (errorText) {
                            try {
                                const errorJson = JSON.parse(errorText);
                                errorMessage = errorJson.error || errorMessage;
                            } catch {
                                errorMessage = errorText || errorMessage;
                            }
                        }
                    } catch (parseError) {
                        console.error('Error parsing delete response:', parseError);
                        errorMessage = `Server error: ${response.status} ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }

                // Refetch to ensure consistency with database
                get().fetchLocations(userId).catch(console.error);
            } catch (error) {
                // Restore location on error
                if (locationToDelete) {
                    set((state) => ({
                        locations: [...state.locations, locationToDelete],
                        error: error instanceof Error ? error.message : 'Failed to delete location',
                    }));
                } else {
                    set({
                        error: error instanceof Error ? error.message : 'Failed to delete location',
                    });
                }
                console.error('deleteLocation error', error);
                throw error; // Re-throw so caller can handle it
            }
        },

        renameLocation: async (data: { id: string; name: string | null }) => {
            const { id, name } = data;
            const userId = useUserStore.getState().userId;
            if (!userId) throw new Error('User not authenticated');

            // Optimistically update local state
            const oldName = get().locations.find((loc) => loc.id === id)?.name;
            get().updateLocationName(id, name);

            try {
                const response = await fetch(`/api/saved-locations/${id}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name }), // @ts-ignore
                });

                if (!response.ok) throw new Error('Failed to rename location');

                // Refetch to ensure consistency with database
                get().fetchLocations(userId).catch(console.error);
            } catch (error) {
                // Revert on error
                if (oldName !== undefined) {
                    get().updateLocationName(id, oldName);
                }
                throw error;
            }
        },

        fetchLocations: async (userId) => {
            set({ loading: true, error: null });

            try {
                const response = await fetch('/api/saved-locations', {
                    credentials: 'include',
                });

                if (!response.ok) throw new Error('Failed to fetch locations');

                const locations = await response.json();
                set({ locations, loading: false });
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : 'Failed to fetch',
                    loading: false,
                });
            }
        },

        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
    })
)