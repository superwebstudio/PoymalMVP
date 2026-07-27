import { useLogStore } from '@/stores/useLogStore';
import { useUserStore } from '@/stores/useUserStore';
import { useImageCompression } from '@/hooks/useImageCompression';
import { useCatchMutations } from '@/hooks/useCatchMutations';
import speciesData from '@/data/species.json';
import { useState, useEffect } from 'react';

export function useFishEntryLogic(dict: any, lang: string) {
    const store = useLogStore();
    const { userId, addRecentSpecies } = useUserStore();
    const [postedSpecies, setPostedSpecies] = useState<string[]>([]);
    const { compressImage } = useImageCompression();
    const { identifyFish, isIdentifying } = useCatchMutations();

    // Fetch posted species
    useEffect(() => {
        if (!userId) {
            setPostedSpecies([]);
            return;
        }
        const fetchPostedSpecies = async () => {
            try {
                const response = await fetch(`/api/user/${userId}/catches?speciesOnly=true`, {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    const species = Array.from(new Set(
                        data
                            .filter((item: any) => item.species && !item.isTextOnly)
                            .map((item: any) => item.species)
                    )) as string[];
                    setPostedSpecies(species);
                }
            } catch (error) {
                console.error('Error fetching posted species:', error);
            }
        };
        fetchPostedSpecies();
    }, [userId]);

    const handleFishSpeciesChange = (value: string) => {
        store.setFishForm(prev => ({ ...prev, species: value, scientificName: '' }));
        if (value.length > 1) {
            const filtered = speciesData.filter((s) =>
                s.commonNameEn.toLowerCase().includes(value.toLowerCase()) ||
                s.commonNameRu.toLowerCase().includes(value.toLowerCase()) ||
                s.scientificName.toLowerCase().includes(value.toLowerCase())
            ).slice(0, 6);
            store.setFishSuggestions(filtered);
            store.setShowFishSuggestions(true);
        } else {
            store.setShowFishSuggestions(false);
        }
    };

    const handleSelectSpecies = (item: typeof speciesData[number]) => {
        const commonName = lang === 'ru' ? item.commonNameRu : item.commonNameEn;
        store.setFishForm(prev => ({
            ...prev,
            species: commonName,
            scientificName: item.scientificName,
        }));
        store.setShowFishSuggestions(false);
        store.setIsSpeciesInputFocused(false);
    };

    const handleFishImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
            const compressedBlob = await compressImage(file);
            const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
            const reader = new FileReader();
            reader.onloadend = () => {
                store.setFishForm(prev => ({
                    ...prev,
                    imageData: reader.result as string,
                    imageFile: compressedFile,
                }));
            };
            reader.readAsDataURL(compressedFile);
        } catch (error) {
            console.error('Image compression failed', error);
            const reader = new FileReader();
            reader.onloadend = () => {
                store.setFishForm(prev => ({
                    ...prev,
                    imageData: reader.result as string,
                    imageFile: file,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleIdentifyFishEntry = async () => {
        if (!store.fishForm.imageFile) return;
        try {
            const compressed = await compressImage(store.fishForm.imageFile);
            const formData = new FormData();
            formData.append('image', compressed, 'image.jpg');

            const result = await identifyFish(formData);
            if (result.species) {
                store.setFishForm(prev => ({
                    ...prev,
                    species: result.species,
                    scientificName: result.scientificName || prev.scientificName,
                }));
                store.setModalState({
                    isOpen: true,
                    message: `Identified: ${result.species}`,
                    isSuccess: true
                });
            }
        } catch (err: any) {
            store.setModalState({
                isOpen: true,
                message: err.message || 'Identification failed',
                isSuccess: false
            });
        }
    };

    const handleSaveFishEntry = () => {
        if (!store.fishForm.species.trim()) {
            store.setModalState({
                isOpen: true,
                message: dict.mustEnterSpecies || 'Please enter the fish species',
                isSuccess: false
            });
            return;
        }

        const weightValid = !store.fishForm.weight.trim() || /^\d*\.?\d+$/.test(store.fishForm.weight.trim());
        const lengthValid = !store.fishForm.length.trim() || /^\d*\.?\d+$/.test(store.fishForm.length.trim());

        if (!weightValid || !lengthValid) {
            store.setWeightError(!weightValid);
            store.setLengthError(!lengthValid);
            store.setModalState({
                isOpen: true,
                message: (dict as any).invalidNumber || 'Please enter valid numbers for weight and length',
                isSuccess: false
            });
            return;
        }

        store.setWeightError(false);
        store.setLengthError(false);

        const entry = {
            id: store.editingEntryId ?? store.fishForm.id,
            species: store.fishForm.species.trim(),
            scientificName: store.fishForm.scientificName?.trim() || undefined,
            weight: store.fishForm.weight.trim(),
            length: store.fishForm.length.trim(),
            imageData: store.fishForm.imageData,
            imageFile: store.fishForm.imageFile,
            bait: store.fishForm.bait.trim(),
            method: store.fishForm.method.trim(),
            rating: store.fishForm.rating,
        };

        store.setFishEntries(prev => {
            if (store.editingEntryId) {
                return prev.map(item => (item.id === store.editingEntryId ? entry : item));
            }
            return [...prev, entry];
        });

        addRecentSpecies(entry.species);
        store.closeFishSheet();
    };

    return {
        postedSpecies,
        isIdentifying,
        handleFishSpeciesChange,
        handleSelectSpecies,
        handleFishImageChange,
        handleIdentifyFishEntry,
        handleSaveFishEntry
    };
}










