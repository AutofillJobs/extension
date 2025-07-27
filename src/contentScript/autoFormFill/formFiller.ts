import { Email, userData } from '../messageListener';
import { getToggleState, getUserData } from '../utils/storageHandler';
import { FormData } from '../utils/types';
import { 
  mapDetailRegex, 
  selectInputRegex, 
  radioInputRegex, 
  dateInputRegex, 
  workExperienceRegex, 
  projectExperienceRegex, 
  educationExperienceRegex 
} from './regexPatterns';

export function initializeFormFiller() {
  prefill();
  checkInputFields();

  // Right-click handler for manual data filling
  document.addEventListener(
    "mousedown",
    (event) => {
      // Check if the right mouse button was clicked
      if (event.button === 2) {
        getUserData((userData) => {
          if (userData?.data) {
            console.log("Form data found:", userData);
            dataFill(userData.data);
          } else {
            console.log("No data found");
          }
        });
      }
    },
    true // Use capture phase
  );
  
}

function prefill() {
  const inputFields = document.querySelectorAll<HTMLInputElement>("input");

  inputFields.forEach((input) => {
    if (!input.classList.contains('css-77hcv')) {
      input.value = "";
    }
  });

  document
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = true;
    });

  document.querySelectorAll("select").forEach((select) => {
    select.selectedIndex = 0;
  });

  document.querySelectorAll("form").forEach((form) => {
    form.reset();
  });

  checkInputFields();
}

function checkInputFields() {
  const inputFields = document.querySelectorAll("input");
  const selectFields = document.querySelectorAll("select");

  if (inputFields.length > 0 || selectFields.length > 0) {
    getUserData((userData) => {
      if (userData) {
        console.log("Form data found:", userData);
        dataFill(userData.data);
      } else {
        console.log("No data found");
      }
    });
  }
}

