
import fillOracleForm from './oracle/oracleScript'
import {
  initializeStorage,
  getToggleState,
  getUserData,
} from "../utils/storageHandler";
import {
  setupMessageListeners,
  setupBubbleMessageListener,
  userData,
} from "./messageListener";
import { initializeFormFiller } from "./autoFormFill/formFiller";
import fillWorkdayForm from "./workDay/workdaynewScript";
import fillGreenhouseFields from "./greenhouse/greenhouseScript";
import { autofillICIMS } from "./icims/icimsScript";
import fillZohoForm from "./zoho/zohoScript";
import fillSuccessFactorsForm from "./successFactors/successfactorScript";
import fillSmartRecruitersForm from "./SmartRecruit/smartRecruitContent";
import {
  countVisibleUsableInputs,
  saveInteractiveElements,
} from "./inputCounter/countCounter";
import fillLeverForm from "./lever/leverScript";
import fillLinkedInForm from "./LinkedIn/linkedinContent";
import automateIndeedApplication from "./Indeed/indeedContent";

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
  const isOracle = window.location.hostname.includes('oracle');

  const icimsSite = window.location.hostname.includes("icims");
  const isZohoSite = window.location.hostname.includes("zoho");
  const isSuccessFactorsSite =
    window.location.hostname.includes("successfactors") ||
    window.location.hostname.includes("dzconnex");
  const isLeverSite = window.location.hostname.includes("lever");
  const isSmartRecruitersSite =
    window.location.hostname.includes("smartrecruiters");
  const isLinkedInSite =
    window.location.hostname.includes("linkedin.com") &&
    window.location.pathname.includes("/jobs/");
  const isIndeedJobPage =
    window.location.hostname.includes("indeed.com") &&
    (window.location.pathname.includes("/job/") ||
      window.location.pathname.includes("/viewjob"));
  const isIndeedApplyPage = window.location.hostname.includes(
    "smartapply.indeed.com"
  );

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
    } 
    else if(isOracle && toggleState) {
      console.log("Filling Oracle Form");
      getUserData((userData) => {
        if(userData?.data?.details){
          fillOracleForm(userData);
          console.log(userData);
          
        }
      })
    } 
    else if (isZohoSite && toggleState) {
      console.log("Filling ZOHO form");
      getUserData((userData) => {
        if (userData?.data?.details) fillZohoForm(userData);
      });
    } else if (isSuccessFactorsSite && toggleState) {
      console.log("Filling SuccessFactors form");
      getUserData((userData) => {
        if (userData?.data?.details) fillSuccessFactorsForm(userData);
      });
    } else if (isLeverSite && toggleState) {
      console.log("Filling Lever form");
      getUserData((userData) => {
        if (userData?.data?.details) fillLeverForm(userData);
      });
    } else if (isSmartRecruitersSite && toggleState) {
      console.log("Filling SmartRecruiters form");
      getUserData((userData) => {
        if (userData?.data?.details) fillSmartRecruitersForm(userData);
      });
    } else if (isLinkedInSite && toggleState) {
      console.log("Filling LinkedIn form");
      getUserData((userData) => {
        const linkedInData = userData?.data?.details || userData;
        if (linkedInData) {
          fillLinkedInForm(linkedInData);
        }
      });
    } else if (isIndeedApplyPage || (isIndeedJobPage && toggleState)) {
      console.log("Filling Indeed form");
      getUserData((userData) => {
        if (userData?.data?.details) automateIndeedApplication(userData);
      });
    } else {
      initializeFormFiller();
    }
  });

  chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => {});
}

// Listen for page load
window.addEventListener("load", initialize);

