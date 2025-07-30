import { initializeStorage, getToggleState, getAutoClickSaveState, getUserData } from '../utils/storageHandler';
import { setupMessageListeners } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import createWorkdayFormFiller from './workDay/workdayScript';
import { FormData } from './utils/types';
import fillWorkdayForm from './workDay/workdaynewScript';
import { autofillICIMS } from './icims/icimsScript';

// Initialize when page is fully loaded
async function initialize() {
  console.log("Page is fully loaded");
  await initializeStorage();
  setupMessageListeners();
  // Check if on Workday site and toggleState is enabled
  const isWorkdaySite = window.location.hostname.includes('workday');
  const icimsSite = window.location.hostname.includes('icims');
  getToggleState((toggleState) => {
    if (isWorkdaySite && toggleState) {
      console.log("Filling Workday form");
      getUserData((userData) => {
        if (userData) {
          // const workdayFiller = createWorkdayFormFiller(userData.data);
          // workdayFiller.initFormFiller();          
          fillWorkdayForm(userData)
        } else {
          console.warn('[ContentScript] No formData found in storage for Workday site.');
        }
      });
    }else if(icimsSite && toggleState){
      getUserData((userData) => {
        if (userData) {
          autofillICIMS(null, userData)     
        } else {
          console.warn('[ContentScript] No formData found in storage for Workday site.');
        }
      })
    }
    else{
      initializeFormFiller();
    }
  });
  // Request login email
  chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => {});


}

window.addEventListener("load", initialize);