import { create } from 'zustand';

interface PostData {
  catchId: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  species?: string;
  imageUrl?: string;
}

interface PostStore {
  posts: Map<string, PostData>;
  setPostData: (catchId: string, data: Partial<PostData>) => void;
  getPostData: (catchId: string) => PostData | undefined;
  updateLikes: (catchId: string, likesCount: number, isLiked: boolean) => void;
  updateComments: (catchId: string, commentsCount: number) => void;
  initializePost: (catchId: string, data: Omit<PostData, 'catchId'>) => void;
}

export const usePostStore = create<PostStore>((set, get) => ({
  posts: new Map(),

  setPostData: (catchId: string, data: Partial<PostData>) => {
    set((state) => {
      const newPosts = new Map(state.posts);
      const existing = newPosts.get(catchId) || {
        catchId,
        likesCount: 0,
        commentsCount: 0,
        isLiked: false,
      };
      newPosts.set(catchId, { ...existing, ...data });
      return { posts: newPosts };
    });
  },

  getPostData: (catchId: string) => {
    return get().posts.get(catchId);
  },

  updateLikes: (catchId: string, likesCount: number, isLiked: boolean) => {
    get().setPostData(catchId, { likesCount, isLiked });
  },

  updateComments: (catchId: string, commentsCount: number) => {
    get().setPostData(catchId, { commentsCount });
  },

  initializePost: (catchId: string, data: Omit<PostData, 'catchId'>) => {
    get().setPostData(catchId, { catchId, ...data });
  },
}));



















