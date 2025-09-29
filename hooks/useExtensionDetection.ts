'use client';

import { useEffect, useState } from 'react';

interface ExtensionInfo {
  hasExtensions: boolean;
  extensionNames: string[];
  isStable: boolean;
}

export function useExtensionDetection(): ExtensionInfo {
  const [extensionInfo, setExtensionInfo] = useState<ExtensionInfo>({
    hasExtensions: false,
    extensionNames: [],
    isStable: false
  });

  useEffect(() => {
    // Common extension identifiers
    const extensionSelectors = [
      '[id*="ultimate-toolbar"]',
      '[id*="bis_"]',
      '[class*="ul-sticky-container"]',
      '[data-extension]',
      '[data-bis-]'
    ];

    const detectExtensions = () => {
      const foundExtensions: string[] = [];
      
      extensionSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            foundExtensions.push(selector);
          }
        } catch (e) {
          // Ignore selector errors
        }
      });

      // Check for common extension patterns in attributes
      const body = document.body;
      if (body) {
        const attributes = Array.from(body.attributes);
        attributes.forEach(attr => {
          if (attr.name.includes('__processed_') || 
              attr.name.includes('bis_') ||
              attr.name.includes('extension')) {
            foundExtensions.push(`attribute:${attr.name}`);
          }
        });
      }

      return foundExtensions;
    };

    // Initial detection
    const initialExtensions = detectExtensions();
    
    // Wait for extensions to load and modify DOM
    const checkForExtensions = () => {
      const extensions = detectExtensions();
      
      setExtensionInfo({
        hasExtensions: extensions.length > 0,
        extensionNames: extensions,
        isStable: true
      });
    };

    // Check immediately
    checkForExtensions();

    // Check again after a short delay to catch late-loading extensions
    const timer = setTimeout(checkForExtensions, 500);

    // Monitor for DOM changes that might indicate extensions
    const observer = new MutationObserver((mutations) => {
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
        checkForExtensions();
      }
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['id', 'class', 'data-extension', 'data-bis-']
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return extensionInfo;
}

