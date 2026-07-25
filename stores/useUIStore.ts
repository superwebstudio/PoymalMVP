import { create } from 'zustand';

interface UIStore {
  commentModalOpen: boolean;
  selectedPostForComment: any | null;
  setCommentModalOpen: (open: boolean) => void;
  setSelectedPostForComment: (post: any | null) => void;
  openCommentModal: (post: any) => void;
  closeCommentModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  commentModalOpen: false,
  selectedPostForComment: null,
  setCommentModalOpen: (open) => set({ commentModalOpen: open }),
  setSelectedPostForComment: (post) => set({ selectedPostForComment: post }),
  openCommentModal: (post) => set({
    commentModalOpen: true,
    selectedPostForComment: post
  }),
  closeCommentModal: () => set({
    commentModalOpen: false
    // Don't clear selectedPostForComment here to allow exit animation
  }),
}));

