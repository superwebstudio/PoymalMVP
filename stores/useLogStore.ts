import { create } from 'zustand';
import speciesData from '@/data/species.json';

export type FishEntry = {
    id: string;
    species: string;
    scientificName?: string;
    weight: string;
    length: string;
    imageData: string | null;
    imageFile?: File | null;
    bait: string;
    method: string;
};

export type FishEntryFormState = FishEntry & { imageFile: File | null };

export type BaitMixIngredient = {
    id: string;
    name: string;
    amount: string; // Numeric amount
    unit: 'g' | 'kg' | 'oz' | 'lbs' | 'handfuls' | 'parts' | 'other';
    customUnit?: string; // Free text when unit is 'other'
};

export type BaitMixFormState = {
    mixName: string;
    ingredients: BaitMixIngredient[];
    notes: string;
    imageData: string | null;
    imageFile: File | null;
    targetSpecies: string[]; // Array of species names
    waterTempRange: string; // e.g., "6-12°C"
    seasons: string[]; // Array of season tags: Spring, Summer, Fall, Winter
};

export type SelectedLocation = {
    latitude: number;
    longitude: number;
    locationName?: string | null;
    source?: 'geolocation' | 'search' | 'manual' | 'query';
};

export const createEmptyFishForm = (): FishEntryFormState => ({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    species: '',
    scientificName: '',
    weight: '',
    length: '',
    imageData: null,
    imageFile: null,
    bait: '',
    method: '',
});

interface LogStore {
    // Page State
    postMode: 'full' | 'quick' | 'bait_mix';
    locationPrivate: boolean;
    includeWeather: boolean;
    showAdditional: boolean;
    enlargedImage: string | null;
    selectedLocation: SelectedLocation | null;

    // Bait Mix State
    baitMixForm: BaitMixFormState;

    // Fish List State
    fishEntries: FishEntry[];
    deleteConfirmId: string | null;
    deleteIngredientId: string | null;

    // Fish Sheet/Form State
    isFishSheetOpen: boolean;
    editingEntryId: string | null;
    fishForm: FishEntryFormState;
    fishSuggestions: typeof speciesData;
    showFishSuggestions: boolean;
    isSpeciesInputFocused: boolean;
    weightError: boolean;
    lengthError: boolean;

    // Modal State
    modalState: {
        isOpen: boolean;
        message: string;
        isSuccess: boolean;
    };

    // Actions
    setPostMode: (mode: 'full' | 'quick' | 'bait_mix') => void;
    setLocationPrivate: (isPrivate: boolean) => void;
    setIncludeWeather: (include: boolean) => void;
    setShowAdditional: (show: boolean | ((prev: boolean) => boolean)) => void;
    setEnlargedImage: (image: string | null) => void;
    setSelectedLocation: (location: SelectedLocation | null) => void;

    setFishEntries: (entries: FishEntry[] | ((prev: FishEntry[]) => FishEntry[])) => void;
    setDeleteConfirmId: (id: string | null) => void;
    setDeleteIngredientId: (id: string | null) => void;

    setIsFishSheetOpen: (isOpen: boolean) => void;
    setEditingEntryId: (id: string | null) => void;
    setFishForm: (form: FishEntryFormState | ((prev: FishEntryFormState) => FishEntryFormState)) => void;
    setFishSuggestions: (suggestions: typeof speciesData) => void;
    setShowFishSuggestions: (show: boolean) => void;
    setIsSpeciesInputFocused: (focused: boolean) => void;
    setWeightError: (error: boolean) => void;
    setLengthError: (error: boolean) => void;

    setModalState: (state: { isOpen: boolean; message: string; isSuccess: boolean }) => void;
    closeModal: () => void;

    // Bait Mix Actions
    setBaitMixForm: (form: BaitMixFormState | ((prev: BaitMixFormState) => BaitMixFormState)) => void;
    addBaitMixIngredient: () => void;
    removeBaitMixIngredient: (id: string) => void;
    confirmRemoveIngredient: () => void;
    updateBaitMixIngredient: (id: string, updates: Partial<BaitMixIngredient>) => void;
    resetBaitMixForm: () => void;

    // Helpers
    resetFishForm: () => void;
    resetLogDraft: () => void;
    openFishSheet: (entry?: FishEntry) => void;
    closeFishSheet: () => void;
}

const createEmptyBaitMixForm = (): BaitMixFormState => ({
    mixName: '',
    ingredients: [],
    notes: '',
    imageData: null,
    imageFile: null,
    targetSpecies: [],
    waterTempRange: '',
    seasons: [],
});

