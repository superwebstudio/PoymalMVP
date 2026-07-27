"use client";

import Link from "next/link";
import { Flame, Fish, Compass } from "lucide-react";
import { useI18n } from "@/lib/useI18n";
import type { MapMode } from "@/components/map/hooks/useCatchMarkers";
import type { AccessTier } from "@/lib/access-tier";

interface MapModeSwitcherProps {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  tier: AccessTier;
}

const MODES: Array<{
  id: MapMode;
  labelKey: string;
  fallback: string;
  icon: typeof Flame;
  requiresAuth?: boolean;
}> = [
  { id: "hotspots", labelKey: "hotspots", fallback: "Hotspots", icon: Flame },
  {
    id: "my-spots",
    labelKey: "myCatches",
    fallback: "My Catches",
    icon: Fish,
    requiresAuth: true,
  },
  { id: "explore", labelKey: "explore", fallback: "Explore", icon: Compass },
];

export function MapModeSwitcher({
  mode,
  onModeChange,
  tier,
}: MapModeSwitcherProps) {
  const { dict } = useI18n();
  const isGuest = tier === "guest";

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-[120] -translate-x-1/2">
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/50 p-1 shadow-lg backdrop-blur-md">
          {MODES.map(({ id, labelKey, fallback, icon: Icon, requiresAuth }) => {
            if (requiresAuth && isGuest) {
              return (
                <Link
                  key={id}
                  href="/login?next=/map"
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-white/10"
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">
                    {(dict as Record<string, string>)[labelKey] || fallback}
                  </span>
                </Link>
              );
            }

            const selected = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onModeChange(id)}
                aria-pressed={selected}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selected
                    ? "bg-white text-zinc-900"
                    : "text-zinc-200 hover:bg-white/10"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">
                  {(dict as Record<string, string>)[labelKey] || fallback}
                </span>
              </button>
            );
          })}
        </div>
        {tier !== "pro" && mode !== "my-spots" && (
          <Link
            href={tier === "guest" ? "/login?next=/map" : "/pro"}
            className="rounded-full border border-yellow-500/30 bg-black/60 px-3 py-1 text-[11px] font-medium text-yellow-300 backdrop-blur-md"
          >
            {tier === "guest"
              ? "Community heatmap — sign in for your spots"
              : "Upgrade to PRO for exact community locations"}
          </Link>
        )}
      </div>
    </div>
  );
}
