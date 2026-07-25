import { create } from 'zustand';

type FeedType = 'all' | 'following';

interface FeedStore {
  feed: any[];
  loading: boolean;
  feedType: FeedType;
  isTransitioning: boolean;
  scrollPosition: number;
  isMenuOpen: boolean;
  pendingView: 'feed' | 'news' | null;
  setFeed: (feed: any[]) => void;
  setLoading: (loading: boolean) => void;
  setFeedType: (type: FeedType) => void;
  setIsTransitioning: (isTransitioning: boolean) => void;
  setScrollPosition: (position: number) => void;
  setMenuOpen: (open: boolean) => void;
  setPendingView: (view: 'feed' | 'news' | null) => void;
  fetchFeed: (type: FeedType, showTransition?: boolean) => Promise<void>;
}

export const useFeedStore = create<FeedStore>((set, get) => ({
  feed: [],
  loading: true,
  feedType: 'all',
  isTransitioning: false,
  scrollPosition: 0,
  isMenuOpen: false,
  pendingView: null,
  setFeed: (feed) => set({ feed }),
  setLoading: (loading) => set({ loading }),
  setFeedType: (feedType) => set({ feedType }),
  setIsTransitioning: (isTransitioning) => set({ isTransitioning }),
  setScrollPosition: (position) => set({ scrollPosition: position }),
  setMenuOpen: (open) => set({ isMenuOpen: open }),
  setPendingView: (view) => set({ pendingView: view }),
  fetchFeed: async (type: FeedType, showTransition = false) => {
    if (showTransition) {
      set({ isTransitioning: true });
    }
    try {
      const feedResponse = await fetch(`/api/feed?type=${type}`, {
        credentials: 'include',
      });
      const feedData = await feedResponse.json();
      set({ feed: feedData, feedType: type });
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      if (showTransition) {
        setTimeout(() => set({ isTransitioning: false }), 300);
      }
    }
  },
}));

