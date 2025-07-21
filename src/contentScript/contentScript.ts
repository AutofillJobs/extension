// Chrome storage and message handling
chrome.storage.local.get(['toggleState'], function(result) {
  console.log('Toggle state stored in local storage:', result.toggleState);
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && changes.toggleState) {
    const newValue = changes.toggleState.newValue;
    console.log('Toggle state changed to:', newValue);
  }
});

// Message listener for field filling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fillField') {
    chrome.storage.local.get('variablesFromBackend', (result) => {
      const variables = result.variablesFromBackend;
      console.log('Variables from backend:', variables);
      const fieldValue = variables[message.field];
      console.log('Field value:', fieldValue);

      if (fieldValue) {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
          const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement;
          // Clear the input field before setting its value
          inputElement.value = '';
          // Set the new value
          inputElement.value = fieldValue;
          // Dispatch an input event to ensure any attached event listeners are triggered
          inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });
  }
});

// Global variables
let Email = "";
let userData: any;

// Initialize when page is fully loaded
function initialize() {
  console.log("Page is fully loaded");
  prefill();
}

window.addEventListener("load", initialize);

// Prefill function to clear and reset form fields
function prefill() {
  const inputFields = document.querySelectorAll<HTMLInputElement>("input");

  inputFields.forEach((input) => {
    // Check if the input does not have the class 'css-77hcv'
    if (!input.classList.contains('css-77hcv')) {
      input.value = "";  // Clear the input only if it does not have the class
    }
  });

  // Check all checkboxes
  document
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((checkbox) => {
      checkbox.checked = true;
    });

  // Reset select dropdowns to their first option
  document.querySelectorAll("select").forEach((select) => {
    select.selectedIndex = 0;
  });

  // Reset all forms
  document.querySelectorAll("form").forEach((form) => {
    form.reset();
  });

  checkInputFields();
}

// Message listener for email and other data
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.email) {
    Email = request.email;
    console.log("Received email ID:", request.email);
  }
  if (Email == null) {
    console.log("Please Google Login");
  }
});

// Check input fields and fill with data
function checkInputFields() {
  const inputFields = document.querySelectorAll("input");
  const selectFields = document.querySelectorAll("select");

  if (inputFields.length > 0 || selectFields.length > 0) {
    chrome.storage.local.get(['formData'], (result) => {
      if (result.formData) {
        console.log("Form data found:", result.formData);
        dataFill(result.formData.data);
      } else {
        console.log("No data found");
      }
    });
  }
}

// Right-click handler for manual data filling
document.addEventListener(
  "mousedown",
  function (event) {
    if (event.button === 2) { // Right mouse button
      const lastClickedElement = event.target;
      dataFill(userData);
    }
  },
  true
);

// Button click handler
function onPopButtonClick() {
  dataFill(userData);
}

