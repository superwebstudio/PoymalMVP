import { create } from 'zustand';

interface CatchStore {
  catchData: any | null;
  relatedCatches: any[];
  loading: boolean;
  setCatchData: (data: any) => void;
  setRelatedCatches: (catches: any[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useCatchStore = create<CatchStore>((set) => ({
  catchData: null,
  relatedCatches: [],
  loading: false,
  setCatchData: (data) => set({ catchData: data }),
  setRelatedCatches: (catches) => set({ relatedCatches: catches }),
  setLoading: (loading) => set({ loading }),
}));










