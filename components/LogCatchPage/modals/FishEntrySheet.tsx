"use client";

import React, { useRef } from 'react';
import { Sheet } from 'react-modal-sheet';
import { X, Camera, Fish } from 'lucide-react';
import { useLogStore } from '@/stores/useLogStore';
import { useFishEntryLogic } from '@/hooks/useFishEntryLogic';
import { Backdrop } from '@/components/ui/Backdrop';
import { StarRating } from '@/components/StarRating';

interface FishEntrySheetProps {
    dict: any;
    lang: string;
}

export const FishEntrySheet: React.FC<FishEntrySheetProps> = ({ dict, lang }) => {
    const store = useLogStore();
    const {
        postedSpecies,
        isIdentifying,
        handleFishSpeciesChange,
        handleSelectSpecies,
        handleFishImageChange,
        handleIdentifyFishEntry,
        handleSaveFishEntry
    } = useFishEntryLogic(dict, lang);

    const fishFileInputRef = useRef<HTMLInputElement>(null);
    const {
        isFishSheetOpen, fishForm, editingEntryId,
        showFishSuggestions, fishSuggestions, isSpeciesInputFocused,
        weightError, lengthError
    } = store;

    const hasUnsavedChanges = fishForm.species || fishForm.weight || fishForm.length || fishForm.bait || fishForm.method || fishForm.imageData;

    const handleClose = () => {
        if (hasUnsavedChanges) {
            if (window.confirm(dict.discardChangesConfirm || 'Discard unsaved changes?')) {
                store.closeFishSheet();
            }
        } else {
            store.closeFishSheet();
        }
    };

    return (
        <>
            {/* Simple backdrop without blur */}
            <Backdrop
                isOpen={isFishSheetOpen}
                onClose={handleClose}
                blur={false}
                zIndex={109}
            />

            <Sheet
                isOpen={isFishSheetOpen}
                onClose={handleClose}
                snapPoints={[0, 0.95, 1]}
                initialSnap={1}
            >
                <Sheet.Container className="!bg-zinc-900 border-t border-zinc-800 rounded-t-3xl">
                    <Sheet.Header>
                        <div className="flex justify-center py-3">
                            <div className="w-12 h-1.5 bg-zinc-600 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between px-4 pb-2">
                            <h3 className="text-lg font-semibold text-white">
                                {editingEntryId ? (dict.editFish || 'Edit fish') : (dict.addFish || 'Add fish')}
                            </h3>
                            <button onClick={handleClose} className="p-2 text-zinc-400 hover:text-zinc-200">
                                <X size={20} />
                            </button>
                        </div>
                    </Sheet.Header>

                    <Sheet.Content className="px-4 pb-6 overflow-y-auto">
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-zinc-400 ml-1 flex items-center gap-1 mb-2">
                                    <Fish size={12} /> {dict.species}
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            value={fishForm.species}
                                            onChange={(e) => handleFishSpeciesChange(e.target.value)}
                                            onFocus={() => store.setIsSpeciesInputFocused(true)}
                                            onBlur={() => {
                                                setTimeout(() => store.setIsSpeciesInputFocused(false), 200);
                                            }}
                                            placeholder={dict.speciesPlaceholder}
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3  text-white focus:outline-none "
                                            autoComplete="off"
                                        />
                                        <input
                                            ref={fishFileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFishImageChange}
                                        />
                                        {(isSpeciesInputFocused && (showFishSuggestions || postedSpecies.length > 0)) && (
                                            <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                                                {postedSpecies.length > 0 && (
                                                    <div className="border-b border-zinc-800">
                                                        <div className="px-3 py-2 text-xs uppercase tracking-wide text-zinc-500">
                                                            {dict.recentlyCaught || 'Recently caught'}
                                                        </div>
                                                        {postedSpecies.map((item, index) => (
                                                            <button
                                                                key={`posted-${item}-${index}`}
                                                                type="button"
                                                                onClick={() => {
                                                                    store.setFishForm(prev => ({ ...prev, species: item }));
                                                                    store.setShowFishSuggestions(false);
                                                                    store.setIsSpeciesInputFocused(false);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 flex items-center gap-2"
                                                            >
                                                                <Fish size={14} className="text-blue-400" />
                                                                {item}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                {showFishSuggestions && fishSuggestions.map((item, index) => (
                                                    <button
                                                        key={item.id && item.id.trim() ? `suggestion-${item.id}` : `suggestion-${index}`}
                                                        type="button"
                                                        onClick={() => handleSelectSpecies(item)}
                                                        className="w-full text-left px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-800 border-b border-zinc-800 last:border-0"
                                                    >
                                                        <div className="flex justify-between items-center gap-2">
                                                            <span>{lang === 'ru' ? item.commonNameRu : item.commonNameEn}</span>
                                                            <span className="text-xs text-zinc-500 italic">{item.scientificName}</span>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fishFileInputRef.current?.click()}
                                        className="flex-shrink-0 self-start flex items-center justify-center bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:border-blue-500 transition-colors px-3 py-3"
                                        aria-label={dict.addPhoto || 'Add photo'}
                                    >
                                        <Camera size={24} />
                                    </button>
                                </div>
                                {fishForm.scientificName && (
                                    <p className="text-xs text-zinc-500 ml-1 mt-1 italic">{fishForm.scientificName}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-zinc-400 ml-1">{dict.weightLabel} ({dict.kg})</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={fishForm.weight}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                store.setFishForm(prev => ({ ...prev, weight: value }));
                                                store.setWeightError(false);
                                            } else {
                                                store.setWeightError(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            const isValid = !fishForm.weight.trim() || /^\d*\.?\d+$/.test(fishForm.weight.trim());
                                            store.setWeightError(!isValid);
                                        }}
                                        className={`w-full bg-zinc-900 border rounded-lg p-3 text-lg font-semibold text-white focus:outline-none ${weightError ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 '}`}
                                        placeholder="0.0"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400 ml-1">{dict.lengthLabel} ({dict.cm})</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={fishForm.length}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                                                store.setFishForm(prev => ({ ...prev, length: value }));
                                                store.setLengthError(false);
                                            } else {
                                                store.setLengthError(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            const isValid = !fishForm.length.trim() || /^\d*\.?\d+$/.test(fishForm.length.trim());
                                            store.setLengthError(!isValid);
                                        }}
                                        className={`w-full bg-zinc-900 border rounded-lg p-3 text-lg font-semibold text-white focus:outline-none ${lengthError ? 'border-red-500 focus:border-red-500' : 'border-zinc-800 '}`}
                                        placeholder="0.0"
                                    />
                                </div>
                            </div>


                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="text-xs text-zinc-400 ml-1">{dict.baitLabel || 'Bait'}</label>
                                    <input
                                        value={fishForm.bait}
                                        onChange={(e) => store.setFishForm(prev => ({ ...prev, bait: e.target.value }))}
                                        onFocus={(e) => {
                                            // Wait for keyboard to appear
                                            setTimeout(() => {
                                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 300);
                                        }}
                                        placeholder={dict.baitPlaceholder || 'e.g. Spinnerbait'}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none "
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-zinc-400 ml-1">{dict.methodLabel || 'Method'}</label>
                                    <input
                                        value={fishForm.method}
                                        onChange={(e) => store.setFishForm(prev => ({ ...prev, method: e.target.value }))}
                                        onFocus={(e) => {
                                            // Wait for keyboard to appear
                                            setTimeout(() => {
                                                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }, 300);
                                        }}
                                        placeholder={dict.selectMethod || 'e.g. Spinning'}
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:outline-none "
                                        style={{ fontSize: '16px' }}
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="text-xs text-zinc-400 ml-1 mb-2 block">
                                    {dict.rating || 'Catch Rating'}
                                </label>
                                <StarRating
                                    value={fishForm.rating}
                                    onChange={(next) =>
                                        store.setFishForm((prev) => ({
                                            ...prev,
                                            rating: next > 0 ? next : null,
                                        }))
                                    }
                                    size={28}
                                />
                            </div>
                        </div>

                        {fishForm.imageData && (
                            <div className="relative">
                                <img
                                    src={fishForm.imageData}
                                    alt={fishForm.species || 'Fish'}
                                    onClick={() => store.setEnlargedImage(fishForm.imageData)}
                                    className="w-full h-40 object-cover rounded-xl border border-zinc-800 cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        store.setFishForm(prev => ({ ...prev, imageData: null, imageFile: null }));
                                    }}
                                    className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black/90"
                                >
                                    <X size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleIdentifyFishEntry}
                                    disabled={isIdentifying}
                                    className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white/90 text-xs font-medium py-1.5 px-3 rounded-lg transition-all border border-white/10"
                                >
                                    {isIdentifying ? (
                                        <div className="w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <span className="text-yellow-400">✨</span>
                                    )}
                                    <span>{isIdentifying ? (dict.identifying || "Identifying...") : ((dict as any).identifyWithAI || "Identify with AI")}</span>
                                </button>
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={handleSaveFishEntry}
                                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-xl transition-colors"
                            >
                                {dict.saveFish || 'Save fish'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold py-3 rounded-xl transition-colors"
                            >
                                {dict.cancel || 'Cancel'}
                            </button>
                        </div>
                    </Sheet.Content>
                </Sheet.Container>
                {/* Remove built-in backdrop since we use custom BackdropBlur */}
            </Sheet>
        </>
    );
};