// Enhanced regex patterns for better field matching
const mapDetailRegex = {
  firstName: /first[-_ ]?name|fname|f[_]*name|given[_ ]?name|forename|personal[_ ]?name/gi,
  middleName: /middle[-_ ]?name|mname|m[_]*name|initial|middle[_ ]?initial/gi,
  lastName: /last[-_ ]?name|lname|l[_]*name|surname|family[_ ]?name|paternal[-_ ]?name|sir[_ ]?name/gi,
  fullName: /(^|\b)full[\s-_]?name\b|(^|\b)user[\s-_]?name\b|given[\s-_]?name\(s\)?|(^|\b)complete[\s-_]?name\b|legal[_ ]?name|legal[\s-_ ]?name\s?\(first,middle,last\)/gi,
  preferredName: /preferred[-_ ]?name|nickname|alias|preferred[_ ]?first[_ ]?name/gi,
  familyName: /family[-_ ]?name|last[-_ ]?name/gi,
  zip: /zip(code)?|postal[-_ ]?code|post[_ ]?code/gi,
  phoneCode: /\b(?:country[_ ]?code|country[_ ]?phone|international[_ ]?code|intl[_ ]?code|dialing[_ ]?code)\b/gi,
  phoneNumber: /phone[-_ ]?(number)?\*?|mobile[-_ ]?(number)?\*?|telephone\*?|contact[_ ]?number|phone number/gi,
  email: /e[-_ ]?mail|email[-_ ]?address|email/gi,
  phoneAlternativeNumber: /alternate[-_ ]?phone|secondary[-_ ]?phone|alternative[_ ]?contact[_ ]?number/gi,
  dateOfBirth: /dob|date[-_ ]?of[-_ ]?birth|birth[-_ ]?date|birthdate/gi,
  address1: /address[-_ ]?1|address|street[-_ ]?address|primary[_ ]?address/gi,
  address2: /address[-_ ]?2|suite|unit|apartment|address[_ ]?line[_ ]?2/gi,
  gender: /gender|sex|male[_ ]?or[_ ]?female/gi,
  street: /street|street[-_ ]?name|road|avenue/gi,
  houseNumber: /house[-_ ]?number|building[-_ ]?number|house[_ ]?num/gi,
  city: /city|town|locality|city[_ ]?name/gi,
  state: /state|province|region|state[_ ]?name/gi,
  country: /country|nation|country[_ ]?name|nationality/gi,
  apartment: /apartment|flat|unit|apartment[_ ]?number/gi,
  floor: /floor|level|floor[_ ]?number/gi,
  building: /building|complex|building[_ ]?name/gi,
  twitterUrl: /twitter[-_ ]?url|twitter[_ ]?account|@[\w]+/gi,
  linkedinUrl: /linkedin[-_ ]?url|linkedin[_ ]?profile|social network urls|Please provide a link to your LinkedIn profile:/gi,
  githubUrl: /github[-_ ]?url|github[_ ]?account|website/gi,
  expectedSalary: /expected[-_ ]?(salary|pay|compensation|wage(s)?)|salary[-_ ]?(expectation(s)?|range|desired|requirement(s)?)|desired[-_ ]?(salary|pay|compensation|wage(s)?)|compensation[_ ]?expectations/gi,
  password: /password|passcode|pwd/gi,
  confirmPassword: /confirm[-_ ]?password|verify[-_ ]?password|password[_ ]?confirmation/gi,
  employmentStatus: /employment[-_ ]?status|job[-_ ]?status|work[_ ]?status/gi,
  company: /company|employer|organization|company[_ ]?name/gi,
  jobTitle: /job[-_ ]?title|position|role|designation/gi,
  startDate: /start[-_ ]?date|date[-_ ]?of[-_ ]?entry|employment[_ ]?start[_ ]?date/gi,
  endDate: /end[-_ ]?date|date[-_ ]?of[-_ ]?leaving|employment[_ ]?end[_ ]?date/gi,
  educationLevel: /education[-_ ]?level|highest[-_ ]?qualification|academic[_ ]?level/gi,
  degree: /degree|qualification|degree[_ ]?title/gi,
  fieldOfStudy: /field[-_ ]?of[-_ ]?study|major|specialization/gi,
  school: /school|university|college|institution/gi,
  graduationDate: /graduation[-_ ]?date|date[_ ]?of[_ ]?graduation/gi,
  grossSalary: /gross[_ ]?salary|total[_ ]?earnings|annual[_ ]?income|salary[_ ]?before[_ ]?taxes/gi,
  noticePeriod: /notice[_ ]?period|availability|time[_ ]?to[_ ]?join|joining[_ ]?time/gi,
  howDidYouHearAboutUs: /how[_ ]?did[_ ]?you[_ ]?hear[_ ]?about[_ ]?us|source[_ ]?of[_ ]?application|referral[_ ]?source/gi,
  emailAddress: /e[-_ ]?mail[_ ]?address|email|contact[_ ]?email/gi,
  phoneDeviceType: /phone[_ ]?device[_ ]?type|mobile[_ ]?model|cell[_ ]?phone[_ ]?kind/gi,
  nationality: /nationality|citizen(ship)?|country[_\s-]?of[_\s-]?origin|passport[_\s-]?country/gi,
  prefix: /^(mr|ms|mrs|miss|dr|prof)\.?|prefix|title|salutation/gi,
  countryRegion: /country[_\s-]?region|region|area|location[_\s-]?code|geo(graphical)?[_\s-]?area|place[_\s-]?of[_\s-]?residence|residential[_\s-]?area|living[_\s-]?area|habitation[_\s-]?area|domicile/gi,
};