export const useLogStore = create<LogStore>((set, get) => ({
    postMode: 'full',
    locationPrivate: false,
    includeWeather: false,
    showAdditional: false,
    enlargedImage: null,
    selectedLocation: null,

    baitMixForm: createEmptyBaitMixForm(),

    fishEntries: [],
    deleteConfirmId: null,
    deleteIngredientId: null,

    isFishSheetOpen: false,
    editingEntryId: null,
    fishForm: createEmptyFishForm(),
    fishSuggestions: [],
    showFishSuggestions: false,
    isSpeciesInputFocused: false,
    weightError: false,
    lengthError: false,

    modalState: {
        isOpen: false,
        message: '',
        isSuccess: false,
    },

    setPostMode: (mode) => set({ postMode: mode }),
    setLocationPrivate: (isPrivate) => set({ locationPrivate: isPrivate }),
    setIncludeWeather: (include) => set({ includeWeather: include }),
    setShowAdditional: (updater) => set((state) => ({ showAdditional: typeof updater === 'function' ? updater(state.showAdditional) : updater })),
    setEnlargedImage: (image) => set({ enlargedImage: image }),
    setSelectedLocation: (location) => set({ selectedLocation: location }),

    setFishEntries: (updater) => set((state) => ({ fishEntries: typeof updater === 'function' ? updater(state.fishEntries) : updater })),
    setDeleteConfirmId: (id) => set({ deleteConfirmId: id }),
    setDeleteIngredientId: (id) => set({ deleteIngredientId: id }),

    setIsFishSheetOpen: (isOpen) => set({ isFishSheetOpen: isOpen }),
    setEditingEntryId: (id) => set({ editingEntryId: id }),
    setFishForm: (updater) => set((state) => ({ fishForm: typeof updater === 'function' ? updater(state.fishForm) : updater })),
    setFishSuggestions: (suggestions) => set({ fishSuggestions: suggestions }),
    setShowFishSuggestions: (show) => set({ showFishSuggestions: show }),
    setIsSpeciesInputFocused: (focused) => set({ isSpeciesInputFocused: focused }),
    setWeightError: (error) => set({ weightError: error }),
    setLengthError: (error) => set({ lengthError: error }),

    setModalState: (state) => set({ modalState: state }),
    closeModal: () => set({ modalState: { isOpen: false, message: '', isSuccess: false } }),

    resetFishForm: () => set({
        fishForm: createEmptyFishForm(),
        editingEntryId: null,
        weightError: false,
        lengthError: false,
        fishSuggestions: [],
        showFishSuggestions: false
    }),

    resetLogDraft: () =>
        set({
            postMode: 'full',
            locationPrivate: false,
            includeWeather: false,
            showAdditional: false,
            enlargedImage: null,
            selectedLocation: null,
            baitMixForm: createEmptyBaitMixForm(),
            fishEntries: [],
            deleteConfirmId: null,
            deleteIngredientId: null,
            isFishSheetOpen: false,
            editingEntryId: null,
            fishForm: createEmptyFishForm(),
            fishSuggestions: [],
            showFishSuggestions: false,
            isSpeciesInputFocused: false,
            weightError: false,
            lengthError: false,
            modalState: {
                isOpen: false,
                message: '',
                isSuccess: false,
            },
        }),

    openFishSheet: (entry) => {
        if (entry) {
            set({
                fishForm: { ...entry, imageFile: null },
                editingEntryId: entry.id,
                isFishSheetOpen: true,
                fishSuggestions: [],
                showFishSuggestions: false,
                isSpeciesInputFocused: false
            });
        } else {
            set({
                fishForm: createEmptyFishForm(),
                editingEntryId: null,
                isFishSheetOpen: true,
                fishSuggestions: [],
                showFishSuggestions: false,
                isSpeciesInputFocused: false
            });
        }
    },

    closeFishSheet: () => {
        set({ isFishSheetOpen: false });
        setTimeout(() => {
            get().resetFishForm();
        }, 200);
    },

    // Bait Mix Actions
    setBaitMixForm: (updater) => set((state) => ({ 
        baitMixForm: typeof updater === 'function' ? updater(state.baitMixForm) : updater 
    })),

    addBaitMixIngredient: () => set((state) => ({
        baitMixForm: {
            ...state.baitMixForm,
            ingredients: [
                ...state.baitMixForm.ingredients,
                {
                    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
                    name: '',
                    amount: '',
                    unit: 'g' as const,
                    customUnit: undefined,
                }
            ]
        }
    })),

    removeBaitMixIngredient: (id) => set({ deleteIngredientId: id }),
    
    confirmRemoveIngredient: () => {
        const state = get();
        if (state.deleteIngredientId) {
            set({
                baitMixForm: {
                    ...state.baitMixForm,
                    ingredients: state.baitMixForm.ingredients.filter(ing => ing.id !== state.deleteIngredientId)
                },
                deleteIngredientId: null,
            });
        }
    },

    updateBaitMixIngredient: (id, updates) => set((state) => ({
        baitMixForm: {
            ...state.baitMixForm,
            ingredients: state.baitMixForm.ingredients.map(ing =>
                ing.id === id ? { ...ing, ...updates } : ing
            )
        }
    })),

    resetBaitMixForm: () => set({ baitMixForm: createEmptyBaitMixForm() }),
}));

