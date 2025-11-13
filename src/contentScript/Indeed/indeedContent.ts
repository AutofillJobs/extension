import { saveJobToAnalytics } from "../utils/jobSaver";

(function immediateSmartApplyCapture() {
  if (!window.location.hostname.includes("smartapply.indeed.com")) return;

  const interval = setInterval(() => {
    const hdr = document.querySelector<HTMLElement>('h2#ia-JobHeader-title, .ia-JobHeader-title');
    const headerText = hdr?.innerText.trim();

    if (headerText && headerText !== 'Indeed_job') {
      console.log('[Indeed Auto] Immediate SmartApply header capture:', headerText);
  
      chrome.storage.local.set({ tempJobTitle: headerText });
      clearInterval(interval);
    }
  }, 500);

  setTimeout(() => clearInterval(interval), 5000);
})();

interface UserData {
  Details: {
    fullName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phone: string;
    location: string;
  };

  jobPreferences: {
    expectedCTC: string;
    totalITExperience: string;
  };
  legalAndWorkAuth: {
    authorizedToWorkIn: string;
    needSponsorship: string;
  };
  availability: {
    startDate: string;
  };
}

const domHelpers = {
  /**
   * Waits for a visible HTML element to appear in the DOM.
   * @param selector The CSS selector to find.
   * @param context The document or element to search within.
   * @param timeout The maximum time to wait in milliseconds.
   * @returns A promise that resolves to the found element or null if timed out.
   */
  waitForElement: async (
    selector: string,
    context: Document | HTMLElement = document,
    timeout = 7000
  ): Promise<HTMLElement | null> => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = context.querySelector(selector) as HTMLElement;
      if (element && element.offsetParent !== null) return element;
      await new Promise((r) => setTimeout(r, 250));
    }
    console.warn(
      `[Indeed Auto Apply] waitForElement timed out for selector: ${selector}`
    );
    return null;
  },
  delay: (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms)),
  isDisabled: (el: Element): boolean => {
    const disabledAttr = (el as HTMLElement).getAttribute("disabled");
    const ariaDisabled = (el as HTMLElement).getAttribute("aria-disabled");
    const className = (el as HTMLElement).className || "";
    return (
      disabledAttr !== null ||
      ariaDisabled === "true" ||
      /disabled|is-disabled|btn--disabled/i.test(className)
    );
  },
  clickWithRetry: async (el: HTMLElement, timeout = 6000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (!domHelpers.isDisabled(el)) {
        try {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          await domHelpers.delay(100);
          el.click();
          return true;
        } catch (e) {
          
        }
      }
      await domHelpers.delay(250);
    }
    return false;
  },
};

const log = (message: string) => console.log(`[Indeed Auto Apply] ${message}`);

(function earlyIndeedCapture() {
  const host = window.location.hostname;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search;
  const params = new URLSearchParams(search);
  const jk = params.get('jk') || params.get('jobkey') || params.get('jobid');

  if (!/indeed\.com$/i.test(host)) return;

  if (jk) {
    const captureUrl = `https://${host.includes('indeed.com') ? 'in.' : ''}indeed.com/viewjob?jk=${jk}`;

    chrome.storage.local.get(['savedJobsAnalytics', 'tempJobTitle', 'lastIndeedJobUrl'], res => {
      if (res.tempJobTitle && res.lastIndeedJobUrl) {
        // already captured in this tab
        return;
      }

      // Try multiple selectors to find the job title
      const titleSelectors = [
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
        '.jobsearch-JobInfoHeader h1'
      ];

      let titleFromDoc = null;
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          titleFromDoc = element.textContent?.trim();
          if (titleFromDoc) {
            log(`Found job title using selector "${selector}": ${titleFromDoc}`);
            break;
          }
        }
      }

      if (!titleFromDoc) {
        const metaTitleElement = document.querySelector('meta[property="og:title"], meta[name="title"]');
        if (metaTitleElement) {
          titleFromDoc = metaTitleElement.getAttribute('content')?.trim();
          log(`Found job title from meta tag: ${titleFromDoc}`);
        }
      }


      if (!titleFromDoc) {
        const iframe = document.querySelector('iframe#indeed-apply-widget') as HTMLIFrameElement | null;
        const hdr = iframe?.contentDocument?.querySelector<HTMLElement>('h2#ia-JobHeader-title, .ia-JobHeader-title');
        if (hdr?.innerText.trim()) {
          titleFromDoc = hdr.innerText.trim();
          log(`Found job title from SmartApply iframe header: ${titleFromDoc}`);
        }
      }

      // If still no title, use document title or fallback
      if (!titleFromDoc) {
        titleFromDoc = document.title.split('-')[0]?.trim() ||
          document.title.split('|')[0]?.trim() ||
          `Indeed_job`;
        log(`Using platform fallback job title: ${titleFromDoc}`);
      }

      const data = {
        tempJobTitle: titleFromDoc,
        lastIndeedJobUrl: captureUrl,
        lastIndeedCompanyName: document.querySelector('[data-testid="company-name"], .jobsearch-CompanyInfoContainer a')?.textContent?.trim() || 'Unknown Company',
        tempJobApplyStartTime: Date.now()
      };
      log('Early capture – storing: ' + JSON.stringify(data));
      chrome.storage.local.set(data, () => {
        // also add as Viewed if not present
        saveJobToAnalytics(titleFromDoc, captureUrl, 'Viewed');
      });
    });
  }
})();

// Helper function to check if auto-click is enabled
async function isAutoClickEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(["autoClickToggleState"], (result) => {
      const enabled = result.autoClickToggleState !== false;
      console.log(
        "[Indeed] Auto-click toggle state from storage:",
        result.autoClickToggleState,
        "Resolved to:",
        enabled
      );
      resolve(enabled);
    });
  });
}

async function getApplicationContext(): Promise<Document> {
  if (window.location.hostname.includes("smartapply.indeed.com")) {
    log("Detected 'smartapply' full-page context.");
    return document;
  }
  const iframe = (await domHelpers.waitForElement(
    "iframe#indeed-apply-widget"
  )) as HTMLIFrameElement;
  if (iframe?.contentDocument) {
    log("Detected iFrame widget context.");
    return iframe.contentDocument;
  }
  throw new Error(
    "Could not find Indeed application context (iframe or smartapply page)."
  );
}

async function findActionButton(
  context: Document,
  timeoutMs = 7000
): Promise<HTMLElement | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    // 1) Prefer Mosaic "Continue" buttons by data-testid and visible span text
    const mosaicButtons = Array.from(
      context.querySelectorAll<HTMLButtonElement>("button[data-testid]")
    );
    for (const btn of mosaicButtons) {
      const txt = (btn.textContent || "").trim().toLowerCase();
      const span =
        btn.querySelector("span")?.textContent?.trim().toLowerCase() || "";
      if (txt.includes("continue") || span.includes("continue")) {
        log(`✅ Found Continue button: "${btn.textContent?.trim()}"`);
        return btn as HTMLElement;
      }
    }

    // 2) Generic continue buttons (include disabled; click helper will wait)
    const generalButtons = Array.from(
      context.querySelectorAll<HTMLElement>('button, input[type="submit"]')
    );
    for (const btn of generalButtons) {
      const txt = (btn.textContent || "").trim().toLowerCase();
      const span =
        btn.querySelector("span")?.textContent?.trim().toLowerCase() || "";
      const aria = btn.getAttribute("aria-label")?.toLowerCase() || "";
      if (
        txt.includes("continue") ||
        span.includes("continue") ||
        aria.includes("continue")
      ) {
        log(
          `✅ Found Continue button (general): "${(
            btn.textContent || aria
          ).trim()}"`
        );
        return btn as HTMLElement;
      }
    }

    // 3) Submit buttons
    for (const btn of generalButtons) {
      const txt = (btn.textContent || "").trim().toLowerCase();
      const span =
        btn.querySelector("span")?.textContent?.trim().toLowerCase() || "";
      const aria = btn.getAttribute("aria-label")?.toLowerCase() || "";
      const val = (btn as HTMLInputElement).value?.toLowerCase() || "";
      if (
        txt.includes("submit application") ||
        span.includes("submit application") ||
        aria.includes("submit application") ||
        val.includes("submit application") ||
        (txt.includes("submit") && !txt.includes("submit for")) ||
        (span.includes("submit") && !span.includes("submit for"))
      ) {
        log(`✅ Found Submit button: "${(btn.textContent || val).trim()}"`);
        return btn as HTMLElement;
      }
    }

    await domHelpers.delay(250);
  }
  return null;
}

