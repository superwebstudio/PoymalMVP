"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "@/lib/useI18n";
import { useLiveMapStore } from "@/stores/useLiveMapStore";
import type { MapCatch } from "@/components/map/hooks/useCatchMarkers";

interface LiveCatchToastsProps {
  onCatchClick: (catchItem: MapCatch) => void;
  onClusterClick: (
    catches: MapCatch[],
    latitude: number,
    longitude: number
  ) => void;
}

function formatRelativeTime(
  createdAt: string,
  dict: Record<string, string>
): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));

  if (minutes < 1) return dict.justNow || "just now";
  if (minutes < 60) return `${minutes} ${dict.minutesAgoShort || "min ago"}`;

  const hours = Math.floor(minutes / 60);
  return `${hours} ${dict.hoursAgoShort || "h ago"}`;
}

function formatSingleToast(
  catchItem: MapCatch,
  dict: Record<string, string>
): string {
  const name =
    catchItem.user?.firstName ||
    catchItem.user?.username ||
    dict.angler ||
    "Angler";
  const species = catchItem.species || dict.catch || "catch";
  const length =
    catchItem.length != null && catchItem.length > 0
      ? ` ${Math.round(catchItem.length)} cm`
      : "";
  const when = formatRelativeTime(catchItem.createdAt, dict);

  return `🎣 ${name} caught a${length} ${species} • ${when}`;
}

export function LiveCatchToasts({
  onCatchClick,
  onClusterClick,
}: LiveCatchToastsProps) {
  const { dict } = useI18n();
  const events = useLiveMapStore((state) => state.events);
  const dismissToast = useLiveMapStore((state) => state.dismissToast);
  const visible = events.filter((event) => event.toastVisible).slice(0, 3);

  return (
    <div className="pointer-events-none fixed top-16 right-4 z-[130] flex w-[min(20rem,calc(100vw-5.5rem))] flex-col gap-2">
      <AnimatePresence>
        {visible.map((event) => {
          const isCluster = event.type === "cluster";
          const label = isCluster
            ? (
                dict.liveClusterToast || "{count} new catches"
              ).replace("{count}", String(event.catches.length))
            : formatSingleToast(event.catches[0], dict);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="pointer-events-auto flex items-start gap-1 overflow-hidden rounded-2xl border border-zinc-700/80 bg-zinc-900/95 shadow-lg shadow-black/40 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => {
                  dismissToast(event.id);
                  if (isCluster) {
                    onClusterClick(
                      event.catches,
                      event.latitude,
                      event.longitude
                    );
                  } else if (event.catches[0]) {
                    onCatchClick(event.catches[0]);
                  }
                }}
                className="min-w-0 flex-1 px-3 py-2.5 text-left text-sm leading-snug text-zinc-100"
              >
                {label}
              </button>
              <button
                type="button"
                onClick={() => dismissToast(event.id)}
                className="mt-1.5 mr-1.5 rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                aria-label={dict.dismiss || "Dismiss"}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
