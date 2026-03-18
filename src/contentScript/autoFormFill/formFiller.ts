import { getToggleState, getUserData } from '../../utils/storageHandler';
import { fillDetails } from './fieldFiller';
import {
  mapDetailRegex,
  workExperienceRegex,
  projectExperienceRegex,
  educationExperienceRegex
} from './regexPatterns';

export function initializeFormFiller() {
  checkInputFields();

  // Right-click handler for manual data filling
  document.addEventListener(
    "mousedown",
    (event) => {
      if (event.button === 2) {
        getUserData((userData) => {
          if (userData?.data) {
            dataFill(userData.data);
          }
        });
      }
    },
    true
  );
}

function checkInputFields() {
  const inputFields = document.querySelectorAll("input");
  const selectFields = document.querySelectorAll("select");

  if (inputFields.length > 0 || selectFields.length > 0) {
    getUserData((userData) => {
      if (userData) {
        dataFill(userData.data);
      }
    });
  }
}

export function dataFill(data: any) {
  if (!data) {
    console.error("No data provided to dataFill function");
    return;
  }

  const userDetails = { ...(data.details || {}) };
  const userWorkExperience = data.workExperiences || [];
  const userProjectExperience = data.projectExperiences || [];
  const userEducationExperience = data.educationExperiences || [];

  const pageContent = document.body.innerText.toLowerCase();

  const workExperienceRegexPattern = /\b(work[-_ ]?experience|professional[-_ ]?experience|employment[-_ ]?history)\b/i;
  const educationExperienceRegexPattern = /\b(education[-_ ]?experience|education|academic[-_ ]?background|educational[-_ ]?history|studies)\b/i;
  const projectExperienceRegexPattern = /\b(project[-_ ]?experience|project|portfolio|project[-_ ]?history)\b/i;

  function findElementByText(searchText: string, rootElement: Element): Element | null {
    const lowerSearchText = searchText.toLowerCase();
    const textSegments = (rootElement as HTMLElement).innerText.split("\n");
    const nonEmptyTextSegments = textSegments.filter((segment) => segment.trim() !== "");

    const isTextFound = nonEmptyTextSegments.some((segment) =>
      segment.toLowerCase().includes(lowerSearchText)
    );

    if (!isTextFound) {
      return null;
    } else if (isTextFound && rootElement.childElementCount < 1) {
      return rootElement;
    } else {
      for (const child of Array.from(rootElement.children)) {
        const foundElement = findElementByText(searchText, child);
        if (foundElement) return foundElement;
      }
    }
    return null;
  }

  function findAllButtonsInParent(element: Element, parentTagName: string = "DIV"): NodeListOf<HTMLButtonElement> | null {
    let currentElement: Element | null = element;
    let parentElement: HTMLElement | null = null;

    while (currentElement) {
      if (currentElement.parentElement && currentElement.parentElement.tagName === parentTagName.toUpperCase()) {
        parentElement = currentElement.parentElement as HTMLElement;
        break;
      }
      currentElement = currentElement.parentElement;
    }

    if (!parentElement) return null;
    return parentElement.querySelectorAll<HTMLButtonElement>("button");
  }

  function programmaticallyClickButtons(timesToClick: number, button: HTMLButtonElement, callback?: () => void) {
    if (timesToClick <= 0) {
      if (callback) callback();
      return;
    }
    button.click();
    setTimeout(() => {
      programmaticallyClickButtons(timesToClick - 1, button, callback);
    }, 1200);
  }

  async function uploadFile(inputSelector: string, blobStorageUrl: string, fileName: string) {
    try {
      const response = await fetch(blobStorageUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/octet-stream' }
      });

      if (!response.ok) throw new Error(`Network response was not ok ${response.statusText}`);

      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });
      const dt = new DataTransfer();
      dt.items.add(file);

      const inputElement = document.querySelector(inputSelector) as HTMLInputElement;
      if (!inputElement) throw new Error("File input element not found");

      inputElement.files = dt.files;
      inputElement.dispatchEvent(new Event("change", { bubbles: true }));
    } catch (error) {
      console.error("File upload failed:", error);
    }
  }

  async function fillResume() {
    try {
      chrome.storage.local.get(['resumeBase64', 'resumeUrl', 'resumeName'], async (result: any) => {
        const selectors = [
          'input[type="file"][name="resume"]',
          'input[type="file"][accept*="pdf"]',
          'input[type="file"][id*="resume"]',
          'input[type="file"][class*="resume"]',
        ];
        const fileInput = selectors.reduce<HTMLInputElement | null>((found, sel) =>
          found || document.querySelector<HTMLInputElement>(sel), null);

        if (!fileInput) return;

        if (result.resumeBase64) {
          const url = `data:application/pdf;base64,${result.resumeBase64}`;
          await uploadFile(fileInput.matches('input') ? `#${fileInput.id}` || selectors[0] : selectors[0], url, result.resumeName || 'resume.pdf');
        } else if (result.resumeUrl) {
          await uploadFile(selectors[0], result.resumeUrl, result.resumeName || 'resume.pdf');
        }
      });
    } catch (error) {
      console.error("Error in fillResume:", error);
    }
  }

  async function fillCV() {
    try {
      chrome.storage.local.get(['cvBase64', 'cvUrl', 'cvName'], async (result: any) => {
        const selectors = [
          'input[type="file"][name="cv"]',
          'input[type="file"][id*="cv"]',
          'input[type="file"][class*="cv"]',
        ];
        if (result.cvBase64) {
          const url = `data:application/pdf;base64,${result.cvBase64}`;
          await uploadFile(selectors[0], url, result.cvName || 'cv.pdf');
        } else if (result.cvUrl) {
          await uploadFile(selectors[0], result.cvUrl, result.cvName || 'cv.pdf');
        }
      });
    } catch (error) {
      console.error("Error in fillCV:", error);
    }
  }

  function fillProjectDetails() {
    userProjectExperience.forEach((experience: any) => {
      fillDetails({ ...experience }, projectExperienceRegex);
    });
  }

  function fillEducationDetails() {
    userEducationExperience.forEach((experience: any) => {
      fillDetails({ ...experience }, educationExperienceRegex);
    });

    if (pageContent.match(projectExperienceRegexPattern)) {
      const foundElement = findElementByText("Project", document.body);
      if (foundElement) {
        const buttons = findAllButtonsInParent(foundElement);
        if (buttons && buttons.length > 0) {
          programmaticallyClickButtons(userProjectExperience.length, buttons[0], fillProjectDetails);
        }
      }
    }
  }

  function fillDetailsThenClickEducation() {
    userWorkExperience.forEach((experience: any) => {
      fillDetails({ ...experience }, workExperienceRegex);
    });

    if (pageContent.match(educationExperienceRegexPattern)) {
      const foundElement = findElementByText("Education", document.body);
      if (foundElement) {
        const buttons = findAllButtonsInParent(foundElement);
        if (buttons && buttons.length > 0) {
          programmaticallyClickButtons(userEducationExperience.length, buttons[0], fillEducationDetails);
        }
      }
    }
  }

  if (pageContent.match(workExperienceRegexPattern)) {
    const foundElement = findElementByText("Work Experience", document.body);
    if (foundElement) {
      const buttons = findAllButtonsInParent(foundElement);
      if (buttons && buttons.length > 0) {
        programmaticallyClickButtons(userWorkExperience.length, buttons[0], fillDetailsThenClickEducation);
      }
    }
  }

  getToggleState((toggleState) => {
    if (toggleState) {
      fillCV();
      fillResume();
      fillDetails(userDetails, mapDetailRegex);
    }
  });
}
