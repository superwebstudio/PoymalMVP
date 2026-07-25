"use client";

import React from 'react';
import { Sheet } from 'react-modal-sheet';
import { X } from 'lucide-react';

interface FishDetailsModalProps {
  fish: any;
  isOpen: boolean;
  onClose: () => void;
  dict: any;
  methodTranslations: Record<string, string>;
}

export const FishDetailsModal: React.FC<FishDetailsModalProps> = ({
  fish,
  isOpen,
  onClose,
  dict,
  methodTranslations,
}) => {
  if (!fish) return null;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0, 0.4, 0.6, 1]}
      initialSnap={1}
    >
      <Sheet.Container className="!bg-zinc-950 border-t border-zinc-800 rounded-t-2xl">
        <Sheet.Header>
          <div className="flex justify-center py-3">
            <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
          </div>
          <div className="flex items-center justify-between px-4 pb-2">
            <h3 className="text-lg font-bold text-zinc-100">
              {fish.species || dict.fishDetails || 'Fish Details'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400"
            >
              <X size={20} />
            </button>
          </div>
        </Sheet.Header>
        <Sheet.Content className="p-4 space-y-4 overflow-y-auto">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">{dict.bait || "Bait"}</div>
                <div className="font-medium text-zinc-200" style={{ fontSize: '16px' }}>{fish.bait || "-"}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">{dict.method || "Method"}</div>
                <div className="font-medium text-zinc-200" style={{ fontSize: '16px' }}>
                  {methodTranslations[fish.method] || fish.method || "-"}
                </div>
              </div>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.Container>
      <Sheet.Backdrop onTap={onClose} />
    </Sheet>
  );
};
