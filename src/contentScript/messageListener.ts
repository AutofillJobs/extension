import { getBackendService, syncDataFromBackend } from '../utils/storageHandler';

let Email: string = "";
let userData: any;

export function setupBubbleMessageListener() {
  console.log("Setting up Bubble message listener...");
  window.addEventListener("message", (event) => {
    const o = event.origin || '';
    const allowed =
      !event.origin ||
      o === window.location.origin ||
      o.endsWith('applygoat.com') ||
      o.endsWith('bubbleapps.io') ||
      o === 'http://127.0.0.1:5500';
    if (!allowed) return;
    const message = event.data;
    switch (message.type) {
      case 'UPDATE_USER_INFO':
        console.log("Received user info update from Bubble:", message.payload);
        chrome.storage.local.set({ userData: message.payload }, () => {
          console.log("User data saved to chrome.storage");
        });
        break;
      case 'APPLYGOAT_DATA_UPDATED':
        console.log('[ContentScript] 🔄 Website reported data update. Triggering sync...');
        (async () => {
          try {
            await syncDataFromBackend((success, error) => {
              if (success) {
                console.log('[ContentScript] ✅ Real-time sync complete.');
              } else {
                console.error('[ContentScript] ❌ Real-time sync failed:', error);
              }
            });
          } catch (err) {
            console.error('[ContentScript] Error executing sync:', err);
          }
        })();
        break;
      default:
        console.warn("Unknown message type from Bubble:", message.type);
    }
  });
}

export function setupMessageListeners() {
  // Message listener for email and other data
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.email) {
      Email = request.email;
      console.log("Received email ID:", request.email);
    }
    if (Email == null) {
      console.log("Please Google Login");
    }
    userData = request.data || userData;
    sendResponse({});
  });

  // Message listener for field filling
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'fillField') {
      chrome.storage.local.get('variablesFromBackend', (result: { variablesFromBackend?: Record<string, string> }) => {
        const variables = result.variablesFromBackend;
        console.log('Variables from backend:', variables);
        const fieldValue = variables?.[message.field];
        console.log('Field value:', fieldValue);

        if (fieldValue) {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
            inputElement.value = '';
            inputElement.value = fieldValue;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        sendResponse({});
      });
      return true; // Keep the message channel open for async response
    }
  });
}

export { Email, userData };