export function dataFill(data: any) {
  console.log("Filling data:", data);
  
  if (!data) {
    console.error("No data provided to dataFill function");
    return;
  }

  const userDetails = data.details || {};
  const userWorkExperience = data.workExperiences || [];
  const userProjectExperience = data.projectExperiences || [];
  const userEducationExperience = data.educationExperiences || [];

  const pageContent = document.body.innerText.toLowerCase();
  
  const workExperienceRegexPattern = /\b(work[_ -]?experience|professional[_ -]?experience|employment[_ -]?history)\b/i;
  const educationExperienceRegexPattern = /\b(education[_ -]?experience|Education|academic[_ -]?background|educational[_ -]?history|studies)\b/i;
  const projectExperienceRegexPattern = /\b(project[_ -]?experience|project|portfolio|project[_ -]?history)\b/i;

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
    } else if (isTextFound && rootElement.childElementCount >= 1) {
      for (const child of Array.from(rootElement.children)) {
        const foundElement = findElementByText(searchText, child);
        if (foundElement) {
          return foundElement;
        }
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

    if (!parentElement) {
      return null;
    }

    return parentElement.querySelectorAll<HTMLButtonElement>("button");
  }

  function programmaticallyClickButtons(timesToClick: number, button: HTMLButtonElement, callback?: () => void) {
    if (timesToClick <= 0) {
      if (callback) {
        callback();
      }
      return;
    }

    button.click();
    
    setTimeout(() => {
      programmaticallyClickButtons(timesToClick - 1, button, callback);
    }, 1000);
  }

  async function uploadFile(inputSelector: string, blobStorageUrl: string, fileName: string) {
    try {
      const response = await fetch(blobStorageUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok ${response.statusText}`);
      }

      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });
      const dt = new DataTransfer();
      dt.items.add(file);

      const inputElement = document.querySelector(inputSelector) as HTMLInputElement;
      if (!inputElement) {
        throw new Error("File input element not found");
      }

      inputElement.files = dt.files;
      const event = new Event("change", { bubbles: true });
      inputElement.dispatchEvent(event);

      console.log("File upload successful");
    } catch (error) {
      console.error("File upload failed:", error);
    }
  }

  async function fillResume() {
    try {
      chrome.storage.local.get(['resumeBase64'], async (result: { resumeBase64?: string }) => {
        if (result.resumeBase64) {
          const resumeUrl = `data:application/pdf;base64,${result.resumeBase64}`;
          await uploadFile('input[type="file"][name="resume"]', resumeUrl, 'resume.pdf');
        } else {
          console.error("Resume Base64 string not found in storage");
        }
      });
    } catch (error) {
      console.error("Error in fillResume:", error);
    }
  }

  async function fillCV() {
    try {
      chrome.storage.local.get(['cvBase64'], async (result: { cvBase64?: string }) => {
        if (result.cvBase64) {
          const cvUrl = `data:application/pdf;base64,${result.cvBase64}`;
          await uploadFile('input[type="file"][name="cv"]', cvUrl, 'cv.pdf');
        } else {
          console.error("CV Base64 string not found in storage");
        }
      });
    } catch (error) {
      console.error("Error in fillCV:", error);
    }
  }

  function fillDetailsThenClickEducation() {
    userWorkExperience.forEach((experience: any) => {
      console.log("Filling work experience:", experience);
      fillDetails(experience, workExperienceRegex);
    });

    if (pageContent.match(educationExperienceRegexPattern)) {
      console.log("Education Experience content detected");
      let foundElement = findElementByText("Education", document.body);

      if (foundElement) {
        let buttons = findAllButtonsInParent(foundElement);
        if (buttons && buttons.length > 0) {
          programmaticallyClickButtons(
            userEducationExperience.length,
            buttons[0],
            function () {
              fillEducationDetails();
            }
          );
        }
      }
    }
  }

  function fillEducationDetails() {
    userEducationExperience.forEach((experience: any) => {
      console.log("Filling education experience:", experience);
      fillDetails(experience, educationExperienceRegex);
    });

    if (pageContent.match(projectExperienceRegexPattern)) {
      console.log("Project Experience content detected");
      let foundElement = findElementByText("Project", document.body);

      if (foundElement) {
        let buttons = findAllButtonsInParent(foundElement);
        if (buttons && buttons.length > 0) {
          programmaticallyClickButtons(
            userProjectExperience.length,
            buttons[0],
            function () {
              fillProjectDetails();
            }
          );
        }
      }
    }
  }

  function fillProjectDetails() {
    userProjectExperience.forEach((experience: any) => {
      console.log("Filling project experience:", experience);
      fillDetails(experience, projectExperienceRegex);
    });
  }

  if (pageContent.match(workExperienceRegexPattern)) {
    console.log("Work Experience content detected");
    let foundElement = findElementByText("Work Experience", document.body);

    if (foundElement) {
      let buttons = findAllButtonsInParent(foundElement);
      if (buttons && buttons.length > 0) {
        programmaticallyClickButtons(
          userWorkExperience.length,
          buttons[0],
          function () {
            fillDetailsThenClickEducation();
          }
        );
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

export function fillDetails(userDetails: any, regexMap: any) {
  if (!userDetails || !regexMap) {
    console.error("Invalid parameters provided to fillDetails");
    return;
  }

  const inputElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  const selectFields = document.querySelectorAll<HTMLSelectElement>("select");
  console.log("Fields found:", inputElements.length + selectFields.length);
  
  const filledFields: any = {};
  const fieldMappings: any = {};

  function getTextLines(element: Element): string[] {
    let lines: string[] = [];
    let currentLine = "";

    function traverse(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        currentLine += node.textContent?.trim() || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (["DIV", "P", "LABEL", "H1", "H2", "H3", "H4", "H5", "H6"].includes((node as Element).tagName)) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = "";
          }
          Array.from(node.childNodes).forEach(traverse);
        } else {
          Array.from(node.childNodes).forEach(traverse);
        }
      }
    }

    traverse(element);

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  const fillInputField = (userDetails: any, regexMap: any) => {
    inputElements.forEach((input, index) => {
      let matchFound = false;
      let matchedKey = null;

      if (input.value) {
        return;
      }

      for (let key in regexMap) {
        if (matchFound) break;

        const attributesToCheck = ["name", "id", "class", "title", "placeholder"];
        attributesToCheck.some((attr) => {
          const value = input.getAttribute(attr);
          if (value && regexMap[key].test(value)) {
            matchFound = true;
            matchedKey = key;
            return true;
          }
          return false;
        });

        if (!matchFound && input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label && regexMap[key].test(label.textContent || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      if (!matchFound) {
        let parentElement = input.parentElement;
        while (!matchFound && parentElement) {
          const lines = getTextLines(parentElement);
          if (lines.length > 2) break;

          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              matchFound = true;
              matchedKey = key;
              break;
            }
          }

          parentElement = parentElement.parentElement;
        }
      }

      if (matchFound && matchedKey && userDetails[matchedKey]) {
        input.value = userDetails[matchedKey];
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        filledFields[matchedKey] = userDetails[matchedKey];
        fieldMappings[matchedKey] = { index: index };
        delete userDetails[matchedKey];
      }
    });
  };

  fillInputField(userDetails, regexMap);

  const isEmptyObject = (obj: any) => {
    return Object.keys(obj).length === 0;
  };
  
  if (!isEmptyObject(fieldMappings)) {
    localStorage.setItem('fieldMappings', JSON.stringify(fieldMappings));
    console.log('Field mappings saved to localStorage:', fieldMappings);
  }

  const fillSelectField = (userDetails: any, regexMap: any) => {
    const selectElements = document.querySelectorAll<HTMLSelectElement>('select, [role="option"], [role="listbox"], [role="generic"]');
    
    selectElements.forEach((select) => {
      let matchFound = false;
      let matchedKey = null;

      for (let key in regexMap) {
        if (matchFound) break;

        const attributesToCheck = ["name", "id", "class", "title", "placeholder"];
        attributesToCheck.some((attr) => {
          const value = select.getAttribute(attr);
          if (value && regexMap[key].test(value)) {
            matchFound = true;
            matchedKey = key;
            return true;
          }
          return false;
        });

        if (!matchFound && select.id) {
          const label = document.querySelector(`label[for="${select.id}"]`);
          if (label && regexMap[key].test(label.textContent || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      if (!matchFound) {
        let parentElement = select.parentElement;
        while (!matchFound && parentElement) {
          const lines = getTextLines(parentElement);
          if (lines.length > 2) break;

          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              matchFound = true;
              matchedKey = key;
              break;
            }
          }

          parentElement = parentElement.parentElement;
        }
      }

      if (matchFound && matchedKey && userDetails[matchedKey]) {
        const selectValue = userDetails[matchedKey];
        Array.from(select.options).forEach((option) => {
          if (option.text === selectValue || option.value === selectValue) {
            select.value = option.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            select.dispatchEvent(new Event("input", { bubbles: true }));
            filledFields[matchedKey] = userDetails[matchedKey];
          }
        });
      }
    });
  };
  
  fillSelectField(userDetails, selectInputRegex);

  const fillRadioButton = (userDetails: any, regexMap: any) => {
    const radioButtons = document.querySelectorAll<HTMLInputElement>("input[type='radio']");

    radioButtons.forEach((radio) => {
      let matchFound = false;
      let matchedKey = null;
      const radioValue = radio.value || "";

      for (let key in regexMap) {
        if (regexMap[key].test(radioValue.toLowerCase())) {
          matchedKey = key;
          matchFound = true;
          break;
        }
      }

      if (matchFound && matchedKey && userDetails[matchedKey]) {
        if (userDetails[matchedKey].toLowerCase() === radioValue.toLowerCase()) {
          radio.checked = true;
          radio.dispatchEvent(new Event("change", { bubbles: true }));
          filledFields[matchedKey] = userDetails[matchedKey];
        }
      }
    });
  };

  fillRadioButton(userDetails, radioInputRegex);

  const fillDateField = (userDetails: any, regexMap: any) => {
    const dateInputs = document.querySelectorAll<HTMLInputElement>("input[type='date']");

    dateInputs.forEach((input) => {
      let matchFound = false;
      let matchedKey = null;

      for (let key in regexMap) {
        if (matchFound) break;

        const attributesToCheck = ["name", "id", "class", "title", "placeholder"];
        attributesToCheck.some((attr) => {
          const value = input.getAttribute(attr);
          if (value && regexMap[key].test(value)) {
            matchFound = true;
            matchedKey = key;
            return true;
          }
          return false;
        });

        if (!matchFound && input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label && regexMap[key].test(label.textContent?.trim() || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      if (!matchFound) {
        let parentElement = input.parentElement;
        while (!matchFound && parentElement) {
          const lines = getTextLines(parentElement);
          if (lines.length > 2) break;

          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              matchFound = true;
              matchedKey = key;
              break;
            }
          }

          parentElement = parentElement.parentElement;
        }
      }

      if (matchFound && matchedKey && userDetails[matchedKey]) {
        input.value = userDetails[matchedKey];
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        filledFields[matchedKey] = userDetails[matchedKey];
      }
    });
  };

  fillDateField(userDetails, dateInputRegex);
  
  console.log("All filled fields:", filledFields);

  if (Object.keys(filledFields).length > 0) {
    chrome.runtime.sendMessage({ action: 'filledFields', data: filledFields });
  }
}