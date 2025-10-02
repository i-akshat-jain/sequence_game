// This script runs before React to clean up browser extension modifications
(function() {
  'use strict';
  
  // Function to clean up extension modifications
  function cleanupExtensions() {
    try {
      const body = document.body;
      if (!body) return;

      // Remove extension-related attributes
      const attributesToRemove = [];
      for (let i = 0; i < body.attributes.length; i++) {
        const attr = body.attributes[i];
        if (attr.name.includes('__processed_') ||
            attr.name.includes('bis_') ||
            attr.name.includes('extension') ||
            attr.name.includes('ultimate-toolbar')) {
          attributesToRemove.push(attr.name);
        }
      }
      
      attributesToRemove.forEach(attrName => {
        body.removeAttribute(attrName);
      });

      // Remove extension elements
      const extensionSelectors = [
        '[id*="ultimate-toolbar"]',
        '[id*="bis_"]',
        '[class*="ul-sticky-container"]',
        '[data-extension]',
        '[data-bis-]'
      ];

      extensionSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          });
        } catch (e) {
          // Ignore selector errors
        }
      });

    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Run cleanup immediately
  cleanupExtensions();

  // Set up observer to clean up any new modifications
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver((mutations) => {
      let needsCleanup = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target === document.body || target === document.documentElement) {
            const attrName = mutation.attributeName;
            if (attrName && (
              attrName.includes('__processed_') ||
              attrName.includes('bis_') ||
              attrName.includes('extension') ||
              attrName.includes('ultimate-toolbar')
            )) {
              needsCleanup = true;
            }
          }
        }
      });

      if (needsCleanup) {
        // Debounce cleanup
        setTimeout(cleanupExtensions, 10);
      }
    });

    // Start observing
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['id', 'class', 'data-extension', 'data-bis-', 'hidden']
    });

    // Stop observing after 10 seconds to avoid performance issues
    setTimeout(() => {
      observer.disconnect();
    }, 10000);
  }
})();




