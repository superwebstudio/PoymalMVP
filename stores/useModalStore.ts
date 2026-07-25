import { create } from 'zustand';

interface ModalStore {
  activeShareId: string | null;
  showFishDetailsId: string | null;
  fullscreenImageSrc: string | null;
  commentModalOpen: boolean;
  showDetailsSheet: boolean;
  
  setActiveShareId: (id: string | null) => void;
  setShowFishDetailsId: (id: string | null) => void;
  setFullscreenImageSrc: (src: string | null) => void;
  setCommentModalOpen: (open: boolean) => void;
  setShowDetailsSheet: (show: boolean) => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  activeShareId: null,
  showFishDetailsId: null,
  fullscreenImageSrc: null,
  commentModalOpen: false,
  showDetailsSheet: false,
  
  setActiveShareId: (id) => set({ activeShareId: id }),
  setShowFishDetailsId: (id) => set({ showFishDetailsId: id }),
  setFullscreenImageSrc: (src) => set({ fullscreenImageSrc: src }),
  setCommentModalOpen: (open) => set({ commentModalOpen: open }),
  setShowDetailsSheet: (show) => set({ showDetailsSheet: show }),
}));










