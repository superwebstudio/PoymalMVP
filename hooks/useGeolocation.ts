import { useState, useCallback, useRef } from 'react';

interface GeoPosition {
    latitude: number;
    longitude: number;
    locationName?: string;
}

interface UseGeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

function readGeolocationError(err: unknown): { code: number | null; message: string } {
    if (err && typeof err === 'object') {
        const code = 'code' in err && typeof (err as GeolocationPositionError).code === 'number'
            ? (err as GeolocationPositionError).code
            : null;
        const message = 'message' in err && typeof (err as GeolocationPositionError).message === 'string'
            ? (err as GeolocationPositionError).message
            : '';
        return { code, message: message || 'Unknown geolocation error' };
    }

    if (typeof err === 'string' && err.trim()) {
        return { code: null, message: err };
    }

    return { code: null, message: 'Unknown geolocation error' };
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
    const [position, setPosition] = useState<GeoPosition | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const getCurrentLocation = useCallback(async () => {
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            setError('Location needs HTTPS on this device.');
            setLoading(false);
            return;
        }

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 120000,
                    ...optionsRef.current,
                });
            });

            const { latitude, longitude } = pos.coords;

            let locationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                    { headers: { 'User-Agent': 'Poymal Fishing App' } }
                );

                if (response.ok) {
                    const data = await response.json();
                    const address = data.address;
                    if (address) {
                        locationName =
                            address.village ||
                            address.town ||
                            address.city ||
                            address.county ||
                            address.state ||
                            `${address.road || ''} ${address.house_number || ''}`.trim() ||
                            locationName;
                    }
                }
            } catch {
                // Reverse geocode is optional — keep coordinate label
            }

            setPosition({ latitude, longitude, locationName });
        } catch (err: unknown) {
            const { code, message } = readGeolocationError(err);

            let userFriendlyMessage = 'Failed to get location.';
            if (code === 1) {
                userFriendlyMessage = 'Please allow location access.';
            } else if (code === 2) {
                userFriendlyMessage = 'Location unavailable.';
            } else if (code === 3) {
                userFriendlyMessage = 'Location request timed out.';
            } else if (message) {
                userFriendlyMessage = message;
            }

            setError(userFriendlyMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    return { position, loading, error, getCurrentLocation };
}
