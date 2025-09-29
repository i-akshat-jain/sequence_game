'use client';

import { useEffect, useState } from 'react';

interface StableHydrationProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function StableHydration({ 
  children, 
  fallback = (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading game...</p>
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

        // Check for extension attributes
        const hasExtensionAttrs = Array.from(body.attributes).some(attr => 
          attr.name.includes('__processed_') ||
          attr.name.includes('bis_') ||
          attr.name.includes('extension') ||
          attr.name.includes('ultimate-toolbar')
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
              attrName.includes('ultimate-toolbar')
            )) {
              hasRelevantChanges = true;
            }
          }
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
        }, 200);
      }
    });

    // Start observing
    if (typeof window !== 'undefined') {
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['id', 'class', 'data-extension', 'data-bis-', 'hidden']
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

