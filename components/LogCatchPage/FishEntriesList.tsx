import React from 'react';
import { Plus, Fish, X } from 'lucide-react';
import { useLogStore } from '@/stores/useLogStore';

interface FishEntriesListProps {
    dict: any;
}

export const FishEntriesList: React.FC<FishEntriesListProps> = ({ dict }) => {
    const store = useLogStore();
    const { fishEntries } = store;

    const handleRemoveFishEntry = (e: React.MouseEvent, id?: string) => {
        e.stopPropagation();
        if (id) {
            store.setDeleteConfirmId(id);
        }
    };

    if (fishEntries.length === 0) {
        return (
            <button
                type="button"
                onClick={() => store.openFishSheet()}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-900/80 transition-colors flex flex-col items-center justify-center gap-1"
                aria-label={dict.addFish || 'Add fish'}
            >
                <Plus size={24} className="text-zinc-500" />
                <span className="text-[10px] text-zinc-500 font-medium">{dict.addFish || 'Add Fish'}</span>
            </button>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-3">
            {fishEntries.map((entry, index) => (
                <div
                    key={entry.id && entry.id.trim() ? `fish-${entry.id}` : `fish-entry-${index}`}
                    onClick={() => store.openFishSheet(entry)}
                    className="relative aspect-square rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-700 transition-colors group cursor-pointer"
                >
                    {entry.imageData ? (
                        <img
                            src={entry.imageData}
                            alt={entry.species}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
                            <Fish size={20} className="text-zinc-500" />
                            <span className="text-xs font-medium text-zinc-300 text-center line-clamp-2 leading-tight">
                                {entry.species}
                            </span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={(e) => handleRemoveFishEntry(e, entry.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg z-10"
                        aria-label={dict.removeFish || 'Remove fish'}
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => store.openFishSheet()}
                className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 bg-zinc-900/60 hover:border-zinc-600 hover:bg-zinc-900/80 transition-colors flex flex-col items-center justify-center gap-1"
                aria-label={dict.addFish || 'Add fish'}
            >
                <Plus size={24} className="text-zinc-500" />
                <span className="text-xs text-zinc-500 font-medium leading-tight text-center px-1">{dict.addFish || 'Add Fish'}</span>
            </button>
        </div>
    );
};


