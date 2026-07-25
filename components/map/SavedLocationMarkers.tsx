import React, { useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { Star } from 'lucide-react';
import { createRoot } from 'react-dom/client';

interface SavedLocation {
    id: string;
    latitude: number;
    longitude: number;
    name: string | null;
}

interface SavedLocationMarkersProps {
    map: React.MutableRefObject<mapboxgl.Map | null>;
    locations: SavedLocation[];
    onLocationClick?: (location: SavedLocation) => void;
}

export const SavedLocationMarkers = ({ map, locations, onLocationClick }: SavedLocationMarkersProps) => {
    const markersRef = React.useRef<{ [key: string]: mapboxgl.Marker }>({});
    const onClickHandlersRef = React.useRef<{ [key: string]: (e: MouseEvent) => void }>({});
    const locationsRef = React.useRef<SavedLocation[]>([]);

    React.useEffect(() => {
        if (!map.current) return;

        const currentLocations = locations;
        const previousLocations = locationsRef.current;
        locationsRef.current = currentLocations;

        // Remove markers that are no longer in the list
        Object.keys(markersRef.current).forEach((id) => {
            if (!currentLocations.find((l) => l.id === id)) {
                const marker = markersRef.current[id];
                const handler = onClickHandlersRef.current[id];
                if (handler && marker.getElement()) {
                    marker.getElement().removeEventListener('click', handler);
                }
                marker.remove();
                delete markersRef.current[id];
                delete onClickHandlersRef.current[id];
            }
        });

        // Add or update markers
        currentLocations.forEach((location) => {
            const existingMarker = markersRef.current[location.id];
            const previousLocation = previousLocations.find((l) => l.id === location.id);

            // Update position if location changed
            if (existingMarker && previousLocation) {
                if (previousLocation.latitude !== location.latitude ||
                    previousLocation.longitude !== location.longitude) {
                    existingMarker.setLngLat([location.longitude, location.latitude]);
                }
            } else if (!existingMarker) {
                // Create new marker
                const el = document.createElement('div');
                el.className = 'saved-location-marker cursor-pointer';
                el.style.zIndex = '10';
                el.style.pointerEvents = 'auto';
                el.style.willChange = 'transform';

                // Create React root for the marker content
                const root = createRoot(el);
                root.render(
                    <div className="bg-zinc-900 border-2 border-yellow-500 rounded-full p-1.5 shadow-lg">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    </div>
                );

                // Create click handler
                const clickHandler = (e: MouseEvent) => {
                    e.stopPropagation();
                    if (onLocationClick) {
                        onLocationClick(location);
                    }
                };
                el.addEventListener('click', clickHandler);
                onClickHandlersRef.current[location.id] = clickHandler;

                const marker = new mapboxgl.Marker({
                    element: el,
                    anchor: 'center'
                })
                    .setLngLat([location.longitude, location.latitude])
                    .addTo(map.current!);

                markersRef.current[location.id] = marker;
            }
        });

        return () => {
            // Cleanup on unmount
            Object.keys(markersRef.current).forEach((id) => {
                const marker = markersRef.current[id];
                const handler = onClickHandlersRef.current[id];
                if (handler && marker.getElement()) {
                    marker.getElement().removeEventListener('click', handler);
                }
                marker.remove();
            });
            markersRef.current = {};
            onClickHandlersRef.current = {};
        };
    }, [map, locations, onLocationClick]);

    return null;
};