function isResumeUploadStep(context: Document): boolean {
  const resumeUploadIndicators = [
    'input[type="file"]',
    '[data-testid*="resume"]',
    '[data-testid*="upload"]',
    ".file-upload",
    ".resume-upload",
    '[class*="upload"]',
    '[class*="resume"]',
    '[id*="upload"]',
    '[id*="resume"]',
  ];

  for (const selector of resumeUploadIndicators) {
    if (context.querySelector(selector)) {
      return true;
    }
  }

  const bodyText = context.body?.textContent?.toLowerCase() || "";
  return (
    (bodyText.includes("upload") &&
      (bodyText.includes("resume") || bodyText.includes("cv"))) ||
    bodyText.includes("attach your resume") ||
    bodyText.includes("upload resume") ||
    bodyText.includes("choose file")
  );
}

const indeedKeywordMapping: { [key: string]: string } = {
  "how many years of": "jobPreferences.totalITExperience",
  "experience do you have": "jobPreferences.totalITExperience",
  "desired pay": "jobPreferences.expectedCTC",
  "desired salary": "jobPreferences.expectedCTC",
  "expected salary": "jobPreferences.expectedCTC",
  "legally authorized to work": "legalAndWorkAuth.authorizedToWorkIn",
  "require sponsorship": "legalAndWorkAuth.needSponsorship",
  "earliest start date": "availability.startDate",
  "first name": "Details.firstName",
  "last name": "Details.lastName",
  "phone number": "Details.phone",
  "email address": "Details.email",
};

const indeedRegexPatterns = [
  // Interview availability (free text)
  {
    pattern: /(interview).*(date|time|availability)/i,
    type: "text",
    getAnswer: () => generateInterviewSlots(),
  },
  // Location-based yes/no
  {
    pattern:
      /(are\s*(you|u).*(located|based)|do\s*you\s*live\s*in|are\s*(you|u)\s*in\s+)/i,
    type: "radio",
    getAnswer: (userData: any, q: string) => {
      const details = (userData?.Details || userData) as any;
      const target = (
        q.match(/in\s+([\w\s,\-]+)/i)?.[1] ||
        q.match(/located\s*(in|at)\s*([\w\s,\-]+)/i)?.[2] ||
        ""
      )
        .toLowerCase()
        .trim();

      // If no explicit target found, default to Yes to avoid blocking
      if (!target) return "Yes";

      const haystackParts = [
        details?.city,
        details?.state,
        details?.country,
        details?.location,
        details?.address,
        details?.locality,
      ]
        .filter(Boolean)
        .map((s: string) => String(s).toLowerCase());

      const hay = ` ${haystackParts.join(" ")} `;
      const tokens = target.split(/[\s,\-]+/).filter(Boolean);
      const matched = tokens.some(
        (tok) => hay.includes(` ${tok} `) || hay.includes(tok)
      );

      return matched ? "Yes" : "No";
    },
  },
  {
    pattern: /(first\s*name|given\s*name)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.firstName || "John",
  },
  {
    pattern: /(last\s*name|family\s*name|surname)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.lastName || "Doe",
  },
  {
    pattern: /(full\s*name|complete\s*name|name)/i,
    type: "text",
    getAnswer: (userData: any) =>
      userData?.fullName ||
      `${userData?.firstName || "John"} ${userData?.lastName || "Doe"}`,
  },
  {
    pattern: /(middle\s*name|middle\s*initial)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.middleName || "M",
  },
  {
    pattern: /(preferred\s*name|nick\s*name)/i,
    type: "text",
    getAnswer: (userData: any) =>
      userData?.preferredName || userData?.firstName || "John",
  },
  {
    pattern: /(phone\s*number|telephone|mobile|contact\s*number)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.phoneNumber || "2025550147",
  },
  {
    pattern: /(email\s*address|email)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.email || "john.doe@gmail.com",
  },
  {
    pattern: /(date\s*of\s*birth|birth\s*date|dob)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.DoB || "1990-01-01",
  },
  {
    pattern: /age/i,
    type: "text",
    getAnswer: (userData: any) => userData?.age || "35",
  },
  {
    pattern: /(gender|sex)/i,
    type: "select",
    getAnswer: (userData: any) => userData?.gender || "Male",
  },
  {
    pattern: /(marital\s*status)/i,
    type: "select",
    getAnswer: (userData: any) => userData?.maritalStatus || "Single",
  },
  {
    pattern: /(nationality|country\s*of\s*birth)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.nationality || "American",
  },
  {
    pattern: /(ethnicity|race)/i,
    type: "select",
    getAnswer: (userData: any) => userData?.ethnicity || "Prefer not to answer",
  },

  {
    pattern: /(street\s*address|address\s*line\s*1|address)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.address1 || "123 Main Street",
  },
  {
    pattern: /(address\s*line\s*2|apartment|suite|unit)/i,
    type: "text",
    getAnswer: (userData: any) =>
      userData?.address2 || userData?.apartment || "Suite 4B",
  },
  {
    pattern: /(city|town)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.city || "San Francisco",
  },
  {
    pattern: /(state|province|region)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.state || "California",
  },
  {
    pattern: /(postal\s*code|zip\s*code|zip)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.zip || "941051",
  },
  {
    pattern: /(country)/i,
    type: "select",
    getAnswer: (userData: any) =>
      userData?.country || "United States of America",
  },

  {
    pattern:
      /(highest.*level.*education.*completed|education.*level|degree.*level)/i,
    type: "select",
    getAnswer: (userData: any) => {
      const degree = userData?.degree || "";
      const degreeLower = degree.toLowerCase();

      if (degreeLower.includes("doctorate") || degreeLower.includes("phd"))
        return "Doctorate";
      if (
        degreeLower.includes("master") ||
        degreeLower.includes("mba") ||
        degreeLower.includes("ms ")
      )
        return "Master's degree";
      if (
        degreeLower.includes("bachelor") ||
        degreeLower.includes("be ") ||
        degreeLower.includes("btech") ||
        degreeLower.includes("b.tech") ||
        degreeLower.includes("science")
      )
        return "Bachelor's degree";
      if (degreeLower.includes("associate")) return "Associate degree";
      if (
        degreeLower.includes("diploma") ||
        degreeLower.includes("certificate")
      )
        return "Some college";
      if (degreeLower.includes("high school") || degreeLower.includes("12th"))
        return "High school";

      return "Bachelor's degree";
    },
  },
  {
    pattern: /(college|university|school.*name)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const education = userData?.educationExperiences?.[0];
      return education?.collegeName || "MIT";
    },
  },
  {
    pattern: /(field.*study|major|course.*name)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const education = userData?.educationExperiences?.[0];
      return education?.courseName || education?.field || "Computer Science";
    },
  },
  {
    pattern: /(graduation.*date|completed.*education)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const education = userData?.educationExperiences?.[0];
      return education?.endDate || "2014-06-30";
    },
  },
  {
    pattern: /(gpa|grade|academic.*performance)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const education = userData?.educationExperiences?.[0];
      return education?.grade || "A";
    },
  },

  // Numeric total work experience question
  {
    pattern:
      /(how\s*many\s*years.*total\s*work\s*experience|total\s*work\s*experience)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const currentYear = new Date().getFullYear();
      const startYear = userData?.workExperiences?.[0]?.startDate
        ? new Date(userData.workExperiences[0].startDate).getFullYear()
        : currentYear - 3;
      return Math.max(3, currentYear - startYear).toString();
    },
  },

  {
    pattern: /(years.*experience|work.*experience|professional.*experience)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const currentYear = new Date().getFullYear();
      const startYear = userData?.workExperiences?.[0]?.startDate
        ? new Date(userData.workExperiences[0].startDate).getFullYear()
        : 2020;
      return Math.max(1, currentYear - startYear).toString();
    },
  },
  {
    pattern: /(current.*job.*title|job.*title|position|role)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const work = userData?.workExperiences?.[0];
      return work?.jobTitle || "Software Engineer";
    },
  },
  {
    pattern: /(current.*company|company.*name|employer)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const work = userData?.workExperiences?.[0];
      return work?.companyName || "TechCorp Inc.";
    },
  },
  {
    pattern: /(employment.*start.*date|started.*working)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const work = userData?.workExperiences?.[0];
      return work?.startDate || "2025-06-01";
    },
  },

  {
    pattern:
      /(desired.*salary|expected.*salary|salary.*expectation|compensation)/i,
    type: "text",
    getAnswer: (userData: any) =>
      userData?.expectedSalary || userData?.salaryExpectations || "100000",
  },
  {
    pattern: /(current.*salary|gross.*salary)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.grossSalary || "90000",
  },
  {
    pattern: /(notice.*period|availability|start.*date)/i,
    type: "text",
    getAnswer: (userData: any) =>
      userData?.noticePeriod || userData?.startDate || "2 months",
  },

  {
    pattern: /(work.*authorization|authorized.*work|legal.*work)/i,
    type: "radio",
    getAnswer: (userData: any) =>
      userData?.workAuthorization || userData?.citizenship || "Yes",
  },
  {
    pattern: /(visa.*sponsorship|require.*sponsorship|need.*sponsorship)/i,
    type: "radio",
    getAnswer: (userData: any) =>
      userData?.visaSponsorship || userData?.requiresSponsorship || "No",
  },
  {
    pattern: /(us.*citizen|citizenship|citizen)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.citizenship || "Yes",
  },

  {
    pattern: /(do you have.*valid.*(license|certification|certificate))/i,
    type: "radio",
    getAnswer: (userData: any, questionText: string) => {
      const certMatch = questionText.match(
        /(MS|DNB|MD|MBBS|RN|CPA|PMP|AWS|[A-Z]{2,})/i
      );
      const cert = certMatch ? certMatch[0].toUpperCase() : "";

      const medicalCerts = ["MS", "DNB", "MD", "MBBS", "ENT", "SURGEON"];
      if (medicalCerts.some((mc) => cert.includes(mc))) {
        return "No";
      }

      return "No";
    },
  },

  {
    pattern: /(disability|disabled)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.disability || "No",
  },
  {
    pattern: /(veteran|military.*service|served.*military)/i,
    type: "radio",
    getAnswer: (userData: any) =>
      userData?.veteran || userData?.servedInMilitary || "No",
  },
  {
    pattern: /(willing.*relocate|relocation|relocate)/i,
    type: "radio",
    getAnswer: (userData: any) =>
      userData?.willingToRelocate || userData?.relocation || "Yes",
  },
  {
    pattern: /(hybrid.*schedule|remote.*work|work.*from.*home)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.hybridSchedule || "Yes",
  },
  {
    pattern: /(english.*level|english.*proficiency)/i,
    type: "select",
    getAnswer: (userData: any) => userData?.englishLevel || "Advanced",
  },

  {
    pattern: /(worked.*previously|previous.*employment|employment.*history)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.workedPreviously || "Yes",
  },
  {
    pattern: /(government.*employment|worked.*government)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.governmentEmployment || "No",
  },
  {
    pattern: /(export.*control|export.*restrictions)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.exportControl || "No",
  },
  {
    pattern: /(non.*compete|noncompete|competition.*agreement)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.nonCompete || "No",
  },
  {
    pattern: /(workday.*system|workday.*employee|employee.*relation)/i,
    type: "radio",
    getAnswer: (userData: any) =>
      userData?.workdaySystemUsage || userData?.workdayEmployeeRelation || "No",
  },
  {
    pattern: /(customer.*government|government.*relation)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.customerGovernmentRelation || "No",
  },

  {
    pattern: /(referral|referred.*by|reference)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.hasReferral || "No",
  },
  {
    pattern: /(other.*processes|other.*applications|applying.*elsewhere)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.otherProcesses || "No",
  },

  {
    pattern: /(linkedin|linkedin.*profile)/i,
    type: "text",
    getAnswer: (userData: any) =>
      userData?.linkedinUrl || "https://www.linkedin.com/in/johndoe",
  },
  {
    pattern: /(github|git.*profile)/i,
    type: "text",
    getAnswer: (userData: any) =>
      userData?.githubUrl || "https://www.github.com/johndoe",
  },
  {
    pattern: /(website|portfolio|personal.*site)/i,
    type: "text",
    getAnswer: (userData: any) =>
      userData?.websiteUrl || "https://www.johndoe.com",
  },
  {
    pattern: /(twitter|twitter.*handle)/i,
    type: "text",
    getAnswer: (userData: any) => userData?.twitterUrl || "JohnDoe",
  },

  {
    pattern: /(years.*experience.*(with|in|using))/i,
    type: "text",
    getAnswer: (userData: any, questionText: string) => {
      const skillMatch =
        questionText.match(/with\s+([\w\s\.\-]+?)\?/i) ||
        questionText.match(/in\s+([\w\s\.\-]+?)\?/i) ||
        questionText.match(/using\s+([\w\s\.\-]+?)\?/i);
      const skill = skillMatch ? skillMatch[1].trim().toLowerCase() : "";

      const workExp = userData?.workExperiences || [];
      let hasSkill = false;

      for (const work of workExp) {
        const skills = work.skills || [];
        if (
          skills.some(
            (s: string) =>
              s.toLowerCase().includes(skill) || skill.includes(s.toLowerCase())
          )
        ) {
          hasSkill = true;
          break;
        }
      }

      if (
        hasSkill ||
        [
          "javascript",
          "python",
          "java",
          "react",
          "node",
          "sql",
          "aws",
          "docker",
        ].some((tech) => skill.includes(tech))
      ) {
        return "3";
      }

      return "2";
    },
  },

  {
    pattern:
      /(do you speak english\??|speak.*english|english.*fluency|english.*language.*skills)/i,
    type: "radio",
    getAnswer: () => "Yes",
  },

  {
    pattern: /(acknowledge|agree|confirm|accept)/i,
    type: "radio",
    getAnswer: (userData: any) => userData?.acknowledgment || "Yes",
  },

  // CTC patterns
  {
    pattern: /(current.*ctc|present.*ctc|ctc.*current)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const salary = userData?.grossSalary || userData?.Details?.grossSalary;
      return salary ? salary.replace(/[^0-9]/g, "") : "90000";
    },
  },
  {
    pattern: /(expected.*ctc|ctc.*expectation|desired.*ctc)/i,
    type: "text",
    getAnswer: (userData: any) => {
      const salary =
        userData?.expectedSalary ||
        userData?.Details?.expectedSalary ||
        userData?.salaryExpectations;
      return salary ? salary.replace(/[^0-9]/g, "") : "100000";
    },
  },
  {
    pattern: /\bctc\b(?!.*current)(?!.*expected)/i,
    type: "text",
    getAnswer: (userData: any) => {
      // For generic CTC questions, prefer expected over current
      const expectedSalary =
        userData?.expectedSalary ||
        userData?.Details?.expectedSalary ||
        userData?.salaryExpectations;
      const currentSalary =
        userData?.grossSalary || userData?.Details?.grossSalary;
      const salary = expectedSalary || currentSalary;
      return salary ? salary.replace(/[^0-9]/g, "") : "100000";
    },
  },
];

