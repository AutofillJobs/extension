
interface UserData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    location: string;
    pronouns?: string;
    countryOfResidence?: string;
    phoneCountryCode?: string;
  };
  jobPreferences: {
    expectedCTC: string;
    totalITExperience: string;
    totalMonthsExperience: string;
    currentSalary: string;
    servingNoticePeriod: string;
    currentlyWorking?: boolean;
    immediateJoiner?: boolean;
    noticePeriod?: string;
    hybridWork?: boolean;
    commuteToLocation?: boolean;
    skillRatings?: { [key: string]: string };
    technologies?: { [key: string]: boolean };
    willingToRelocate?: boolean;
    workAuthorization?: string;
    totalExperience?: string;
    expectedSalary?: string;
  };
  educationAndInternships: {
    hasBachelorsDegree: boolean;
  };
  education?: {
    gpa: string;
    graduationDate: string;
    currentlyEnrolled: boolean;
  };
  documentsAndLinks: {
    resumeURL: string;
    coverLetter: string;
    portfolioURL: string;
    personalWebsite: string;
  };
  assessmentsAndSkills: {
    githubURL: string;
    leetcodeURL: string;
  };
  behavioralAndMotivation: {
    strengths: string;
    weaknesses: string;
  };
  legalAndWorkAuth: {
    authorizedToWorkIn: string;
    visaType: string;
    needSponsorship: string;
  };
  availability: {
    startDate: string;
  };
  extraAndOptional: {
    openToRemoteWork: boolean;
    lookingForInternship: boolean;
    unpaidInternshipComfort: string;
    skillRatings?: { [key: string]: string };
    driversLicense?: boolean;
    passportAvailability?: boolean;
    requireAccommodations?: boolean;
    openToContract?: boolean;
    wantsMentoring?: boolean;
    willingToTravel?: boolean;
  };
  workExperiences: Array<{
    duration: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    [key: string]: any;
  }>;
  skills?: { [key: string]: any };
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
    const selectors = [ ".jobs-apply-button--top-card button", "#jobs-apply-button-id", ".jobs-apply-button" ];
    return domHelpers.waitForElement(selectors);
}

async function waitForApplicationModal(): Promise<HTMLElement | null> {
    const selectors = [ ".jobs-easy-apply-modal", ".jobs-easy-apply-content", ".jobs-apply-form" ];
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
    const closeButton = await domHelpers.waitForElement('button[aria-label="Dismiss"], .artdeco-modal__dismiss');
    if (closeButton) {
        closeButton.click();
    }
}

const keywordMapping: { [key: string]: string } = {
  "pronoun": "personalInfo.pronouns",
  "country of residence": "personalInfo.countryOfResidence",
  "full name": "personalInfo.fullName",
  "email": "personalInfo.email",
  "phone": "personalInfo.phone",
  "phone country code": "personalInfo.phoneCountryCode",
  "location": "personalInfo.location",
  "authorized to work": "legalAndWorkAuth.authorizedToWorkIn",
  "visa": "legalAndWorkAuth.visaType",
  "sponsorship": "legalAndWorkAuth.needSponsorship",
  "salary": "jobPreferences.expectedCTC",
  "expected ctc": "jobPreferences.expectedCTC",
  "expected compensation": "jobPreferences.expectedCTC",
  "current salary": "jobPreferences.currentSalary",
  "total years of professional experience": "jobPreferences.totalITExperience",
  "bachelor's degree": "educationAndInternships.hasBachelorsDegree",
  "bachelor": "educationAndInternships.hasBachelorsDegree",
  "start date": "availability.startDate",
  "notice period": "jobPreferences.servingNoticePeriod",
  "relocate": "jobPreferences.willingToRelocate",
  "experience": "jobPreferences.totalExperience",
};

function getNumericAnswer(questionText: string, userData: UserData): string | null {
  const yearsRegex = /how\s+many\s+years[^?]*with\s+(.+?)\s*\?/i;
  const yearsMatch = yearsRegex.exec(questionText);
  if (yearsMatch) {
    const techRaw = yearsMatch[1].replace(/\(.*?\)/g, '').trim().toLowerCase();
    const candidate = userData.jobPreferences?.skillRatings?.[techRaw] || userData.skills?.[techRaw] || userData.jobPreferences?.totalITExperience;
    return (candidate ? String(candidate) : '3').replace(/[^0-9.]/g, '');
  }
  const noticeRegex = /notice\s+period[^\d]*days?/i;
  if (noticeRegex.test(questionText)) {
    const noticeVal = userData.jobPreferences?.noticePeriod || userData.jobPreferences?.servingNoticePeriod;
    return (noticeVal ? String(noticeVal) : '30').replace(/[^0-9.]/g, '');
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
      const enabled = result.autoClickToggleState === true;
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
        
        if (!dataPath && (questionText.startsWith("are you") || questionText.startsWith("do you"))) {
             const radioYes = questionEl.querySelector('input[type="radio"][value*="Yes"]') as HTMLInputElement;
             if(radioYes && !radioYes.checked) {
                log(`Defaulting to "Yes" for question: "${questionText}"`);
                radioYes.click();
             }
             continue;
        }

        if (!dataPath) continue;

        const answer = getAnswerFromPath(userData, dataPath);
        if (answer === null || answer === undefined || answer === "") continue;

        log(`Answering question: "${questionText}" with "${answer}"`);

        const answerString = String(answer).toLowerCase();
        const radio = questionEl.querySelector(`input[type="radio"][id*="${answerString}"]`) as HTMLInputElement || Array.from(questionEl.querySelectorAll('label')).find(l => (l.textContent||'').trim().toLowerCase() === answerString)?.control as HTMLInputElement;
        const textInput = questionEl.querySelector('input[type="text"], input[type="number"], textarea') as HTMLElement;
        const select = questionEl.querySelector('select') as HTMLElement;

        if (radio && !radio.checked) {
            radio.click();
        } else if (select || textInput) {
            await simulateUserInput(select || textInput, String(answer));
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
        
        const easyApplyBtn = await findEasyApplyButton();
        if (!easyApplyBtn) throw new Error("Easy Apply button not found.");
        
        // Easy Apply button should always be clicked regardless of toggle state
        // as it's needed to initiate the application process
        easyApplyBtn.click();

        const modal = await waitForApplicationModal();
        if (!modal) throw new Error("Application modal did not appear.");

        await handleMultiStepApplication(userData);
        await domHelpers.delay(4000);

        const successMessage = await domHelpers.waitForElement('.jobs-easy-apply-content [aria-live="polite"]', 2000);
        if (successMessage && (successMessage.textContent || "").toLowerCase().includes("application sent")) {
            log("SUCCESS: Application submitted successfully!");
            await closeSuccessModal();
        } else {
            log("WARNING: Could not confirm submission success. Please verify manually.");
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unknown error occurred.";
        log(`Application failed: ${message}`);
        throw error;
    }
}
