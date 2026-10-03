"use client";

import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/useI18n';
import speciesData from '@/data/species.json';

export function useLocationSearch(searchQuery: string) {
    const { lang } = useI18n();
    const [locationSearchResults, setLocationSearchResults] = useState<any[]>([]);
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);

    const searchLocation = async (query: string) => {
        if (!query.trim()) {
            setLocationSearchResults([]);
            return;
        }

        setIsSearchingLocation(true);
        try {
            // Search fish species locally
            const lowerQuery = query.toLowerCase();
            const matchingSpecies = speciesData
                .filter(species => 
                    species.commonNameEn.toLowerCase().includes(lowerQuery) ||
                    species.commonNameRu.toLowerCase().includes(lowerQuery) ||
                    species.scientificName.toLowerCase().includes(lowerQuery)
                )
                .slice(0, 5)
                .map(species => ({
                    type: 'species',
                    id: species.id,
                    species: lang === 'ru' ? species.commonNameRu : species.commonNameEn,
                    scientificName: species.scientificName,
                    place_name: lang === 'ru' ? species.commonNameRu : species.commonNameEn,
                }));

            // Forward geocoding, or reverse geocoding when the query is "lat, lng".
            // Mapbox expects longitude first. The token is the public client token.
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
            const coordMatch = query.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
            let url: string;

            if (coordMatch) {
                const lat = parseFloat(coordMatch[1]);
                const lng = parseFloat(coordMatch[2]);
                url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`;
            } else {
                url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=5`;
            }

            const response = await fetch(url);
            let locationResults: any[] = [];
            if (response.ok) {
                const data = await response.json();
                locationResults = (data.features || []).map((feature: any) => ({
                    ...feature,
                    type: 'location',
                }));
            }

            // Combine results: species first, then locations
            setLocationSearchResults([...matchingSpecies, ...locationResults]);
        } catch (error) {
            console.error('Search error:', error);
            setLocationSearchResults([]);
        } finally {
            setIsSearchingLocation(false);
        }
    };

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery) {
                searchLocation(searchQuery);
            } else {
                setLocationSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, lang]);

    return { locationSearchResults, isSearchingLocation };
}

