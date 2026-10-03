import { useLogStore } from '@/stores/useLogStore';
import { useUserStore } from '@/stores/useUserStore';
import { useImageCompression } from '@/hooks/useImageCompression';
import { useCatchMutations } from '@/hooks/useCatchMutations';
import { useNotificationStore } from '@/stores/useNotificationStore';
import speciesData from '@/data/species.json';
import { useState, useEffect } from 'react';

function asTrimmedString(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to read image'));
            }
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read image'));
        reader.readAsDataURL(file);
    });
}

export function useFishEntryLogic(dict: any, lang: string) {
    const store = useLogStore();
    const { userId, addRecentSpecies } = useUserStore();
    const { addNotification } = useNotificationStore();
    const [postedSpecies, setPostedSpecies] = useState<string[]>([]);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const { compressImage } = useImageCompression();
    const { identifyFish, isIdentifying } = useCatchMutations();

    const showFishError = (message: string) => {
        addNotification({
            message,
            type: 'error',
            position: 'center',
            showOkButton: true,
        });
    };

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

        // Allow selecting the same file again after a failed/partial attempt
        event.target.value = '';

        setIsProcessingImage(true);
        try {
            let nextFile = file;
            try {
                const compressedBlob = await compressImage(file);
                nextFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.jpg') || 'catch.jpg', {
                    type: 'image/jpeg',
                });
            } catch (error) {
                console.error('Image compression failed', error);
            }

            const dataUrl = await readFileAsDataUrl(nextFile);
            useLogStore.getState().setFishForm((prev) => ({
                ...prev,
                imageData: dataUrl,
                imageFile: nextFile,
            }));
        } catch (error) {
            console.error('Image processing failed', error);
            showFishError(dict.imageProcessFailed || 'Failed to process image. Please try another photo.');
        } finally {
            setIsProcessingImage(false);
        }
    };

    const handleIdentifyFishEntry = async () => {
        const { fishForm } = useLogStore.getState();
        if (!fishForm.imageFile) return;
        try {
            const compressed = await compressImage(fishForm.imageFile);
            const formData = new FormData();
            formData.append('image', compressed, 'image.jpg');

            const result = await identifyFish(formData);
            const speciesName = result.species;
            if (speciesName) {
                const scientificName = result.scientificName ?? undefined;
                useLogStore.getState().setFishForm((prev) => ({
                    ...prev,
                    species: speciesName,
                    scientificName: scientificName || prev.scientificName,
                }));
                addNotification({
                    message: `Identified: ${result.species}`,
                    type: 'success',
                });
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Identification failed';
            showFishError(message);
        }
    };

    const handleSaveFishEntry = () => {
        if (isProcessingImage) {
            showFishError(dict.imageStillProcessing || 'Please wait for the photo to finish loading.');
            return;
        }

        try {
            const {
                fishForm,
                editingEntryId,
                setWeightError,
                setLengthError,
                setFishEntries,
                closeFishSheet,
            } = useLogStore.getState();

            const species = asTrimmedString(fishForm.species);
            const weight = asTrimmedString(fishForm.weight);
            const length = asTrimmedString(fishForm.length);
            const bait = asTrimmedString(fishForm.bait);
            const method = asTrimmedString(fishForm.method);
            const scientificName = asTrimmedString(fishForm.scientificName);

            if (!species) {
                showFishError(dict.mustEnterSpecies || 'Please enter the fish species');
                return;
            }

            const weightValid = !weight || /^\d*\.?\d+$/.test(weight);
            const lengthValid = !length || /^\d*\.?\d+$/.test(length);

            if (!weightValid || !lengthValid) {
                setWeightError(!weightValid);
                setLengthError(!lengthValid);
                showFishError(
                    (dict as { invalidNumber?: string }).invalidNumber ||
                        'Please enter valid numbers for weight and length'
                );
                return;
            }

            setWeightError(false);
            setLengthError(false);

            const entry = {
                id: editingEntryId ?? fishForm.id,
                species,
                scientificName: scientificName || undefined,
                weight,
                length,
                imageData: fishForm.imageData,
                imageFile: fishForm.imageFile,
                bait,
                method,
                rating: fishForm.rating,
            };

            setFishEntries((prev) => {
                if (editingEntryId) {
                    const updated = prev.map((item) => (item.id === editingEntryId ? entry : item));
                    // If the id somehow did not match, still persist the edit
                    if (!prev.some((item) => item.id === editingEntryId)) {
                        return [...prev, entry];
                    }
                    return updated;
                }
                return [...prev, entry];
            });

            addRecentSpecies(entry.species);
            closeFishSheet();
        } catch (error) {
            console.error('Failed to save fish entry', error);
            showFishError(dict.saveFishFailed || 'Could not save this fish. Please try again.');
        }
    };

    return {
        postedSpecies,
        isIdentifying,
        isProcessingImage,
        handleFishSpeciesChange,
        handleSelectSpecies,
        handleFishImageChange,
        handleIdentifyFishEntry,
        handleSaveFishEntry
    };
}










