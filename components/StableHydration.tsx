'use client';

import { useEffect, useState } from 'react';

interface StableHydrationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function StableHydration({ 
  children, 
  fallback = (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-6"></div>
        <p className="text-gray-600 text-lg font-medium">Loading game...</p>
      </div>
    </div>
  )
}: StableHydrationProps) {
  const [isStable, setIsStable] = useState(false);
  const [hasExtensions, setHasExtensions] = useState(false);

  useEffect(() => {
    let mounted = true;
    let stabilityTimer: NodeJS.Timeout;
    let extensionCheckTimer: NodeJS.Timeout;

    const checkForExtensions = () => {
      if (typeof window === 'undefined') return false;

      try {
        // Check for common extension patterns
        const body = document.body;
        if (!body) return false;

        // Check for extension attributes on body and documentElement
        const hasExtensionAttrs = Array.from(body.attributes).some(attr => 
          attr.name.includes('__processed_') ||
          attr.name.includes('bis_') ||
          attr.name.includes('extension') ||
          attr.name.includes('ultimate-toolbar')
        ) || Array.from(document.documentElement.attributes).some(attr => 
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

    const waitForStability = () => {
      if (!mounted) return;

      const extensionsDetected = checkForExtensions();
      setHasExtensions(extensionsDetected);

      if (extensionsDetected) {
        // If extensions are detected, wait longer for them to stabilize
        extensionCheckTimer = setTimeout(() => {
          if (mounted) {
            const stillHasExtensions = checkForExtensions();
            if (stillHasExtensions) {
              // Extensions are still modifying, wait a bit more
              stabilityTimer = setTimeout(() => {
                if (mounted) {
                  setIsStable(true);
                }
              }, 500);
            } else {
              setIsStable(true);
            }
          }
        }, 1000);
      } else {
        // No extensions detected, proceed normally
        stabilityTimer = setTimeout(() => {
          if (mounted) {
            setIsStable(true);
          }
        }, 100);
      }
    };

    // Start checking immediately
    waitForStability();

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
        // Clear existing timers
        clearTimeout(stabilityTimer);
        clearTimeout(extensionCheckTimer);
        
        // Wait for extensions to finish modifying
        extensionCheckTimer = setTimeout(() => {
          if (mounted) {
            waitForStability();
          }
        }, 300);
      }
    });

    // Start observing
    if (typeof window !== 'undefined') {
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
    }

    // Fallback timer to ensure we eventually render
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        setIsStable(true);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(stabilityTimer);
      clearTimeout(extensionCheckTimer);
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  // During SSR and before stability, show fallback
  if (!isStable) {
    return <>{fallback}</>;
  }

  // After stability is achieved, render children
  return <>{children}</>;
}




