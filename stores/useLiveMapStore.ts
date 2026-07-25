"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MapCatch } from "@/components/map/hooks/useCatchMarkers";

export interface LiveCatchEvent {
  id: string;
  type: "single" | "cluster";
  catches: MapCatch[];
  latitude: number;
  longitude: number;
  createdAt: number;
  toastVisible: boolean;
  pulseUntil: number;
}

interface LiveMapStore {
  liveMode: boolean;
  events: LiveCatchEvent[];
  setLiveMode: (value: boolean) => void;
  toggleLiveMode: () => void;
  addEvents: (events: LiveCatchEvent[]) => void;
  dismissToast: (eventId: string) => void;
  removeEvent: (eventId: string) => void;
  clearExpiredPulses: () => void;
}

export const useLiveMapStore = create<LiveMapStore>()(
  persist(
    (set, get) => ({
      liveMode: false,
      events: [],

      setLiveMode: (value) =>
        set({
          liveMode: value,
          events: value ? get().events : [],
        }),

      toggleLiveMode: () => {
        const next = !get().liveMode;
        set({
          liveMode: next,
          events: next ? get().events : [],
        });
      },

      addEvents: (events) =>
        set((state) => ({
          events: [...events, ...state.events].slice(0, 20),
        })),

      dismissToast: (eventId) =>
        set((state) => ({
          events: state.events.map((event) =>
            event.id === eventId ? { ...event, toastVisible: false } : event
          ),
        })),

      removeEvent: (eventId) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== eventId),
        })),

      clearExpiredPulses: () => {
        const now = Date.now();
        set((state) => ({
          events: state.events.filter(
            (event) => event.toastVisible || event.pulseUntil > now
          ),
        }));
      },
    }),
    {
      name: "ulov-live-map",
      partialize: (state) => ({ liveMode: state.liveMode }),
    }
  )
);
