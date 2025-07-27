import { initializeStorage, getToggleState, getUserData } from './utils/storageHandler';
import { setupMessageListeners } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import createWorkdayFormFiller from './workDay/workdayScript';
import { FormData } from './utils/types';

// Initialize when page is fully loaded
function initialize() {
  console.log("Page is fully loaded");
  initializeStorage();
  setupMessageListeners();
  initializeFormFiller();

  // Check if on Workday site and toggleState is enabled
  const isWorkdaySite = window.location.hostname.includes('workday');
  getToggleState((toggleState) => {
    if (isWorkdaySite && toggleState) {
      console.log("Filling Workday form");
      getUserData((userData) => {
        if (userData) {
          const workdayFiller = createWorkdayFormFiller(userData.data);
          workdayFiller.initFormFiller();
        } else {
          console.warn('[ContentScript] No formData found in storage for Workday site.');
        }
      });
    }
  });

  // Request login email
  chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => {});


}

window.addEventListener("load", initialize);