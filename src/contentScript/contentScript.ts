import { initializeStorage, getToggleState, getAutoClickSaveState, getUserData } from '../utils/storageHandler';
import { setupMessageListeners } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import createWorkdayFormFiller from './workDay/workdayScript';
import { FormData } from './utils/types';
import fillWorkdayForm from './workDay/workdaynewScript';
import fillGreenhouseFields from './greenhouse/greenhouseScript';

// Initialize when page is fully loaded
async function initialize() {
  console.log("Page is fully loaded");
  await initializeStorage();
  setupMessageListeners();
  // Check if on Workday site and toggleState is enabled
  const isWorkdaySite = window.location.hostname.includes('workday');
  const isGreenhouseSite = window.location.hostname.includes("greenhouse")
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
    }else if(isGreenhouseSite && toggleState){
      console.log("GREENHOUSE SITE ");
      getUserData((userData) => {
        if(userData){
          fillGreenhouseFields(userData);
        }else{
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