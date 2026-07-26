"use client";

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { BottomNav } from '@/components/BottomNav';
import { Plus } from 'lucide-react';
import { useI18n } from '@/lib/useI18n';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useLogStore } from '@/stores/useLogStore';
import { useLogSubmit } from '@/hooks/useLogSubmit';
import { FishEntrySheet } from '@/components/LogCatchPage/modals/FishEntrySheet';
import { DeleteConfirmModal } from '@/components/LogCatchPage/modals/DeleteConfirmModal';
import { StatusModal } from '@/components/LogCatchPage/modals/StatusModal';
import { ImagePreviewModal } from '@/components/LogCatchPage/modals/ImagePreviewModal';
import { FishEntriesList } from '@/components/LogCatchPage/FishEntriesList';
import { LocationSection } from '@/components/LogCatchPage/LocationSection';
import { AdditionalDetails } from '@/components/LogCatchPage/AdditionalDetails';
import { useSearchParams } from 'next/navigation';
import { BaitMixForm } from '@/components/LogCatchPage/BaitMixForm';

const catchSchema = z.object({
  description: z.string().optional(),
  location: z.string().optional(),
  depth: z.string().optional(),
  bait: z.string().optional(),
  method: z.string().optional(),
});

type CatchFormValues = z.infer<typeof catchSchema>;

function LogCatchPageContent() {
  const { dict, lang } = useI18n();
  const store = useLogStore();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString() ?? '';
  const { position, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const { onSubmit, isCreating } = useLogSubmit(dict);

  const querySelectedLocation = React.useMemo(() => {
    if (!searchParamsString) return null;
    const params = new URLSearchParams(searchParamsString);
    const latParam = params.get('lat');
    const lngParam = params.get('lng');
    if (!latParam || !lngParam) return null;
    const latitude = parseFloat(latParam);
    const longitude = parseFloat(lngParam);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;
    const name = params.get('name');
    return {
      latitude,
      longitude,
      locationName: name || null,
      source: 'query' as const,
    };
  }, [searchParamsString]);

  const methods = useForm<CatchFormValues>({
    resolver: zodResolver(catchSchema),
  });
  const { register, handleSubmit, setValue, watch } = methods;
  const locationInput = watch('location');

  const selectedLocation = store.selectedLocation;
  const setSelectedLocation = store.setSelectedLocation;

  // Sync query params selection into store
  React.useEffect(() => {
    if (querySelectedLocation) {
      setSelectedLocation(querySelectedLocation);
      if (querySelectedLocation.locationName) {
        setValue('location', querySelectedLocation.locationName);
      } else {
        setValue('location', `${querySelectedLocation.latitude.toFixed(4)}, ${querySelectedLocation.longitude.toFixed(4)}`);
      }
    }
  }, [querySelectedLocation, setSelectedLocation, setValue]);

  // Sync geolocation updates into store
  React.useEffect(() => {
    if (position?.latitude && position?.longitude) {
      setSelectedLocation({
        latitude: position.latitude,
        longitude: position.longitude,
        locationName: position.locationName,
        source: 'geolocation',
      });
    }
  }, [position, setSelectedLocation]);

  // Auto-populate location input when selectedLocation has a name and input is empty
  React.useEffect(() => {
    if (selectedLocation?.locationName && !locationInput) {
      setValue('location', selectedLocation.locationName);
    }
  }, [selectedLocation?.locationName, locationInput, setValue]);

  // Sync selectedLocation from store when returning from location picker
  React.useEffect(() => {
    const locationFromStore = store.selectedLocation;
    if (locationFromStore && locationFromStore.latitude && locationFromStore.longitude) {
      if (locationFromStore.locationName) {
        setValue('location', locationFromStore.locationName);
      } else {
        setValue('location', `${locationFromStore.latitude.toFixed(4)}, ${locationFromStore.longitude.toFixed(4)}`);
      }
    }
  }, [store.selectedLocation, setValue, store]);

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col bg-zinc-950 text-zinc-100 min-h-screen pb-24">
        {/* Header Mode Switcher */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2">
          <div className="flex gap-2">
            {(['full', 'quick', 'bait_mix'] as const).map((m) => (
              <button
                key={m}
                onClick={() => store.setPostMode(m)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors text-sm ${store.postMode === m
                  ? 'bg-sky-600 text-white'
                  : 'bg-zinc-800 text-zinc-400'
                  }`}
              >
                {m === 'full' ? (dict.fullPost || 'Full Post') : m === 'quick' ? (dict.quickThought || 'Quick Thought') : (dict.baitMix || 'Bait Mix')}
              </button>
            ))}
          </div>
        </div>

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
          ) : store.postMode === 'bait_mix' ? (
            <BaitMixForm
              dict={dict}
              position={position}
              loading={locationLoading}
              getCurrentLocation={getCurrentLocation}
              selectedLocation={selectedLocation}
            />
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
            disabled={isCreating}
            className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl shadow-lg disabled:opacity-50 transition-colors"
          >
            {isCreating ? (dict.loading || 'Posting...') : dict.postCatch}
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

export default function LogCatchPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
          Loading...
        </div>
      }
    >
      <LogCatchPageContent />
    </React.Suspense>
  );
}
