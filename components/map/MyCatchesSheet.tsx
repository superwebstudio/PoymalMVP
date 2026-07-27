"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Sheet } from "react-modal-sheet";
import { Fish, X } from "lucide-react";
import { useI18n } from "@/lib/useI18n";
import { useMapStore } from "@/stores/useMapStore";
import type { MapCatch } from "@/components/map/hooks/useCatchMarkers";
import { CachedImage } from "@/components/CachedImage";

interface MyCatchesSheetProps {
  isOpen: boolean;
  catches: MapCatch[];
  onCatchClick: (catchItem: MapCatch) => void;
  onClose: () => void;
}

/** Peek (~30%), mid, and full list */
const SNAP_POINTS = [0, 0.3, 0.55, 1] as const;
const PEEK_SNAP_INDEX = 1;

function formatCatchMeta(
  catchItem: MapCatch,
  dict: Record<string, string>,
): string {
  const parts: string[] = [];
  if (catchItem.length != null && catchItem.length > 0) {
    parts.push(`${Math.round(catchItem.length)} cm`);
  }
  if (catchItem.weight != null && catchItem.weight > 0) {
    parts.push(`${catchItem.weight.toFixed(1)} kg`);
  }
  if (parts.length === 0) {
    return dict.catch || "Catch";
  }
  return parts.join(" · ");
}

export function MyCatchesSheet({
  isOpen,
  catches,
  onCatchClick,
  onClose,
}: MyCatchesSheetProps): React.JSX.Element | null {
  const { dict } = useI18n();
  const showBottomSheet = useMapStore((state) => state.showBottomSheet);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const restoreAfterDetailRef = useRef(false);
  const sheetKeyRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Enter My Catches → slide open at ~30% peek (never the collapsed bar)
  useEffect(() => {
    if (!isOpen) {
      setSheetOpen(false);
      restoreAfterDetailRef.current = false;
      return;
    }
    if (showBottomSheet) return;
    sheetKeyRef.current += 1;
    setSheetOpen(true);
  }, [isOpen, showBottomSheet]);

  // After closing an individual catch, reopen My Catches at peek height
  useEffect(() => {
    if (!isOpen || showBottomSheet) return;
    if (!restoreAfterDetailRef.current) return;
    restoreAfterDetailRef.current = false;
    sheetKeyRef.current += 1;
    setSheetOpen(true);
  }, [showBottomSheet, isOpen]);

  const sortedCatches = useMemo(
    () =>
      [...catches].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [catches],
  );

  const countLabel =
    sortedCatches.length === 1
      ? `1 ${dict.catch || "catch"}`
      : `${sortedCatches.length} ${dict.catches || "catches"}`;

  if (!mounted) return null;

  return (
    <Sheet
      key={`my-catches-${sheetKeyRef.current}`}
      isOpen={isOpen && sheetOpen && !showBottomSheet}
      onClose={() => {
        setSheetOpen(false);
        onClose();
      }}
      snapPoints={[...SNAP_POINTS]}
      initialSnap={PEEK_SNAP_INDEX}
      style={{ zIndex: 210 }}
    >
      <Sheet.Container
        className="!border-t !border-zinc-800 !bg-zinc-900"
        style={{
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <Sheet.Header>
          <div className="flex justify-center pb-1 pt-2.5">
            <div className="h-1.5 w-10 rounded-full bg-zinc-600" />
          </div>
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-zinc-100">
                {(dict as Record<string, string>).myCatches || "My Catches"}
              </h3>
              <p className="text-xs text-zinc-500">{countLabel}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSheetOpen(false);
                onClose();
              }}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={dict.close || "Close"}
            >
              <X size={18} />
            </button>
          </div>
        </Sheet.Header>

        <Sheet.Content className="px-4 pb-4">
          {sortedCatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-zinc-500">
              <Fish size={28} className="opacity-50" />
              <p className="text-sm">
                {(dict as Record<string, string>).noMyCatchesOnMap ||
                  "No catches with a location yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-8">
              {sortedCatches.map((catchItem) => (
                <button
                  key={catchItem.id}
                  type="button"
                  onClick={() => {
                    restoreAfterDetailRef.current = true;
                    setSheetOpen(false);
                    onCatchClick(catchItem);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-800/50 p-2.5 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-700">
                    {catchItem.imageUrl ? (
                      <CachedImage
                        src={catchItem.imageUrl}
                        alt={catchItem.species || "Catch"}
                        className="h-full w-full"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg">
                        🎣
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {catchItem.species || dict.unknownSpecies || "Unknown"}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {formatCatchMeta(
                        catchItem,
                        dict as Record<string, string>,
                      )}
                      {" · "}
                      {new Date(catchItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Sheet.Content>
      </Sheet.Container>
      {/* Transparent non-blocking backdrop so map markers stay tappable */}
      <Sheet.Backdrop
        style={{ backgroundColor: "transparent", pointerEvents: "none" }}
      />
    </Sheet>
  );
}
