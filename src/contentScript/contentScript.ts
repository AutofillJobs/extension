import {
  initializeStorage,
  getToggleState,
  getUserData,
} from "../utils/storageHandler";
import {
  setupMessageListeners,
  setupBubbleMessageListener,
} from "./messageListener";
import { initializeFormFiller } from "./autoFormFill/formFiller";
import fillWorkdayForm from "./workDay/workdaynewScript";
import fillGreenhouseFields from "./greenhouse/greenhouseScript";
import { autofillICIMS } from "./icims/icimsScript";
import fillZohoForm from "./zoho/zohoScript";
import {
  countVisibleUsableInputs,
  saveInteractiveElements,
} from "./inputCounter/countCounter";

// Utility: Wait for input in DOM
const waitForInput = (selector: string, timeout = 5000) => {
  return new Promise<HTMLInputElement | null>((resolve) => {
    const el = document.querySelector(selector) as HTMLInputElement;
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const elNow = document.querySelector(selector) as HTMLInputElement;
      if (elNow) {
        resolve(elNow);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => resolve(null), timeout);
  });
};

// Initialize input detection
async function initializeInputDetection() {
  try {
    console.log("Starting page load detection...");
    const inputs = countVisibleUsableInputs();
    saveInteractiveElements(inputs.length);
  } catch (error) {
    console.error("Page load detection failed:", error);
  }
}

// Main initialization
async function initialize() {
  console.log("Page is fully loaded");
  setupBubbleMessageListener();
  setTimeout(initializeInputDetection, 10000);
  await initializeStorage();
  setupMessageListeners();

  const isWorkdaySite = window.location.hostname.includes("workday");
  const isGreenhouseSite = window.location.hostname.includes("greenhouse");
  const icimsSite = window.location.hostname.includes("icims");
  const isZohoSite = window.location.hostname.includes("zoho");

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
        if (userData?.data?.details) fillZohoForm(userData);
      });
    } else {
      initializeFormFiller();
    }
  });

  chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => {});
}

// Listen for page load
window.addEventListener("load", initialize);