// Listen for refetchData message from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[ContentScript] Message received:', message);
  
  if (message.action === "refetchData") {
    console.log('[ContentScript] Processing refetchData request');
    getToggleState((toggleState) => {
      console.log('[ContentScript] Toggle state:', toggleState);
      
      if (toggleState) {
        // Re-run form filling logic
        const isWorkdaySite = window.location.hostname.includes("workday");
        const isGreenhouseSite =
          window.location.hostname.includes("greenhouse");
        const icimsSite = window.location.hostname.includes("icims");
        const isZohoSite = window.location.hostname.includes("zoho");
        const isSuccessFactorsSite =
          window.location.hostname.includes("successfactors") ||
          window.location.hostname.includes("dzconnex");
        const isLeverSite = window.location.hostname.includes("lever");
        const isSmartRecruitersSite =
          window.location.hostname.includes("smartrecruiters");
        const isLinkedInSite =
          window.location.hostname.includes("linkedin.com") &&
          window.location.pathname.includes("/jobs/");
        const isIndeedJobPage =
          window.location.hostname.includes("indeed.com") &&
          (window.location.pathname.includes("/job/") ||
            window.location.pathname.includes("/viewjob"));
        const isIndeedApplyPage = window.location.hostname.includes(
          "smartapply.indeed.com"
        );

        getUserData((userData) => {
          console.log('[ContentScript] Retrieved userData:', userData);
          
          // Validate userData structure
          if (!userData) {
            console.error('[ContentScript] Invalid formData structure: userData is null/undefined');
            sendResponse({ success: false, error: 'No user data found' });
            return;
          }
          
          // Normalize userData structure
          const formData = userData.data || userData;
          console.log('[ContentScript] Normalized formData:', formData);
          
          if (!formData) {
            console.error('[ContentScript] Invalid formData structure:', formData);
            sendResponse({ success: false, error: 'Invalid data structure' });
            return;
          }

          try {
            if (isWorkdaySite) {
              console.log("Refilling Workday form");
              if (formData.details) fillWorkdayForm({ data: formData });
            } else if (isGreenhouseSite) {
              console.log("Refilling Greenhouse form");
              if (formData.details) fillGreenhouseFields({ data: formData });
            } else if (icimsSite) {
              console.log("Refilling ICIMS form");
              if (formData.details) autofillICIMS({ data: formData }, null);
            } else if (isZohoSite) {
              console.log("Refilling ZOHO form");
              if (formData.details) fillZohoForm({ data: formData });
            } else if (isSuccessFactorsSite) {
              console.log("Refilling SuccessFactors form");
              if (formData.details) fillSuccessFactorsForm({ data: formData });
            } else if (isLeverSite) {
              console.log("Refilling Lever form");
              if (formData.details) fillLeverForm({ data: formData });
            } else if (isSmartRecruitersSite) {
              console.log("Refilling SmartRecruiters form");
              if (formData.details) fillSmartRecruitersForm({ data: formData });
            } else if (isLinkedInSite) {
              console.log("Refilling LinkedIn form");
              const linkedInData = formData.details || formData;
              if (linkedInData) fillLinkedInForm(linkedInData);
            } else if (isIndeedApplyPage || (isIndeedJobPage && toggleState)) {
              console.log("Refilling Indeed form");
              if (formData.details) automateIndeedApplication({ data: formData });
            } else {
              console.log("Refilling generic form with dataFill");
              // Import dataFill function for generic form filling
              import('./autoFormFill/formFiller').then(({ dataFill }) => {
                if (formData) {
                  dataFill(formData);
                } else {
                  console.error('No form data available for generic filling');
                }
              });
            }
            sendResponse({ success: true });
          } catch (error: any) {
            console.error('[ContentScript] Error during form filling:', error);
            sendResponse({ success: false, error: error.message });
          }
        });
      } else {
        console.log('[ContentScript] Autofill is disabled');
        sendResponse({ success: false, error: 'Autofill is disabled' });
      }
    });
    return true; // Keep message port open for async response
  } else {
    console.log('[ContentScript] Message type not handled:', message?.type || message?.action);
  }
});

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

interface Application {
  jobId: string;
  companyLink: string;
  jobTitle: string;
  status: string;
  dateApplied: string; 
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
  const knownJobDomains = [
    "workday",
    "greenhouse",
    "lever",
    "icims",
    "zoho",
    "successfactors",
    "dzconnex",
  ];

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

  return window.location.href; // fallback
};

// -----------------------------
// ✅ Capture Job Title before Apply
// -----------------------------
document.addEventListener(
  "click",
  async (event) => {
    const target = event.target as HTMLElement;
    const jobLink = target.closest(
      "a[data-rel='link-job-name']"
    ) as HTMLAnchorElement;

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
  },
  true
);

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
      dateApplied: formattedDate, // ✅ save time
      isCareerForm: true,
    };

    const isAlreadySaved = applications.some(
      (app) => `${app.jobId}-${app.jobTitle}` === uniqueKey
    );

    if (!isAlreadySaved) {
      applications.push(newApplication);
      chrome.storage.local.set({ applications }, () => {
        console.log("Career form saved:", newApplication);
        chrome.storage.local.remove("lastJobTitle");
      });
    } else {
      console.log(
        ` Application already exists for this job (${uniqueKey}). Skipping save.`
      );
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

  const isKnownJobSite = [
    "greenhouse",
    "workday",
    "lever",
    "icims",
    "successfactors",
    "dzconnex",
  ].some((domain) => window.location.hostname.includes(domain));

  if (!isConfirmation || !isKnownJobSite) return;
  const jobId = getJobId();
  if (!jobId) return;
  saveApplication(jobId);
};

