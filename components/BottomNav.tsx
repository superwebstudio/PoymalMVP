"use client";
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Map, PlusCircle, User, Globe, Newspaper, Trophy, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/useI18n';
import { useFeedStore } from '@/stores/useFeedStore';
import { useUserStore } from '@/stores/useUserStore';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomNavProps {
  isVisible?: boolean;
  feedType?: 'all' | 'news' | 'leaderboard';
  currentView?: 'feed' | 'news';
  onFeedTypeChange?: (type: 'all' | 'news' | 'leaderboard') => void;
}

export const BottomNav = ({
  isVisible = true,
  feedType: propFeedType,
  currentView: propCurrentView,
  onFeedTypeChange
}: BottomNavProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { dict, mounted } = useI18n();
  const { feedType: storeFeedType, isMenuOpen: storeMenuOpen, setMenuOpen, setFeedType, setPendingView } = useFeedStore();
  const userId = useUserStore((state) => state.userId);
  const [isFocused, setIsFocused] = useState(false);
  const [currentView, setCurrentView] = useState<'feed' | 'news'>('feed');
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartTime, setTouchStartTime] = useState<number | null>(null);
  const [hasMoved, setHasMoved] = useState(false);

  // Use store menu state, but allow local override if prop is provided
  const isMenuOpen = storeMenuOpen;
  const checkTimeoutRef = useRef<NodeJS.Timeout>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHomePage = pathname === '/';
  const isFeedPage = pathname === '/' || pathname.startsWith('/feed') || pathname.startsWith('/news') || pathname.startsWith('/leaderboard');
  const isSearchPage = pathname.startsWith('/search');
  const homeButtonRef = useRef<HTMLButtonElement>(null);

  const feedType = propFeedType || storeFeedType;

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVh();
    window.addEventListener('resize', setVh);
    return () => window.removeEventListener('resize', setVh);
  }, []);

  useEffect(() => {
    const checkIfInputFocused = () => {
      const activeElement = document.activeElement as HTMLElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT'
      );
      setIsFocused(!!isInputFocused);
    };

    const handleFocusChange = () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
      checkIfInputFocused();
    };

    document.addEventListener('focusin', handleFocusChange, true);
    document.addEventListener('focusout', handleFocusChange, true);
    checkIfInputFocused();

    return () => {
      document.removeEventListener('focusin', handleFocusChange, true);
      document.removeEventListener('focusout', handleFocusChange, true);
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, []);

  const navItems = [
    { label: dict.feed, href: '/', icon: Home },
    { label: (dict as any).map || 'Map', href: '/map', icon: Map },
    { label: dict.post, href: '/log', icon: PlusCircle },
    { label: dict.search || 'Search', href: '/search', icon: Search },
    { label: dict.profile, href: '/profile', icon: User },
  ];

  const menuItems = [
    {
      type: 'all' as const,
      icon: Globe,
      label: mounted ? dict.all : 'All'
    },
    {
      type: 'news' as const,
      icon: Newspaper,
      label: mounted ? (dict as any).news || 'News' : 'News'
    },
  ];

  const isActive = (type: 'all' | 'news' | 'leaderboard') => {
    if (!feedType || !currentView) return false;
    if (type === 'news') {
      return currentView === 'news';
    }
    if (type === 'leaderboard') {
      return currentView === 'news';
    }
    return feedType === type && currentView === 'feed';
  };

  const activeItem = menuItems.find(item => isActive(item.type)) || menuItems[0];

  const handleItemClick = (type: 'all' | 'news' | 'leaderboard') => {
    // Close menu first
    setMenuOpen(false);

    // If on feed page, use the handler
    if (isFeedPage && onFeedTypeChange) {
      onFeedTypeChange(type);
      if (type === 'news' || type === 'leaderboard') {
        setCurrentView('news');
      } else {
        setCurrentView('feed');
      }
    } else {
      // If on other page, set state in store and navigate to home
      if (type === 'news' || type === 'leaderboard') {
        // Set pending view for news/leaderboard
        setPendingView('news');
        router.push('/');
      } else {
        // Set feed type in store, then navigate
        setFeedType(type);
        setPendingView('feed');
        router.push('/');
      }
    }
  };

  const handleHomeTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMenuOpen) {
      setMenuOpen(false);
      return;
    }

    // Only navigate if NOT on feed page
    if (!isFeedPage) {
      router.push('/');
    } else if (feedType && onFeedTypeChange) {
      // On feed page, tap opens menu
      setMenuOpen(true);
    }
  };

  const handleHomeLongPress = () => {
    // Long press ONLY opens menu, regardless of page
    if (feedType) {
      setMenuOpen(true);
    }
  };

  const handleHomeMouseDown = (e: React.MouseEvent) => {
    const startTime = Date.now();

    setTouchStartTime(startTime);
    setTouchStartY(e.clientY);
    setHasMoved(false);
    setHoveredItem(null);

    if (isFeedPage && feedType && onFeedTypeChange) {
      // On feed page, open menu immediately (enables both tap-tap and slide modes)
      setMenuOpen(true);
      setIsDragging(true);
      return;
    }
    // Set up long press timer for other pages
    if (!isFeedPage && feedType) {
      longPressTimerRef.current = setTimeout(() => {
        setIsDragging(true);
        handleHomeLongPress();
      }, 500);
    }
  };

  const handleHomeMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleHomeTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const startTime = Date.now();

    setTouchStartTime(startTime);
    setTouchStartY(touch.clientY);
    setHasMoved(false);
    setHoveredItem(null);

    if (isFeedPage && feedType && onFeedTypeChange) {
      // On feed page, open menu immediately (enables both tap-tap and slide modes)
      setMenuOpen(true);
      setIsDragging(true);
      return;
    }
    // Set up long press timer for other pages
    if (!isFeedPage && feedType) {
      longPressTimerRef.current = setTimeout(() => {
        setIsDragging(true);
        handleHomeLongPress();
      }, 500);
    }
  };

  const handleHomeTouchEnd = (e?: React.TouchEvent) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (touchStartTime === null) return;

    const duration = Date.now() - touchStartTime;
    const wasDragging = isDragging && hasMoved;

    // Mode 2: Slide mode - they slid to an item
    if (wasDragging && hoveredItem) {
      handleItemClick(hoveredItem as 'all' | 'news' | 'leaderboard');
      setIsDragging(false);
      setTouchStartY(null);
      setTouchStartTime(null);
      setHoveredItem(null);
      setHasMoved(false);
      return;
    }

    // Mode 1: Quick tap (< 200ms) and no slide - keep menu open for tap-tap
    if (duration < 200 && !hasMoved && isMenuOpen) {
      // Menu stays open, they can tap an item
      // Clear touch state after a small delay to prevent click event from firing
      setTimeout(() => {
        setIsDragging(false);
        setTouchStartY(null);
        setTouchStartTime(null);
        setHasMoved(false);
      }, 50);
      return;
    }

    // Long hold with no slide = close menu
    if (wasDragging && !hoveredItem) {
      setMenuOpen(false);
    }

    // Cleanup
    setIsDragging(false);
    setTouchStartY(null);
    setTouchStartTime(null);
    setHoveredItem(null);
    setHasMoved(false);
  };

  // Handle touch move for drag-to-select
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || touchStartTime === null) return;

    const touch = e.touches[0];
    const moveDistance = Math.abs(touch.clientY - touchStartY);

    // If moved more than 5px, consider it a slide
    if (moveDistance > 5) {
      setHasMoved(true);
      setIsDragging(true);

      // Prevent scrolling during drag
      e.preventDefault();

      const element = document.elementFromPoint(touch.clientX, touch.clientY);

      // Find which menu item we're hovering
      const menuItem = element?.closest('[data-menu-item]');
      if (menuItem) {
        const itemType = menuItem.getAttribute('data-menu-item');
        setHoveredItem(itemType);
      } else {
        setHoveredItem(null);
      }
    }
  };


  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (touchStartTime === null) return;

    const duration = Date.now() - touchStartTime;
    const wasDragging = isDragging && hasMoved;

    // Mode 2: Slide mode - they slid to an item
    if (wasDragging && hoveredItem) {
      handleItemClick(hoveredItem as 'all' | 'news' | 'leaderboard');
      setIsDragging(false);
      setTouchStartY(null);
      setTouchStartTime(null);
      setHoveredItem(null);
      setHasMoved(false);
      return;
    }

    // Mode 1: Quick tap (< 200ms) and no slide - keep menu open for tap-tap
    if (duration < 200 && !hasMoved && isMenuOpen) {
      // Menu stays open, they can tap an item
      // Clear touch state after a small delay to prevent click event from firing
      setTimeout(() => {
        setIsDragging(false);
        setTouchStartY(null);
        setTouchStartTime(null);
        setHasMoved(false);
      }, 50);
      return;
    }

    // Long hold with no slide = close menu
    if (wasDragging && !hoveredItem) {
      setMenuOpen(false);
    }

    // Cleanup
    setIsDragging(false);
    setTouchStartY(null);
    setTouchStartTime(null);
    setHoveredItem(null);
    setHasMoved(false);
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-feed-menu]') && !target.closest('[data-home-button]')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, setMenuOpen]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Auto-open menu if it was set to open (from long press on other pages)
  useEffect(() => {
    if (isFeedPage && feedType && isMenuOpen && onFeedTypeChange) {
      // Menu state is already set in store from long press
      // Just ensure it stays open when we reach the feed page
      // No action needed - the menu will render because isMenuOpen is true
    }
  }, [isFeedPage, feedType, isMenuOpen, onFeedTypeChange]);

  // Global mouse/touch move listeners for drag-to-select
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (touchStartY === null || touchStartTime === null) return;

      const moveDistance = Math.abs(e.clientY - touchStartY);

      // If moved more than 5px, consider it a slide
      if (moveDistance > 5) {
        setHasMoved(true);
        setIsDragging(true);

        const element = document.elementFromPoint(e.clientX, e.clientY);
        const menuItem = element?.closest('[data-menu-item]');
        if (menuItem) {
          const itemType = menuItem.getAttribute('data-menu-item');
          setHoveredItem(itemType);
        } else {
          setHoveredItem(null);
        }
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0 && touchStartY !== null && touchStartTime !== null) {
        const touch = e.touches[0];
        const moveDistance = Math.abs(touch.clientY - touchStartY);

        // If moved more than 5px, consider it a slide
        if (moveDistance > 5) {
          setHasMoved(true);
          setIsDragging(true);

          e.preventDefault(); // Prevent scrolling during drag

          const element = document.elementFromPoint(touch.clientX, touch.clientY);
          const menuItem = element?.closest('[data-menu-item]');
          if (menuItem) {
            const itemType = menuItem.getAttribute('data-menu-item');
            setHoveredItem(itemType);
          } else {
            setHoveredItem(null);
          }
        }
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    const handleGlobalTouchEnd = () => {
      handleHomeTouchEnd();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, touchStartY, hoveredItem]);

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[45] bg-black/40 backdrop-blur-sm"
            onClick={() => {
              if (!isDragging) {
                setMenuOpen(false);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Feed Menu - Morphing from Home Button */}
      <AnimatePresence>
        {isMenuOpen && feedType && homeButtonRef.current && (
          <motion.div
            data-feed-menu
            initial={{
              opacity: 0,
              scale: 0.3,
              y: 0,
              x: 0
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              x: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.3,
              y: 0,
              x: 0
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 400,
              mass: 0.8
            }}
            className="feed-home-menu fixed z-[50] bg-zinc-900/98 backdrop-blur-3xl rounded-[28px] p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              // Align with phone-shell gutters (desktop) and nav padding (mobile)
              left: 'calc(var(--app-gutter, 0px) + 1.5rem)',
              bottom: `calc(60px + max(2rem, calc(env(safe-area-inset-bottom) + 1rem)) + 0.75rem)`,
              width: 'min(260px, calc(100vw - var(--app-gutter, 0px) * 2 - 3rem))',
              maxWidth: 'calc(var(--app-max-width, 480px) - 3rem)',
              transformOrigin: 'bottom left',
            }}
          >
            <div className="space-y-2">
              {menuItems.map((item, index) => {
                const isHovered = hoveredItem === item.type;
                return (
                  <motion.button
                    key={item.type}
                    data-menu-item={item.type}
                    initial={false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.05 + (index * 0.04),
                      duration: 0.3,
                      ease: [0.34, 1.56, 0.64, 1]
                    }}
                    onClick={() => {
                      if (!isDragging) {
                        handleItemClick(item.type);
                      }
                    }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center gap-3.5 py-3.5 px-4 rounded-[20px] font-medium transition-all duration-200",
                      isHovered
                        ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg shadow-sky-600/25 scale-105"
                        : "bg-zinc-800/30 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
                    )}
                  >
                    <item.icon
                      size={21}
                      strokeWidth={2.5}
                      className={cn(
                        "transition-transform duration-200 flex-shrink-0",
                        isHovered && "scale-110"
                      )}
                    />
                    <span className="text-[15px] font-semibold tracking-wide">
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Speech bubble tail */}
            <motion.div
              className="absolute -bottom-4 left-2 w-10 h-6"
              style={{
                clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                backgroundColor: 'rgb(24 24 27 / 0.95)'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        data-bottom-nav
        className="bottom-nav fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex items-center z-50"
        style={{
          paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))',
          paddingTop: '0.75rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          height: 'calc(60px + max(2rem, calc(env(safe-area-inset-bottom) + 1rem)))',
          justifyContent: 'space-between',
          gap: '1.5rem',
          transform: ((!isSearchPage && isFocused) || !isVisible)
            ? 'translateY(100%)'
            : undefined,
          transition: 'transform 0.2s ease-out',
          pointerEvents: ((!isSearchPage && isFocused) || !isVisible) ? 'none' : 'auto',
          willChange: 'transform',
        }}
      >
        {navItems.map((item) => {
          const isActiveNav =
            item.href === '/search'
              ? pathname.startsWith('/search')
              : pathname === item.href;
          const isHome = item.href === '/';
          const showActiveIndicator = isHome && feedType && isActive(activeItem.type);
          const canShowMenu = feedType && onFeedTypeChange;
          // Always render as button if we have feedType (from store or prop), even without onFeedTypeChange
          const canShowMenuButton = !!feedType;

          return (
            <div
              key={item.href}
              className="flex flex-col items-center gap-1 min-w-0 flex-1 relative"
              style={{ marginLeft: '0.25rem', marginRight: '0.25rem' }}
            >
              {isHome && canShowMenuButton ? (
                <button
                  ref={homeButtonRef}
                  data-home-button
                  onMouseDown={handleHomeMouseDown}
                  onMouseUp={(e) => {
                    handleHomeMouseUp();
                    handleMouseUp();
                  }}
                  onMouseLeave={() => {
                    handleHomeMouseUp();
                    if (isDragging) {
                      handleMouseUp();
                    }
                  }}
                  onTouchStart={handleHomeTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleHomeTouchEnd}
                  onClick={(e) => {
                    // Only handle tap if not dragging and not in the middle of a touch interaction
                    if (!isDragging && touchStartTime === null) {
                      handleHomeTap(e);
                    }
                  }}
                  onDragStart={(e) => e.preventDefault()}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-0 flex-1 relative select-none transition-all duration-300",
                    isMenuOpen ? "text-white" : isActiveNav ? "text-white" : "text-zinc-500"
                  )}
                  style={{
                    userSelect: 'none',
                    WebkitUserSelect: 'none' as any,
                    WebkitTouchCallout: 'none' as any,
                    touchAction: isDragging ? 'none' : 'manipulation'
                  }}
                >
                  <div className={cn(
                    "p-2 rounded-full transition-all duration-300",
                    isMenuOpen && "bg-zinc-800"
                  )}>
                    <Home size={24} className="flex-shrink-0 pointer-events-none" />
                  </div>
                  {/* Active indicator dot */}
                  {showActiveIndicator && !isMenuOpen && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="w-1 h-1 bg-zinc-300 rounded-full pointer-events-none select-none"
                      style={{ userSelect: 'none', WebkitUserSelect: 'none' as any }}
                    />
                  )}
                </button>
              ) : isHome && !canShowMenu ? (
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-0 flex-1",
                    isActiveNav ? "text-white" : "text-zinc-500"
                  )}
                  prefetch={true}
                >
                  <Home size={28} className="flex-shrink-0" />
                </Link>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-0 flex-1",
                    isActiveNav ? "text-white" : "text-zinc-500"
                  )}
                  prefetch={true}
                >
                  <item.icon size={28} className="flex-shrink-0" />
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
};