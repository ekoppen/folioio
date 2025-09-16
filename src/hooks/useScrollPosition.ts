import { useEffect, useRef } from 'react';

interface ScrollPosition {
  x: number;
  y: number;
  timestamp: number;
}

export function useScrollPosition(key: string = 'main-scroll-position') {
  const hasRestoredRef = useRef(false);

  // Save scroll position to localStorage
  const saveScrollPosition = () => {
    const position: ScrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(key, JSON.stringify(position));
    } catch (error) {
      console.warn('Failed to save scroll position:', error);
    }
  };

  // Restore scroll position from localStorage
  const restoreScrollPosition = () => {
    if (hasRestoredRef.current) return;

    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const position: ScrollPosition = JSON.parse(saved);

        // Only restore if position was saved recently (within 1 hour)
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - position.timestamp < oneHour) {
          // Small delay to ensure page is rendered
          setTimeout(() => {
            window.scrollTo({
              left: position.x,
              top: position.y,
              behavior: 'auto' // Use 'auto' for instant positioning
            });
          }, 100);
        }
      }
    } catch (error) {
      console.warn('Failed to restore scroll position:', error);
    }

    hasRestoredRef.current = true;
  };

  // Clear saved scroll position
  const clearScrollPosition = () => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear scroll position:', error);
    }
  };

  useEffect(() => {
    // Restore position on mount
    restoreScrollPosition();

    // Save position before page unload
    const handleBeforeUnload = () => {
      saveScrollPosition();
    };

    // Save position on scroll (debounced)
    let scrollTimer: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        saveScrollPosition();
      }, 250); // Debounce for 250ms
    };

    // Save position when navigating away (for SPAs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveScrollPosition();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [key]);

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition
  };
}