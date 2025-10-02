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

        // Check for extension attributes on body and documentElement
        const bodyAttributes = Array.from(body.attributes);
        const docAttributes = Array.from(document.documentElement.attributes);
        const hasExtensionAttrs = bodyAttributes.some(attr => 
          attr.name.includes('__processed_') ||
          attr.name.includes('bis_') ||
          attr.name.includes('extension') ||
          attr.name.includes('ultimate-toolbar')
        ) || docAttributes.some(attr => 
          attr.name.includes('__processed_') ||
          attr.name.includes('bis_') ||
          attr.name.includes('extension') ||
          attr.name.includes('ultimate-toolbar')
        );

        // Check for extension elements (including Ultimate Toolbar GPT)
        const hasExtensionElements = document.querySelectorAll(`
          [id*="ultimate-toolbar"],
          [id*="ultimate-toolbar-gpt"],
          [id*="bis_"],
          [class*="ul-sticky-container"],
          [class*="react-draggable"],
          [data-extension],
          [data-bis-],
          [bis_skin_checked]
        `).length > 0;

        // Check for specific Ultimate Toolbar GPT elements
        const hasUltimateToolbar = document.getElementById('ultimate-toolbar-gpt') !== null;

        return hasExtensionAttrs || hasExtensionElements || hasUltimateToolbar;
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
              attrName.includes('extension') ||
              attrName.includes('ultimate-toolbar') ||
              attrName === 'hidden' ||
              attrName === 'id'
            )) {
              hasRelevantChanges = true;
            }
          }
        } else if (mutation.type === 'childList') {
          // Watch for addition of extension elements
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.id?.includes('ultimate-toolbar') ||
                  element.id?.includes('bis_') ||
                  element.className?.includes('ul-sticky-container') ||
                  element.hasAttribute('bis_skin_checked')) {
                hasRelevantChanges = true;
              }
            }
          });
        }
      });

      if (hasRelevantChanges) {
        // Wait a bit for extensions to finish modifying
        setTimeout(checkHydration, 200);
      }
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['id', 'class', 'data-extension', 'data-bis-', 'hidden', 'bis_skin_checked']
    });
    
    // Also observe documentElement for extension attributes
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      attributeFilter: ['id', 'class', 'data-extension', 'data-bis-', 'hidden', 'bis_skin_checked']
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