function getAnswerFromPath(userData: UserData, path: string): any {
  return path
    .split(".")
    .reduce((o: any, k) => (o && o[k] !== undefined ? o[k] : null), userData);
}

async function handleSingleQuestion(
  questionEl: HTMLElement,
  userData: UserData
) {
  const labelEl = questionEl.querySelector(
    ".ia-Question-label, .fast-apply-question-label, label, .question-label"
  );
  if (!labelEl) return;

  const questionText = (labelEl.textContent || "").trim();
  const questionTextLower = questionText.toLowerCase();
  if (!questionText) return;

  log(` Processing question: "${questionText}"`);

  let answer: any = null;
  let questionType = "text";

  for (const regexPattern of indeedRegexPatterns) {
    if (regexPattern.pattern.test(questionText)) {
      answer = regexPattern.getAnswer(userData, questionText);
      questionType = regexPattern.type;
      log(` Matched regex pattern, answer: "${answer}", type: ${questionType}`);
      break;
    }
  }

  if (answer === null) {
    let dataPath: string | null = null;
    for (const keyword in indeedKeywordMapping) {
      if (questionTextLower.includes(keyword)) {
        dataPath = indeedKeywordMapping[keyword];
        break;
      }
    }

    if (dataPath) {
      answer = getAnswerFromPath(userData, dataPath);
      log(` Keyword match "${dataPath}", answer: "${answer}"`);
    }
  }

  if (answer === null) {
    log(` No match found for question: "${questionText}"`);
    return;
  }

  const textInput = questionEl.querySelector(
    'input[type="text"], input[type="email"], input[type="tel"], input[type="number"]'
  ) as HTMLInputElement;
  const selectElement = questionEl.querySelector("select") as HTMLSelectElement;
  const radioButtons = questionEl.querySelectorAll('input[type="radio"]');

  if (selectElement) {
    log(` Filling select dropdown for "${questionText}"`);
    await fillSelectDropdown(selectElement, answer);
  } else if (textInput) {
    log(` Filling text input for "${questionText}"`);
    textInput.value = String(answer);
    textInput.dispatchEvent(new Event("input", { bubbles: true }));
    textInput.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (radioButtons.length > 0) {
    log(` Processing radio buttons for "${questionText}"`);
    for (const radio of Array.from(radioButtons)) {
      const radioLabel = (
        radio.parentElement?.textContent ||
        radio.nextSibling?.textContent ||
        ""
      )
        .trim()
        .toLowerCase();
      if (
        radioLabel === String(answer).toLowerCase() ||
        radioLabel.includes(String(answer).toLowerCase())
      ) {
        log(`Clicking radio button: "${radioLabel}"`);
        (radio as HTMLInputElement).click();
        break;
      }
    }
  }

  await domHelpers.delay(300);
}

async function fillSelectDropdown(
  selectElement: HTMLSelectElement,
  targetValue: string
) {
  const options = Array.from(selectElement.options);

  for (const option of options) {
    const optionText = option.text.trim();
    const optionValue = option.value.trim();

    if (
      optionText.toLowerCase() === targetValue.toLowerCase() ||
      optionValue.toLowerCase() === targetValue.toLowerCase() ||
      optionText.toLowerCase().includes(targetValue.toLowerCase()) ||
      targetValue.toLowerCase().includes(optionText.toLowerCase())
    ) {
      log(` Selecting option: "${optionText}"`);
      selectElement.selectedIndex = option.index;
      selectElement.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
  }

  log(`No matching option found for "${targetValue}" in select dropdown`);
}

// ===== Additive helpers for Indeed Mosaic questions (data-testid based) =====
function findQuestionByText(
  root: ParentNode,
  text: RegExp
): HTMLElement | null {
  const labels = Array.from(
    root.querySelectorAll<HTMLElement>('[data-testid$="-label"]')
  );
  for (const lab of labels) {
    const t = lab.textContent?.trim() || "";
    if (text.test(t)) {
      const container = lab.closest(
        "div.ia-Questions-item"
      ) as HTMLElement | null;
      if (container) return container;
    }
  }
  return null;
}

function dispatchAll(el: HTMLElement) {
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.dispatchEvent(new Event("blur", { bubbles: true }));
}

async function waitForQuestions(context: Document, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (context.querySelector(".ia-Questions")) return;
    await new Promise((r) => setTimeout(r, 150));
  }
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}
function formatISODateLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function generateInterviewSlots(): string {
  const now = new Date();
  const days = 3; // 2-3 dates; we'll provide 3 lines
  const ranges = [
    { start: { h: 10, m: 0 }, end: { h: 11, m: 0 } },
    { start: { h: 14, m: 0 }, end: { h: 15, m: 0 } },
    { start: { h: 17, m: 0 }, end: { h: 18, m: 0 } },
  ];
  const lines: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = formatISODateLocal(d);
    // pick 2 ranges for each date for brevity
    const parts = [0, 1].map((idx) => {
      const r = ranges[(i + idx) % ranges.length];
      const s = `${pad2(r.start.h)}:${pad2(r.start.m)}`;
      const e = `${pad2(r.end.h)}:${pad2(r.end.m)}`;
      return `${s}–${e}`;
    });
    lines.push(`${dateStr}: ${parts.join(", ")}`);
  }
  return lines.join("\n");
}