const selectInputRegex = {
  gender: /gender|gender\*|sex/gi,
  country: /location|country|region|candidate-location/gi,
  state: /state|province|region/gi,
  employmentStatus: /employment[-_ ]?status|job[-_ ]?status/gi,
  phoneDeviceType: /phone[_ ]?device[_ ]?type|mobile[_ ]?model|cell[_ ]?phone[_ ]?kind/gi,
  location: /location|place[_ ]?of[_ ]?residence|work[_ ]?location|city|state/gi,
  howDidYouHearAboutUs: /how[_ ]?did[_ ]?you[_ ]?hear[_ ]?about[_ ]?us|source[_ ]?of[_ ]?application|referral[_ ]?source/gi,
  educationLevel: /education[-_ ]?level|highest[-_ ]?qualification|academic[_ ]?level/gi,
  degree: /degree|qualification|degree[_ ]?title/gi,
  fieldOfStudy: /field[-_ ]?of[-_ ]?study|major|specialization/gi,
  city: /city|town|locality|city[_ ]?name/gi,
  maritalStatus: /marital[_\s-]?status|marriage[_\s-]?status|civil[_\s-]?status|relationship[_\s-]?status/gi,
  servedInMilitary: /military[_\s-]?service|armed[_\s-]?forces[_\s-]?experience|veteran[_\s-]?status|service[_\s-]?record/gi,
  workedPreviously: /previous[_\s-]?employment|prior[_\s-]?job[_\s-]?experience|past[_\s-]?work|employment[_\s-]?history/gi,
  countryRegion: /country[_\s-]?region|region|area|location[_\s-]?code|geo(graphical)?[_\s-]?area|place[_\s-]?of[_\s-]?residence|residential[_\s-]?area|living[_\s-]?area|habitation[_\s-]?area|domicile/gi,
  nationality: /nationality|citizen(ship)?|country[_\s-]?of[_\s-]?origin|passport[_\s-]?country/gi,
  prefix: /prefix|title|salutation|(mr|ms|mrs|miss|dr|prof)\.?/gi,
};

const radioInputRegex = {
  gender: /male|female|other|prefer not to say/gi,
};

const dateInputRegex = {
  dateOfBirth: /dob|date[-_ ]?of[-_ ]?birth|birth[-_ ]?date|birthdate/gi,
  startDate: /start[-_ ]?date|date[-_ ]?of[-_ ]?entry/gi,
  endDate: /end[-_ ]?date|date[-_ ]?of[-_ ]?leaving/gi,
};

const workExperienceRegex = {
  jobTitle: /job title|Job[_ -]?Title/gi,
  companyName: /company[_ -]?name|company/gi,
  description: /description|[a-zA-Z*0-9]*role[a-zA-Z*0-9]*description[a-zA-Z*0-9]*|role description/gi,
  location: /location|country|region|candidate-location/gi,
  stillWorking: /[a-zA-z*0-9]*still[_ -]working[a-zA-z*0-9]*/gi,
  startDate: /[a-zA-z*0-9]*start[_ -]?date[a-zA-z*0-9]*|[a-zA-z*0-9]*from[a-zA-z*0-9]*/gi,
  endDate: /[a-zA-z*0-9]*end[- _]?date[a-zA-z*0-9]*|to[a-zA-z*0-9]*/gi,
  skills: /skills/gi,
  linkedinUrl: /linkedin[-_ ]?url|linkedin[_ ]?profile|social network urls|Please provide a link to your LinkedIn profile:/gi,
};

const projectExperienceRegex = {
  projectName: /project[_ -]?name|project/gi,
  startDate: /[a-zA-z*0-9]*start[_ -]?date[a-zA-z*0-9]*|[a-zA-z*0-9]*from[a-zA-z*0-9]*/gi,
  endDate: /[a-zA-z*0-9]*end[- _]?date[a-zA-z*0-9]*|to[a-zA-z*0-9]*/gi,
  skills: /skills/gi,
  stillWorking: /[a-zA-z*0-9]*still[_ -]working[a-zA-z*0-9]*|ongoing[a-zA-z*0-9]*/gi,
  description: /description|[a-zA-z*0-9]*project[a-zA-z*0-9]* description[a-zA-z*0-9]*/gi,
  gitUrl: /git[_ -]?url|repository[_ -]?url|source[_ -]?code[_ -]?url/gi,
  hostUrl: /host[_ -]?url|live[_ -]?site[_ -]?url|demo[_ -]?url/gi,
};

