import fillOracleForm from './oracle/oracleScript'
import {
  initializeStorage,
  getToggleState,
  getUserData,
} from "../utils/storageHandler";
import {
  setupMessageListeners,
  setupBubbleMessageListener,
} from "./messageListener";
import { initializeFormFiller, dataFill } from "./autoFormFill/formFiller";
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

(function mainExecution() {

  // Never run on applygoat.com itself
  if (window.location.hostname.includes('applygoat') || window.location.href.includes('applygoat')) {
    return;
  }

  // ---------------------------------------------------------------------------
  // Site detection helpers — extracted to avoid duplicating logic
  // ---------------------------------------------------------------------------
  interface SiteFlags {
    isWorkday: boolean;
    isGreenhouse: boolean;
    isICIMS: boolean;
    isOracle: boolean;
    isZoho: boolean;
    isSuccessFactors: boolean;
    isLever: boolean;
    isSmartRecruiters: boolean;
    isLinkedIn: boolean;
    isIndeedJob: boolean;
    isIndeedApply: boolean;
  }

  function detectSite(): SiteFlags {
    const host = window.location.hostname;
    const path = window.location.pathname;
    return {
      isWorkday: host.includes("workday"),
      isGreenhouse: host.includes("greenhouse"),
      isICIMS: host.includes("icims"),
      isOracle: host.includes("oracle"),
      isZoho: host.includes("zoho"),
      isSuccessFactors: host.includes("successfactors") || host.includes("dzconnex"),
      isLever: host.includes("lever"),
      isSmartRecruiters: host.includes("smartrecruiters"),
      isLinkedIn: host.includes("linkedin.com") && path.includes("/jobs/"),
      isIndeedJob: host.includes("indeed.com") && (path.includes("/job/") || path.includes("/viewjob")),
      isIndeedApply: host.includes("smartapply.indeed.com"),
    };
  }

  function runFiller(userData: any, site: SiteFlags) {
    if (!userData) return;

    if (site.isWorkday && userData.data?.details) {
      fillWorkdayForm(userData);
    } else if (site.isGreenhouse && userData.data?.details) {
      fillGreenhouseFields(userData);
    } else if (site.isICIMS && userData.data?.details) {
      autofillICIMS(userData, null);
    } else if (site.isOracle && userData.data?.details) {
      fillOracleForm(userData);
    } else if (site.isZoho && userData.data?.details) {
      fillZohoForm(userData);
    } else if (site.isSuccessFactors && userData.data?.details) {
      fillSuccessFactorsForm(userData);
    } else if (site.isLever && userData.data?.details) {
      fillLeverForm(userData);
    } else if (site.isSmartRecruiters && userData.data?.details) {
      fillSmartRecruitersForm(userData);
    } else if (site.isLinkedIn) {
      const linkedInData = userData.data?.details || userData;
      if (linkedInData) fillLinkedInForm(linkedInData);
    } else if (site.isIndeedApply || site.isIndeedJob) {
      if (userData.data?.details) automateIndeedApplication(userData);
    } else {
      dataFill(userData.data);
    }
  }

  // ---------------------------------------------------------------------------
  // Input counter (runs 10s after page load for analytics)
  // ---------------------------------------------------------------------------
  async function initializeInputDetection() {
    try {
      const inputs = countVisibleUsableInputs();
      saveInteractiveElements(inputs.length);
    } catch (error) {
      console.error("Page load detection failed:", error);
    }
  }

  // ---------------------------------------------------------------------------
  // Main initialization on page load
  // ---------------------------------------------------------------------------
  async function initialize() {
    setupBubbleMessageListener();
    setTimeout(initializeInputDetection, 10000);
    await initializeStorage();
    setupMessageListeners();

    const site = detectSite();

    getToggleState((toggleState) => {
      if (!toggleState) return;

      // LinkedIn and Indeed apply pages run regardless of toggle (they have own checks)
      const shouldRun = site.isWorkday || site.isGreenhouse || site.isICIMS ||
        site.isOracle || site.isZoho || site.isSuccessFactors || site.isLever ||
        site.isSmartRecruiters || site.isLinkedIn || site.isIndeedJob || site.isIndeedApply;

      if (!shouldRun) {
        initializeFormFiller();
        return;
      }

      getUserData((userData) => {
        runFiller(userData, site);
      });
    });

    chrome.runtime.sendMessage({ message: "getLoginEmail" }, () => { });
  }

  window.addEventListener("load", initialize);

  // ---------------------------------------------------------------------------
  // Single unified message listener — handles both refetchData and SAVE_APPLICATION_MANUAL
  // ---------------------------------------------------------------------------
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "refetchData") {
      getToggleState((toggleState) => {
        if (!toggleState) {
          sendResponse({ success: false, error: 'Autofill is disabled' });
          return;
        }

        const site = detectSite();
        getUserData((userData) => {
          if (!userData) {
            sendResponse({ success: false, error: 'No user data found' });
            return;
          }
          try {
            runFiller(userData, site);
            sendResponse({ success: true });
          } catch (error: any) {
            console.error('[ContentScript] Error during form filling:', error);
            sendResponse({ success: false, error: error.message });
          }
        });
      });
      return true; // Keep message port open for async response
    }

    if (message.type === 'SAVE_APPLICATION_MANUAL') {
      try {
        saveJobToAnalytics();
        sendResponse({ success: true });
      } catch (error: any) {
        console.error('[ContentScript] Error saving job:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true;
    }
  });

  // ---------------------------------------------------------------------------
  // Job title capture before navigation (for job portals with listing pages)
  // ---------------------------------------------------------------------------
  document.addEventListener(
    "click",
    async (event) => {
      const target = event.target as HTMLElement;
      const jobLink = target.closest("a[data-rel='link-job-name']") as HTMLAnchorElement;
      if (!jobLink) return;

      event.preventDefault();
      const jobTitle = jobLink.textContent?.trim();
      if (jobTitle) {
        try {
          await new Promise<void>((resolve, reject) => {
            chrome.storage.local.set({ lastJobTitle: jobTitle }, () => {
              if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
              resolve();
            });
          });
        } catch (error) {
          console.error("Failed to save job title:", error);
        }
      }
      window.location.href = jobLink.href;
    },
    true
  );

  // ---------------------------------------------------------------------------
  // Application saving — career page forms
  // ---------------------------------------------------------------------------
  interface Application {
    jobId: string;
    companyLink: string;
    jobTitle: string;
    status: string;
    dateApplied: string;
    isCareerForm?: boolean;
  }

  const detectCareerPage = (): boolean => {
    const careerKeywords = [
      "/careers", "/jobs", "/opportunities", "/apply", "/vacancies",
      "/join-us", "/job-openings", "/employment", "/recruitment",
    ];
    const knownJobDomains = [
      "workday", "greenhouse", "lever", "icims", "zoho",
      "successfactors", "dzconnex", "smartrecruiters",
    ];

    const currentURL = window.location.href.toLowerCase();
    const currentHost = window.location.hostname.toLowerCase();

    const urlMatch = careerKeywords.some((keyword) => currentURL.includes(keyword));
    const isKnownJobSite = knownJobDomains.some((domain) => currentHost.includes(domain));

    let hasApplyButton = false;
    if (isKnownJobSite) {
      hasApplyButton = Array.from(document.querySelectorAll("button, a")).some(
        (el) => el.textContent?.trim().toLowerCase() === "apply"
      );
    }

    return urlMatch || (isKnownJobSite && hasApplyButton);
  };

  const getJobId = (): string | null => {
    const hiddenInput = document.querySelector<HTMLInputElement>('input[name="jobPostingId"]');
    if (hiddenInput?.value) return hiddenInput.value;

    const urlParts = window.location.pathname.split("/");
    const jobIdFromUrl = urlParts.find((part) => /^\d+$/.test(part));
    if (jobIdFromUrl) return jobIdFromUrl;

    return window.location.href;
  };

  const saveApplication = (jobId: string | null) => {
    const websiteLink = window.location.href;

    chrome.storage.local.get(["lastJobTitle", "applications"], (result) => {
      const jobTitle =
        result.lastJobTitle ||
        document.querySelector("h1, h2")?.textContent?.trim() ||
        document.querySelector("title")?.textContent?.trim() ||
        "Unknown Job";

      const applications: Application[] = result.applications || [];
      const stableJobId = jobId || websiteLink;
      const uniqueKey = `${stableJobId}-${jobTitle}`;

      const now = new Date();
      const formattedDate = now.toLocaleString("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      });

      const newApplication: Application = {
        jobId: stableJobId,
        companyLink: websiteLink,
        jobTitle,
        status: "Applied",
        dateApplied: formattedDate,
        isCareerForm: true,
      };

      const isAlreadySaved = applications.some(
        (app) => `${app.jobId}-${app.jobTitle}` === uniqueKey
      );

      if (!isAlreadySaved) {
        applications.push(newApplication);
        chrome.storage.local.set({ applications }, () => {
          chrome.storage.local.remove("lastJobTitle");
        });
      }
    });
  };

  const handleFormSubmission = () => {
    if (!detectCareerPage()) return;
    const jobId = getJobId();
    saveApplication(jobId);
  };

  const detectConfirmationPage = () => {
    const isConfirmation =
      window.location.href.includes("/confirmation") ||
      window.location.href.includes("/jobTasks/completed") ||
      window.location.href.includes("/thank-you") ||
      window.location.href.includes("/success") ||
      document.title.toLowerCase().includes("thank you");

    const isKnownJobSite = [
      "greenhouse", "workday", "lever", "icims", "successfactors", "dzconnex",
    ].some((domain) => window.location.hostname.includes(domain));

    if (!isConfirmation || !isKnownJobSite) return;
    const jobId = getJobId();
    saveApplication(jobId);
  };

  document.addEventListener("submit", handleFormSubmission, true);
  window.addEventListener("load", detectConfirmationPage);

  // ---------------------------------------------------------------------------
  // Analytics job saver
  // ---------------------------------------------------------------------------
  function saveJobToAnalytics() {
    const websiteLink = window.location.href;
    let jobTitle = "Unknown Job";

    const host = window.location.hostname;

    if (host.includes("linkedin.com")) {
      jobTitle =
        document.querySelector<HTMLElement>('h2.top-card-layout__title')?.innerText.trim() ||
        document.querySelector<HTMLElement>('h1.top-card-layout__title')?.innerText.trim() ||
        document.querySelector('title')?.textContent?.replace(/\|.*$/, '').trim() ||
        jobTitle;
    } else if (host.includes("indeed.com")) {
      jobTitle =
        document.querySelector<HTMLElement>('h1.jobsearch-JobInfoHeader-title')?.innerText.trim() ||
        document.querySelector<HTMLElement>('[data-testid="jobsearch-JobInfoHeader-title"]')?.innerText.trim() ||
        jobTitle;
    } else if (host.includes("smartrecruiters.com")) {
      jobTitle =
        document.querySelector<HTMLElement>('[data-test="job-title"]')?.innerText.trim() ||
        document.querySelector<HTMLElement>('.job-title')?.innerText.trim() ||
        document.querySelector<HTMLElement>('h1[data-test-id="job-title"]')?.innerText.trim() ||
        jobTitle;
    } else if (host.includes("workday")) {
      jobTitle =
        document.querySelector<HTMLElement>('[data-automation-id="jobPostingHeader"] h1')?.innerText.trim() ||
        document.querySelector<HTMLElement>('h1[data-automation-id="job-title"]')?.innerText.trim() ||
        jobTitle;
    } else if (host.includes("greenhouse")) {
      jobTitle =
        document.querySelector<HTMLElement>('.app-title')?.innerText.trim() ||
        document.querySelector<HTMLElement>('h1.app-title')?.innerText.trim() ||
        jobTitle;
    } else if (host.includes("lever")) {
      jobTitle =
        document.querySelector<HTMLElement>('h2[data-qa="posting-name"]')?.innerText.trim() ||
        document.querySelector<HTMLElement>('.posting-headline h2')?.innerText.trim() ||
        jobTitle;
    } else if (host.includes("icims")) {
      jobTitle =
        document.querySelector<HTMLElement>('.iCIMS_Header h1')?.innerText.trim() ||
        document.querySelector<HTMLElement>('.job-title')?.innerText.trim() ||
        jobTitle;
    }

    // Generic fallback
    if (jobTitle === "Unknown Job") {
      const titleElement = document.querySelector('h1, h2');
      if (titleElement?.textContent) {
        const titleText = titleElement.textContent.trim();
        if (!titleText.toLowerCase().includes('sorry') &&
            !titleText.toLowerCase().includes('error') &&
            titleText.length > 5) {
          jobTitle = titleText;
        }
      }
      if (jobTitle === "Unknown Job") {
        const pageTitle = document.querySelector('title')?.textContent?.trim();
        if (pageTitle) {
          jobTitle = pageTitle.split('|')[0].split('-')[0].trim();
        }
      }
    }

    chrome.storage.local.get(["savedJobsAnalytics"], (result) => {
      const savedJobs = result.savedJobsAnalytics || [];
      const canonicalUrl = websiteLink.split('?')[0].split('#')[0];

      const existingJob = savedJobs.find((job: any) => {
        const existingCanonical = job.url.split('?')[0].split('#')[0];
        return existingCanonical === canonicalUrl;
      });

      if (existingJob) return;

      const newSavedJob = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        title: jobTitle,
        url: websiteLink,
        dateAdded: new Date().toISOString(),
        status: "Applied",
      };

      savedJobs.push(newSavedJob);
      chrome.storage.local.set({ savedJobsAnalytics: savedJobs });
    });
  }

  // Expose for debugging
  (window as any).detectCareerPage = detectCareerPage;

})();
