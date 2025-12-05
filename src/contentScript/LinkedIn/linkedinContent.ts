import { saveJobToAnalytics } from "../utils/jobSaver";

interface UserData {
  address1?: string;
  altEmail?: string;
  city?: string;
  country?: string;
  degree?: string;
  disability?: string;
  email?: string;
  ethnicity?: string;
  expectedSalary?: string;
  field?: string;
  firstName?: string;
  gender?: string;
  githubUrl?: string;
  grossSalary?: string;
  lastName?: string;
  linkedinUrl?: string;
  maritalStatus?: string;
  noticePeriod?: string;
  phoneNumber?: string;
  prefix?: string;
  servedInMilitary?: string;
  skills?: string;
  state?: string;
  street?: string;
  summary?: string;
  twitterUrl?: string;
  veteran?: string;
  visaSponsorship?: string;
  workAuthorization?: string;
  workedPreviously?: string;
  zip?: string;
  educationExperiences?: any[];
  projectExperiences?: any[];
  workExperiences?: any[];
  fullName?: string;
  [key: string]: any;
}

const domHelpers = {
  waitForElement: async (
    selectors: string | string[],
    timeout = 7000
  ): Promise<HTMLElement | null> => {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      for (const selector of selectorArray) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) return element;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    console.warn(`waitForElement timed out for selectors: ${selectorArray.join(', ')}`);
    return null;
  },
  isVisible: (element: HTMLElement): boolean => {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
  },
  delay: (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms)),
};

async function findEasyApplyButton(): Promise<HTMLElement | null> {
  const selectors = [".jobs-apply-button--top-card button", "#jobs-apply-button-id", ".jobs-apply-button"];
  return domHelpers.waitForElement(selectors);
}

async function waitForApplicationModal(): Promise<HTMLElement | null> {
  const selectors = [".jobs-easy-apply-modal", ".jobs-easy-apply-content", ".jobs-apply-form"];
  return domHelpers.waitForElement(selectors, 10000);
}

async function findNextOrSubmitButton(): Promise<HTMLButtonElement | null> {
  const buttonSelectors = [
    'button[aria-label*="Continue to next step"]',
    'button[aria-label*="Review your application"]',
    'button[aria-label*="Submit application"]',
    'button[aria-label*="Next"]',
    'button[aria-label*="Continue"]',
    'button[aria-label*="Review"]',
    'button[aria-label*="Submit"]',
    'button[data-control-name="continue_unify"]',
  ];
  for (const selector of buttonSelectors) {
    const button = document.querySelector(selector) as HTMLButtonElement;
    if (button && domHelpers.isVisible(button) && !button.disabled) {
      return button;
    }
  }
  return null;
}

async function closeSuccessModal(): Promise<void> {

  const jobTitle = document.querySelector('.jobs-unified-top-card__job-title')?.textContent?.trim();
  const jobUrl = window.location.href;
  await saveJobToAnalytics(jobTitle, jobUrl, 'Applied');

  const closeButton = await domHelpers.waitForElement('button[aria-label="Dismiss"], .artdeco-modal__dismiss');
  if (closeButton) {
    closeButton.click();
  }
}

const keywordMapping: { [key: string]: string } = {
  "pronoun": "gender",
  "country of residence": "country",
  "full name": "fullName",
  "first name": "firstName",
  "last name": "lastName",
  "email": "email",
  "phone": "phoneNumber",
  "phone country code": "phoneNumber",
  "location": "address1",
  "authorized to work": "workAuthorization",
  "visa": "visaSponsorship",
  "sponsorship": "visaSponsorship",
  "salary": "expectedSalary",
  "expected ctc": "expectedSalary",
  "expected compensation": "expectedSalary",
  "current salary": "grossSalary",
  "total years of professional experience": "noticePeriod",
  "bachelor's degree": "degree",
  "bachelor": "degree",
  "notice period": "noticePeriod",
  "github": "githubUrl",
  "linkedin": "linkedinUrl",
};

function getNumericAnswer(questionText: string, userData: UserData): string | null {
  const yearsRegex = /how\s+many\s+years[^?]*with\s+(.+?)\s*\?/i;
  const yearsMatch = yearsRegex.exec(questionText);
  if (yearsMatch) {
    const techRaw = yearsMatch[1].replace(/\(.*?\)/g, '').trim().toLowerCase();

    if (userData.skills && userData.skills.toLowerCase().includes(techRaw)) {
      return '3';
    }
    return '3';
  }
  const noticeRegex = /notice\s+period[^\d]*days?/i;
  if (noticeRegex.test(questionText)) {
    const noticeVal = userData.noticePeriod;
    return (noticeVal ? String(noticeVal) : '30').replace(/[^0-9.]/g, '');
  }


  const skillRatingRegex = /(rate.*yourself|rate.*you|proficiency|skill.*level|scale.*of.*1.*to.*10|1.*to.*10.*scale)/i;
  if (skillRatingRegex.test(questionText)) {
    return '7';
  }

  return null;
}

