'use client';

import { useEffect, useState, useRef } from 'react';

interface ExtensionSafeWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ExtensionSafeWrapper({ 
  children, 
  fallback = (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-6"></div>
        <p className="text-gray-600 text-lg font-medium">Loading game...</p>
      </div>
    </div>
  )
}: ExtensionSafeWrapperProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasExtensions, setHasExtensions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let mounted = true;
    let stabilityTimer: NodeJS.Timeout;
    let extensionTimer: NodeJS.Timeout;

    const checkForExtensions = (): boolean => {
      if (typeof window === 'undefined') return false;

      try {
        // Check for Ultimate Toolbar GPT and other extensions
        const hasUltimateToolbar = document.getElementById('ultimate-toolbar-gpt') !== null;
        const hasExtensionElements = document.querySelectorAll(`
          [id*="ultimate-toolbar"],
          [id*="bis_"],
          [class*="ul-sticky-container"],
          [class*="react-draggable"],
          [data-extension],
          [data-bis-],
          [bis_skin_checked]
        `).length > 0;

        // Check for extension attributes
        const body = document.body;
        const docElement = document.documentElement;
        const hasExtensionAttrs = Array.from(body.attributes).some(attr => 
          attr.name.includes('__processed_') ||
          attr.name.includes('bis_') ||
          attr.name.includes('extension') ||
          attr.name.includes('ultimate-toolbar')
        ) || Array.from(docElement.attributes).some(attr => 
          attr.name.includes('__processed_') ||
          attr.name.includes('bis_') ||
          attr.name.includes('extension') ||
          attr.name.includes('ultimate-toolbar')
        );

        return hasUltimateToolbar || hasExtensionElements || hasExtensionAttrs;
      } catch (e) {
        return false;
      }
    };

    const suppressExtensionInterference = () => {
      if (typeof window === 'undefined') return;

      try {
        // Hide extension elements that might interfere
        const extensionElements = document.querySelectorAll(`
          [id*="ultimate-toolbar"],
          [id*="bis_"],
          [class*="ul-sticky-container"]
        `);

        extensionElements.forEach((element) => {
          if (element instanceof HTMLElement) {
            element.style.display = 'none';
            element.style.visibility = 'hidden';
            element.style.pointerEvents = 'none';
          }
        });

        // Remove problematic attributes from body and documentElement
        const body = document.body;
        const docElement = document.documentElement;
        
        // Create a list of attributes to remove
        const attributesToRemove = ['bis_skin_checked', '__processed_'];
        
        attributesToRemove.forEach(attr => {
          if (body.hasAttribute(attr)) {
            body.removeAttribute(attr);
          }
          if (docElement.hasAttribute(attr)) {
            docElement.removeAttribute(attr);
          }
        });
      } catch (e) {
        console.warn('Could not suppress extension interference:', e);
      }
    };

    const waitForStability = () => {
      if (!mounted) return;

      const extensionsDetected = checkForExtensions();
      setHasExtensions(extensionsDetected);

      if (extensionsDetected) {
        // Suppress extension interference
        suppressExtensionInterference();
        
        // Wait longer for extensions to stabilize
        extensionTimer = setTimeout(() => {
          if (mounted) {
            const stillHasExtensions = checkForExtensions();
            if (stillHasExtensions) {
              // Extensions are still present, suppress them and wait a bit more
              suppressExtensionInterference();
              stabilityTimer = setTimeout(() => {
                if (mounted) {
                  setIsReady(true);
                }
              }, 500);
            } else {
              setIsReady(true);
            }
          }
        }, 1000);
      } else {
        // No extensions detected, proceed normally
        stabilityTimer = setTimeout(() => {
          if (mounted) {
            setIsReady(true);
          }
        }, 100);
      }
    };

    const setupMutationObserver = () => {
      if (typeof window === 'undefined') return;

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
          clearTimeout(extensionTimer);
          
          // Suppress interference and wait for stability
          suppressExtensionInterference();
          extensionTimer = setTimeout(() => {
            if (mounted) {
              waitForStability();
            }
          }, 300);
        }
      });

      // Start observing
      observer.observe(document.body, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ['id', 'class', 'data-extension', 'data-bis-', 'hidden', 'bis_skin_checked']
      });
      
      observer.observe(document.documentElement, {
        attributes: true,
        childList: true,
        attributeFilter: ['id', 'class', 'data-extension', 'data-bis-', 'hidden', 'bis_skin_checked']
      });

      observerRef.current = observer;
    };

    // Start the process
    waitForStability();
    setupMutationObserver();

    // Fallback timer to ensure we eventually render
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        suppressExtensionInterference();
        setIsReady(true);
      }
    }, 5000);

    // Cleanup function
    cleanupRef.current = () => {
      mounted = false;
      clearTimeout(stabilityTimer);
      clearTimeout(extensionTimer);
      clearTimeout(fallbackTimer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // During SSR and before stability, show fallback
  if (!isReady) {
    return <>{fallback}</>;
  }

  // After stability is achieved, render children with a container that can handle extensions
  return (
    <div ref={containerRef} className="extension-safe-container">
      {children}
    </div>
  );
}
