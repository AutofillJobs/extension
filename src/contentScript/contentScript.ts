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
        try {
          if (userData && userData.data && userData.data.details) {
            fillWorkdayForm(userData);
          } else {
            console.warn('[ContentScript] No valid formData found in storage for Workday site.');
          }
        } catch (error) {
          console.error('[ContentScript] Error processing user data for Workday:', error);
        }
      });
    } else if (isGreenhouseSite && toggleState) {
      console.log("Filling Greenhouse form");
      getUserData((userData) => {
        try {
          if (userData && userData.data && userData.data.details) {
            fillGreenhouseFields(userData);
          } else {
            console.warn('[ContentScript] No valid formData found in storage for Greenhouse site.');
          }
        } catch (error) {
          console.error('[ContentScript] Error processing user data for Greenhouse:', error);
        }
      });
    } else if (icimsSite && toggleState) {
      console.log("Filling ICIMS form");
      getUserData((userData) => {
        try {
          if (userData && userData.data && userData.data.details) {
            autofillICIMS(userData, null);
          } else {
            console.warn('[ContentScript] No valid formData found in storage for ICIMS site.');
          }
        } catch (error) {
          console.error('[ContentScript] Error processing user data for ICIMS:', error);
        }
      });
    } else if(isZohoSite && toggleState){
      console.log("Filling ZOHO form");
      getUserData((userData) => {
        try {
          if (userData && userData.data && userData.data.details) {
            fillZohoForm(userData);
          } else {
            console.warn('[ContentScript] No valid formData found in storage for ZOHO site.');
          }
        } catch (error) {
          console.error('[ContentScript] Error processing user data for ZOHO:', error);
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
