"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import { MapPin, Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLogStore } from "@/stores/useLogStore";

interface LocationCoords {
  latitude: number;
  longitude: number;
  locationName?: string | null;
}

interface LocationSectionProps {
  dict: Record<string, string>;
  position: LocationCoords | null;
  selectedLocation: LocationCoords | null;
  loading: boolean;
  getCurrentLocation: () => void;
}

function buildStaticMapUrl(
  location: LocationCoords,
  options: { pinColor?: string; zoom?: number; showPin?: boolean } = {}
): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
  const { longitude, latitude } = location;
  const zoom = options.zoom ?? 14;
  const showPin = options.showPin !== false;
  const pin = showPin && options.pinColor
    ? `pin-s+${options.pinColor}(${longitude},${latitude})/`
    : "";
  return `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/static/${pin}${longitude},${latitude},${zoom},0/800x400@2x?access_token=${token}`;
}

/** Decorative map when GPS isn't available yet (does not count as selected location) */
const PREVIEW_FALLBACK: LocationCoords = {
  latitude: 49.8175,
  longitude: 15.473,
};

export const LocationSection: React.FC<LocationSectionProps> = ({
  dict,
  position,
  selectedLocation,
  loading,
  getCurrentLocation,
}) => {
  const router = useRouter();
  const store = useLogStore();
  const { locationPrivate } = store;

  const requestedLocationRef = useRef(false);

  // Fetch GPS once on mount so the map preview fills before the user picks
  useEffect(() => {
    if (requestedLocationRef.current) return;
    if (selectedLocation) return;
    if (position?.latitude != null && position?.longitude != null) return;
    requestedLocationRef.current = true;
    getCurrentLocation();
  }, [selectedLocation, position, getCurrentLocation]);

  const locationToUse: LocationCoords | null =
    selectedLocation ??
    (position?.latitude != null && position?.longitude != null
      ? {
          latitude: position.latitude,
          longitude: position.longitude,
          locationName: position.locationName ?? null,
        }
      : null);

  const hasRealLocation = locationToUse != null;
  const mapLocation = locationToUse ?? PREVIEW_FALLBACK;
  const pinColor = selectedLocation ? "ef4444" : "3b82f6";
  const mapUrl = buildStaticMapUrl(mapLocation, {
    pinColor,
    showPin: hasRealLocation,
    zoom: hasRealLocation ? 14 : 6,
  });

  const locationLabel = selectedLocation
    ? selectedLocation.locationName ||
      `${selectedLocation.latitude.toFixed(4)}, ${selectedLocation.longitude.toFixed(4)}`
    : locationToUse
      ? locationToUse.locationName ||
        `${locationToUse.latitude.toFixed(4)}, ${locationToUse.longitude.toFixed(4)}`
      : loading
        ? dict.gettingLocation || "Getting location…"
        : dict.addLocation || "Add Location";

  return (
    <section className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
        <MapPin size={16} className="text-red-400" /> {dict.locationLabel}
      </label>

      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Lock size={14} className="text-zinc-500" />
          <span>{dict.locationPrivacy || "Location Privacy"}:</span>
        </div>
        <div className="flex rounded-full bg-zinc-800 p-0.5">
          <button
            type="button"
            onClick={() => store.setLocationPrivate(true)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              locationPrivate
                ? "bg-red-600 text-white"
                : "text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {dict.private || "Private"}
          </button>
          <button
            type="button"
            onClick={() => store.setLocationPrivate(false)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !locationPrivate
                ? "bg-green-600 text-white"
                : "text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {dict.public || "Public"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          const params = new URLSearchParams();
          if (locationToUse) {
            params.set("lat", locationToUse.latitude.toString());
            params.set("lng", locationToUse.longitude.toString());
          }
          router.push(`/log/pick-location?${params.toString()}`);
        }}
        className="group relative h-36 w-full overflow-hidden rounded-lg bg-zinc-800"
      >
        {mapUrl ? (
          <Image
            src={mapUrl}
            alt=""
            fill
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover"
            unoptimized
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-zinc-900" />
        )}

        <div
          className={`absolute inset-0 ${hasRealLocation ? "bg-black/55" : "bg-black/50"}`}
        />

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 px-4">
          {loading && !hasRealLocation ? (
            <Loader2 size={18} className="animate-spin text-sky-400" />
          ) : (
            <MapPin
              size={18}
              className={hasRealLocation ? "text-sky-400" : "text-zinc-400"}
            />
          )}
          <span className="text-center text-sm font-medium text-white drop-shadow-lg">
            {locationLabel}
          </span>
          {hasRealLocation && !selectedLocation && (
            <span className="text-[11px] text-zinc-300">
              {dict.currentLocation || "Current location"}
            </span>
          )}
        </div>
      </button>
    </section>
  );
};
