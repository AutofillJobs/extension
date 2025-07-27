let toggleState: boolean | null = null;

export function initializeStorage() {
  // Get the initial toggleState from local storage
  chrome.storage.local.get(['toggleState'], (result: { toggleState?: boolean }) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting toggleState:', chrome.runtime.lastError);
      return;
    }
    toggleState = result.toggleState ?? null;
    console.log('Initial toggle state from local storage:', toggleState);
  });

  // Listen for changes to toggleState in local storage
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.toggleState) {
      toggleState = changes.toggleState.newValue;
      console.log('Toggle state updated to:', toggleState);
    }
  });
}

export function getToggleState(callback: (state: boolean | null) => void) {
  callback(toggleState);
}

export function getUserData(callback: (userData: any) => void) {
  chrome.storage.local.get(['formData'], (result: { formData?: any }) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting user data:', chrome.runtime.lastError);
      callback(null);
      return;
    }
    callback(result.formData || null);
  });
}