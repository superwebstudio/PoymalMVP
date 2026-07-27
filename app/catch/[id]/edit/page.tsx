"use client";

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BottomNav } from '@/components/BottomNav';
import { Plus } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLogStore, FishEntry } from '@/stores/useLogStore';
import { useLogEdit } from '@/hooks/useLogEdit';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { FishEntrySheet } from '@/components/LogCatchPage/modals/FishEntrySheet';
import { DeleteConfirmModal } from '@/components/LogCatchPage/modals/DeleteConfirmModal';
import { ImagePreviewModal } from '@/components/LogCatchPage/modals/ImagePreviewModal';
import { FishEntriesList } from '@/components/LogCatchPage/FishEntriesList';
import { LocationSection } from '@/components/LogCatchPage/LocationSection';
import { AdditionalDetails } from '@/components/LogCatchPage/AdditionalDetails';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/stores/useUserStore';
import { TelegramBackButton } from '@/components/TelegramBackButton';

const catchSchema = z.object({
  description: z.string().optional(),
  location: z.string().optional(),
  depth: z.string().optional(),
  bait: z.string().optional(),
  method: z.string().optional(),
});

type CatchFormValues = z.infer<typeof catchSchema>;

export default function EditCatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { dict, lang } = useI18n();
  const router = useRouter();
  const { userId } = useUserStore();
  const store = useLogStore();
  const { addNotification } = useNotificationStore();
  const [catchId, setCatchId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const { position, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const { onSubmit, isUpdating } = useLogEdit(catchId || '', dict);

  const methods = useForm<CatchFormValues>({
    resolver: zodResolver(catchSchema),
  });
  const { register, handleSubmit, setValue, watch } = methods;
  const locationInput = watch('location');

  const selectedLocation = store.selectedLocation;
  const setSelectedLocation = store.setSelectedLocation;

  // Resolve params
  React.useEffect(() => {
    const fetchParams = async () => {
      const resolvedParams = await params;
      setCatchId(resolvedParams.id);
    };
    fetchParams();
  }, [params]);

  // Fetch catch data and populate form
  React.useEffect(() => {
    if (!catchId || !userId) return;

    const fetchCatch = async () => {
      try {
        // Fetch main catch
        const response = await fetch(`/api/catch/${catchId}/get`);
        if (!response.ok) {
          addNotification({
            message: dict.catchNotFound || 'Catch not found',
            type: 'error',
            position: 'center',
            showOkButton: true,
          });
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        const catchData = await response.json();

        // Check if user owns this catch
        if (catchData.userId !== userId) {
          addNotification({
            message: dict.unauthorizedEdit || 'You can only edit your own catches',
            type: 'error',
            position: 'center',
            showOkButton: true,
          });
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        // Determine post mode
        const isTextOnly = catchData.isTextOnly || false;
        store.setPostMode(isTextOnly ? 'quick' : 'full');

        // Populate form fields
        setValue('description', catchData.description || '');
        setValue('location', catchData.location || '');
        setValue('depth', catchData.depth?.toString() || '');
        setValue('bait', catchData.bait || '');
        setValue('method', catchData.method || '');

        // Set location state
        if (catchData.latitude && catchData.longitude) {
          setSelectedLocation({
            latitude: catchData.latitude,
            longitude: catchData.longitude,
            locationName: catchData.location || null,
            source: 'manual',
          });
        } else {
          // Clear selected location if no coordinates
          setSelectedLocation(null);
        }

        // Set privacy and weather settings
        store.setLocationPrivate(catchData.locationPrivate || false);
        store.setIncludeWeather(!!catchData.weatherData);

        setIsInitialized(true);

        // For full posts, fetch related catches and convert to fish entries
        if (!isTextOnly) {
          try {
            const relatedResponse = await fetch(
              `/api/catch/${catchId}/related?userId=${catchData.userId}&createdAt=${catchData.createdAt}&location=${encodeURIComponent(catchData.location || '')}`
            );

            let allCatches = [catchData];
            if (relatedResponse.ok) {
              const related = await relatedResponse.json();
              allCatches = [catchData, ...related.filter((c: any) => c.id !== catchId)];
            }

            // Convert catches to fish entries
            const fishEntries: FishEntry[] = allCatches
              .filter((c: any) => c.species || c.imageUrl) // Only include catches with species or image
              .map((c: any) => ({
                id: c.id,
                species: c.species || '',
                scientificName: c.scientificName || '',
                weight: c.weight?.toString() || '',
                length: c.length?.toString() || '',
                imageData: c.imageUrl || null,
                bait: c.bait || '',
                method: c.method || '',
                rating: typeof c.rating === 'number' ? c.rating : null,
              }));

            store.setFishEntries(fishEntries);
          } catch (error) {
            console.error('Error fetching related catches:', error);
            // If related fetch fails, just use the main catch
            if (catchData.species || catchData.imageUrl) {
              store.setFishEntries([{
                id: catchData.id,
                species: catchData.species || '',
                scientificName: catchData.scientificName || '',
                weight: catchData.weight?.toString() || '',
                length: catchData.length?.toString() || '',
                imageData: catchData.imageUrl || null,
                bait: catchData.bait || '',
                method: catchData.method || '',
                rating: typeof catchData.rating === 'number' ? catchData.rating : null,
              }]);
            }
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching catch:', error);
        store.setModalState({
          isOpen: true,
          message: dict.errorLoadingCatch || 'Error loading catch',
          isSuccess: false,
        });
        setLoading(false);
      }
    };

    fetchCatch();
  }, [catchId, userId, router, dict, setValue, setSelectedLocation]);

  // Sync geolocation updates into store (only if not initialized from catch data)
  React.useEffect(() => {
    if (isInitialized && position?.latitude && position?.longitude && !selectedLocation) {
      setSelectedLocation({
        latitude: position.latitude,
        longitude: position.longitude,
        locationName: position.locationName,
        source: 'geolocation',
      });
    }
  }, [position, selectedLocation, setSelectedLocation, isInitialized]);

  // Auto-populate location input only on initial load
  React.useEffect(() => {
    if (isInitialized && selectedLocation?.locationName && !locationInput) {
      setValue('location', selectedLocation.locationName);
    }
  }, [isInitialized, selectedLocation?.locationName, locationInput, setValue]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">{dict.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col bg-zinc-950 text-zinc-100 min-h-screen pb-24">
        <TelegramBackButton fallbackUrl={catchId ? `/catch/${catchId}` : '/'} />

        <main className="flex-1 p-4 space-y-4">
          {store.postMode === 'quick' ? (
            <div className="space-y-3">
              <textarea
                {...register('description')}
                placeholder={dict.shareThought || "Share thoughts..."}
                rows={8}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white text-lg focus:outline-none resize-none"
              />
            </div>
          ) : (
            <>
              {/* Fish Entries Section */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{dict.fishEntries || 'Fish Entries'}</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => store.openFishSheet()}
                    className="hidden md:flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus size={16} />
                    <span>{dict.addFish || 'Add fish'}</span>
                  </button>
                </div>
                <FishEntriesList dict={dict} />
              </section>

              {/* Description */}
              <section className="space-y-3">
                <label className="text-sm text-zinc-400 ml-1">{dict.description}</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  placeholder={dict.descriptionPlaceholder}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none resize-none"
                />
              </section>

              {/* Location Section */}
              <LocationSection
                dict={dict}
                position={position}
                loading={locationLoading}
                getCurrentLocation={getCurrentLocation}
                selectedLocation={selectedLocation}
              />

              {/* Additional Details + Include Weather */}
              <AdditionalDetails
                dict={dict}
                location={locationInput || selectedLocation?.locationName || position?.locationName}
                latitude={selectedLocation?.latitude || position?.latitude || null}
                longitude={selectedLocation?.longitude || position?.longitude || null}
              />
            </>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={isUpdating}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-colors"
          >
            {isUpdating ? (dict.loading || 'Updating...') : (dict.save || 'Save Changes')}
          </button>
        </main>

        {/* Modals and Sheets */}
        <FishEntrySheet dict={dict} lang={lang} />
        <DeleteConfirmModal dict={dict} />
        <ImagePreviewModal />

        <BottomNav />
      </div>
    </FormProvider>
  );
}
