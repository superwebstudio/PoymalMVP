"use client";

import { useState } from 'react';
import { useSavedLocationsStore } from '@/stores/useSavedLocationsStore';

export function useSavedLocations() {
    const { createLocation: storeCreateLocation } = useSavedLocationsStore();
    const [isCreating, setIsCreating] = useState(false);

    const createLocation = async (location: { name: string | null; latitude: number; longitude: number }) => {
        setIsCreating(true);
        try {
            const result = await storeCreateLocation(location);
            return result;
        } finally {
            setIsCreating(false);
        }
    };

    return {
        createLocation,
        isCreating,
    };
}



