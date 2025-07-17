import { useEffect, useRef } from 'react';

interface UseKeyboardVisibilityOptions {
  enabled?: boolean;
  scrollOffset?: number;
}

export const useKeyboardVisibility = (options: UseKeyboardVisibilityOptions = {}) => {
  const { enabled = true, scrollOffset = 20 } = options;
  const activeInputRef = useRef<HTMLElement | null>(null);
  const originalViewportHeight = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Store original viewport height
    originalViewportHeight.current = window.visualViewport?.height || window.innerHeight;

    // Function to handle input focus
    const handleInputFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        activeInputRef.current = target;
        
        // Small delay to ensure keyboard is shown
        setTimeout(() => {
          scrollToActiveInput();
        }, 300);
      }
    };

    // Function to handle input blur
    const handleInputBlur = () => {
      activeInputRef.current = null;
    };

    // Function to scroll active input into view
    const scrollToActiveInput = () => {
      if (!activeInputRef.current) return;

      const inputElement = activeInputRef.current;
      const inputRect = inputElement.getBoundingClientRect();
      const currentViewportHeight = window.visualViewport?.height || window.innerHeight;
      
      // Check if keyboard is likely open (viewport height decreased significantly)
      const keyboardHeight = originalViewportHeight.current - currentViewportHeight;
      const isKeyboardOpen = keyboardHeight > 150; // Threshold for keyboard detection

      if (isKeyboardOpen) {
        // Calculate if input is hidden by keyboard
        const inputBottom = inputRect.bottom;
        const visibleAreaBottom = currentViewportHeight;
        
        if (inputBottom > visibleAreaBottom - scrollOffset) {
          // Scroll to bring input into view
          const scrollAmount = inputBottom - visibleAreaBottom + scrollOffset + 50; // Extra padding
          window.scrollBy(0, scrollAmount);
        }
      }
    };

    // Handle visual viewport changes (when keyboard appears/disappears)
    const handleVisualViewportChange = () => {
      if (activeInputRef.current) {
        setTimeout(() => {
          scrollToActiveInput();
        }, 100);
      }
    };

    // Add event listeners
    document.addEventListener('focusin', handleInputFocus);
    document.addEventListener('focusout', handleInputBlur);
    
    // Listen for visual viewport changes if supported
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleVisualViewportChange);
    }

    // Cleanup
    return () => {
      document.removeEventListener('focusin', handleInputFocus);
      document.removeEventListener('focusout', handleInputBlur);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      } else {
        window.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, [enabled, scrollOffset]);

  return {
    isKeyboardOpen: () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      return originalViewportHeight.current - currentHeight > 150;
    }
  };
};