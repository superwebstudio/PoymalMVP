"use client";

import { Maximize2, Minimize2, Navigation, List, Radio } from "lucide-react";
import { motion } from "framer-motion";

interface MapControlsProps {
  isBottomNavVisible: boolean;
  onToggleBottomNav: () => void;
  onCenterLocation: () => void;
  onShowNearby?: () => void;
  liveMode?: boolean;
  onToggleLiveMode?: () => void;
  showFullscreenToggle?: boolean;
  showNearbyButton?: boolean;
  bottomOffset?: string;
}

export function MapControls({
  isBottomNavVisible,
  onToggleBottomNav,
  onCenterLocation,
  onShowNearby,
  liveMode = false,
  onToggleLiveMode,
  bottomOffset,
}: MapControlsProps) {
  return (
    <>
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        onClick={onToggleBottomNav}
        className="fixed top-4 left-4 z-[120] touch-manipulation rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60"
      >
        {isBottomNavVisible ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
      </motion.button>

      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        onClick={onShowNearby}
        className="fixed top-16 left-4 z-[120] touch-manipulation rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60"
      >
        <List size={20} />
      </motion.button>

      {onToggleLiveMode && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={onToggleLiveMode}
          aria-pressed={liveMode}
          title={liveMode ? "Live Mode On — demo activity playing" : "Live Mode Off — tap to preview"}
          className={`fixed top-28 left-4 z-[120] touch-manipulation rounded-full p-2 backdrop-blur-md transition-colors ${
            liveMode
              ? "bg-sky-500/90 text-white hover:bg-sky-400"
              : "bg-black/40 text-white hover:bg-black/60"
          }`}
        >
          <Radio size={20} className={liveMode ? "animate-pulse" : undefined} />
        </motion.button>
      )}

      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 }}
        onClick={onCenterLocation}
        className="fixed right-4 z-[120] touch-manipulation rounded-full bg-black/40 p-3 text-white backdrop-blur-md transition-colors hover:bg-black/60"
        style={{
          bottom: bottomOffset ||
            (isBottomNavVisible
              ? "calc(6rem + 0.5rem + 100px + 0.5rem)"
              : "calc(100px + 0.5rem)"),
        }}
      >
        <Navigation size={20} />
      </motion.button>
    </>
  );
}