// Message listener from website
window.addEventListener("message", (event) => {
  if (event.origin !== "http://127.0.0.1:5500") return;

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

// -----------------------------
// Types & Helpers
// -----------------------------
interface Application {
  jobId: string;
  companyLink: string;
  jobTitle: string;
  dateApplied: string;
  status: string;
  isCareerForm?: boolean;
}

// Detect career page
const detectCareerPage = (): boolean => {
  const careerKeywords = [
    "/careers",
    "/jobs",
    "/opportunities",
    "/apply",
    "/vacancies",
    "/join-us",
    "/job-openings",
    "/employment",
    "/recruitment",
    "/submit-a-job",
    "/post-a-job",
  ];
  const knownJobDomains = ["workday", "greenhouse", "lever", "icims", "zoho"];

  const currentURL = window.location.href.toLowerCase();
  const currentHost = window.location.hostname.toLowerCase();

  const urlMatch = careerKeywords.some((keyword) =>
    currentURL.includes(keyword)
  );
  const isKnownJobSite = knownJobDomains.some((domain) =>
    currentHost.includes(domain)
  );

  let hasApplyButton = false;
  if (isKnownJobSite) {
    hasApplyButton = Array.from(document.querySelectorAll("button, a")).some(
      (el) => el.textContent?.trim().toLowerCase().includes("apply")
    );
  }

  return urlMatch || (isKnownJobSite && hasApplyButton);
};

// Get job ID
const getJobId = (): string | null => {
  const hiddenInput = document.querySelector<HTMLInputElement>(
    'input[name="jobPostingId"]'
  );
  if (hiddenInput?.value) return hiddenInput.value;

  const urlParts = window.location.pathname.split("/");
  const jobIdFromUrl = urlParts.find((part) => /^\d+$/.test(part));
  if (jobIdFromUrl) return jobIdFromUrl;

  return window.location.href;
};

// Save application
const saveApplication = (jobId: string) => {
  const websiteLink = window.location.href;
  const websiteTitle = document.title;
  const appliedDateTime = new Date().toLocaleString();

  const newApplication: Application = {
    jobId,
    companyLink: websiteLink,
    jobTitle: websiteTitle,
    dateApplied: appliedDateTime,
    status: "Applied",
    isCareerForm: true,
  };

  chrome.storage.local.get({ applications: [] }, (result) => {
    const applications: Application[] = result.applications;
    const isAlreadySaved = applications.some((app) => app.jobId === jobId);

    if (!isAlreadySaved) {
      applications.push(newApplication);
      chrome.storage.local.set({ applications }, () => {
        console.log("✅ Career form saved:", newApplication);
      });
    } else {
      console.log(`⚠️ Application for Job ID ${jobId} already exists.`);
    }
  });
};

// Handle form submit (single-page)
const handleFormSubmission = () => {
  if (!detectCareerPage()) return;
  const jobId = getJobId();
  if (!jobId) return;
  saveApplication(jobId);
};

// Detect confirmation page (multi-page)
const detectConfirmationPage = () => {
  const isConfirmation =
    window.location.href.includes("/confirmation") ||
    (window.location.href.includes("/jobTasks/completed") && // ✅ Workday
      (window.location.hostname.includes("greenhouse") ||
        window.location.hostname.includes("workday") ||
        window.location.hostname.includes("lever") ||
        window.location.hostname.includes("icims")));

  if (!isConfirmation) return;
  const jobId = getJobId();
  if (!jobId) return;
  saveApplication(jobId);
};

// Event listeners
document.addEventListener("submit", handleFormSubmission, true);
window.addEventListener("load", detectConfirmationPage);

// Expose function for debugging
(window as any).detectCareerPage = detectCareerPage;

// import { initializeStorage, getToggleState, getAutoClickSaveState, getUserData } from '../utils/storageHandler';
// import { setupMessageListeners } from './messageListener';
// import { initializeFormFiller } from './autoFormFill/formFiller';
// import createWorkdayFormFiller from './workDay/workdayScript';
// import { FormData } from './utils/types';
// import fillWorkdayForm from './workDay/workdaynewScript';
// import fillGreenhouseFields from './greenhouse/greenhouseScript';
// import { autofillICIMS } from './icims/icimsScript'; // <-- from develop branch
// import fillZohoForm from './zoho/zohoScript';
// import { waitForPageToBeReady,countVisibleUsableInputs, saveInteractiveElements } from './inputCounter/countCounter';
// import { setupBubbleMessageListener } from './messageListener';

// async function initializeInputDetection() {
//   try {
//     console.log('Starting page load detection...');

//     // await waitForPageToBeReady({
//     //   maxWaitTime: 15000,
//     //   stabilityChecks: 4,
//     //   checkInterval: 750
//     // });

//     // if (window.history && window.history.pushState) {
//     //   const originalPushState = history.pushState;
//     //   history.pushState = function (...args) {
//     //     originalPushState.apply(this, args);
//     //     setTimeout(countVisibleUsableInputs, 1000);
//     //     return null;
//     //   };

//     //   window.addEventListener('popstate', () => {
//     //     setTimeout(countVisibleUsableInputs, 1000);
//     //   });
//     // }

//     const inputs = countVisibleUsableInputs();
//     // console.log(`Page fully loaded! Found ${inputs.length} interactive elements.`);
//     saveInteractiveElements(inputs.length);
//   } catch (error) {
//     console.error('Page load detection failed:', error);
//     // setTimeout(() => {
//     //   const inputs = countVisibleUsableInputs();
//     //   // console.log(`Page content detected (final attempt). Found ${inputs.length} elements.`);
//     // }, 3000);
//   }
// }

// // if (document.readyState === 'complete') {
// //   initializeInputDetection();
// // } else {
// //   window.addEventListener('load', initializeInputDetection);
// //   document.addEventListener('DOMContentLoaded', initializeInputDetection);
// //   setTimeout(initializeInputDetection, 5000);
// // }

// // Initialize when page is fully loaded

// async function initialize() {
//   console.log("Page is fully loaded");
//   setupBubbleMessageListener();
//   setTimeout(initializeInputDetection, 10000);
//   await initializeStorage();
//   setupMessageListeners();

//   const isWorkdaySite = window.location.hostname.includes('workday');
//   const isGreenhouseSite = window.location.hostname.includes("greenhouse");
//   const icimsSite = window.location.hostname.includes('icims'); // <-- from develop branch
//   const isZohoSite = window.location.hostname.includes('zoho');

//   getToggleState((toggleState) => {
//     if (isWorkdaySite && toggleState) {
//       console.log("Filling Workday form");
//       getUserData((userData) => {
//         try {
//           if (userData && userData.data && userData.data.details) {
//             fillWorkdayForm(userData);
//           } else {
//             console.warn('[ContentScript] No valid formData found in storage for Workday site.');
//           }
//         } catch (error) {
//           console.error('[ContentScript] Error processing user data for Workday:', error);
//         }
//       });
//     } else if (isGreenhouseSite && toggleState) {
//       console.log("Filling Greenhouse form");
//       getUserData((userData) => {
//         try {
//           if (userData && userData.data && userData.data.details) {
//             fillGreenhouseFields(userData);
//           } else {
//             console.warn('[ContentScript] No valid formData found in storage for Greenhouse site.');
//           }
//         } catch (error) {
//           console.error('[ContentScript] Error processing user data for Greenhouse:', error);
//         }
//       });
//     } else if (icimsSite && toggleState) {
//       console.log("Filling ICIMS form");
//       getUserData((userData) => {
//         try {
//           if (userData && userData.data && userData.data.details) {
//             autofillICIMS(userData, null);
//           } else {
//             console.warn('[ContentScript] No valid formData found in storage for ICIMS site.');
//           }
//         } catch (error) {
//           console.error('[ContentScript] Error processing user data for ICIMS:', error);
//         }
//       });
//     } else if(isZohoSite && toggleState){
//       console.log("Filling ZOHO form");
//       getUserData((userData) => {
//         try {
//           if (userData && userData.data && userData.data.details) {
//             fillZohoForm(userData);
//           } else {
//             console.warn('[ContentScript] No valid formData found in storage for ZOHO site.');
//           }
//         } catch (error) {
//           console.error('[ContentScript] Error processing user data for ZOHO:', error);
//         }
//       });
//     }
//     else {
//       initializeFormFiller();
//     }
//   });

//   // Request login email
//   chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => {});
// }

// window.addEventListener("load", initialize);

// // contentScript.js

// // Listen for messages from the website
// window.addEventListener("message", (event) => {
//   // SECURITY: Verify the message origin to prevent malicious attacks
//   console.log("event",event)
//   if (event.origin !== "http://127.0.0.1:5500") {
//     return;
//   }

//   // You can add more security checks, like a message type
//   const message = event.data;
//   if (message.type && message.type === "UPDATE_USER_INFO") {
//     console.log("Message received from webpage:", message.payload);

//     // Save the payload directly to chrome.storage.local
//     chrome.storage.local.set({ userInfo: message.payload }, () => {
//       if (chrome.runtime.lastError) {
//         console.error("Error saving to chrome.storage.local:", chrome.runtime.lastError.message);
//       } else {
//         console.log("User info saved successfully to local storage.");
//       }
//     });
//   }
// });
