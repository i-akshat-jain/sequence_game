'use client';

import { useEffect, useState } from 'react';

interface HydrationState {
  isHydrated: boolean;
  isStable: boolean;
  hasExtensions: boolean;
}

export function useHydration(): HydrationState {
  const [state, setState] = useState<HydrationState>({
    isHydrated: false,
    isStable: false,
    hasExtensions: false
  });

  useEffect(() => {
    let mounted = true;

    const checkHydration = () => {
      if (!mounted) return;

      // Check if we're in the browser
      if (typeof window === 'undefined') return;

      // Check for extension modifications
      const hasExtensions = checkForExtensions();
      
      // Check if DOM is stable (no recent modifications)
      const isStable = checkDOMStability();
      
      setState(prev => ({
        ...prev,
        isHydrated: true,
        isStable,
        hasExtensions
      }));
    };

    const checkForExtensions = (): boolean => {
      try {
        // Check for common extension patterns
        const body = document.body;
        if (!body) return false;

        // Check for extension attributes
        const attributes = Array.from(body.attributes);
        const hasExtensionAttrs = attributes.some(attr => 
          attr.name.includes('__processed_') ||
          attr.name.includes('bis_') ||
          attr.name.includes('extension')
        );

        // Check for extension elements
        const hasExtensionElements = document.querySelectorAll(`
          [id*="ultimate-toolbar"],
          [id*="bis_"],
          [class*="ul-sticky-container"],
          [data-extension],
          [data-bis-]
        `).length > 0;

        return hasExtensionAttrs || hasExtensionElements;
      } catch (e) {
        return false;
      }
    };

    const checkDOMStability = (): boolean => {
      try {
        // Simple check: if body has been modified recently, it's not stable
        const body = document.body;
        if (!body) return false;

        // Check if body has extension-related attributes
        const hasExtensionAttrs = Array.from(body.attributes).some(attr => 
          attr.name.includes('__processed_') ||
          attr.name.includes('bis_')
        );

        // If no extension attributes, consider it stable
        return !hasExtensionAttrs;
      } catch (e) {
        return true; // Assume stable if we can't check
      }
    };

    // Initial check
    checkHydration();

    // Set up mutation observer to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      if (!mounted) return;

      let hasRelevantChanges = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          if (target === document.body || target === document.documentElement) {
            const attrName = mutation.attributeName;
            if (attrName && (
              attrName.includes('__processed_') ||
              attrName.includes('bis_') ||
              attrName.includes('extension')
            )) {
              hasRelevantChanges = true;
            }
          }
        }
      });

      if (hasRelevantChanges) {
        // Wait a bit for extensions to finish modifying
        setTimeout(checkHydration, 100);
      }
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['id', 'class', 'data-extension', 'data-bis-']
    });

    // Fallback timer to ensure we eventually hydrate
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        setState(prev => ({
          ...prev,
          isHydrated: true,
          isStable: true
        }));
      }
    }, 3000);

    return () => {
      mounted = false;
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, []);

  return state;
}

