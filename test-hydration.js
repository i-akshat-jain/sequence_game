// Simple test script to verify hydration works with extensions
// This simulates the extension injection that was causing the hydration mismatch

console.log('Testing hydration with extension simulation...');

// Simulate extension injection after a delay
setTimeout(() => {
  console.log('Simulating Ultimate Toolbar GPT extension injection...');
  
  // Create the problematic element that was causing hydration mismatch
  const extensionElement = document.createElement('div');
  extensionElement.id = 'ultimate-toolbar-gpt';
  extensionElement.setAttribute('hidden', 'true');
  extensionElement.setAttribute('bis_skin_checked', '1');
  extensionElement.innerHTML = `
    <div class="ul-sticky-container react-draggable" style="transform: translate(0px, 0px);">
      <div>Extension content</div>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(extensionElement);
  
  // Add problematic attributes to body
  document.body.setAttribute('bis_skin_checked', '1');
  document.body.setAttribute('__processed_', 'true');
  
  console.log('Extension elements added. Check if hydration still works properly.');
  console.log('Extension elements:', document.querySelectorAll('[id*="ultimate-toolbar"]').length);
  console.log('Body attributes:', Array.from(document.body.attributes).map(attr => `${attr.name}="${attr.value}"`));
  
}, 1000);

console.log('Test script loaded. Extension simulation will start in 1 second.');
