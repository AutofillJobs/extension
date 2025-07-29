import { initializeStorage, getToggleState, getAutoClickSaveState, getUserData } from '../utils/storageHandler';
import { setupMessageListeners } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import createWorkdayFormFiller from './workDay/workdayScript';
import { FormData } from './utils/types';
import { autofillSuccessFactorsForm } from './successFactors/successFactorsScript';

// Initialize when page is fully loaded
function initialize() {
  console.log("Page is fully loaded");
  initializeStorage();
  setupMessageListeners();
  

  // Check if on Workday or SuccessFactors site and toggleState is enabled
  const isWorkdaySite = window.location.hostname.includes('workday');
  const isSuccessFactorsSite = window.location.href.includes('career5.successfactors.eu/portalcareer?company=SAP');
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
    } else if (isSuccessFactorsSite && toggleState) {
      console.log("Filling SuccessFactors form");
      autofillSuccessFactorsForm();
    } else {
      initializeFormFiller();
    }
  });

  // Request login email
  chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => {});


}

window.addEventListener("load", initialize);