function normalizeEducationLabel(s: string): string {
  const t = (s || "").toLowerCase();
  if (/doctor|phd|dphil/.test(t)) return "Doctorate";
  if (/master|ms\b|msc\b|ma\b|m\.?tech|mba/.test(t)) return "Master's";
  if (/bachelor|bs\b|ba\b|bsc\b|b\.?tech|be\b/.test(t)) return "Bachelor's";
  if (/diploma/.test(t)) return "Diploma";
  if (/higher\s*secondary|12(th)?/.test(t))
    return "Higher Secondary(12th Pass)";
  if (/secondary|10(th)?/.test(t)) return "Secondary(10th Pass)";
  return "Bachelor's";
}

async function fillSpecificMosaicQuestions(context: Document, userData: any) {
  await waitForQuestions(context, 12000);

  // Years of total work experience
  try {
    const qYears = findQuestionByText(
      context,
      /years of total work experience/i
    );
    if (qYears) {
      const input = qYears.querySelector<HTMLInputElement>(
        'input[data-testid^="input-q_"][data-testid$="-input"]'
      );
      if (input) {
        const details = (userData?.Details || userData) as any;
        // Derive years
        let years: string | number =
          details?.totalITExperience || details?.totalExperience;
        if (years == null) {
          const currentYear = new Date().getFullYear();
          const startYear = userData?.workExperiences?.[0]?.startDate
            ? new Date(userData.workExperiences[0].startDate).getFullYear()
            : currentYear - 3;
          years = Math.max(1, currentYear - startYear); // clamp to at least 1
        }
        const safe = String(years).replace(/[^\d]/g, "").slice(0, 2) || "1";
        input.focus();
        input.value = safe;
        dispatchAll(input);
        log(` Set years of experience to ${safe}`);
      }
    }
  } catch (e) {
    log(`Could not fill years of experience (mosaic): ${(e as Error).message}`);
  }

  // Highest education level
  try {
    const qEdu = findQuestionByText(context, /highest level of education/i);
    if (qEdu) {
      const sel = qEdu.querySelector<HTMLSelectElement>(
        'select[data-testid^="input-q_"][data-testid$="-select"]'
      );
      if (sel) {
        const details = (userData?.Details || userData) as any;
        const desired = normalizeEducationLabel(
          details?.educationLevel ||
          details?.degree ||
          details?.highestEducation ||
          ""
        );
        const options = Array.from(sel.options);
        const exact = options.find(
          (o) => o.label.trim().toLowerCase() === desired.toLowerCase()
        );
        const contains =
          exact ||
          options.find((o) =>
            o.label.toLowerCase().includes(desired.toLowerCase())
          );
        const choice =
          contains ||
          options.find((o) =>
            /bachelor|master|diploma|doctorate|secondary/i.test(o.label)
          ) ||
          options[1];
        if (choice) {
          sel.value = choice.value;
          dispatchAll(sel);
          log(`Set education level to "${choice.label}"`);
        }
      }
    }
  } catch (e) {
    log(`Could not fill education level (mosaic): ${(e as Error).message}`);
  }
}

async function fillMosaicPageIfPresent(context: Document, userData: any) {
  const heading = context.querySelector<HTMLElement>(
    'h1[data-testid="questions-heading"]'
  );
  const text = heading?.textContent?.trim().toLowerCase() || "";
  if (!text.includes("answer these questions from the employer")) return;

  log(
    ' Detected Mosaic questions page: "Answer these questions from the employer"'
  );

  await fillSpecificMosaicQuestions(context, userData);

  const items = Array.from(
    context.querySelectorAll<HTMLElement>("div.ia-Questions-item")
  );
  for (const item of items) {
    const labelEl = item.querySelector<HTMLElement>('[data-testid$="-label"]');
    const qText = labelEl?.textContent?.trim() || "";
    if (!qText) continue;

    if (/interview/i.test(qText) && /(date|time)/i.test(qText)) {
      const textarea = item.querySelector<HTMLTextAreaElement>(
        'textarea[data-testid^="input-q_"][data-testid$="-input"], textarea'
      );
      if (textarea) {
        const answer = generateInterviewSlots();
        textarea.focus();
        textarea.value = answer;
        dispatchAll(textarea);
        log(` Provided interview availability for "${qText}"`);
        continue;
      }
    }

    let answer: any = null;
    let type: "text" | "select" | "radio" = "text";
    for (const rp of indeedRegexPatterns) {
      if (rp.pattern.test(qText)) {
        answer = rp.getAnswer((userData as any).Details || userData, qText);
        type = rp.type as any;
        break;
      }
    }
    if (answer === null) {
      const lower = qText.toLowerCase();
      for (const key in indeedKeywordMapping) {
        if (lower.includes(key)) {
          answer = getAnswerFromPath(
            (userData as any).Details || userData,
            indeedKeywordMapping[key]
          );
          break;
        }
      }
    }
    if (answer === null || answer === undefined) continue;

    const selectEl = item.querySelector<HTMLSelectElement>(
      'select[data-testid^="input-q_"][data-testid$="-select"]'
    );
    const inputEl = item.querySelector<HTMLInputElement>(
      'input[data-testid^="input-q_"][data-testid$="-input"]'
    );
    const textareaEl = item.querySelector<HTMLTextAreaElement>(
      'textarea[data-testid^="input-q_"][data-testid$="-input"], textarea'
    );
    const radios = item.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]'
    );

    if (selectEl) {
      const val = /education|degree/i.test(qText)
        ? normalizeEducationLabel(String(answer))
        : String(answer);
      const options = Array.from(selectEl.options);
      const exact = options.find(
        (o) => o.label.trim().toLowerCase() === val.toLowerCase()
      );
      const contains =
        exact ||
        options.find((o) => o.label.toLowerCase().includes(val.toLowerCase()));
      const choice = contains || options[1];
      if (choice) {
        selectEl.value = choice.value;
        dispatchAll(selectEl);
        log(` Set select for "${qText}" to "${choice.label}"`);
      }
      continue;
    }

    if (textareaEl) {
      const toType = String(answer);
      textareaEl.focus();
      textareaEl.value = toType;
      dispatchAll(textareaEl);
      log(` Set textarea for "${qText}" to "${toType}"`);
      continue;
    }

    if (inputEl) {
      let toType = String(answer);
      if (/year/i.test(qText)) {
        const n = parseInt(toType.replace(/[^\d]/g, ""), 10);
        if (!Number.isNaN(n) && n < 1) toType = "1";
      }
      inputEl.focus();
      inputEl.value = toType;
      dispatchAll(inputEl);
      log(` Set input for "${qText}" to "${toType}"`);
      continue;
    }

    if (radios.length) {
      const target = String(answer).toLowerCase();
      for (const r of Array.from(radios)) {
        const lbl = (r.parentElement?.textContent || "").trim().toLowerCase();
        if (lbl === target || lbl.includes(target)) {
          r.click();
          log(` Selected radio for "${qText}": ${lbl}`);
          break;
        }
      }
    }
  }
}

