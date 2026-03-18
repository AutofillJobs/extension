import { FormData } from './utils/types';
import { syncDataFromBackend } from '../utils/storageHandler';

let Email: string = "";
let userData: FormData;

export function setupBubbleMessageListener() {
  window.addEventListener("message", (event) => {
    // Strict origin check — never accept null/empty origins
    const origin = event.origin;
    if (!origin) return;

    const allowed =
      origin === window.location.origin ||
      origin.endsWith('.applygoat.com') ||
      origin === 'https://applygoat.com' ||
      origin.endsWith('.bubbleapps.io') ||
      origin === 'https://bubbleapps.io';

    if (!allowed) return;

    const message = event.data;
    if (!message || typeof message !== 'object' || typeof message.type !== 'string') return;

    switch (message.type) {
      case 'UPDATE_USER_INFO':
        chrome.storage.local.set({ userData: message.payload });
        break;
      case 'APPLYGOAT_DATA_UPDATED':
        (async () => {
          try {
            await syncDataFromBackend((success, error) => {
              if (!success) console.error('[ContentScript] Real-time sync failed:', error);
            });
          } catch (err) {
            console.error('[ContentScript] Error executing sync:', err);
          }
        })();
        break;
    }
  });
}

export function setupMessageListeners() {
  // Receive email from background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.email) {
      Email = request.email;
    }
    userData = request.data || userData;
    sendResponse({});
  });

  // Context menu: fill focused field with a specific variable
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'fillField') {
      chrome.storage.local.get('variablesFromBackend', (result: { variablesFromBackend?: Record<string, string> }) => {
        const fieldValue = result.variablesFromBackend?.[message.field];
        if (fieldValue) {
          const activeElement = document.activeElement as HTMLElement;
          if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
            inputElement.value = fieldValue;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        sendResponse({});
      });
      return true;
    }
  });
}

export { Email, userData };
