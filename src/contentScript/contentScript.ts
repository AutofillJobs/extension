import { initializeStorage, getToggleState, getUserData } from '../utils/storageHandler';
import { setupMessageListeners, setupBubbleMessageListener } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import fillWorkdayForm from './workDay/workdaynewScript';
import fillGreenhouseFields from './greenhouse/greenhouseScript';
import { autofillICIMS } from './icims/icimsScript';
import fillZohoForm from './zoho/zohoScript';
import fillSuccessFactorsForm from './successFactors/successfactorScript'
import { countVisibleUsableInputs, saveInteractiveElements } from './inputCounter/countCounter';
import fillLeverForm from "./lever/leverScript";

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
    console.log('Starting page load detection...');
    const inputs = countVisibleUsableInputs();
    saveInteractiveElements(inputs.length);
  } catch (error) {
    console.error('Page load detection failed:', error);
  }
}

// Main initialization
async function initialize() {
  console.log("Page is fully loaded");
  setupBubbleMessageListener();
  setTimeout(initializeInputDetection, 10000);
  await initializeStorage();
  setupMessageListeners();

  const isWorkdaySite = window.location.hostname.includes('workday');
  const isGreenhouseSite = window.location.hostname.includes("greenhouse");
  const icimsSite = window.location.hostname.includes('icims');
  const isZohoSite = window.location.hostname.includes('zoho');
  const isSuccessFactorsSite = window.location.hostname.includes('successfactors') || window.location.hostname.includes('dzconnex');

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
    } else if (isSuccessFactorsSite && toggleState) {
      console.log("Filling SuccessFactors form");
      getUserData((userData) => {
        if (userData?.data?.details) fillSuccessFactorsForm(userData);
      });
    } 
    else if (window.location.hostname.includes("jobs.lever.co") && toggleState) {
      console.log("Filling Lever form");
      getUserData((userData) => {
        if (userData?.data?.details) fillLeverForm(userData);
      });
    } 
    else {
      initializeFormFiller();
    }
  });

  chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => { });
}

// Listen for page load
window.addEventListener("load", initialize);

// Message listener from website
window.addEventListener("message", (event) => {
  if (event.origin !== "http://127.0.0.1:5500") return;

  // userInfo -> formData 
  const message = event.data;
  if (message.type === "UPDATE_USER_INFO") {
    chrome.storage.local.set({ userInfo: message.payload }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error saving to chrome.storage.local:", chrome.runtime.lastError.message);
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
  const careerKeywords = ["/careers", "/jobs", "/opportunities", "/apply", "/vacancies", "/join-us", "/job-openings", "/employment", "/recruitment", "/submit-a-job", "/post-a-job"];
  const knownJobDomains = ["workday", "greenhouse", "lever", "icims", "zoho", "successfactors", "dzconnex"];

  const currentURL = window.location.href.toLowerCase();
  const currentHost = window.location.hostname.toLowerCase();

  const urlMatch = careerKeywords.some(keyword => currentURL.includes(keyword));
  const isKnownJobSite = knownJobDomains.some(domain => currentHost.includes(domain));

  let hasApplyButton = false;
  if (isKnownJobSite) {
    hasApplyButton = Array.from(document.querySelectorAll("button, a"))
      .some(el => el.textContent?.trim().toLowerCase().includes("apply"));
  }

  return urlMatch || (isKnownJobSite && hasApplyButton);
};

// Get job ID
const getJobId = (): string | null => {
  const hiddenInput = document.querySelector<HTMLInputElement>('input[name="jobPostingId"]');
  if (hiddenInput?.value) return hiddenInput.value;

  const urlParts = window.location.pathname.split('/');
  const jobIdFromUrl = urlParts.find(part => /^\d+$/.test(part));
  if (jobIdFromUrl) return jobIdFromUrl;

  return window.location.href; // fallback
};

// -----------------------------
// ✅ Capture Job Title before Apply (❗️ NEW LOGIC TO PREVENT RACE CONDITION ❗️)
// -----------------------------
document.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;

  // Find the job link, whether the user clicked the link directly or an element inside it
  const jobLink = target.closest("a[data-rel='link-job-name']") as HTMLAnchorElement;

  if (jobLink) {
    // 1. Prevent the browser from navigating immediately
    event.preventDefault();

    const jobTitle = jobLink.textContent?.trim();
    if (jobTitle) {
      try {
        // 2. Wait for the storage operation to complete
        await new Promise<void>((resolve, reject) => {
          chrome.storage.local.set({ lastJobTitle: jobTitle }, () => {
            if (chrome.runtime.lastError) {
              return reject(chrome.runtime.lastError);
            }
            console.log("✅ Stored job title before applying:", jobTitle);
            resolve();
          });
        });

        // 3. Manually navigate to the page now that the title is saved
        window.location.href = jobLink.href;
      } catch (error) {
        console.error("❌ Failed to save job title:", error);
        // If saving fails, still navigate so the user isn't stuck
        window.location.href = jobLink.href;
      }
    } else {
      // If no title was found, navigate anyway
      window.location.href = jobLink.href;
    }
  }
}, true); // Use capture phase to ensure this runs before other click handlers


// -----------------------------
// Save application (dedup + uniqueKey)
// -----------------------------
const saveApplication = (jobId: string | null) => {
  const websiteLink = window.location.href;
  const appliedDateTime = new Date().toLocaleString();

  chrome.storage.local.get(["lastJobTitle", "applications"], (result) => {
    let jobTitle =
      result.lastJobTitle ||
      document.querySelector("h1, h2")?.textContent?.trim() ||
      document.querySelector("title")?.textContent?.trim() ||
      "Unknown Job";

    const applications: Application[] = result.applications || [];
    const stableJobId = jobId || websiteLink;
    const uniqueKey = `${stableJobId}-${jobTitle}-${appliedDateTime}`;

    const newApplication: Application = {
      jobId: stableJobId,
      companyLink: websiteLink,
      jobTitle,
      dateApplied: appliedDateTime,
      status: "Applied",
      isCareerForm: true,
    };

    const isAlreadySaved = applications.some(
      (app) => `${app.jobId}-${app.jobTitle}` === `${stableJobId}-${jobTitle}`
    );

    if (!isAlreadySaved) {
      applications.push(newApplication);
      chrome.storage.local.set({ applications }, () => {
        console.log("✅ Career form saved:", newApplication);
        chrome.storage.local.remove("lastJobTitle");
      });
    } else {
      console.log(`⚠️ Application already exists for this job title. Saving again with a new timestamp.`);
      applications.push(newApplication);
      chrome.storage.local.set({ applications }, () => {
        console.log("✅ Career form saved (re-application):", newApplication);
        chrome.storage.local.remove("lastJobTitle");
      });
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
    window.location.href.includes("/jobTasks/completed") || // ✅ Workday
    window.location.href.includes("/thank-you") ||
    window.location.href.includes("/success") ||
    document.title.toLowerCase().includes("thank you");

  const isKnownJobSite =
    ["greenhouse", "workday", "lever", "icims", "successfactors", "dzconnex"]
      .some(domain => window.location.hostname.includes(domain));

  if (!isConfirmation || !isKnownJobSite) return;
  const jobId = getJobId();
  if (!jobId) return;
  saveApplication(jobId);
};

// Event listeners
document.addEventListener("submit", handleFormSubmission, true);
window.addEventListener("load", detectConfirmationPage);

// Expose function for debugging
(window as any).detectCareerPage = detectCareerPage;


