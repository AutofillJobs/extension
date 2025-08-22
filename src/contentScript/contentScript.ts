import { initializeStorage, getToggleState, getUserData } from '../utils/storageHandler';
import { setupMessageListeners, setupBubbleMessageListener } from './messageListener';
import { initializeFormFiller } from './autoFormFill/formFiller';
import fillWorkdayForm from './workDay/workdaynewScript';
import fillGreenhouseFields from './greenhouse/greenhouseScript';
import { autofillICIMS } from './icims/icimsScript';
import fillZohoForm from './zoho/zohoScript';
import fillSuccessFactorsForm from './successFactors/successfactorScript'
import { countVisibleUsableInputs, saveInteractiveElements } from './inputCounter/countCounter';

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
    } else {
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
  status: string;
  dateApplied: string;   // ✅ added field
  isCareerForm?: boolean;
}

// Detect career page
const detectCareerPage = (): boolean => {
  const careerKeywords = ["/careers","/jobs","/opportunities","/apply","/vacancies","/join-us","/job-openings","/employment","/recruitment","/submit-a-job", "/post-a-job"];
  const knownJobDomains = ["workday","greenhouse","lever","icims","zoho","successfactors","dzconnex"];

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
// ✅ Capture Job Title before Apply
// -----------------------------
document.addEventListener("click", async (event) => {
  const target = event.target as HTMLElement;
  const jobLink = target.closest("a[data-rel='link-job-name']") as HTMLAnchorElement;

  if (jobLink) {
    event.preventDefault();

    const jobTitle = jobLink.textContent?.trim();
    if (jobTitle) {
      try {
        await new Promise<void>((resolve, reject) => {
          chrome.storage.local.set({ lastJobTitle: jobTitle }, () => {
            if (chrome.runtime.lastError) {
              return reject(chrome.runtime.lastError);
            }
            console.log("✅ Stored job title before applying:", jobTitle);
            resolve();
          });
        });
        window.location.href = jobLink.href;
      } catch (error) {
        console.error("❌ Failed to save job title:", error);
        window.location.href = jobLink.href;
      }
    } else {
      window.location.href = jobLink.href;
    }
  }
}, true);

// -----------------------------
// Save application (with date/time)
// -----------------------------
const saveApplication = (jobId: string | null) => {
  const websiteLink = window.location.href;

  chrome.storage.local.get(["lastJobTitle", "applications"], (result) => {
    let jobTitle =
      result.lastJobTitle ||
      document.querySelector("h1, h2")?.textContent?.trim() ||
      document.querySelector("title")?.textContent?.trim() ||
      "Unknown Job";

    const applications: Application[] = result.applications || [];
    const stableJobId = jobId || websiteLink;
    const uniqueKey = `${stableJobId}-${jobTitle}`; // ✅ uniqueness by jobId + title only

    // ✅ Add formatted date/time
    const now = new Date();
    const formattedDate = now.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newApplication: Application = {
      jobId: stableJobId,
      companyLink: websiteLink,
      jobTitle,
      status: "Applied",
      dateApplied: formattedDate,   // ✅ save time
      isCareerForm: true,
    };

    const isAlreadySaved = applications.some(
      (app) => `${app.jobId}-${app.jobTitle}` === uniqueKey
    );

    if (!isAlreadySaved) {
      applications.push(newApplication);
      chrome.storage.local.set({ applications }, () => {
        console.log("✅ Career form saved:", newApplication);
        chrome.storage.local.remove("lastJobTitle");
      });
    } else {
      console.log(`⚠️ Application already exists for this job (${uniqueKey}). Skipping save.`);
    }
  });
};

// Handle form submit
const handleFormSubmission = () => {
  if (!detectCareerPage()) return;
  const jobId = getJobId();
  if (!jobId) return;
  saveApplication(jobId);
};

// Detect confirmation page
const detectConfirmationPage = () => {
  const isConfirmation =
    window.location.href.includes("/confirmation") ||
    window.location.href.includes("/jobTasks/completed") ||
    window.location.href.includes("/thank-you") ||
    window.location.href.includes("/success") ||
    document.title.toLowerCase().includes("thank you");

  const isKnownJobSite =
    ["greenhouse","workday","lever","icims","successfactors","dzconnex"]
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
