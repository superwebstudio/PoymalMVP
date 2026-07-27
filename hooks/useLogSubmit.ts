import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { useLogStore } from '@/stores/useLogStore';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useWeatherStore } from '@/stores/useWeatherStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { uploadCatchImage } from '@/lib/image-upload';

export function useLogSubmit(dict: any) {
  const router = useRouter();
  const { userId } = useUserStore();
  const store = useLogStore();
  const { position } = useGeolocation();
  const { addNotification } = useNotificationStore();
  const [isCreating, setIsCreating] = useState(false);

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

    setIsCreating(true);

    try {
      const selectedLocation = store.selectedLocation;
      const targetLatitude = selectedLocation?.latitude ?? position?.latitude ?? null;
      const targetLongitude = selectedLocation?.longitude ?? position?.longitude ?? null;
      const targetLocationName = selectedLocation?.locationName ?? position?.locationName ?? null;

      let weatherDataToStore: Record<string, unknown> | undefined = undefined;
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

      if (store.postMode === 'bait_mix') {
        if (!store.baitMixForm.mixName || store.baitMixForm.mixName.trim() === '') {
          addNotification({
            message: dict.baitMixNameRequired || 'Please enter a mix name',
            type: 'error',
            position: 'center',
            showOkButton: true,
          });
          setIsCreating(false);
          return;
        }

        let imageUrl: string | null = null;
        if (store.baitMixForm.imageData || store.baitMixForm.imageFile) {
          try {
            imageUrl = await uploadCatchImage({
              imageFile: store.baitMixForm.imageFile,
              imageData: store.baitMixForm.imageData,
              filename: 'bait-mix.jpg',
            });
          } catch (error) {
            console.error('Error uploading image:', error);
            // Re-throw so the outer catch shows a single error modal
            throw error;
          }
        }

        const baitMixData = {
          mixName: store.baitMixForm.mixName.trim(),
          ingredients: store.baitMixForm.ingredients
            .filter(ing => ing.name.trim() !== '')
            .map(ing => ({
              name: ing.name.trim(),
              amount: ing.amount.trim(),
              unit: ing.unit,
              customUnit: ing.unit === 'other' && ing.customUnit ? ing.customUnit.trim() : null,
            })),
          notes: store.baitMixForm.notes.trim() || null,
          targetSpecies: store.baitMixForm.targetSpecies.length > 0 ? store.baitMixForm.targetSpecies : undefined,
          waterTempRange: store.baitMixForm.waterTempRange.trim() || null,
          seasons: store.baitMixForm.seasons.length > 0 ? store.baitMixForm.seasons : undefined,
        };

        const response = await fetch('/api/catch', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postType: 'bait_mix',
            isTextOnly: false,
            description: baitMixData.mixName,
            imageUrl,
            location: formData.location || targetLocationName || null,
            latitude: targetLatitude,
            longitude: targetLongitude,
            locationPrivate: store.locationPrivate,
            isPublic: true,
            baitMixData,
            ...(weatherDataToStore !== undefined && { weatherData: weatherDataToStore }),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to post bait mix');
        }

        addNotification({
          message: dict.postSuccess || 'Posted successfully!',
          type: 'success',
        });

        store.resetBaitMixForm();

        setTimeout(() => {
          router.push('/');
        }, 1500);
        return;
      }

      if (store.postMode === 'quick') {
        if (!formData.description || formData.description.trim() === '') {
          addNotification({
            message: dict.thoughtRequired || 'Please enter your thought',
            type: 'error',
            position: 'center',
            showOkButton: true,
          });
          setIsCreating(false);
          return;
        }

        const response = await fetch('/api/catch', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            postType: 'text',
            isTextOnly: true,
            description: formData.description || null,
            location: formData.location || position?.locationName || null,
            latitude: targetLatitude,
            longitude: targetLongitude,
            locationPrivate: store.locationPrivate,
            ...(weatherDataToStore !== undefined && { weatherData: weatherDataToStore }),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to post catch');
        }

        addNotification({
          message: dict.postSuccess || 'Posted successfully!',
          type: 'success',
        });

        setTimeout(() => {
          router.push('/');
        }, 1500);
        return;
      }

      if (store.fishEntries.length === 0) {
        addNotification({
          message: dict.addFishFirst || 'Please add at least one fish entry',
          type: 'error',
          position: 'center',
          showOkButton: true,
        });
        setIsCreating(false);
        return;
      }

      const fishEntries = await Promise.all(
        store.fishEntries.map(async (entry) => {
          let imageUrl: string | null = null;

          if (entry.imageData || entry.imageFile) {
            try {
              imageUrl = await uploadCatchImage({
                imageFile: entry.imageFile,
                imageData: entry.imageData,
                filename: 'catch.jpg',
              });
            } catch (error) {
              console.error('Error uploading image:', error);
              // Re-throw so the outer catch shows a single error modal
              throw error;
            }
          }

          return {
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

      const response = await fetch('/api/catch', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postType: 'catch',
          isTextOnly: false,
          description: formData.description || null,
          location: formData.location || targetLocationName || null,
          latitude: targetLatitude,
          longitude: targetLongitude,
          depth: formData.depth || null,
          bait: formData.bait || null,
          method: formData.method || null,
          locationPrivate: store.locationPrivate,
          ...(weatherDataToStore !== undefined && { weatherData: weatherDataToStore }),
          fishEntries,
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to post catch';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
          console.error('API Error:', error);
        } catch {
          const text = await response.text();
          console.error('API Error (non-JSON):', text);
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      addNotification({
        message: dict.postSuccess || 'Posted successfully!',
        type: 'success',
      });

      store.setFishEntries([]);
      store.resetFishForm();

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error: unknown) {
      console.error('Error submitting catch:', error);
      const message =
        error instanceof Error
          ? error.message
          : dict.postError || 'Failed to post catch';
      addNotification({
        message,
        type: 'error',
        position: 'center',
        showOkButton: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return { onSubmit, isCreating };
}