const educationExperienceRegex = {
  courseName: /course[_ -]?name|program/gi,
  field: /field[_ -]?of[_ -]?study|major/gi,
  collegeName: /college[_ -]?name|university|institution/gi,
  startDate: /[a-zA-z*0-9]*start[_ -]?date[a-zA-z*0-9]*|[a-zA-z*0-9]*from[a-zA-z*0-9]*/gi,
  endDate: /[a-zA-z*0-9]*end[- _]?date[a-zA-z*0-9]*|to[a-zA-z*0-9]*/gi,
  skills: /skills/gi,
  stillStudying: /still[_ -]?studying|ongoing[_ -]?education|currently[_ -]?enrolled/gi,
  description: /description|course[_ -]?details|program[_ -]?overview/gi,
  grade: /grade|gpa|score|marks/gi,
  location: /location|campus|city|place/gi,
  educationType: /education[_ -]?type|degree[_ -]?level|certification/gi,
};

// Main data filling function
const dataFill = (data: any) => {
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
  
  // Combined regex patterns for each category
  const workExperienceRegexPattern = /\b(work[_ -]?experience|professional[_ -]?experience|employment[_ -]?history)\b/i;
  const educationExperienceRegexPattern = /\b(education[_ -]?experience|Education|academic[_ -]?background|educational[_ -]?history|studies)\b/i;
  const projectExperienceRegexPattern = /\b(project[_ -]?experience|project|portfolio|project[_ -]?history)\b/i;

  // Enhanced element finding function
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

  // Find all buttons in parent element
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

  // Programmatically click buttons with delay
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

  // Fill work experience section
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

  // Fill details then proceed to education
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

  // Fill education details then proceed to projects
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

  // Fill project details
  function fillProjectDetails() {
    userProjectExperience.forEach((experience: any) => {
      console.log("Filling project experience:", experience);
      fillDetails(experience, projectExperienceRegex);
    });
  }

  // Handle file uploads
  const dropZones = document.querySelectorAll("[dropzone], [data-transfer], [data-dropzone], [data-upload], .upload-area, .file-dropzone");
  console.log("Detected potential drop zones:", dropZones.length);

  const uploaders = document.querySelectorAll('[data-automation-id="file-upload-drop-zone"]');
  console.log("Detected uploader:", uploaders);

  // File upload function
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

  // Fill resume
  async function fillResume() {
    try {
      chrome.storage.local.get(['resumeBase64'], async (result) => {
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

  // Fill CV
  async function fillCV() {
    try {
      chrome.storage.local.get(['cvBase64'], async (result) => {
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

  // Execute file uploads
  fillCV();
  fillResume();

  // Fill basic details
  fillDetails(userDetails, mapDetailRegex);
};

// Enhanced field filling function
const fillDetails = (userDetails: any, regexMap: any) => {
  if (!userDetails || !regexMap) {
    console.error("Invalid parameters provided to fillDetails");
    return;
  }

  const inputElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  const selectFields = document.querySelectorAll<HTMLSelectElement>("select");
  console.log("Fields found:", inputElements.length + selectFields.length);
  
  const filledFields: any = {};
  const fieldMappings: any = {};

  // Get text lines from element
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

  // Fill input fields
  const fillInputField = (userDetails: any, regexMap: any) => {
    inputElements.forEach((input, index) => {
      let matchFound = false;
      let matchedKey = null;

      if (input.value) {
        return;
      }

      // Check input element attributes
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

        // Check associated label
        if (!matchFound && input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label && regexMap[key].test(label.textContent || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      // Check parent elements
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

      // Fill the field if match found
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

  // Save field mappings to localStorage
  const isEmptyObject = (obj: any) => {
    return Object.keys(obj).length === 0;
  };
  
  if (!isEmptyObject(fieldMappings)) {
    localStorage.setItem('fieldMappings', JSON.stringify(fieldMappings));
    console.log('Field mappings saved to localStorage:', fieldMappings);
  }

  // Fill select fields
  const fillSelectField = (userDetails: any, regexMap: any) => {
    const selectElements = document.querySelectorAll<HTMLSelectElement>('select, [role="option"], [role="listbox"], [role="generic"]');
    
    selectElements.forEach((select) => {
      let matchFound = false;
      let matchedKey = null;

      // Check select element attributes
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

        // Check associated label
        if (!matchFound && select.id) {
          const label = document.querySelector(`label[for="${select.id}"]`);
          if (label && regexMap[key].test(label.textContent || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      // Check parent elements
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

      // Fill the select field if match found
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

  // Fill radio buttons
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

  // Fill date fields
  const fillDateField = (userDetails: any, regexMap: any) => {
    const dateInputs = document.querySelectorAll<HTMLInputElement>("input[type='date']");

    dateInputs.forEach((input) => {
      let matchFound = false;
      let matchedKey = null;

      // Check input attributes
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

        // Check associated label
        if (!matchFound && input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label && regexMap[key].test(label.textContent?.trim() || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      // Check parent elements
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

      // Fill the date field if match found
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

  // Send filled fields to background script
  if (Object.keys(filledFields).length > 0) {
    chrome.runtime.sendMessage({ action: 'filledFields', data: filledFields });
  }
};

// Floating popup functions
function createFloatingPopup(count: number) {
  const popupDiv = document.createElement("div");

  popupDiv.style.position = "fixed";
  popupDiv.style.top = "10px";
  popupDiv.style.right = "10px";
  popupDiv.style.height = "50px";
  popupDiv.style.backgroundColor = "black";
  popupDiv.style.border = "1px solid black";
  popupDiv.style.zIndex = "1000";
  popupDiv.style.transition = "0.3s ease";
  popupDiv.style.borderTopLeftRadius = "15px";
  popupDiv.style.borderBottomLeftRadius = "15px";
  popupDiv.style.display = "flex";
  popupDiv.style.alignItems = "center";

  document.body.appendChild(popupDiv);

  const button = document.createElement("button");
  button.textContent = "Button";
  button.style.backgroundColor = "black";
  button.style.color = "white";
  button.style.border = "1px solid black";
  button.style.padding = "5px 10px";
  popupDiv.appendChild(button);

  const textContent = document.createElement("div");
  textContent.textContent = "Fields: " + count;
  textContent.style.marginLeft = "10px";
  textContent.style.color = "white";

  popupDiv.addEventListener("mouseenter", () => {
    popupDiv.appendChild(textContent);
  });

  popupDiv.addEventListener("mouseleave", () => {
    popupDiv.style.right = "10px";
    if (popupDiv.contains(textContent)) {
      popupDiv.removeChild(textContent);
    }
  });

  button.addEventListener("click", () => {
    onPopButtonClick();
  });
}

function createErrorFloatingPopup(count: number, message: string = "", duration: number = 10000) {
  const popupDiv = document.createElement("div");

  popupDiv.style.position = "fixed";
  popupDiv.style.top = "10px";
  popupDiv.style.right = "10px";
  popupDiv.style.minHeight = "50px";
  popupDiv.style.backgroundColor = "#333";
  popupDiv.style.color = "white";
  popupDiv.style.padding = "10px";
  popupDiv.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  popupDiv.style.zIndex = "10000";
  popupDiv.style.display = "flex";
  popupDiv.style.justifyContent = "center";
  popupDiv.style.alignItems = "center";
  popupDiv.style.borderRadius = "5px";
  popupDiv.innerHTML = message;

  document.body.appendChild(popupDiv);

  if (duration > 0) {
    setTimeout(() => {
      popupDiv.style.transition = "opacity 0.5s ease";
      popupDiv.style.opacity = "0";
      setTimeout(() => document.body.removeChild(popupDiv), 500);
    }, duration);
  }
}

// Request login email
chrome.runtime.sendMessage({ message: "getLoginEmail" }, function (response) {});
