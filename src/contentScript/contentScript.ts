import { initializeStorage, getToggleState, getAutoClickSaveState, getUserData } from '../utils/storageHandler';
import { setupMessageListeners } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import { FormData } from './utils/types';

// Existing Workday form filler
import fillWorkdayForm from './workDay/workdaynewScript';

// NEW: Import Taleo form filler
import fillTaleoForm from './oracleTaleo/taleoBaseScript';

// Initialize when page is fully loaded
async function initialize() {
  console.log("Page is fully loaded");
  await initializeStorage();
  setupMessageListeners();

  // Detect platform
  const isWorkdaySite = window.location.hostname.includes('workday');
  const isTaleoSite = window.location.hostname.includes('taleo');

  getToggleState((toggleState) => {
    if (toggleState) {
      if (isWorkdaySite) {
        console.log("Filling Workday form...");
        getUserData((userData) => {
          if (userData) {
            fillWorkdayForm(userData);
          } else {
            console.warn('[ContentScript] No formData found in storage for Workday site.');
          }
        });
      } 
      else if (isTaleoSite) {
        console.log("Filling Taleo form...");
        getUserData((userData) => {
          if (userData) {
            fillTaleoForm();

          } else {
            console.warn('[ContentScript] No formData found in storage for Taleo site.');
          }
        });
      }
      else {
        // For other sites fallback to generic form filler
        initializeFormFiller();
      }
    } else {
      // If toggle is off, use generic filler
      initializeFormFiller();
    }
  });

  // Request login email from background script (if needed)
  chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => {});
}

window.addEventListener("load", initialize);
