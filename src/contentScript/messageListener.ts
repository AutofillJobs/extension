import { fillDetails } from './autoFormFill/formFiller';
import { FormData } from './utils/types';

let Email: string = "";
let userData: any;

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
    userData = request.data || userData; // Update userData if provided
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