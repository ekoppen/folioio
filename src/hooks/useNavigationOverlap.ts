import { useState, useEffect, useRef, RefObject } from 'react';

interface UseNavigationOverlapReturn {
  isOverlapping: boolean;
  logoRef: RefObject<HTMLDivElement>;
  navigationRef: RefObject<HTMLDivElement>;
}

export function useNavigationOverlap(): UseNavigationOverlapReturn {
  const [isOverlapping, setIsOverlapping] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverlap = () => {
      const logoElement = logoRef.current;
      const navigationElement = navigationRef.current;

      if (!logoElement || !navigationElement) {
        setIsOverlapping(false);
        return;
      }

      const logoRect = logoElement.getBoundingClientRect();
      const navRect = navigationElement.getBoundingClientRect();

      // Check if elements overlap horizontally
      const horizontalOverlap = !(
        logoRect.right < navRect.left ||
        logoRect.left > navRect.right
      );

      // Check if elements overlap vertically (should be on same line)
      const verticalOverlap = !(
        logoRect.bottom < navRect.top ||
        logoRect.top > navRect.bottom
      );

      // Consider overlapping if both horizontal and vertical overlap exist
      const overlapping = horizontalOverlap && verticalOverlap;

      // Add some buffer space (10px) to prevent tight layouts, less aggressive
      const logoRightWithBuffer = logoRect.right + 10;
      const navLeftWithBuffer = navRect.left - 10;
      const bufferOverlap = logoRightWithBuffer > navLeftWithBuffer && verticalOverlap;

      setIsOverlapping(overlapping || bufferOverlap);
    };

    // Debounce function to prevent excessive calls
    let timeoutId: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkOverlap, 100);
    };

    // Initial check
    checkOverlap();

    // Use ResizeObserver for more efficient monitoring
    const resizeObserver = new ResizeObserver(debouncedCheck);

    if (logoRef.current) {
      resizeObserver.observe(logoRef.current);
    }
    if (navigationRef.current) {
      resizeObserver.observe(navigationRef.current);
    }

    // Also listen to window resize for viewport changes
    window.addEventListener('resize', debouncedCheck);

    // Check after a small delay to ensure layout is settled
    const initialTimeout = setTimeout(checkOverlap, 200);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedCheck);
    };
  }, []);

  return {
    isOverlapping,
    logoRef,
    navigationRef
  };
}