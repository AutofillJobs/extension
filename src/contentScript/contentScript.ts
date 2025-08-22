import { initializeStorage, getToggleState, getAutoClickSaveState, getUserData } from '../utils/storageHandler';
import { setupMessageListeners } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import createWorkdayFormFiller from './workDay/workdayScript';
import { FormData } from './utils/types';
import fillWorkdayForm from './workDay/workdaynewScript';
import fillGreenhouseFields from './greenhouse/greenhouseScript';
import { autofillICIMS } from './icims/icimsScript'; // <-- from develop branch
import fillZohoForm from './zoho/zohoScript';
import { waitForPageToBeReady,countVisibleUsableInputs, saveInteractiveElements } from './inputCounter/countCounter';
import { setupBubbleMessageListener } from './messageListener';

async function initializeInputDetection() {
  try {
    console.log('Starting page load detection...');
    
    // await waitForPageToBeReady({
    //   maxWaitTime: 15000,
    //   stabilityChecks: 4,
    //   checkInterval: 750
    // });

    // if (window.history && window.history.pushState) {
    //   const originalPushState = history.pushState;
    //   history.pushState = function (...args) {
    //     originalPushState.apply(this, args);
    //     setTimeout(countVisibleUsableInputs, 1000);
    //     return null;
    //   };

    //   window.addEventListener('popstate', () => {
    //     setTimeout(countVisibleUsableInputs, 1000);
    //   });
    // }

    const inputs = countVisibleUsableInputs();
    saveInteractiveElements(inputs.length);
  } catch (error) {
    console.error('Page load detection failed:', error);
    // setTimeout(() => {
    //   const inputs = countVisibleUsableInputs();
    //   // console.log(`Page content detected (final attempt). Found ${inputs.length} elements.`);
    // }, 3000);
  }
}

// if (document.readyState === 'complete') {
//   initializeInputDetection();
// } else {
//   window.addEventListener('load', initializeInputDetection);
//   document.addEventListener('DOMContentLoaded', initializeInputDetection);
//   setTimeout(initializeInputDetection, 5000);
// }


// Initialize when page is fully loaded

async function initialize() {
  console.log("Page is fully loaded");
  setupBubbleMessageListener();
  setTimeout(initializeInputDetection, 10000);
  await initializeStorage();
  setupMessageListeners();

  const isWorkdaySite = window.location.hostname.includes("workday");
  const isGreenhouseSite = window.location.hostname.includes("greenhouse");
  const icimsSite = window.location.hostname.includes('icims'); // <-- from develop branch
  const isZohoSite = window.location.hostname.includes('zoho');
  
  getToggleState((toggleState) => {
    if (isWorkdaySite && toggleState) {
      console.log("Filling Workday form");
      getUserData((userData) => {
        if (userData?.data?.details) fillWorkdayForm(userData);
      });
    } else if (isGreenhouseSite && toggleState) {
      console.log("Filling Greenhouse form");
      getUserData((userData) => {
        if (userData?.data?.details) fillGreenhouseFields(userData);
      });
    } else if (icimsSite && toggleState) {
      console.log("Filling ICIMS form");
      getUserData((userData) => {
        if (userData?.data?.details) autofillICIMS(userData, null);
      });
    } else if (isZohoSite && toggleState) {
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

// Listen for page load
window.addEventListener("load", initialize);

// Message listener from website
window.addEventListener("message", (event) => {
  // SECURITY: Verify the message origin to prevent malicious attacks
  console.log("event",event)
  if (event.origin !== "http://127.0.0.1:5500") {
    return;
  }

  // You can add more security checks, like a message type
  const message = event.data;
  if (message.type === "UPDATE_USER_INFO") {
    chrome.storage.local.set({ userInfo: message.payload }, () => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error saving to chrome.storage.local:",
          chrome.runtime.lastError.message
        );
      } else {
        console.log("User info saved successfully to local storage.");
      }
    });
  }
});