"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Sheet } from "react-modal-sheet";
import { ChevronUp, Fish, X } from "lucide-react";
import { useI18n } from "@/lib/useI18n";
import type { MapCatch } from "@/components/map/hooks/useCatchMarkers";
import { CachedImage } from "@/components/CachedImage";

interface MyCatchesSheetProps {
  isOpen: boolean;
  catches: MapCatch[];
  onCatchClick: (catchItem: MapCatch) => void;
  onClose: () => void;
}

function formatCatchMeta(
  catchItem: MapCatch,
  dict: Record<string, string>
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
}: MyCatchesSheetProps) {
  const { dict } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setExpanded(false);
    }
  }, [isOpen]);

  const sortedCatches = useMemo(
    () =>
      [...catches].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [catches]
  );

  const countLabel =
    sortedCatches.length === 1
      ? `1 ${dict.catch || "catch"}`
      : `${sortedCatches.length} ${dict.catches || "catches"}`;

  if (!isOpen || !mounted) return null;

  const collapsedBar =
    !expanded ? (
      <div
        className="fixed left-0 right-0 border-t border-zinc-800 bg-zinc-900 shadow-[0_-8px_30px_rgba(0,0,0,0.45)]"
        style={{
          bottom: 0,
          zIndex: 200,
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="flex justify-center pt-2">
          <div className="h-1.5 w-10 rounded-full bg-zinc-600" />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="min-w-0 flex-1 text-left"
          >
            <h3 className="truncate text-base font-semibold text-zinc-100">
              {(dict as Record<string, string>).myCatches || "My Catches"}
            </h3>
            <p className="text-xs text-zinc-500">{countLabel}</p>
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-full bg-zinc-800 p-2 text-zinc-300"
              aria-label={dict.expand || "Expand"}
            >
              <ChevronUp size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              aria-label={dict.close || "Close"}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      {collapsedBar && createPortal(collapsedBar, document.body)}

      <Sheet
        isOpen={expanded}
        onClose={() => setExpanded(false)}
        snapPoints={[0, 0.55, 1]}
        initialSnap={1}
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
                onClick={() => setExpanded(false)}
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
                      setExpanded(false);
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
                        {catchItem.species ||
                          dict.unknownSpecies ||
                          "Unknown"}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {formatCatchMeta(
                          catchItem,
                          dict as Record<string, string>
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
        <Sheet.Backdrop onTap={() => setExpanded(false)} />
      </Sheet>
    </>
  );
}
