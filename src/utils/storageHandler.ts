let toggleState: boolean | null = null;
let autoClickSave: boolean = false; // Default to false

export function initializeStorage() {
  // Get the initial toggleState and autoClickSave from local storage
  chrome.storage.local.get(['toggleState', 'autoClickSave'], (result: { toggleState?: boolean; autoClickSave?: boolean }) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting toggleState:', chrome.runtime.lastError);
      return;
    }
    toggleState = result.toggleState ?? null;
    autoClickSave = result.autoClickSave ?? false; // Default fallback
    console.log('Initial toggle state from local storage:', toggleState);
    console.log('Initial autoClickSave state from local storage:', autoClickSave);
  });

  // Listen for changes to toggleState and autoClickSave in local storage
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes.toggleState) {
        toggleState = changes.toggleState.newValue;
        console.log('Toggle state updated to:', toggleState);
      }
      if (changes.autoClickSave) {
        autoClickSave = changes.autoClickSave.newValue;
        console.log('AutoClickSave state updated to:', autoClickSave);
      }
    }
  });
}

export function getToggleState(callback: (state: boolean | null) => void) {
  callback(toggleState);
}

export function getAutoClickSaveState(callback: (state: boolean) => void) {
  callback(autoClickSave);
}

export function updateAutoClickSaveState(newState: boolean, callback?: (success: boolean, error?: string) => void) {
  chrome.storage.local.set({ 'autoClickSave': newState }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error updating autoClickSave state:', chrome.runtime.lastError);
      if (callback) {
        callback(false, chrome.runtime.lastError.message);
      }
      return;
    }
    autoClickSave = newState;
    console.log('AutoClickSave state updated to:', newState);
    if (callback) {
      callback(true);
    }
  });
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

export function saveUserData(data: any, callback?: (success: boolean, error?: string) => void) {
  chrome.storage.local.set({ 'formData': data }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving user data:', chrome.runtime.lastError);
      if (callback) {
        callback(false, chrome.runtime.lastError.message);
      }
      return;
    }
    console.log('User data saved successfully');
    if (callback) {
      callback(true);
    }
  });
}

export function saveFileData(fileData: { [key: string]: any }, callback?: (success: boolean, error?: string) => void) {
  chrome.storage.local.set(fileData, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving file data:', chrome.runtime.lastError);
      if (callback) {
        callback(false, chrome.runtime.lastError.message);
      }
      return;
    }
    console.log('File data saved successfully');
    if (callback) {
      callback(true);
    }
  });
}
