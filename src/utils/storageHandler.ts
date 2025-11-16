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
    
    try {
      // Validate that the data has the expected structure
      const formData = result.formData;
      if (formData && typeof formData === 'object') {
        callback(formData);
      } else {
        console.warn('Invalid formData structure:', formData);
        callback(null);
      }
    } catch (error) {
      console.error('Error processing user data:', error);
      callback(null);
    }
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

/**
 * Fetches user's autofill data from the Bubble backend
 * and saves it to local storage ('formData').
 */
export async function syncDataFromBackend(callback?: (success: boolean, error?: string) => void) {
  console.log("SYNC: Starting sync from Bubble backend...");
  try {
    const backendService = await getBackendService();
    // 1. Fetch the data from Bubble
    const { success, data, error } = await backendService.fetchUserData();

    if (success && data) {
      console.log("SYNC: Successfully fetched data from Bubble.", data);

      // 2. Save the fetched data to local storage under the 'formData' key
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ 'formData': data }, () => {
          if (chrome.runtime.lastError) {
            console.error('SYNC: Error saving fetched data to local storage:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
          }
          console.log('SYNC: Fetched data saved to local storage "formData" key.');
          resolve();
        });
      });

      if (callback) callback(true);
      return; // Success!

    } else if (error) {
      // Fetch failed (e.g., 401 Unauthorized, API key wrong)
      console.error('SYNC: Failed to fetch data from Bubble:', error);
      if (callback) callback(false, error);
    } else {
      // Fetch succeeded but no data was found
      console.log('SYNC: No autofill data found in Bubble for this user.');
      if (callback) callback(true); // Not an "error" if no data exists
    }

  } catch (e) {
    console.error('SYNC: A critical error occurred during sync:', e);
    if (callback) callback(false, e instanceof Error ? e.message : 'Unknown error');
  }
}

// Export backend service for direct access if needed
export { getBackendService };
