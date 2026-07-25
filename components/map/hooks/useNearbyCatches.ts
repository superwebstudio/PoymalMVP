import { useState, useEffect, useMemo } from 'react';
import { calculateDistance } from '@/lib/locationUtils';
import { Catch } from '@/types';

export function useNearbyCatches(catches: Catch[], userLocation: { lat: number; lng: number } | null) {

    // We use useMemo here instead of useEffect + useState.
    // It's cleaner and runs immediately during render, preventing a "flash" of unsorted content.
    const sortedCatches = useMemo(() => {
        if (!userLocation || catches.length === 0) return catches;

        return [...catches]
            .filter(catchItem => catchItem.latitude != null && catchItem.longitude != null)
            .map(catchItem => ({
                ...catchItem,
                distance: calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    catchItem.latitude!,
                    catchItem.longitude!
                )
            }))
            .sort((a, b) => (a.distance || 0) - (b.distance || 0));

    }, [catches, userLocation]);

    return sortedCatches;
}