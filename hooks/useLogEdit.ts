"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { useLogStore } from '@/stores/useLogStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { uploadCatchImage } from '@/lib/image-upload';


export function useLogEdit(catchId: string, dict: any) {
    const router = useRouter();
    const { userId } = useUserStore();
    const store = useLogStore();
    const { position } = useGeolocation();
    const { addNotification } = useNotificationStore();
    const [isUpdating, setIsUpdating] = useState(false);

    const onSubmit = async (formData: {
        description?: string;
        location?: string;
        depth?: string;
        bait?: string;
        method?: string;
    }) => {
        if (!userId) {
            addNotification({
                message: dict.loginRequired || 'Please log in',
                type: 'error',
                position: 'center',
                showOkButton: true,
            });
            return;
        }

        setIsUpdating(true);

        try {
            const selectedLocation = store.selectedLocation;
            const targetLatitude = selectedLocation?.latitude ?? position?.latitude ?? null;
            const targetLongitude = selectedLocation?.longitude ?? position?.longitude ?? null;
            const targetLocationName = selectedLocation?.locationName ?? position?.locationName ?? null;

            // Fetch weather data if includeWeather is enabled and coordinates are available
            let weatherDataToStore: any = null; // Default to null to clear weather when disabled
            if (store.includeWeather) {
                if (targetLatitude && targetLongitude) {
                    try {
                        const { fetchWeatherData } = useWeatherStore.getState();
                        await fetchWeatherData(targetLatitude, targetLongitude);

                        const weatherState = useWeatherStore.getState();
                        if (weatherState.weatherData || weatherState.marineData) {
                            weatherDataToStore = {
                                weather: weatherState.weatherData ? {
                                    temperature: weatherState.weatherData.temperature,
                                    windSpeed: weatherState.weatherData.windSpeed,
                                    windDirection: weatherState.weatherData.windDirection,
                                    pressure: weatherState.weatherData.pressure,
                                    humidity: weatherState.weatherData.humidity,
                                } : null,
                                marine: weatherState.marineData ? {
                                    waveHeight: weatherState.marineData.waveHeight,
                                    waveDirection: weatherState.marineData.waveDirection,
                                    waterTemperature: weatherState.marineData.waterTemperature,
                                } : null,
                                locationName: weatherState.locationName || targetLocationName || null,
                                fetchedAt: new Date().toISOString(),
                            };
                        }
                    } catch (error) {
                        console.error('Error fetching weather data:', error);
                        weatherDataToStore = { enabled: true, error: 'Failed to fetch weather' };
                    }
                } else {
                    weatherDataToStore = { enabled: true, noCoordinates: true };
                }
            }

            // Handle quick thought mode (text only)
            if (store.postMode === 'quick') {
                if (!formData.description || formData.description.trim() === '') {
                    addNotification({
                        message: dict.thoughtRequired || 'Please enter your thought',
                        type: 'error',
                        position: 'center',
                        showOkButton: true,
                    });
                    setIsUpdating(false);
                    return;
                }

                const response = await fetch(`/api/catch/${catchId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        description: formData.description || null,
                        location: formData.location || position?.locationName || null,
                        latitude: targetLatitude,
                        longitude: targetLongitude,
                        locationPrivate: store.locationPrivate,
                        weatherData: weatherDataToStore, // Always send weatherData (null when disabled)
                    }),
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update catch');
                }

                addNotification({
                    message: dict.updateSuccess || 'Updated successfully!',
                    type: 'success',
                });

                setTimeout(() => {
                    router.push(`/catch/${catchId}`);
                }, 1500);
                return;
            }

            // Handle full post mode with fish entries
            if (store.fishEntries.length === 0) {
                addNotification({
                    message: dict.addFishFirst || 'Please add at least one fish entry',
                    type: 'error',
                    position: 'center',
                    showOkButton: true,
                });
                setIsUpdating(false);
                return;
            }

            // Convert fish entries to the format expected by the API
            const fishEntries = await Promise.all(
                store.fishEntries.map(async (entry) => {
                    let imageUrl = entry.imageData;

                    // Upload new local images (data URLs / files); keep existing remote URLs
                    if (
                        entry.imageFile ||
                        (entry.imageData &&
                            (entry.imageData.startsWith('data:') ||
                                entry.imageData.startsWith('blob:')))
                    ) {
                        try {
                            imageUrl = await uploadCatchImage({
                                imageFile: entry.imageFile,
                                imageData: entry.imageData,
                                filename: 'catch.jpg',
                            });
                        } catch (error) {
                            console.error('Error uploading image:', error);
                            throw error;
                        }
                    }

                    return {
                        id: entry.id,
                        species: entry.species || null,
                        scientificName: entry.scientificName || null,
                        weight: entry.weight || null,
                        length: entry.length || null,
                        imageUrl,
                        bait: entry.bait || formData.bait || null,
                        method: entry.method || formData.method || null,
                    };
                })
            );

            // Update the main catch with shared fields
            const mainCatchResponse = await fetch(`/api/catch/${catchId}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: formData.description || null,
                    location: formData.location || targetLocationName || null,
                    latitude: targetLatitude,
                    longitude: targetLongitude,
                    depth: formData.depth || null,
                    bait: formData.bait || null,
                    method: formData.method || null,
                    locationPrivate: store.locationPrivate,
                    weatherData: weatherDataToStore, // Always send weatherData (null when disabled)
                    // Update first fish entry data on main catch
                    species: fishEntries[0]?.species || null,
                    scientificName: fishEntries[0]?.scientificName || null,
                    weight: fishEntries[0]?.weight ? parseFloat(fishEntries[0].weight) : null,
                    length: fishEntries[0]?.length ? parseFloat(fishEntries[0].length) : null,
                    imageUrl: fishEntries[0]?.imageUrl || null,
                }),
            });

            if (!mainCatchResponse.ok) {
                const error = await mainCatchResponse.json();
                throw new Error(error.error || 'Failed to update catch');
            }

            // Update or create related catches for additional fish entries
            // For now, we'll update the main catch and note that related catches editing
            // would require a more complex API endpoint
            // TODO: Implement proper related catches update/delete/create logic

            addNotification({
                message: dict.updateSuccess || 'Updated successfully!',
                type: 'success',
            });

            setTimeout(() => {
                router.push(`/catch/${catchId}`);
            }, 1500);
        } catch (error: any) {
            console.error('Error updating catch:', error);
            addNotification({
                message: error.message || dict.updateError || 'Failed to update catch',
                type: 'error',
                position: 'center',
                showOkButton: true,
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return { onSubmit, isUpdating };
}

