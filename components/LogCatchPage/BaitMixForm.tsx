"use client";

import React, { useRef, useState } from 'react';
import { Camera, Plus, X, Trash2, Fish, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useLogStore, BaitMixIngredient } from '@/stores/useLogStore';
import { LocationSection } from './LocationSection';
import { AdditionalDetails } from './AdditionalDetails';
import { useFormContext } from 'react-hook-form';
import { useI18n } from '@/lib/useI18n';
import { AnimatePresence, motion } from 'framer-motion';
import { Modal } from '@/components/Modal';
import speciesData from '@/data/species.json';
import baitIngredientsData from '@/data/bait-ingredients.json';

interface BaitMixFormProps {
    dict: any;
    position: any;
    loading: boolean;
    getCurrentLocation: () => void;
    selectedLocation: { latitude: number; longitude: number; locationName?: string | null } | null;
}

export const BaitMixForm: React.FC<BaitMixFormProps> = ({
    dict,
    position,
    loading,
    getCurrentLocation,
    selectedLocation,
}) => {
    const store = useLogStore();
    const { baitMixForm, setBaitMixForm, addBaitMixIngredient, removeBaitMixIngredient, updateBaitMixIngredient, deleteIngredientId, setDeleteIngredientId, confirmRemoveIngredient } = store;
    const { watch } = useFormContext();
    const { lang } = useI18n();
    const locationInput = watch('location');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [speciesSearch, setSpeciesSearch] = useState('');
    const [showSpeciesSuggestions, setShowSpeciesSuggestions] = useState(false);
    const [ingredientSearch, setIngredientSearch] = useState<Record<string, string>>({});
    const [showIngredientSuggestions, setShowIngredientSuggestions] = useState<Record<string, boolean>>({});
    const [showPhoto, setShowPhoto] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [waterTempMin, setWaterTempMin] = useState('');
    const [waterTempMax, setWaterTempMax] = useState('');

    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    const seasonLabels: Record<string, string> = {
        Spring: dict.spring || 'Spring',
        Summer: dict.summer || 'Summer',
        Fall: dict.fall || 'Fall',
        Winter: dict.winter || 'Winter',
    };

    // Filter species based on search
    const filteredSpecies = speciesSearch.length > 1
        ? speciesData.filter((s) => {
            const commonName = lang === 'ru' ? s.commonNameRu : s.commonNameEn;
            return (
                commonName.toLowerCase().includes(speciesSearch.toLowerCase()) ||
                s.scientificName.toLowerCase().includes(speciesSearch.toLowerCase())
            );
        }).slice(0, 8)
        : [];

    const handleAddSpecies = (species: string) => {
        if (!baitMixForm.targetSpecies.includes(species)) {
            setBaitMixForm({
                ...baitMixForm,
                targetSpecies: [...baitMixForm.targetSpecies, species],
            });
        }
        setSpeciesSearch('');
        setShowSpeciesSuggestions(false);
    };

    const handleRemoveSpecies = (species: string) => {
        setBaitMixForm({
            ...baitMixForm,
            targetSpecies: baitMixForm.targetSpecies.filter(s => s !== species),
        });
    };

    const handleToggleSeason = (season: string) => {
        const currentSeasons = baitMixForm.seasons || [];
        if (currentSeasons.includes(season)) {
            setBaitMixForm({
                ...baitMixForm,
                seasons: currentSeasons.filter(s => s !== season),
            });
        } else {
            setBaitMixForm({
                ...baitMixForm,
                seasons: [...currentSeasons, season],
            });
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert(dict.invalidImageType || 'Please select a valid image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert(dict.imageTooLarge || 'Image size must be less than 10MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setBaitMixForm({
                ...baitMixForm,
                imageData: reader.result as string,
                imageFile: file,
            });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setBaitMixForm({
            ...baitMixForm,
            imageData: null,
            imageFile: null,
        });
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
        setShowPhoto(false);
    };

    // Initialize photo/notes visibility if data exists
    React.useEffect(() => {
        if (baitMixForm.imageData) setShowPhoto(true);
        if (baitMixForm.notes) setShowNotes(true);
    }, []);

    // Sync water temp range with min/max
    React.useEffect(() => {
        if (waterTempMin || waterTempMax) {
            const range = waterTempMin && waterTempMax
                ? `${waterTempMin}-${waterTempMax}°C`
                : waterTempMin
                    ? `Min ${waterTempMin}°C`
                    : waterTempMax
                        ? `Max ${waterTempMax}°C`
                        : '';
            setBaitMixForm({ ...baitMixForm, waterTempRange: range });
        }
    }, [waterTempMin, waterTempMax]);

    // Filter ingredients for autocomplete
    const getFilteredIngredients = (ingredientId: string) => {
        const search = ingredientSearch[ingredientId] || '';
        if (search.length < 1) return [];
        return baitIngredientsData
            .filter(ing => ing.toLowerCase().includes(search.toLowerCase()))
            .slice(0, 6);
    };

    const handleIngredientSelect = (ingredientId: string, ingredientName: string) => {
        updateBaitMixIngredient(ingredientId, { name: ingredientName });
        setIngredientSearch(prev => ({ ...prev, [ingredientId]: '' }));
        setShowIngredientSuggestions(prev => ({ ...prev, [ingredientId]: false }));
    };

    const validateIngredient = (ingredient: BaitMixIngredient): boolean => {
        return ingredient.name.trim() !== '' && ingredient.amount.trim() !== '';
    };

    return (
        <div className="space-y-4">
            {/* Mix Name */}
            <section className="space-y-3">
                <label className="text-sm text-zinc-400 ml-1">
                    {dict.baitMixName || 'Mix Name'} <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={baitMixForm.mixName}
                    onChange={(e) => setBaitMixForm({ ...baitMixForm, mixName: e.target.value })}
                    placeholder={dict.baitMixNamePlaceholder || 'Enter mix name...'}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                    maxLength={200}
                />
                <p className="text-xs text-zinc-500 ml-1">
                    {dict.baitMixNameHelper || 'Give your bait mix a descriptive name (e.g., "Carp Special Mix" or "Winter Pike Bait")'}
                </p>
                <p className="text-xs text-zinc-600 ml-1">
                    {baitMixForm.mixName.length}/200 {dict.characters || 'characters'}
                </p>
            </section>

            {/* Ingredients */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-zinc-400 ml-1">
                        {dict.ingredients || 'Ingredients'}
                    </label>
                    <button
                        type="button"
                        onClick={addBaitMixIngredient}
                        className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus size={16} />
                        <span>{dict.addIngredient || 'Add'}</span>
                    </button>
                </div>

                {/* Ingredients List - Show added ingredients */}
                {baitMixForm.ingredients.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {baitMixForm.ingredients.map((ingredient) => {
                            const isValid = validateIngredient(ingredient);
                            const displayUnit = ingredient.unit === 'other' && ingredient.customUnit ? ingredient.customUnit : ingredient.unit;
                            return (
                                <div
                                    key={ingredient.id}
                                    className={`bg-zinc-900 border rounded-lg p-2.5 flex items-center justify-between ${isValid ? 'border-zinc-800' : 'border-yellow-600/50'
                                        }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm text-white font-medium truncate">
                                            {ingredient.name || dict.ingredientName || 'Ingredient name'}
                                        </div>
                                        {ingredient.amount && (
                                            <div className="text-xs text-zinc-400">
                                                {ingredient.amount} {displayUnit}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteIngredientId(ingredient.id)}
                                        className="ml-3 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors flex-shrink-0"
                                        title={dict.deleteIngredient || 'Delete ingredient'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add New Ingredient Form */}
                {baitMixForm.ingredients.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm border border-zinc-800 rounded-lg bg-zinc-900/50">
                        {dict.noIngredients || 'No ingredients added yet. Click "+ Add" to get started.'}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {baitMixForm.ingredients.map((ingredient) => (
                            <div
                                key={ingredient.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2"
                            >
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={ingredient.name}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            updateBaitMixIngredient(ingredient.id, { name: value });
                                            setIngredientSearch(prev => ({ ...prev, [ingredient.id]: value }));
                                            setShowIngredientSuggestions(prev => ({ ...prev, [ingredient.id]: value.length > 0 }));
                                        }}
                                        onFocus={() => {
                                            if (ingredient.name) {
                                                setShowIngredientSuggestions(prev => ({ ...prev, [ingredient.id]: true }));
                                            }
                                        }}
                                        onBlur={() => setTimeout(() => setShowIngredientSuggestions(prev => ({ ...prev, [ingredient.id]: false })), 200)}
                                        placeholder={dict.ingredientName || 'Ingredient name'}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none pr-10"
                                        maxLength={100}
                                    />
                                    {showIngredientSuggestions[ingredient.id] && getFilteredIngredients(ingredient.id).length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {getFilteredIngredients(ingredient.id).map((ing) => (
                                                <button
                                                    key={ing}
                                                    type="button"
                                                    onClick={() => handleIngredientSelect(ingredient.id, ing)}
                                                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
                                                >
                                                    {ing}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={ingredient.amount}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9.,/\s]/g, '');
                                            updateBaitMixIngredient(ingredient.id, { amount: value });
                                        }}
                                        placeholder={dict.amount || 'Amount'}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none"
                                    />
                                    <select
                                        value={ingredient.unit}
                                        onChange={(e) => {
                                            const newUnit = e.target.value as BaitMixIngredient['unit'];
                                            updateBaitMixIngredient(ingredient.id, {
                                                unit: newUnit,
                                                customUnit: newUnit !== 'other' ? undefined : ingredient.customUnit,
                                            });
                                        }}
                                        className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none min-w-[100px]"
                                    >
                                        <option value="g">g</option>
                                        <option value="kg">kg</option>
                                        <option value="oz">oz</option>
                                        <option value="lbs">lbs</option>
                                        <option value="handfuls">{dict.handfuls || 'handfuls'}</option>
                                        <option value="parts">{dict.parts || 'parts'}</option>
                                        <option value="other">{dict.other || 'Other'}</option>
                                    </select>
                                </div>
                                {ingredient.unit === 'other' && (
                                    <input
                                        type="text"
                                        value={ingredient.customUnit || ''}
                                        onChange={(e) =>
                                            updateBaitMixIngredient(ingredient.id, { customUnit: e.target.value })
                                        }
                                        placeholder={dict.customUnit || 'Enter unit...'}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none"
                                        maxLength={20}
                                    />
                                )}
                                {!validateIngredient(ingredient) && (
                                    <p className="text-xs text-yellow-500">
                                        {dict.ingredientValidationError || 'Please enter both name and amount'}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Target Species */}
            <section className="space-y-3">
                <label className="text-sm text-zinc-400 ml-1 flex items-center gap-2">
                    <Fish size={14} />
                    {dict.targetSpecies || 'Target Species'} ({dict.optional || 'Optional'})
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={speciesSearch}
                        onChange={(e) => {
                            setSpeciesSearch(e.target.value);
                            setShowSpeciesSuggestions(e.target.value.length > 1);
                        }}
                        onFocus={() => setShowSpeciesSuggestions(speciesSearch.length > 1)}
                        onBlur={() => setTimeout(() => setShowSpeciesSuggestions(false), 200)}
                        placeholder={dict.searchSpecies || 'Search for species...'}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none"
                    />
                    {showSpeciesSuggestions && filteredSpecies.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {filteredSpecies.map((species) => {
                                const commonName = lang === 'ru' ? species.commonNameRu : species.commonNameEn;
                                return (
                                    <button
                                        key={species.id}
                                        type="button"
                                        onClick={() => handleAddSpecies(commonName)}
                                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-zinc-700 transition-colors"
                                    >
                                        {commonName}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                {baitMixForm.targetSpecies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {baitMixForm.targetSpecies.map((species) => (
                            <div
                                key={species}
                                className="flex items-center gap-1.5 bg-sky-600/20 border border-sky-600/50 rounded-full px-3 py-1.5 text-sm text-sky-300"
                            >
                                <span>{species}</span>
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSpecies(species)}
                                    className="text-sky-300 hover:text-sky-100 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Advanced Details - Collapsible */}
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl">
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-200"
                >
                    <span>{dict.advancedDetails || 'Advanced Details'} ({dict.optional || 'Optional'})</span>
                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                <AnimatePresence initial={false}>
                    {showAdvanced && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="px-4 pb-4 space-y-4 border-t border-zinc-800 overflow-hidden"
                        >
                            {/* Water Temp Range - Min/Max */}
                            <div className="space-y-3 pt-3">
                                <label className="text-sm text-zinc-400 ml-1">
                                    {dict.waterTempRange || 'Water Temp Range'} ({dict.optional || 'Optional'})
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">
                                            {dict.minTemp || 'Min'} (°C)
                                        </label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={waterTempMin}
                                            onChange={(e) => setWaterTempMin(e.target.value)}
                                            placeholder={dict.minTemp || 'Min'}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 mb-1 block">
                                            {dict.maxTemp || 'Max'} (°C)
                                        </label>
                                        <input
                                            type="number"
                                            inputMode="decimal"
                                            value={waterTempMax}
                                            onChange={(e) => setWaterTempMax(e.target.value)}
                                            placeholder={dict.maxTemp || 'Max'}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm text-white focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Season/Time of Year */}
                            <div className="space-y-3">
                                <label className="text-sm text-zinc-400 ml-1">
                                    {dict.season || 'Season/Time of Year'} ({dict.optional || 'Optional'})
                                </label>
                                <p className="text-xs text-zinc-500 ml-1">
                                    {dict.seasonHelper || 'Select all that apply'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {seasons.map((season) => (
                                        <button
                                            key={season}
                                            type="button"
                                            onClick={() => handleToggleSeason(season)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${(baitMixForm.seasons || []).includes(season)
                                                ? 'bg-sky-600 text-white'
                                                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                                }`}
                                        >
                                            {(baitMixForm.seasons || []).includes(season) && (
                                                <Check size={14} />
                                            )}
                                            {seasonLabels[season]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* Notes/Instructions - Collapsible */}
            {!showNotes && !baitMixForm.notes ? (
                <button
                    type="button"
                    onClick={() => setShowNotes(true)}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                >
                    <Plus size={16} />
                    <span>{dict.addNotes || 'Add Notes/Instructions'}</span>
                </button>
            ) : (
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-zinc-400 ml-1">
                            {dict.notes || 'Notes/Instructions'} ({dict.optional || 'Optional'})
                        </label>
                        <div className="flex items-center gap-2">
                            {!baitMixForm.notes && (
                                <button
                                    type="button"
                                    onClick={() => setShowNotes(false)}
                                    className="text-xs text-zinc-500 hover:text-zinc-300"
                                >
                                    {dict.collapse || 'Collapse'}
                                </button>
                            )}
                            {baitMixForm.notes && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNotes(false);
                                        setBaitMixForm({ ...baitMixForm, notes: '' });
                                    }}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    {dict.remove || 'Remove'}
                                </button>
                            )}
                        </div>
                    </div>
                    <textarea
                        value={baitMixForm.notes}
                        onChange={(e) => setBaitMixForm({ ...baitMixForm, notes: e.target.value })}
                        placeholder={dict.baitMixNotesPlaceholder || 'Add any notes or instructions...'}
                        rows={4}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:outline-none resize-none"
                        maxLength={2000}
                    />
                    <p className="text-xs text-zinc-600 ml-1">
                        {baitMixForm.notes.length}/2000 {dict.characters || 'characters'}
                    </p>
                </section>
            )}

            {/* Photo Upload - Collapsible */}
            {!showPhoto && !baitMixForm.imageData ? (
                <button
                    type="button"
                    onClick={() => {
                        setShowPhoto(true);
                        imageInputRef.current?.click();
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                >
                    <Camera size={16} />
                    <span>{dict.addPhoto || 'Add Photo'}</span>
                </button>
            ) : (
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-zinc-400 ml-1">
                            {dict.photo || 'Photo'} ({dict.optional || 'Optional'})
                        </label>
                        <div className="flex items-center gap-2">
                            {!baitMixForm.imageData && (
                                <button
                                    type="button"
                                    onClick={() => setShowPhoto(false)}
                                    className="text-xs text-zinc-500 hover:text-zinc-300"
                                >
                                    {dict.collapse || 'Collapse'}
                                </button>
                            )}
                            {baitMixForm.imageData && (
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="text-xs text-red-400 hover:text-red-300"
                                >
                                    {dict.remove || 'Remove'}
                                </button>
                            )}
                        </div>
                    </div>
                    {baitMixForm.imageData ? (
                        <div className="relative">
                            <img
                                src={baitMixForm.imageData}
                                alt="Bait mix"
                                className="w-full h-48 object-cover rounded-lg border border-zinc-800"
                            />
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors rounded-lg"
                            >
                                <Camera size={24} />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full h-24 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-2 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                        >
                            <Camera size={20} />
                            <span className="text-xs">{dict.addPhoto || 'Add Photo'}</span>
                        </button>
                    )}
                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                    />
                </section>
            )}

            {/* Delete Ingredient Confirmation Modal */}
            <Modal
                isOpen={deleteIngredientId !== null}
                onClose={() => setDeleteIngredientId(null)}
                title={dict.confirmDelete || 'Confirm Delete'}
            >
                <p className="text-zinc-300">{dict.confirmDeleteIngredient || 'Are you sure you want to remove this ingredient?'}</p>
                <div className="mt-4 flex gap-3">
                    <button
                        onClick={() => setDeleteIngredientId(null)}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        {dict.cancel || 'Cancel'}
                    </button>
                    <button
                        onClick={confirmRemoveIngredient}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        {dict.delete || 'Delete'}
                    </button>
                </div>
            </Modal>

            {/* Location Section */}
            <LocationSection
                dict={dict}
                position={position}
                loading={loading}
                getCurrentLocation={getCurrentLocation}
                selectedLocation={selectedLocation}
            />

            {/* Additional Details + Include Weather */}
            <AdditionalDetails
                dict={dict}
                location={locationInput || selectedLocation?.locationName || position?.locationName}
                latitude={selectedLocation?.latitude || position?.latitude || null}
                longitude={selectedLocation?.longitude || position?.longitude || null}
            />
        </div>
    );
};

