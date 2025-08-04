// Configuration file for the extension

export interface AppConfig {
  backend: {
    baseUrl: string;
    apiKey?: string;
    enabled: boolean;
    timeout: number; // in milliseconds
  };
  storage: {
    syncEnabled: boolean;
    autoBackup: boolean;
  };
  features: {
    autoSave: boolean;
    showNotifications: boolean;
  };
}

// Default configuration
export const defaultConfig: AppConfig = {
  backend: {
    baseUrl: 'https://applygoat.com/version-test/api/1.1', // Bubble API base URL
    apiKey: "e02abfdc4f4c029b6ebecf5cd18a8c97", // Bubble API key
    enabled: true,
    timeout: 10000 // 10 seconds
  },
  storage: {
    syncEnabled: true,
    autoBackup: true
  },
  features: {
    autoSave: false,
    showNotifications: true
  }
};

// Function to get configuration from storage or use default
export async function getConfig(): Promise<AppConfig> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['appConfig'], (result) => {
      if (chrome.runtime.lastError || !result.appConfig) {
        // Use default config if none exists
        resolve(defaultConfig);
        return;
      }
      
      // Merge with default config to ensure all properties exist
      const config = { ...defaultConfig, ...result.appConfig };
      resolve(config);
    });
  });
}

// Function to save configuration
export async function saveConfig(config: Partial<AppConfig>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ appConfig: config }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
}

// Function to update specific config values
export async function updateConfig(updates: Partial<AppConfig>): Promise<void> {
  const currentConfig = await getConfig();
  const newConfig = { ...currentConfig, ...updates };
  await saveConfig(newConfig);
}

// Export default config for direct access
export { defaultConfig as config }; 