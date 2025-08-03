import { initializeStorage, getToggleState, getAutoClickSaveState, getUserData } from '../utils/storageHandler';
import { setupMessageListeners } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import createWorkdayFormFiller from './workDay/workdayScript';
import { FormData } from './utils/types';
import fillWorkdayForm from './workDay/workdaynewScript';
import fillGreenhouseFields from './greenhouse/greenhouseScript';
import { autofillICIMS } from './icims/icimsScript'; // <-- from develop branch
import fillZohoForm from './zoho/zohoScript';

// Initialize when page is fully loaded
async function initialize() {
  console.log("Page is fully loaded");
  await initializeStorage();
  setupMessageListeners();

  const isWorkdaySite = window.location.hostname.includes('workday');
  const isGreenhouseSite = window.location.hostname.includes("greenhouse");
  const icimsSite = window.location.hostname.includes('icims'); // <-- from develop branch
  const isZohoSite = window.location.hostname.includes('zoho');
  
  getToggleState((toggleState) => {
    if (isWorkdaySite && toggleState) {
      console.log("Filling Workday form");
      getUserData((userData) => {
        if (userData) {
          fillWorkdayForm(userData);
        } else {
          console.warn('[ContentScript] No formData found in storage for Workday site.');
        }
      });
    } else if (isGreenhouseSite && toggleState) {
      console.log("Filling Greenhouse form");
      getUserData((userData) => {
        if (userData) {
          fillGreenhouseFields(userData);
        } else {
          console.warn('[ContentScript] No formData found in storage for Greenhouse site.');
        }
      });
    } else if (icimsSite && toggleState) {
      console.log("Filling ICIMS form");
      getUserData((userData) => {
        if (userData) {
          autofillICIMS(null, userData);
        } else {
          console.warn('[ContentScript] No formData found in storage for ICIMS site.');
        }
      });
    }else if(isZohoSite && toggleState){
      console.log("Filling ZOHO form");
      getUserData((userData) => {
        if (userData) {
          fillZohoForm(userData);
        } else {
          console.warn('[ContentScript] No formData found in storage for ICIMS site.');
        }
      });
    } 
    else {
      initializeFormFiller();
    }
  });

  // Request login email
  chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => {});
}

window.addEventListener("load", initialize);