function getAnswerFromPath(userData: UserData, path: string): any {
  return path.split('.').reduce((o: any, k) => (o && o[k] ? o[k] : ""), userData);
}

const log = (message: string) => console.log(`[LinkedIn Auto Apply] ${message}`);

// Helper function to check if auto-click is enabled
async function isAutoClickEnabled(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['autoClickToggleState'], (result) => {
      const enabled = result.autoClickToggleState !== false; // Default to true if not set
      console.log('[LinkedIn] Auto-click toggle state from storage:', result.autoClickToggleState, 'Resolved to:', enabled);
      resolve(enabled);
    });
  });
}

async function simulateUserInput(element: HTMLElement, value: string): Promise<void> {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.blur();
  } else if (element instanceof HTMLSelectElement) {
    const option = Array.from(element.options).find(opt =>
      opt.textContent?.toLowerCase().includes(value.toLowerCase()) ||
      opt.value.toLowerCase().includes(value.toLowerCase())
    );
    if (option) {
      element.value = option.value;
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  await domHelpers.delay(200 + Math.random() * 200);
}

function checkBooleanQuestion(questionText: string, userData: UserData): boolean {
  const text = questionText.toLowerCase();

  // 1. Degree check
  if (text.includes("bachelor") || text.includes("degree") || text.includes("master") || text.includes("phd")) {
    const degree = (userData.degree || "").toLowerCase();

    if (degree.includes("bachelor") || degree.includes("master") || degree.includes("phd") || degree.includes("b.tech") || degree.includes("b.e") || degree.includes("mca") || degree.includes("bca")) {
      return true;
    }

    if (degree.length > 2) return true;
  }


  if (text.includes("english")) {
    return true;
  }

  if (text.includes("experience") || text.includes("years")) {

    const commonSkills = ["python", "java", "c++", "c#", "javascript", "typescript", "react", "node", "aws", "azure", "docker", "kubernetes", "sql", "nosql", "git", "xml", "json", "html", "css", "linux", "agile", "scrum"];

    const foundSkill = commonSkills.find(skill => text.includes(skill));
    if (foundSkill) {
      const userSkills = (userData.skills || "").toLowerCase();
      if (userSkills.includes(foundSkill)) return true;

      return false;
    }

    if (userData.workedPreviously === "Yes" || (userData.workExperiences && userData.workExperiences.length > 0)) {
      return true;
    }
  }

  const userSkills = (userData.skills || "").toLowerCase();
  const skillsList = userSkills.split(',').map(s => s.trim());
  for (const skill of skillsList) {
    if (skill && text.includes(skill)) {
      return true;
    }
  }

  if (text.includes("xml") && (userSkills.includes("xml") || userSkills.includes("json"))) return true;
  if (text.includes("git") && userSkills.includes("git")) return true;
  if (text.includes("documentation") && (userSkills.includes("documentation") || true)) return true;
  if (text.includes("primitive data types")) return true;
  if (text.includes("automotive")) return false;

  return false;
}

async function answerQuestionsOnPage(userData: UserData): Promise<void> {
  log("Answering questions on current page...");
  const questionElements = document.querySelectorAll(".fb-dash-form-element, .jobs-easy-apply-form-section__grouping");

  for (const questionEl of Array.from(questionElements)) {
    const labelEl = questionEl.querySelector('label, legend');
    if (!labelEl) continue;

    const questionText = (labelEl.textContent || "").trim().toLowerCase().replace(/\s+/g, ' ');
    if (!questionText) continue;

    const numericAns = getNumericAnswer(questionText, userData);
    if (numericAns !== null) {
      const numInput = questionEl.querySelector('input[type="number"], input[type="text"], textarea') as HTMLElement;
      if (numInput) {
        await simulateUserInput(numInput, numericAns);
        continue;
      }
    }

    let dataPath: string | null = null;
    for (const keyword in keywordMapping) {
      if (questionText.includes(keyword)) {
        dataPath = keywordMapping[keyword];
        break;
      }
    }

    if (dataPath) {
      const answer = getAnswerFromPath(userData, dataPath);
      if (answer !== null && answer !== undefined && answer !== "") {
        log(`Answering question: "${questionText}" with "${answer}"`);
        const answerString = String(answer).toLowerCase();
        const radio = questionEl.querySelector(`input[type="radio"][id*="${answerString}"]`) as HTMLInputElement || Array.from(questionEl.querySelectorAll('label')).find(l => (l.textContent || '').trim().toLowerCase() === answerString)?.control as HTMLInputElement;
        const textInput = questionEl.querySelector('input[type="text"], input[type="number"], textarea') as HTMLElement;
        const select = questionEl.querySelector('select') as HTMLElement;

        if (radio && !radio.checked) {
          radio.click();
          continue;
        } else if (select || textInput) {
          await simulateUserInput(select || textInput, String(answer));
          continue;
        }
      }
    }

    const educationSelect = questionEl.querySelector('select[data-test-text-entity-list-form-select]') as HTMLSelectElement;
    if (educationSelect && questionText.includes('school')) {
      if (userData.educationExperiences && userData.educationExperiences.length > 0) {
        const school = userData.educationExperiences[0].school || userData.educationExperiences[0].institution;
        if (school) {
          log(`Selecting school: "${school}"`);
          await simulateUserInput(educationSelect, school);
          continue;
        }
      }
    }

    const radioYes = questionEl.querySelector('input[data-test-text-selectable-option__input="Yes"], input[type="radio"][value="yes"]') as HTMLInputElement;
    const radioNo = questionEl.querySelector('input[data-test-text-selectable-option__input="No"], input[type="radio"][value="no"]') as HTMLInputElement;

    if (radioYes && radioNo) {
      const shouldSayYes = checkBooleanQuestion(questionText, userData);
      log(`Boolean Question: "${questionText}" -> ${shouldSayYes ? "Yes" : "No"}`);

      if (shouldSayYes && !radioYes.checked) {
        radioYes.click();
      } else if (!shouldSayYes && !radioNo.checked) {
        radioNo.click();
      }
    }
  }
}

async function handleMultiStepApplication(userData: UserData): Promise<void> {
  let stepCount = 0;
  const maxSteps = 15;

  while (stepCount < maxSteps) {
    stepCount++;
    log(`Processing application step ${stepCount}...`);

    await domHelpers.delay(1500);
    await answerQuestionsOnPage(userData);
    await domHelpers.delay(500);

    const button = await findNextOrSubmitButton();
    if (!button) {
      throw new Error("Could not find Next or Submit button.");
    }

    const buttonText = (button.getAttribute('aria-label') || "").toLowerCase();
    const isFinalStep = buttonText.includes("submit") && !buttonText.includes("review");

    const autoClickAllowed = await isAutoClickEnabled();
    if (autoClickAllowed) {
      log(`Clicking button: "${button.getAttribute('aria-label')?.trim()}"`);
      button.click();

      if (isFinalStep) {
        log("Final step detected. Submitting application.");
        // Save job immediately after final submit click
        try {
          await domHelpers.delay(2000); // Wait a bit for submission to process

          const jobTitle = document.querySelector('h1.top-card-layout__title, h2.top-card-layout__title, .job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title a')?.textContent?.trim() || 'LinkedIn Job';
          const jobUrl = window.location.href;

          await saveJobToAnalytics(jobTitle, jobUrl, 'Applied');
          log(`Job saved to analytics after LinkedIn final submit: ${jobTitle}`);
        } catch (e) {
          log("Failed to save job to analytics: " + (e as Error).message);
        }
        break;
      }
    } else {
      log(`Auto-click is disabled. Button "${button.getAttribute('aria-label')?.trim()}" found but not clicked automatically.`);
      log("Please click the button manually to proceed.");
      break;
    }
  }
  if (stepCount >= maxSteps) throw new Error("Exceeded maximum application steps.");
}

export default async function fillLinkedInForm(userData: UserData) {
  try {
    log("Starting LinkedIn application process...");

    if (!userData.fullName && userData.firstName && userData.lastName) {
      userData.fullName = `${userData.firstName} ${userData.lastName}`;
    }
    if (!userData.email && userData.altEmail) {
      userData.email = userData.altEmail;
    }

    const easyApplyBtn = await findEasyApplyButton();
    if (!easyApplyBtn) throw new Error("Easy Apply button not found.");

    easyApplyBtn.click();

    const modal = await waitForApplicationModal();
    if (!modal) throw new Error("Application modal did not appear.");

    await handleMultiStepApplication(userData);
    await domHelpers.delay(4000);

    const successSelectors = [
      '.jobs-easy-apply-content [aria-live="polite"]',
      '.artdeco-inline-feedback--success',
      '.jobs-easy-apply-content .artdeco-inline-feedback--success',
      '[data-test-modal-id="easy-apply-success-modal"]'
    ];

    let successDetected = false;
    for (const selector of successSelectors) {
      const successElement = await domHelpers.waitForElement(selector, 3000);
      if (successElement) {
        const text = successElement.textContent?.toLowerCase() || '';
        if (text.includes('application sent') || text.includes('submitted') || text.includes('success')) {
          log("SUCCESS: Application confirmed via success element!");
          successDetected = true;
          break;
        }
      }
    }

    if (successDetected) {
      await closeSuccessModal();
    } else {
      log("Could not detect success confirmation, but job may have been saved already.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred.";
    log(`Application failed: ${message}`);
    throw error;
  }
}