async function applicationLoop(userData: UserData) {
  let step = 0;
  const maxSteps = 15;
  let resumeStepCompleted = false;

  while (step < maxSteps) {
    step++;
    log(` Processing application step ${step}...`);

    const appContext = await getApplicationContext();

    const isResumeStep = isResumeUploadStep(appContext) || step === 3;
    if (isResumeStep && !resumeStepCompleted) {
      log(
        " Detected resume upload step (Step 3). Completing automation through this step."
      );
      log(
        " Please upload your resume manually, then the automation will continue."
      );

      const questions = appContext.querySelectorAll(
        ".ia-Question, .fast-apply-question"
      );
      if (questions.length > 0) {
        log(
          ` Found ${questions.length} questions on resume upload step. Processing...`
        );
        for (let i = 0; i < questions.length; i++) {
          const question = questions[i] as HTMLElement;
          log(` Processing resume step question ${i + 1}/${questions.length}`);
          await handleSingleQuestion(question, userData);
          await domHelpers.delay(500);
        }
        await fillSpecificMosaicQuestions(appContext, userData);

        log(` Completed filling ${questions.length} questions on resume step.`);
        await domHelpers.delay(1500);
      }

      resumeStepCompleted = true;

      const continueButton = await findActionButton(appContext);
      if (continueButton) {
        const buttonText = (continueButton.textContent || "")
          .trim()
          .toLowerCase();
        if (buttonText.includes("continue")) {
          const autoClickAllowed = await isAutoClickEnabled();
          if (autoClickAllowed) {
            log(" Clicking Continue button on resume upload step.");
            const clicked = await domHelpers.clickWithRetry(
              continueButton as HTMLElement,
              6000
            );
            if (!clicked)
              log(
                "Continue button was disabled or failed to click after retries."
              );
            await domHelpers.delay(2000);
            continue;
          } else {
            log(
              " Auto-click is disabled. Continue button found but not clicked automatically."
            );
            log(" Please click the Continue button manually to proceed.");
            await domHelpers.delay(5000);
            continue;
          }
        }
      }

      log(
        " Continue button not found on resume step. Manual intervention may be needed."
      );
      await domHelpers.delay(5000);
      continue;
    }

    const questions = appContext.querySelectorAll(
      ".ia-Question, .fast-apply-question"
    );
    if (questions.length > 0) {
      log(
        ` Found ${questions.length} questions on this step. Processing each question...`
      );
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i] as HTMLElement;
        log(` Processing question ${i + 1}/${questions.length}`);
        await handleSingleQuestion(question, userData);
        await domHelpers.delay(500);
      }

      // Additive pass for Mosaic questions with data-testid-based widgets
      await fillSpecificMosaicQuestions(appContext, userData);

      log(
        `Completed filling ${questions.length} questions. Waiting for validation...`
      );
      await domHelpers.delay(2000);
    } else {
      const postalInput = appContext.querySelector(
        'input[data-testid="location-fields-postal-code-input"]'
      ) as HTMLInputElement | null;
      const cityInput = appContext.querySelector(
        'input[data-testid="location-fields-locality-input"]'
      ) as HTMLInputElement | null;
      const addressInput = appContext.querySelector(
        'input[data-testid="location-fields-address-input"]'
      ) as HTMLInputElement | null;

      if (postalInput || cityInput || addressInput) {
        log(" Filling location details (postal, city/state, street address)…");
        const {
          postalCode,
          zip,
          pinCode,
          city,
          state,
          locality,
          address,
          street,
        } = (userData as any).Details || (userData as any);

        if (postalInput && (postalCode || zip || pinCode)) {
          postalInput.value = postalCode || zip || pinCode;
          postalInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (cityInput && (city || locality || state)) {
          cityInput.value = city || locality || state;
          cityInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (addressInput && (address || street)) {
          addressInput.value = address || street;
          addressInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      } else {
        log("No standard questions found on this page, likely a review step.");
      }
    }

    await domHelpers.delay(3000);

    log(
      ` Step ${step}: Form filling completed. Waiting for UI updates before looking for buttons...`
    );
    await domHelpers.delay(1000);

    const allButtons = appContext.querySelectorAll(
      'button, input[type="submit"], input[type="button"]'
    );
    log(`Step ${step}: Found ${allButtons.length} total buttons on page`);
    for (let i = 0; i < Math.min(allButtons.length, 5); i++) {
      const btn = allButtons[i] as HTMLElement;
      const btnText = (btn.textContent || "").trim();
      const btnClass = btn.className;
      const btnTestId = btn.getAttribute("data-testid");
      log(
        `Button ${i + 1
        }: "${btnText}" (class: ${btnClass}, testid: ${btnTestId})`
      );
    }

    // If we are on the Mosaic questions page (with the heading), ensure we fill it now
    await fillMosaicPageIfPresent(appContext, userData);

    const actionButton = await findActionButton(appContext);
    if (!actionButton) {
      log(" No Continue or Submit button found on this step.");

      const fallbackButton = await domHelpers.waitForElement(
        'button[type="button"]:not([disabled]), button[type="submit"]:not([disabled])',
        appContext,
        5000
      );
      if (fallbackButton && fallbackButton.textContent?.trim()) {
        const buttonText = fallbackButton.textContent.trim().toLowerCase();
        if (
          buttonText.includes("continue") ||
          buttonText.includes("submit") ||
          buttonText.includes("next")
        ) {
          log(` Found fallback button: "${buttonText}"`);
          const autoClickAllowed = await isAutoClickEnabled();
          if (autoClickAllowed) {
            const clicked = await domHelpers.clickWithRetry(
              fallbackButton as HTMLElement,
              6000
            );
            if (!clicked)
              log(
                "Fallback button was disabled or failed to click after retries."
              );
            if (buttonText.includes("submit")) {
              log(" Final submit button clicked via fallback.");
              // Don't save here - wait for confirmation page
              break;
            }
            await domHelpers.delay(3000);
            continue;
          } else {
            log(
              " Auto-click is disabled. Fallback action button will not be clicked automatically."
            );
            break;
          }
        }
      }
      log(
        " No actionable buttons found. Process may be complete or require manual intervention."
      );
      break;
    }

    const buttonText = (actionButton.textContent || "").toLowerCase();
    const spanText =
      actionButton.querySelector("span")?.textContent?.trim().toLowerCase() ||
      "";
    const displayText = buttonText || spanText;

    const autoClickAllowed = await isAutoClickEnabled();
    if (autoClickAllowed) {
      log(` Clicking button: "${actionButton.textContent?.trim()}"`);
      const clicked = await domHelpers.clickWithRetry(
        actionButton as HTMLElement,
        8000
      );
      if (!clicked)
        log(" Action button was disabled or failed to click after retries.");

      if (
        displayText.includes("submit application") ||
        (displayText.includes("submit") && !displayText.includes("continue"))
      ) {
        log(" Final Submit Application button clicked! Process complete.");
        // Don't save here - wait for confirmation page
        break;
      }

      await domHelpers.delay(3000);
    } else {
      log(
        ` Auto-click is disabled. Action button "${actionButton.textContent?.trim()}" will not be clicked automatically.`
      );
      log(" Please click the button manually to proceed.");
      break;
    }
  }

  if (step >= maxSteps) {
    log(" Reached maximum steps limit. Process may be incomplete.");
  }
}

export default async function automateIndeedApplication(rawData: any) {
  const userData: UserData = rawData?.Details
    ? rawData
    : ((rawData?.data?.details
      ? { ...rawData.data.details }
      : rawData) as UserData);
  log("Starting Indeed Automation Script...");

  log(` UserData structure: ${JSON.stringify(Object.keys(userData), null, 2)}`);
  if ((userData as any).Details) {
    log(
      ` Details keys: ${JSON.stringify(
        Object.keys((userData as any).Details),
        null,
        2
      )}`
    );
  }

  const currentUrl = window.location.href.toLowerCase();
  const currentPath = window.location.pathname.toLowerCase();
  const currentHostname = window.location.hostname.toLowerCase();

  const isJobPage =
    currentPath.includes("/jobs/") ||
    currentPath.includes("/viewjob") ||
    currentPath.includes("/job/") ||
    currentUrl.includes("/jobs?") ||
    (currentHostname.includes("indeed.com") &&
      (currentPath.includes("/view") ||
        document.title.toLowerCase().includes("job") ||
        document.querySelector("[data-jk]") !== null));

  const isApplyPage =
    currentHostname.includes("smartapply.indeed.com") ||
    currentUrl.includes("indeed.com/apply") ||
    currentUrl.includes("smartapply") ||
    document.querySelector("iframe#indeed-apply-widget") !== null;

  // --- SmartApply first-load capture ---
  if (isApplyPage) {
    chrome.storage.local.get(['tempJobTitle', 'lastIndeedJobUrl'], (res) => {
      if (!res.tempJobTitle) {
        const params = new URLSearchParams(window.location.search);
        const jk = params.get('jk') || params.get('jobKey') || params.get('jobId');
        if (jk) {
          const jobUrl = `https://in.indeed.com/viewjob?jk=${jk}`;
          const jobTitle = `Indeed_job`;
          const data = { tempJobTitle: jobTitle, lastIndeedJobUrl: jobUrl };
          console.log('[Indeed] SmartApply first-load capture', data);
          chrome.storage.local.set(data, () => {
            // store fallback viewed status immediately
            saveJobToAnalytics(jobTitle, jobUrl, 'Viewed');
          });
        }
      }
    });
  }

  try {
    log(` Current URL: ${window.location.href}`);
    log(` isJobPage: ${isJobPage}, isApplyPage: ${isApplyPage}`);

    if (isJobPage && !isApplyPage) {
      log(" On a job page. Looking for the 'Apply Now' button...");

      // Debug: Try to find job title with multiple selectors
      const jobTitleSelectors = [
        "h1.jobsearch-JobInfoHeader-title",
        'span[data-testid="jobTitle"]',
        ".jobsearch-JobTitle h1",
        '[data-testid="jobsearch-JobInfoHeader-title"]',
        'h1[data-testid="jobTitle"]',
        ".jobsearch-JobInfoHeader-title span",
        "h1.jobsearch-JobTitle",
        "h1.jobsearch-JobInfoHeader-title-color",
        ".jobsearch-JobInfoHeader-title-container h1",
        '[data-testid="job-title"]',
        '[data-testid="jobTitle-heading"]',
        ".jobsearch-DesktopStickyContainer h1",
        ".jobsearch-JobComponent-embeddedHeader h1"
      ];

      let jobTitle = null;

      // First try direct selectors
      for (const selector of jobTitleSelectors) {
        const element = document.querySelector(selector);
        log(
          `Trying selector "${selector}": ${element ? "FOUND" : "NOT FOUND"}`
        );
        if (element) {
          jobTitle = element.textContent?.trim();
          log(`Job title from "${selector}": "${jobTitle}"`);
          if (jobTitle) break;
        }
      }

      // If no title found, try meta tags
      if (!jobTitle) {
        const metaTitleElement = document.querySelector('meta[property="og:title"], meta[name="title"]');
        if (metaTitleElement) {
          jobTitle = metaTitleElement.getAttribute('content')?.trim();
          log(`Job title from meta tag: "${jobTitle}"`);
        }
      }

      // If still no title, try document title
      if (!jobTitle) {
        jobTitle = document.title.split('-')[0]?.trim() || document.title.split('|')[0]?.trim();
        if (jobTitle) {
          log(`Job title from document title: "${jobTitle}"`);
        }
      }

      // Debug: Try to find company name
      const companySelectors = [
        ".jobsearch-CompanyInfoContainer a",
        '[data-testid="company-name"]',
        ".jobsearch-InlineCompanyRating a",
        "a[data-jk]",
      ];

      let companyName = "Unknown Company";
      for (const selector of companySelectors) {
        const element = document.querySelector(selector);
        log(
          `Trying company selector "${selector}": ${element ? "FOUND" : "NOT FOUND"
          }`
        );
        if (element) {
          const name = element.textContent?.trim();
          if (name) {
            companyName = name;
            log(`Company name from "${selector}": "${companyName}"`);
            break;
          }
        }
      }

      log(
        `Final job title: "${jobTitle || "NONE FOUND"
        }", Company: "${companyName}"`
      );

      // Always store something even if jobTitle could not be extracted
      if (!jobTitle) {
        jobTitle = 'Indeed_job';
        log('Job title not found, using platform fallback "Indeed_job"');
      }

      if (jobTitle && !jobTitle.includes('application has been submitted')) {
        const originalJobUrl = window.location.href;
        // Store both in chrome.storage and sessionStorage for redundancy
        const jobData = {
          tempJobTitle: jobTitle,
          lastIndeedJobUrl: originalJobUrl,
          lastIndeedCompanyName: companyName,
          tempJobApplyStartTime: Date.now(),
        };

        // Also store in sessionStorage as a backup
        try {
          sessionStorage.setItem('indeedJobTitle', jobTitle);
          sessionStorage.setItem('indeedJobUrl', originalJobUrl);
          log('Stored job details in sessionStorage');
        } catch (e) {
          log('Failed to store in sessionStorage: ' + e);
        }

        log(`Capturing job information: ${JSON.stringify(jobData)}`);

        // Store in chrome.storage.local with callback
        chrome.storage.local.set(jobData, () => {
          if (chrome.runtime.lastError) {
            log(
              "Failed to store in chrome.storage: " +
              chrome.runtime.lastError.message
            );
          } else {
            log(`Successfully stored job information in chrome.storage`);
            // Verify storage by reading it back
            chrome.storage.local.get(
              ["tempJobTitle", "lastIndeedJobUrl"],
              (result) => {
                log("Verification - stored data: " + JSON.stringify(result));
              }
            );
          }
        });

        // Also store in sessionStorage as backup
        try {
          sessionStorage.setItem("indeedJobData", JSON.stringify(jobData));
          log("Successfully stored job information in sessionStorage");
        } catch (e) {
          log("Failed to store job data in sessionStorage: " + e);
        }

        // Immediately save to analytics as well (as backup)
        try {
          saveJobToAnalytics(jobTitle, originalJobUrl, "Viewed");
          log('Job immediately saved to analytics with "Viewed" status');
        } catch (e) {
          log(
            "Failed to immediately save to analytics: " + (e as Error).message
          );
        }
      }

      const applyButtonSelectors = [
        "#jobsearch-ViewJobButtons-container button.icl-Button--primary",
        "#indeed-apply-button",
        ".jobsearch-IndeedApplyButton-button",
        "div.jobsearch-IndeedApplyButton-contentWrapper > span.jobsearch-IndeedApplyButton-newDesign",
        "button[data-jk][aria-label*='Apply']",
        "button:contains('Apply now')",
        "a[href*='apply']",
        "button[data-testid*='apply']",
        "[data-testid='applyButtonLinkContainer'] button",
        ".apply-button",
        "button.apply",
      ];

      let applyButton: HTMLElement | null = null;

      for (const selector of applyButtonSelectors) {
        log(`Trying selector: ${selector}`);
        if (selector.includes(":contains(")) {
          const buttons = document.querySelectorAll("button");
          for (const btn of Array.from(buttons)) {
            if (
              btn.textContent?.toLowerCase().includes("apply now") ||
              btn.textContent?.toLowerCase().includes("apply")
            ) {
              applyButton = btn as HTMLElement;
              log(
                ` Found Apply button with text: "${btn.textContent?.trim()}"`
              );
              break;
            }
          }
        } else {
          applyButton = await domHelpers.waitForElement(
            selector,
            document,
            3000
          );
        }

        if (applyButton) {
          log(` Found Apply button with selector: ${selector}`);
          break;
        }
      }

      if (!applyButton) {
        log(
          " Could not find Apply Now button with any selector. Checking page content..."
        );

        const pageTitle = document.title;
        const bodyText = document.body.textContent?.substring(0, 500) || "";
        log(` Page title: ${pageTitle}`);
        log(` Page content preview: ${bodyText}`);

        const allButtons = document.querySelectorAll(
          'button, a[role="button"], input[type="submit"]'
        );
        log(` Found ${allButtons.length} total buttons on page`);

        for (const btn of Array.from(allButtons)) {
          const btnText = (
            btn.textContent ||
            btn.getAttribute("aria-label") ||
            ""
          ).toLowerCase();
          if (btnText.includes("apply")) {
            log(` Potential apply button found: "${btnText}" (${btn.tagName})`);
            applyButton = btn as HTMLElement;
            break;
          }
        }

        if (!applyButton) {
          throw new Error(
            'Could not find the "Apply Now" button. This job might not be directly applicable on Indeed or the page structure has changed.'
          );
        }
      }

      log(
        ` Attempting to click Apply button: "${applyButton.textContent?.trim()}"`
      );
      applyButton.scrollIntoView({ behavior: "smooth", block: "center" });
      await domHelpers.delay(500);
      const clicked = await domHelpers.clickWithRetry(
        applyButton as HTMLElement,
        6000
      );
      if (!clicked)
        log("Apply Now button was disabled or failed to click after retries.");
      log(" Clicked 'Apply Now'. Waiting for the application form to load...");
      await domHelpers.delay(3000);
    }

    log("Proceeding to application form...");

    // FALLBACK: If we're in the application process, try to capture job info from current context
    if (isApplyPage) {
      log(
        "On application page - attempting to capture job information as fallback..."
      );

      // Try to get job title from various sources during application
      let fallbackJobTitle: any = null;
      let fallbackJobUrl = window.location.href;

      // Check if we have stored info from previous page
      chrome.storage.local.get(
        ["tempJobTitle", "lastIndeedJobUrl"],
        (result) => {
          log(
            "Checking existing storage during application: " +
            JSON.stringify(result)
          );
          if (!result.tempJobTitle) {
            log(
              "No stored job title found, attempting to extract from application page..."
            );

            // Try to extract from application context or URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const jobId = urlParams.get("jk") || urlParams.get("jobKey");

            if (jobId) {
              fallbackJobTitle = `Indeed_job`;
              fallbackJobUrl = `https://www.indeed.com/viewjob?jk=${jobId}`;

              const fallbackData = {
                tempJobTitle: fallbackJobTitle,
                lastIndeedJobUrl: fallbackJobUrl,
                lastIndeedCompanyName: "Unknown Company",
                tempJobApplyStartTime: Date.now(),
                isFallback: true,
              };

              log("Storing fallback job data: " + JSON.stringify(fallbackData));
              chrome.storage.local.set(fallbackData, () => {
                if (chrome.runtime.lastError) {
                  log(
                    "Failed to store fallback data: " +
                    chrome.runtime.lastError.message
                  );
                } else {
                  log("Successfully stored fallback job data");
                  // Immediately save to analytics as well
                  saveJobToAnalytics(
                    fallbackJobTitle,
                    fallbackJobUrl,
                    "Applied"
                  );
                }
              });
            }
          }
        }
      );
    }

    const details = (userData as any).Details || userData;
    if (details.fullName && !details.firstName) {
      console.log("full Name is " + details.fullName);
      const nameParts = details.fullName.split(" ");
      details.firstName = nameParts[0];
      details.lastName = nameParts.slice(1).join(" ");
    }

    if (isApplyPage) {
      // Set up success detection observer
      const observer = new MutationObserver((mutations, obs) => {
        // Check for various success indicators
        const successIndicators = [
          '[data-gnav-element-name="GNAVConfirmation"]',
          '.ia-continueButton',
          '.ia-PostApply',
          '[data-testid="success-message"]',
          '.indeed-apply-confirmation',
          '.indeed-apply-success',
          '.indeed-apply-thank-you',
          '[data-testid="post-apply-confirmation"]',
          '.post-apply-success',
          '.application-success',
          '.success-message',
          '.confirmation-message'
        ];

        const successIndicator = successIndicators.some(selector =>
          document.querySelector(selector)
        );

        const successText = document.body.textContent?.toLowerCase() || '';
        const textIndicators = [
          'application submitted',
          'successfully submitted',
          'thank you for applying',
          'application complete',
          'successfully applied'
        ];

        const hasSuccessText = textIndicators.some(text =>
          successText.includes(text)
        );

        if (successIndicator || hasSuccessText) {
          obs.disconnect();
          log('Success indicator found. Saving job application...');

          // Try to get job details from multiple sources
          chrome.storage.local.get(['tempJobTitle', 'lastIndeedJobUrl', 'savedJobsAnalytics'], async (result) => {
            let jobTitle = result.tempJobTitle;
            let jobUrl = result.lastIndeedJobUrl;

            // Clean up the URL if it has extra quotes or spaces
            if (jobUrl) {
              jobUrl = jobUrl.trim().replace(/['"]/g, '');
              if (jobUrl.endsWith(',')) {
                jobUrl = jobUrl.slice(0, -1);
              }
              log(`Cleaned job URL: ${jobUrl}`);
            }

            // If no stored title, try multiple selectors
            if (!jobTitle) {
              const titleSelectors = [
                "h1.jobsearch-JobInfoHeader-title",
                'span[data-testid="jobTitle"]',
                ".jobsearch-JobTitle h1",
                '[data-testid="jobsearch-JobInfoHeader-title"]',
                'h1[data-testid="jobTitle"]',
                ".jobsearch-JobInfoHeader-title span",
                "h1.jobsearch-JobTitle",
                "h1.jobsearch-JobInfoHeader-title-color",
                ".jobsearch-JobInfoHeader-title-container h1",
                '[data-testid="job-title"]',
                '[data-testid="jobTitle-heading"]',
                ".jobsearch-DesktopStickyContainer h1",
                ".jobsearch-JobComponent-embeddedHeader h1",
                "h1, h2"
              ];

              for (const selector of titleSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  jobTitle = element.textContent?.trim();
                  if (jobTitle) {
                    log(`Found job title using selector "${selector}": ${jobTitle}`);
                    break;
                  }
                }
              }

              // If still no title, try meta tags
              if (!jobTitle) {
                const metaTitleElement = document.querySelector('meta[property="og:title"], meta[name="title"]');
                if (metaTitleElement) {
                  jobTitle = metaTitleElement.getAttribute('content')?.trim();
                  log(`Found job title from meta tag: ${jobTitle}`);
                }
              }
            }

            // If no stored URL or invalid URL, try to get from page
            if (!jobUrl || jobUrl.includes('undefined')) {
              const urlParams = new URLSearchParams(window.location.search);
              const jk = urlParams.get('jk') || urlParams.get('jobKey');
              if (jk) {
                jobUrl = `https://in.indeed.com/viewjob?jk=${jk}`;
                log(`Constructed job URL from params: ${jobUrl}`);
              }
            }

            // Get the current job title and URL from the page
            if (!jobTitle || jobTitle.includes('application has been submitted')) {
              chrome.storage.local.get(['tempJobTitle', 'lastIndeedJobUrl'], (result) => {
                jobTitle = result.tempJobTitle;
                jobUrl = result.lastIndeedJobUrl || window.location.href;

                if (!jobTitle || jobTitle.includes('application has been submitted')) {
                  // If still no title, try to get it from the current page
                  const jk = new URL(jobUrl).searchParams.get('jk');
                  log(`Attempting to fetch job details for jk: ${jk}`);

                  if (!jk) {
                    log(`No job ID found in URL: ${jobUrl}`);
                    jobTitle = `Indeed Job (Unknown)`;
                  } else {
                    // Try to get the job title from the current page first
                    const currentPageSelectors = [
                      '[data-testid="jobsearch-JobInfoHeader-title"]',
                      '[data-testid="jobTitle"]',
                      '[data-testid="job-title"]',
                      '[data-testid="jobTitle-heading"]',
                      'h1.jobsearch-JobInfoHeader-title',
                      'h1.jobsearch-JobInfoHeader-title-color',
                      '.jobsearch-JobInfoHeader-title',
                      '.jobsearch-JobInfoHeader-title-container h1'
                    ];

                    // Try to find the title in the current page first
                    for (const selector of currentPageSelectors) {
                      const element = document.querySelector(selector);
                      if (element) {
                        const title = element.textContent?.trim();
                        if (title && !title.includes('application has been submitted')) {
                          jobTitle = title;
                          log(`Found job title from current page: ${jobTitle}`);
                          break;
                        }
                      }
                    }

                    // If still no title, fetch it from the job page
                    if (!jobTitle || jobTitle.includes('application has been submitted')) {
                      log(`Fetching job details for jk: ${jk}`);
                      fetch(`https://in.indeed.com/viewjob?jk=${jk}`)
                        .then(response => response.text())
                        .then(html => {
                          const parser = new DOMParser();
                          const doc = parser.parseFromString(html, 'text/html');

                          // Try meta tags first
                          const metaTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
                            || doc.querySelector('meta[name="title"]')?.getAttribute('content');

                          if (metaTitle && !metaTitle.includes('application has been submitted')) {
                            jobTitle = metaTitle;
                            log(`Found job title from meta tags: ${jobTitle}`);
                          } else {
                            // Try DOM selectors
                            for (const selector of currentPageSelectors) {
                              const element = doc.querySelector(selector);
                              if (element) {
                                const title = element.textContent?.trim();
                                if (title && !title.includes('application has been submitted')) {
                                  jobTitle = title;
                                  log(`Found job title from fetched page: ${jobTitle}`);
                                  break;
                                }
                              }
                            }
                          }

                          // If still no title, use platform-specific fallback
                          if (!jobTitle || jobTitle.includes('application has been submitted')) {
                            jobTitle = `Indeed_job`;
                            log(`Using platform fallback title: ${jobTitle}`);
                          }
                        })
                        .catch(error => {
                          log(`Error fetching job details: ${error}`);
                          jobTitle = `Indeed_job`;
                          log(`Using platform fallback title after error: ${jobTitle}`);
                        });
                    }
                  }
                }
              });
            }

            if (!jobUrl) {
              jobUrl = window.location.href;
              log(`Using current URL as fallback: ${jobUrl}`);
            }

            // Save the job details to analytics
            if (jobTitle && jobUrl) {
              log(`Saving job to analytics - Title: ${jobTitle}, URL: ${jobUrl}`);
              saveJobToAnalytics(jobTitle, jobUrl, 'Applied');
            } else {
              log('Missing job details for analytics save');
            }

            // Always attempt to save, even with fallback data
            try {
              const titleParam = jobTitle && !jobTitle.startsWith('Unknown') && !/Indeed_job/i.test(jobTitle) ? jobTitle : undefined;
              await saveJobToAnalytics(titleParam, jobUrl, 'Applied');
              log('Successfully saved job application to analytics');

              // Clear temporary storage after successful save (delayed to allow multiple applications)
              setTimeout(() => {
                chrome.storage.local.remove([
                  'tempJobTitle',
                  'lastIndeedJobUrl',
                  'lastIndeedCompanyName',
                  'tempJobApplyStartTime'
                ], () => {
                  log('Cleared temporary storage after successful save (delayed)');
                });
              }, 5000); // 5 second delay
            } catch (error) {
              log('Error saving job application: ' + error);
            }
          });
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      const appContext = await getApplicationContext();

      const firstNameInput = await domHelpers.waitForElement(
        'input[data-testid="name-fields-first-name-input"]',
        appContext,
        5000
      );
      if (firstNameInput) {
        log(
          "Refilling Indeed form – contact-info step detected. Populating fields…"
        );
        const lastNameInput = appContext.querySelector(
          'input[data-testid="name-fields-last-name-input"]'
        ) as HTMLInputElement | null;
        const phoneInput = appContext.querySelector(
          'input[name="phone"], input[aria-label="Type phone number"]'
        ) as HTMLInputElement | null;

        if (firstNameInput && details.firstName) {
          (firstNameInput as HTMLInputElement).value = details.firstName;
          firstNameInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        if (lastNameInput && details.lastName) {
          lastNameInput.value = details.lastName;
          lastNameInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
        const phoneVal = (details.phoneNumber || details.phone || "").replace(
          /[^0-9]/g,
          ""
        );
        if (phoneInput && phoneVal) {
          phoneInput.value = phoneVal;
          phoneInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }

    await applicationLoop(userData);
    await domHelpers.delay(4000);

    const finalContext = await getApplicationContext();
    const confirmationHeader = await domHelpers.waitForElement(
      ".ia-PostApply-header",
      finalContext
    );
    if (confirmationHeader) {
      log(" Success! Application submitted. Confirmation page detected.");

      // Debug: Check all storage
      log("=== DEBUG: Checking all storage ===");
      chrome.storage.local.get(null, (allData) => {
        log(
          "All chrome.storage.local data: " + JSON.stringify(allData, null, 2)
        );
      });

      try {
        const sessionData = sessionStorage.getItem("indeedJobData");
        log("SessionStorage data: " + sessionData);
      } catch (e) {
        log("SessionStorage error: " + e);
      }

      try {
        // First try to get data from chrome.storage.local
        chrome.storage.local.get(
          [
            "tempJobTitle",
            "lastIndeedJobUrl",
            "lastIndeedCompanyName",
            "tempJobApplyStartTime",
          ],
          async (result) => {
            log(
              "Retrieved from chrome.storage: " +
              JSON.stringify(result, null, 2)
            );

            let jobTitle = result.tempJobTitle;
            let jobUrl = result.lastIndeedJobUrl;
            let companyName = result.lastIndeedCompanyName;

            // Check if we're on a confirmation page and jobTitle contains confirmation text
            if (jobTitle && (
              jobTitle.toLowerCase().includes("application has been submitted") ||
              jobTitle.toLowerCase().includes("application submitted") ||
              jobTitle.toLowerCase().includes("thank you") ||
              jobTitle.toLowerCase().includes("confirmation") ||
              jobTitle.toLowerCase().includes("applied successfully")
            )) {
              log(`Detected confirmation page title, using platform fallback`);
              jobTitle = "Indeed_job";
            }

            // If not found in chrome.storage, try sessionStorage
            if (!jobTitle || !jobUrl) {
              try {
                const sessionData = sessionStorage.getItem("indeedJobData");
                log("Checking sessionStorage: " + sessionData);
                if (sessionData) {
                  const parsedData = JSON.parse(sessionData);
                  jobTitle = parsedData.tempJobTitle || jobTitle;
                  jobUrl = parsedData.lastIndeedJobUrl || jobUrl;
                  companyName = parsedData.lastIndeedCompanyName || companyName;
                  log("Retrieved job data from sessionStorage backup");
                  
                  // Check if sessionStorage jobTitle contains confirmation text
                  if (jobTitle && (
                    jobTitle.toLowerCase().includes("application has been submitted") ||
                    jobTitle.toLowerCase().includes("application submitted") ||
                    jobTitle.toLowerCase().includes("thank you") ||
                    jobTitle.toLowerCase().includes("confirmation") ||
                    jobTitle.toLowerCase().includes("applied successfully")
                  )) {
                    log(`Detected confirmation page title in sessionStorage, using platform fallback`);
                    jobTitle = "Indeed_job";
                  }
                }
              } catch (e) {
                log("Failed to retrieve from sessionStorage: " + e);
              }
            }

            // Simply save the job as Applied - don't try to update previous entries
            if (jobTitle && jobUrl) {
              log(
                `Saving job as Applied: ${jobTitle} - ${jobUrl}`
              );
              log(`Attempting to save new Indeed job: ${jobTitle}`);
              await saveJobToAnalytics(jobTitle, jobUrl, "Applied");
              log("Job saved as Applied in analytics.");

              // Clear all temporary storage after a delay to allow for multiple job applications
              setTimeout(() => {
                chrome.storage.local.remove([
                  "tempJobTitle",
                  "lastIndeedJobUrl", 
                  "lastIndeedCompanyName",
                  "tempJobApplyStartTime",
                ], () => {
                  log('Cleared temporary storage after delay for next job application');
                });
                try {
                  sessionStorage.removeItem("indeedJobData");
                } catch (e) { }
              }, 5000); // 5 second delay to allow user to navigate to next job
            } else {
              log("Could not find job information for analytics.");
              log(
                `Available data - Title: ${jobTitle || "none"}, URL: ${jobUrl || "none"
                }, Company: ${companyName || "none"}`
              );
            }
          }
        );
      } catch (e) {
        log("Failed to save job to analytics: " + (e as Error).message);
      }
    } else {
      log(
        " Process finished, but could not confirm submission. Please check manually."
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    log(` Application failed: ${message}`);
    throw error;
  }
}