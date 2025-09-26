
interface SavedJob {
  id: string;
  title: string;
  url: string;
  dateAdded: string;
  status?: string;
}

function canonicalUrl(raw: string): string {
  try {
    const urlObj = new URL(raw);
    urlObj.hash = "";

    urlObj.search = "";

    if (/indeed\.com$/i.test(urlObj.hostname)) {
      const jk = new URL(raw).searchParams.get("jk");
      if (jk) {
        urlObj.pathname = "/viewjob";
        urlObj.search = `?jk=${jk}`;
      }
    }
    return urlObj.toString();
  } catch (_) {
    return raw;
  }
}

async function cleanupSmartApplyUrls(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["savedJobsAnalytics"], (result) => {
      const savedJobs: SavedJob[] = result.savedJobsAnalytics || [];
      const updatedJobs = savedJobs.filter(
        (job) => !job.url.includes("smartapply.indeed.com")
      );

      if (updatedJobs.length !== savedJobs.length) {
        chrome.storage.local.set({ savedJobsAnalytics: updatedJobs }, () => {
          console.log("[JobSaver] Cleaned up SmartApply URLs from storage");
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

export async function saveJobToAnalytics(
  jobTitle?: string,
  jobUrl?: string,
  status: string = "Applied"
): Promise<boolean> {
  return new Promise(async (resolve) => {
    
    let websiteLink = jobUrl || window.location.href;
    let finalJobTitle = jobTitle || "Unknown Job";

    if (websiteLink.includes("smartapply.indeed.com")) {
      const result = await new Promise<{ lastIndeedJobUrl?: string }>(
        (resolve) => chrome.storage.local.get(["lastIndeedJobUrl"], resolve)
      );

      if (result.lastIndeedJobUrl) {
        websiteLink = result.lastIndeedJobUrl;
        console.log("[JobSaver] Using original job URL:", websiteLink);
      } else {
        console.log("[JobSaver] No original job URL found, saving with SmartApply URL");
      }
    }

    if (!jobTitle || jobTitle === "Unknown Job" || jobTitle.trim() === "" || jobTitle === "Indeed_job") {
      
      chrome.storage.local.get(["tempJobTitle"], (tempResult) => {
        if (tempResult.tempJobTitle && tempResult.tempJobTitle.trim() !== "") {
          finalJobTitle = tempResult.tempJobTitle;
          console.log("[JobSaver] Using stored job title:", finalJobTitle);
          
          console.log("[JobSaver] Storage retained for caller management");
        } else {
       
          if (window.location.hostname.includes("linkedin.com")) {
            finalJobTitle = extractLinkedInJobTitle() || finalJobTitle;
            if (finalJobTitle === "LinkedIn_job") {
              console.log("[JobSaver] Using LinkedIn platform fallback title");
            }
          } else if (window.location.hostname.includes("indeed.com")) {
            finalJobTitle = extractIndeedJobTitle() || finalJobTitle;
            if (finalJobTitle === "Indeed_job") {
              console.log("[JobSaver] Using Indeed platform fallback title");
            }
          } else {
            finalJobTitle = extractGenericJobTitle() || finalJobTitle;
            if (finalJobTitle === "Job_posting") {
              console.log("[JobSaver] Using generic platform fallback title");
            }
          }
        }

        performSave();
      });
      return;
    }

   
    performSave();
    function performSave() {
      console.log("[JobSaver] Saving job to analytics:", {
        title: finalJobTitle,
        url: websiteLink,
        status,
      });

      chrome.storage.local.get(["savedJobsAnalytics"], (result) => {
        const savedJobs: SavedJob[] = result.savedJobsAnalytics || [];
        const jobId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);

        const newSavedJob: SavedJob = {
          id: jobId,
          title: finalJobTitle,
          url: canonicalUrl(websiteLink),
          dateAdded: new Date().toISOString(),
          status: status,
        };

        const cleanCurrentUrl = canonicalUrl(websiteLink);
        const existingJobIndex = savedJobs.findIndex((job: SavedJob) => {
          const cleanExistingUrl = canonicalUrl(job.url);
         
          return cleanExistingUrl === cleanCurrentUrl && job.title === finalJobTitle;
        });


        if (websiteLink.includes('indeed.com')) {
          savedJobs.push(newSavedJob);
          console.log('[JobSaver] Added new Indeed job entry:', finalJobTitle);
        } else if (existingJobIndex !== -1) {
          const existingJob = savedJobs[existingJobIndex];
         
          if (websiteLink.includes('linkedin.com')) {
            savedJobs.push(newSavedJob);
            console.log('[JobSaver] Added new LinkedIn job entry:', finalJobTitle);
          } else if (status === 'Applied' && existingJob.status !== 'Applied') {
        
            savedJobs.push(newSavedJob);
            console.log('[JobSaver] Added new job entry with different status:', finalJobTitle);
          }
        } else {
          
          savedJobs.push(newSavedJob);
          console.log('[JobSaver] Added new job to analytics:', finalJobTitle);
        }
        chrome.storage.local.set({ savedJobsAnalytics: savedJobs }, () => {
          if (chrome.runtime.lastError) {
            console.error(
              "[JobSaver] Error saving job:",
              chrome.runtime.lastError
            );
            resolve(false);
          } else {
            console.log("[JobSaver] Job saved to analytics storage:", newSavedJob);
            
            if (status === 'Applied') {
              chrome.storage.local.remove(['tempJobTitle']);
            }
            console.log('[JobSaver] Successfully saved job analytics data');
            console.log(`[JobSaver] Total jobs in analytics: ${savedJobs.length}`);
            console.log(`[JobSaver] Latest job added:`, savedJobs[savedJobs.length - 1]);
            resolve(true);
          }
        });
      });
    }
    
  });
}

function extractLinkedInJobTitle(): string | null {
  const selectors = [
    "h1.top-card-layout__title",
    "h2.top-card-layout__title",
    ".job-details-jobs-unified-top-card__job-title h1",
    ".job-details-jobs-unified-top-card__job-title a",
    ".jobs-unified-top-card__job-title h1",
    ".jobs-unified-top-card__job-title a",
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element?.innerText?.trim()) {
      return element.innerText.trim();
    }
  }

  
  const pageTitle = document.querySelector("title")?.textContent?.trim();
  if (pageTitle && !pageTitle.toLowerCase().includes("sorry")) {
    if (
      pageTitle.toLowerCase().includes("application has been submitted") ||
      pageTitle.toLowerCase().includes("application submitted") ||
      pageTitle.toLowerCase().includes("thank you") ||
      pageTitle.toLowerCase().includes("confirmation") ||
      pageTitle.toLowerCase().includes("applied successfully")
    ) {
      console.log(`[JobSaver] Page title indicates confirmation page, using platform fallback`);
      return "LinkedIn_job";
    }
    
    return pageTitle
      .replace(/\|.*$/, "")
      .replace(/\s*-\s*LinkedIn.*$/, "")
      .trim();
  }

  return "LinkedIn_job";
}


function extractIndeedJobTitle(): string | null {
  console.log("[JobSaver] Starting Indeed job title extraction...");
  
  
  const selectors = [
  
    '[data-testid="jobsearch-JobInfoHeader-title"]',
    '[data-testid="jobTitle"]',
    '[data-testid="job-title"]',
    '[data-testid="jobTitle-heading"]',
    'h1.jobsearch-JobInfoHeader-title',
    'h1.jobsearch-JobInfoHeader-title-color',
    '.jobsearch-JobInfoHeader-title',
    '.jobsearch-JobInfoHeader-title-container h1',
    '.jobsearch-DesktopStickyContainer h1',
    '.jobsearch-JobComponent-embeddedHeader h1',
    '.jobsearch-JobTitle h1',
    'h1.jobsearch-JobTitle',
    '.icl-u-xs-mb--xs h1',
    '.jobsearch-JobInfoHeader h1',
    'h1.top-card-layout__title',
    'h2.top-card-layout__title',
    '.job-details-jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title h1',
    '.jobs-unified-top-card__job-title a',
    // Additional selectors
    "h1.jobsearch-JobInfoHeader-title",
    ".jobsearch-JobInfoHeader-title span",
    'h1[data-testid="jobTitle"]',
    ".jobsearch-CompanyInfoWithoutHeaderImage h1",
    'span[data-testid="jobTitle"]',
    ".jobsearch-JobInfoHeader-title",
    "h1.jobsearch-JobTitle",
    ".jobsearch-JobTitle h1",
    // For Indeed smartapply pages
    ".ia-JobHeader-title",
    ".ia-JobTitle",
    '.ia-JobHeader-title h2',
    '.ia-JobTitle h2',
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element?.innerText?.trim()) {
      console.log(`[JobSaver] Found job title using selector "${selector}": ${element.innerText.trim()}`);
      return element.innerText.trim();
    }
   
    if (element?.textContent?.trim()) {
      console.log(`[JobSaver] Found job title using selector "${selector}" (textContent): ${element.textContent.trim()}`);
      return element.textContent.trim();
    }
  }

 
  if (window.location.hostname.includes("smartapply.indeed.com")) {
    console.log("[JobSaver] Trying iframe extraction for smartapply...");
    const iframe = document.querySelector(
      "iframe#indeed-apply-widget"
    ) as HTMLIFrameElement;
    if (iframe?.contentDocument) {
      for (const selector of selectors) {
        const element =
          iframe.contentDocument.querySelector<HTMLElement>(selector);
        if (element?.innerText?.trim()) {
          console.log(`[JobSaver] Found job title in iframe using selector "${selector}": ${element.innerText.trim()}`);
          return element.innerText.trim();
        }
      }
    }
  }

  const metaTitleElement = document.querySelector('meta[property="og:title"], meta[name="title"]');
  if (metaTitleElement) {
    const metaTitle = metaTitleElement.getAttribute('content')?.trim();
    if (metaTitle) {
      console.log(`[JobSaver] Found job title from meta tag: ${metaTitle}`);
      return metaTitle;
    }
  }

  const pageTitle = document.querySelector("title")?.textContent?.trim();
  if (pageTitle && !pageTitle.toLowerCase().includes("indeed")) {
    const cleanTitle = pageTitle
      .replace(/\s*-\s*Indeed.*$/i, "")
      .replace(/\s*\|.*$/g, "")
      .trim();
    if (cleanTitle.length > 5 && cleanTitle.length < 150) {
      console.log(`[JobSaver] Found job title from page title: ${cleanTitle}`);
      return cleanTitle;
    }
  }

  if (pageTitle && (
    pageTitle.toLowerCase().includes("application has been submitted") ||
    pageTitle.toLowerCase().includes("application submitted") ||
    pageTitle.toLowerCase().includes("thank you") ||
    pageTitle.toLowerCase().includes("confirmation") ||
    pageTitle.toLowerCase().includes("applied successfully")
  )) {
    console.log(`[JobSaver] Page title indicates confirmation page, using platform fallback`);
    return "Indeed_job";
  }

  if (pageTitle) {
    const titleFromDoc = pageTitle.split('-')[0]?.trim() || pageTitle.split('|')[0]?.trim();
    if (titleFromDoc && titleFromDoc.length > 5 && titleFromDoc.length < 150) {
      console.log(`[JobSaver] Found job title from document title parts: ${titleFromDoc}`);
      return titleFromDoc;
    }
  }

  console.log("[JobSaver] Could not extract job title from Indeed page");
  return "Indeed_job";
}


function extractGenericJobTitle(): string | null {
  
  const selectors = [
    "h1",
    "h2",
    ".job-title",
    ".position-title",
    '[data-test="job-title"]',
    '[data-automation-id="jobPostingHeader"] h1',
  ];

  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element?.textContent) {
      const titleText = element.textContent.trim();
  
      if (
        !titleText.toLowerCase().includes("sorry") &&
        !titleText.toLowerCase().includes("error") &&
        !titleText.toLowerCase().includes("not supported") &&
        titleText.length > 5 &&
        titleText.length < 150
      ) {
        return titleText;
      }
    }
  }

  return "Job_posting";
}

export function logJobSaver(message: string): void {
  console.log(`[JobSaver] ${message}`);
}

