let toggleState: boolean | null = null;
let autoClickSave: boolean = false; // Default to false

// Import backend service
import { getBackendService } from './backendService';

export async function initializeStorage(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    chrome.storage.local.get(['toggleState', 'autoClickSave'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting toggleState:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }

      toggleState = result.toggleState ?? null;
      autoClickSave = result.autoClickSave ?? false;

      console.log('Initial toggle state from local storage:', toggleState);
      console.log('Initial autoClickSave state from local storage:', autoClickSave);

      // Listen for changes
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

      resolve();
    });
  });
}

export function getToggleState(callback: (state: boolean | null) => void) {
  callback(toggleState);
}

export function getAutoClickSaveState(callback: (state: boolean) => void) {
  callback(autoClickSave);
}

export async function updateAutoClickSaveState(newState: boolean, callback?: (success: boolean, error?: string) => void) {
  return new Promise<void>((resolve, reject) => {
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
    resolve()
  });

  })
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

export async function saveUserData(data: any, callback?: (success: boolean, error?: string) => void) {
  try {
    // First save to local storage
    await new Promise<void>((resolve, reject) => {
      chrome.storage.local.set({ 'formData': data }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving user data:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        console.log('User data saved successfully to local storage');
        resolve();
      });
    });

    // Then sync to backend if we have user details
    if (data?.data?.details) {
      try {
        console.log('Syncing user data to backend...');
        const backendService = await getBackendService();
        const syncResult = await backendService.syncUserData(data.data.details);
        
        if (syncResult.success) {
          console.log('User data synced to backend successfully');
        } else {
          console.warn('Backend sync failed:', syncResult.error);
          // Don't fail the save operation if backend sync fails
        }
      } catch (backendError) {
        console.error('Backend sync error:', backendError);
        // Don't fail the save operation if backend sync fails
      }
    }

    if (callback) {
      callback(true);
    }
  } catch (error) {
    console.error('Error in saveUserData:', error);
    if (callback) {
      callback(false, error instanceof Error ? error.message : 'Unknown error');
    }
  }
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

export function getFileData(callback: (fileData: any) => void) {
  chrome.storage.local.get(['resumeUrl', 'resumeName', 'resumeBase64', 'cvUrl', 'cvName', 'cvBase64'], (result) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting file data:', chrome.runtime.lastError);
      callback(null);
      return;
    }
    callback(result);
  });
}

// Export backend service for direct access if needed
export { getBackendService };