document.addEventListener("submit", handleFormSubmission, true);
window.addEventListener("load", detectConfirmationPage);

const saveJobToAnalytics = () => {
  const websiteLink = window.location.href;
  let jobTitle = "Unknown Job";
  
  // Site-specific selectors
  if (window.location.hostname.includes("linkedin.com")) {
    jobTitle = document.querySelector<HTMLElement>('h2.top-card-layout__title')?.innerText.trim() ||
               document.querySelector<HTMLElement>('h1.top-card-layout__title')?.innerText.trim() ||
               document.querySelector('title')?.textContent?.replace(/\|.*$/, '').trim() ||
               jobTitle;
  } else if (window.location.hostname.includes("indeed.com")) {
    jobTitle = document.querySelector<HTMLElement>('h1.jobsearch-JobInfoHeader-title')?.innerText.trim() || jobTitle;
  } else if (window.location.hostname.includes("smartrecruiters.com")) {
    jobTitle = document.querySelector<HTMLElement>('[data-test="job-title"]')?.innerText.trim() ||
               document.querySelector<HTMLElement>('.job-title')?.innerText.trim() ||
               document.querySelector<HTMLElement>('h1[data-test-id="job-title"]')?.innerText.trim() ||
               jobTitle;
  } else if (window.location.hostname.includes("workday")) {
    jobTitle = document.querySelector<HTMLElement>('[data-automation-id="jobPostingHeader"] h1')?.innerText.trim() ||
               document.querySelector<HTMLElement>('h1[data-automation-id="job-title"]')?.innerText.trim() ||
               jobTitle;
  } else if (window.location.hostname.includes("greenhouse")) {
    jobTitle = document.querySelector<HTMLElement>('.app-title')?.innerText.trim() ||
               document.querySelector<HTMLElement>('h1.app-title')?.innerText.trim() ||
               jobTitle;
  }

  // Generic fallback (avoid title tag with warnings/errors)
  if (jobTitle === "Unknown Job") {
    const titleElement = document.querySelector('h1, h2, h3');
    if (titleElement?.textContent) {
      const titleText = titleElement.textContent.trim();
      // Skip titles that look like error messages or warnings
      if (!titleText.toLowerCase().includes('sorry') && 
          !titleText.toLowerCase().includes('error') &&
          !titleText.toLowerCase().includes('not supported') &&
          titleText.length > 10) {
        jobTitle = titleText;
      }
    }
    
    // Last resort: try title tag but clean it up
    if (jobTitle === "Unknown Job") {
      const pageTitle = document.querySelector('title')?.textContent?.trim();
      if (pageTitle && 
          !pageTitle.toLowerCase().includes('sorry') &&
          !pageTitle.toLowerCase().includes('error') &&
          !pageTitle.toLowerCase().includes('not supported')) {
        jobTitle = pageTitle.split('|')[0].split('-')[0].trim();
      }
    }
  }
  
  console.log('[ContentScript] Saving job to analytics:', { jobTitle, websiteLink });
  
  chrome.storage.local.get(["savedJobsAnalytics"], (result) => {
    const savedJobs = result.savedJobsAnalytics || [];
    const jobId = Date.now().toString();
    
    const newSavedJob = {
      id: jobId,
      title: jobTitle,
      url: websiteLink,
      dateAdded: new Date().toISOString(),
    };
    
    const existingJob = savedJobs.find((job: any) => job.url === websiteLink);
    if (existingJob) {
      console.log('Job already saved to analytics:', websiteLink);
      return;
    }
    
    savedJobs.push(newSavedJob);
    chrome.storage.local.set({ savedJobsAnalytics: savedJobs }, () => {
      console.log('Job saved to analytics storage:', newSavedJob);
    });
  });
};

// Message listener for manual save from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse)=>{
  console.log('[ContentScript] Message received:', msg);
  if(msg && msg.type === 'SAVE_APPLICATION_MANUAL'){
    console.log('[ContentScript] Processing SAVE_APPLICATION_MANUAL request');
    console.log('[ContentScript] Current URL:', window.location.href);
    try {
      saveJobToAnalytics();
      console.log('[ContentScript] saveJobToAnalytics called, sending success response');
      sendResponse({success: true});
    } catch (error : any) {
      console.error('[ContentScript] Error saving job:', error);
      sendResponse({success: false, error: error.message});
    }
    return true; // Keep message port open for async response
  } else {
    console.log('[ContentScript] Message type not handled:', msg?.type);
  }
});

// Expose function for debugging
(window as any).detectCareerPage = detectCareerPage;
