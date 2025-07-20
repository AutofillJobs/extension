chrome.storage.local.get(['toggleState'], function(result) {
  console.log('Toggle state stored in local storage:', result.toggleState);
  
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && changes.toggleState) {
    const newValue = changes.toggleState.newValue;
    console.log('Toggle state changed to:', newValue);
  }
});




chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'fillField') {
    chrome.storage.local.get('variablesFromBackend', (result) => {
      const variables = result.variablesFromBackend;
      console.log(variables);
      const fieldValue = variables[message.field];
      console.log(fieldValue);

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









var Email = "";
// to check if the website have be fully loaded
function initialize() {
  // chrome.runtime.sendMessage({ message: "getLoginEmail" });
  console.log("page is fully loaded");
  prefill()
}

window.addEventListener("load", initialize);

function prefill(){
    const inputFields = document.querySelectorAll<HTMLInputElement>("input");

  inputFields.forEach((input) => {
    // Check if the input does not have the class 'css-77hcv'
    if (!input.classList.contains('css-77hcv')) {
      // console.log("Clear input", input);
      input.value = "";  // Clear the input only if it does not have the class
    }
  });
  

  // check all checkboxes
  document
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((checkbox) => {
      // console.log("Checking unchecked",checkbox);
      // console.log("Checking unchecked",checkbox.selected);
      checkbox.checked = true;
    });

  // Reset radio buttons - You might want to handle this differently based on your requirements
  document
    .querySelectorAll<HTMLInputElement>('input[type="radio"]')
    .forEach((radio) => {
      // radio.checked = false; // or set a specific radio button in a group to checked based on your needs
      // console.log("Checking radio",radio);
    });

  // Reset select dropdowns to their first option or a default value
  document.querySelectorAll("select").forEach((select) => {
    select.selectedIndex = 0; // or set it to a specific index that represents the default value
  });

  document.querySelectorAll("form").forEach((form) => {
    form.reset();
  });

  checkInputFields();


}



chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.email) {
    // Handle the received email ID
    Email = request.email;
    // console.log("Received email ID:", request.email);

    // setTimeout(checkInputFields, 10000);
  }
  if (Email == null) {
    // createErrorFloatingPopup(0, "Please Google  Login", 1000);
    console.log("please Google Login");
  }
  
});

var userData;

//handle popup refetch button click
// In contentScript.js

// Function to handle button clicks
function handleButtonClick(event) {
  // Your code to handle button clicks
  // console.log("Button clicked!", event.target);
  // Perform other actions as needed
}

// Add event listeners to all button elements on the page
const allButtons = document.querySelectorAll("button");
allButtons.forEach((button) => {
  button.addEventListener("click", handleButtonClick);
});

// Function to be called when an input value changes
function handleInputChange(event) {
  // Your code to handle input changes
  // console.log("Input value changed:", event.target.value);
  // Perform other actions as needed
}

//For URL Generation 




// Find all button elements on the page
function checkInputFields() {
  const inputFields = document.querySelectorAll("input");
  const selectFields = document.querySelectorAll("select");

  if (inputFields.length > 0 || selectFields.length > 0) {
    chrome.storage.local.get(['formData'], (result) => {
      if (result.formData) {
        console.log(result.formData);
        dataFill(result.formData.data)
      }
      else {
        console.log("No data found");
      }
    });
  }
}


document.addEventListener(
  "mousedown",
  function (event) {

    if (event.button === 2) {
      // Right mouse button
      const lastClickedElement = event.target;

      dataFill(userData);
    }
  },
  true
);

function onPopButtonClick() {

  dataFill(userData);

}

const mapDetailRegex = {
  firstName:
    /first[-_ ]?name|fname|f[_]*name|given[_ ]?name|forename|personal[_ ]?name/gi,
  middleName: /middle[-_ ]?name|mname|m[_]*name|initial|middle[_ ]?initial/gi,
  lastName:
    /last[-_ ]?name|lname|l[_]*name|surname|family[_ ]?name|paternal[-_ ]?name|sir[_ ]?name/gi,
  fullName: 
    /(^|\b)full[\s-_]?name\b|(^|\b)user[\s-_]?name\b|given[\s-_]?name\(s\)?|(^|\b)complete[\s-_]?name\b|legal[_ ]?name|legal[\s-_ ]?name\s?\(first,middle,last\)/gi, // Updated regex to include "Legal name (first,middle,last)"
  preferredName:
    /preferred[-_ ]?name|nickname|alias|preferred[_ ]?first[_ ]?name/gi,
  familyName: /family[-_ ]?name|last[-_ ]?name/gi,
  zip: /zip(code)?|postal[-_ ]?code|post[_ ]?code/gi,
  phoneCode:
  /\b(?:country[_ ]?code|country[_ ]?phone|international[_ ]?code|intl[_ ]?code|dialing[_ ]?code)\b/gi,
  phoneNumber:
    /phone[-_ ]?(number)?\*?|mobile[-_ ]?(number)?\*?|telephone\*?|contact[_ ]?number|phone number/gi,
  email: /e[-_ ]?mail|email[-_ ]?address|email/gi,
  phoneAlternativeNumber:
    /alternate[-_ ]?phone|secondary[-_ ]?phone|alternative[_ ]?contact[_ ]?number/gi,
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
  expectedSalary:
    /expected[-_ ]?(salary|pay|compensation|wage(s)?)|salary[-_ ]?(expectation(s)?|range|desired|requirement(s)?)|desired[-_ ]?(salary|pay|compensation|wage(s)?)|compensation[_ ]?expectations/gi,
  password: /password|passcode|pwd/gi,
  confirmPassword:
    /confirm[-_ ]?password|verify[-_ ]?password|password[_ ]?confirmation/gi,
  employmentStatus: /employment[-_ ]?status|job[-_ ]?status|work[_ ]?status/gi,
  company: /company|employer|organization|company[_ ]?name/gi,
  jobTitle: /job[-_ ]?title|position|role|designation/gi,
  startDate:
    /start[-_ ]?date|date[-_ ]?of[-_ ]?entry|employment[_ ]?start[_ ]?date/gi,
  endDate:
    /end[-_ ]?date|date[-_ ]?of[-_ ]?leaving|employment[_ ]?end[_ ]?date/gi,
  educationLevel:
    /education[-_ ]?level|highest[-_ ]?qualification|academic[_ ]?level/gi,
  degree: /degree|qualification|degree[_ ]?title/gi,
  fieldOfStudy: /field[-_ ]?of[-_ ]?study|major|specialization/gi,
  school: /school|university|college|institution/gi,
  graduationDate: /graduation[-_ ]?date|date[_ ]?of[_ ]?graduation/gi,
  grossSalary:
    /gross[_ ]?salary|total[_ ]?earnings|annual[_ ]?income|salary[_ ]?before[_ ]?taxes/gi,
  noticePeriod:
    /notice[_ ]?period|availability|time[_ ]?to[_ ]?join|joining[_ ]?time/gi,
  howDidYouHearAboutUs:
    /how[_ ]?did[_ ]?you[_ ]?hear[_ ]?about[_ ]?us|source[_ ]?of[_ ]?application|referral[_ ]?source/gi,
  emailAddress: /e[-_ ]?mail[_ ]?address|email|contact[_ ]?email/gi,
  phoneDeviceType:
    /phone[_ ]?device[_ ]?type|mobile[_ ]?model|cell[_ ]?phone[_ ]?kind/gi,
  nationality:
    /nationality|citizen(ship)?|country[_\s-]?of[_\s-]?origin|passport[_\s-]?country/gi,
  prefix: /^(mr|ms|mrs|miss|dr|prof)\.?|prefix|title|salutation/gi,
  countryRegion:
    /country[_\s-]?region|region|area|location[_\s-]?code|geo(graphical)?[_\s-]?area|place[_\s-]?of[_\s-]?residence|residential[_\s-]?area|living[_\s-]?area|habitation[_\s-]?area|domicile/gi,
};

const selectInputRegex = {
  gender: /gender|gender*|sex/gi,
  country: /location|country|region|candidate-location/gi,
  state: /state|province|region/gi,
  employmentStatus: /employment[-_ ]?status|job[-_ ]?status/gi,
  phoneDeviceType:
    /phone[_ ]?device[_ ]?type|mobile[_ ]?model|cell[_ ]?phone[_ ]?kind/gi,
  location:
    /location|place[_ ]?of[_ ]?residence|work[_ ]?location|city|state/gi,
  howDidYouHearAboutUs:
    /how[_ ]?did[_ ]?you[_ ]?hear[_ ]?about[_ ]?us|source[_ ]?of[_ ]?application|referral[_ ]?source/gi,
  educationLevel:
    /education[-_ ]?level|highest[-_ ]?qualification|academic[_ ]?level/gi,
  degree: /degree|qualification|degree[_ ]?title/gi,
  fieldOfStudy: /field[-_ ]?of[-_ ]?study|major|specialization/gi,
  city: /city|town|locality|city[_ ]?name/gi,
  maritalStatus:
    /marital[_\s-]?status|marriage[_\s-]?status|civil[_\s-]?status|relationship[_\s-]?status/gi,
  servedInMilitary:
    /military[_\s-]?service|armed[_\s-]?forces[_\s-]?experience|veteran[_\s-]?status|service[_\s-]?record/gi,
  workedPreviously:
    /previous[_\s-]?employment|prior[_\s-]?job[_\s-]?experience|past[_\s-]?work|employment[_\s-]?history/gi,
  countryRegion:
    /country[_\s-]?region|region|area|location[_\s-]?code|geo(graphical)?[_\s-]?area|place[_\s-]?of[_\s-]?residence|residential[_\s-]?area|living[_\s-]?area|habitation[_\s-]?area|domicile/gi,
  nationality:
    /nationality|citizen(ship)?|country[_\s-]?of[_\s-]?origin|passport[_\s-]?country/gi,
  prefix: /prefix|title|salutation|(mr|ms|mrs|miss|dr|prof)\.?/gi,
  // You can add more fields as needed, following the same pattern.
};

const radioInputRegex = {
  gender: /male|female|other|prefer not to say/gi, // Regex pattern to match radio button values for gender
  // Other regex patterns...
};
const dateInputRegex = {
  dateOfBirth: /dob|date[-_ ]?of[-_ ]?birth|birth[-_ ]?date|birthdate/gi,
  startDate: /start[-_ ]?date|date[-_ ]?of[-_ ]?entry/gi,
  endDate: /end[-_ ]?date|date[-_ ]?of[-_ ]?leaving/gi,
  // other regex patterns...
};

const workExperienceRegex = {
  jobTitle: /job title|Job[_ -]?Title/gi,
  companyName: /company[_ -]?name|company/gi,
  description:
    /description|[a-zA-Z*0-9]*role[a-zA-Z*0-9]*description[a-zA-Z*0-9]*|role description/gi,
  location: /location|country|region|candidate-location/gi,
  stillWorking: /[a-zA-z*0-9]*still[_ -]working[a-zA-z*0-9]*/gi,
  startDate:
    /[a-zA-z*0-9]*start[_ -]?date[a-zA-z*0-9]*|[a-zA-z*0-9]*from[a-zA-z*0-9]*/gi,
  endDate: /[a-zA-z*0-9]*end[- _]?date[a-zA-z*0-9]*|to[a-zA-z*0-9]*/gi,
  skills: /skills/gi,
  linkedinUrl: /linkedin[-_ ]?url|linkedin[_ ]?profile|social network urls|Please provide a link to your LinkedIn profile:/gi,
};
const projectExperienceRegex = {
  projectName: /project[_ -]?name|project/gi,
  startDate:
    /[a-zA-z*0-9]*start[_ -]?date[a-zA-z*0-9]*|[a-zA-z*0-9]*from[a-zA-z*0-9]*/gi,
  endDate: /[a-zA-z*0-9]*end[- _]?date[a-zA-z*0-9]*|to[a-zA-z*0-9]*/gi,
  skills: /skills/gi,
  stillWorking:
    /[a-zA-z*0-9]*still[_ -]working[a-zA-z*0-9]*|ongoing[a-zA-z*0-9]*/gi,
  description:
    /description|[a-zA-z*0-9]*project[a-zA-z*0-9]* description[a-zA-z*0-9]*/gi,
  gitUrl: /git[_ -]?url|repository[_ -]?url|source[_ -]?code[_ -]?url/gi,
  hostUrl: /host[_ -]?url|live[_ -]?site[_ -]?url|demo[_ -]?url/gi,
};

const educationExperienceRegex = {
  courseName: /course[_ -]?name|program/gi,
  field: /field[_ -]?of[_ -]?study|major/gi,
  collegeName: /college[_ -]?name|university|institution/gi,
  startDate:
    /[a-zA-z*0-9]*start[_ -]?date[a-zA-z*0-9]*|[a-zA-z*0-9]*from[a-zA-z*0-9]*/gi,
  endDate: /[a-zA-z*0-9]*end[- _]?date[a-zA-z*0-9]*|to[a-zA-z*0-9]*/gi,
  skills: /skills/gi,
  stillStudying:
    /still[_ -]?studying|ongoing[_ -]?education|currently[_ -]?enrolled/gi,
  description: /description|course[_ -]?details|program[_ -]?overview/gi,
  grade: /grade|gpa|score|marks/gi,
  location: /location|campus|city|place/gi,
  educationType: /education[_ -]?type|degree[_ -]?level|certification/gi,
};

const dataFill = (data) => {
  console.log(data);
  // console.log("data", data);
  const userDetails = data.details;
  const userWorkExperience = data.workExperiences;
  const userProjectExperience = data.projectExperiences;
  const userEducationExperience = data.educationExperiences;

  const pageContent = document.body.innerText.toLowerCase();
  const allInnerTextArray = pageContent
    .split("\n")
    .filter((text) => text.trim() !== "");
  // console.log("pageContent", allInnerTextArray);
  // Combined regex patterns for each category
  const workExperienceRegexPattern =
    /\b(work[_ -]?experience|professional[_ -]?experience|employment[_ -]?history)\b/i;
  const educationExperienceRegexPattern =
    /\b(education[_ -]?experience|Education|academic[_ -]?background|educational[_ -]?history|studies)\b/i;
  const projectExperienceRegexPattern =
    /\b(project[_ -]?experience|project|portfolio|project[_ -]?histoconry)\b/i;

  function findElementByText(searchText, rootElement) {
    const lowerSearchText = searchText.toLowerCase();
    // console.log("rootElement: " + rootElement.innerText);
    // const pageContent = rootElement.textContent;
    // console.log("rootElement text: ",pageContent)
    // Splitting the textContent of the rootElement into an array by new lines
    const textSegments = rootElement.innerText.split("\n");

    // Filtering out empty strings that might be generated by consecutive newline characters
    const nonEmptyTextSegments = textSegments.filter(
      (segment) => segment.trim() !== ""
    );

    // Checking each segment for the presence of the searchText
    const foundSegments = nonEmptyTextSegments.filter((segment) =>
      segment.toLowerCase().includes(lowerSearchText)
    );
    // console.log("rootElement text found or not: ",foundSegments)
    // Using `Array.prototype.some` to check if any segment contains the searchText
    const isTextFound = nonEmptyTextSegments.some((segment) =>
      segment.toLowerCase().includes(lowerSearchText)
    );

    // console.log("Is text found?", isTextFound);

    if (!isTextFound) {
      // console.log("Found element null  element: ",rootElement)
      return null;
    } else if (isTextFound && rootElement.childElementCount < 1) {
      const element = rootElement;
      // console.log("Found actual leaf element element: ",element)
      return element;
    } else if (isTextFound && rootElement.childElementCount >= 1) {
      // console.log("Founding element parent: ",rootElement)
      const immediateChildren = rootElement.children;
      // console.log("iimmediateChildren", immediateChildren);
      // Get all child elements as an array
      //  console.log("innerHTML",rootElement.innerHTML)
      const childrenArray = Array.from(immediateChildren);
      // console.log(childrenArray)
      // If the element has children, recursively search them
      if (rootElement.childElementCount > 0) {
        for (const child of Array.from(rootElement.children)) {
          const foundElement = findElementByText(searchText, child);
          if (foundElement) {
            // If the child search is successful, return the found element
            return foundElement;
          }
        }
      }
    }
  }

  function findAllButtonsInParent(
    element: Element,
    parentTagName: string = "DIV"
  ): NodeListOf<HTMLButtonElement> | null {
    let currentElement: Element | null = element;
    let parentElement: HTMLElement | null = null;

    // Step 1: Find the parent div (or specified parent element)
    while (currentElement) {
      if (
        currentElement.parentElement &&
        currentElement.parentElement.tagName === parentTagName.toUpperCase()
      ) {
        parentElement = currentElement.parentElement as HTMLElement;
        break; // Found the parent element
      }
      currentElement = currentElement.parentElement;
    }

    // If no parent element is found, return null
    if (!parentElement) {
      // console.log(`No parent ${parentTagName} found for the given element.`);
      return null;
    }

    // Step 2: Find all buttons in the parent element
    let buttons = parentElement.querySelectorAll<HTMLButtonElement>("button");

    return buttons; // Returns all found button elements
  }


  function programmaticallyClickButtons(timesToClick, button, callback) {
    if (timesToClick <= 0) {
      // console.log("All buttons have been clicked.");
      if (callback) {
        callback(); // When finished with clicks, call the callback function
      }
      return; // Stop if no more clicks are needed
    }

    // Click the button
    button.click();
    // console.log("Button clicked! Remaining clicks:", timesToClick - 1);

    // Wait for a second before the next click
    setTimeout(() => {
      // Recursively click the rest of the buttons
      programmaticallyClickButtons(timesToClick - 1, button, callback);
    }, 1000);
  }

  // Usage:

  // Start with Work Experience
  if (pageContent.match(workExperienceRegexPattern)) {
    console.log("Work Experience content detected");
    let foundElement = findElementByText("Work Experience", document.body);

    if (foundElement) {
      let buttons = findAllButtonsInParent(foundElement);
      if (buttons.length > 0) {
        programmaticallyClickButtons(
          userWorkExperience.length,
          buttons[0],
          function () {
            // Work Experience has finished, now start Education Experience
            fillDetailsThenClickEducation();
          }
        );
      }
    }
  }

  function fillDetailsThenClickEducation() {
    // Assume fillDetails function exists and works correctly
    userWorkExperience.forEach((experience, index) => {
      console.log("Filling work experience", experience);
      fillDetails(experience, workExperienceRegex);
    });

    // Now check for Education Experience
    if (pageContent.match(educationExperienceRegexPattern)) {
      console.log("Education Experience content detected");
      let foundElement = findElementByText("Education", document.body);

      if (foundElement) {
        let buttons = findAllButtonsInParent(foundElement);
        if (buttons.length > 0) {
          // Only start clicking the education buttons after the work experiences have been filled
          programmaticallyClickButtons(
            userEducationExperience.length,
            buttons[0],
            function () {
              // Education Experience has finished, you can continue with other tasks or call another function here
              fillDetails(userDetails, mapDetailRegex);
              fillEducationDetails();
            }
          );
        }
      }
    }
  }

  function fillEducationDetails() {
    userEducationExperience.forEach((experience, index) => {
      console.log("Filling education experience", experience);
      fillDetails(experience, educationExperienceRegex);
    });
    // If there are more categories to fill, continue the chain here...
    // Now check for Education Experience
    if (pageContent.match(projectExperienceRegexPattern)) {
      console.log("Project Experience content detected");
      let foundElement = findElementByText("Project", document.body);

      if (foundElement) {
        let buttons = findAllButtonsInParent(foundElement);
        if (buttons.length > 0) {
          // Only start clicking the education buttons after the work experiences have been filled
          programmaticallyClickButtons(
            userProjectExperience.length,
            buttons[0],
            function () {
              // Education Experience has finished, you can continue with other tasks or call another function here
              fillProjectDetails();
            }
          );
        }
      }
    }
  }
  function fillProjectDetails() {
    userProjectExperience.forEach((experience, index) => {
      console.log("Filling project experience", experience);
      fillDetails(experience, projectExperienceRegex);
    });
  }



  // Search for elements that may have a dropzone attribute
  const dropZones = document.querySelectorAll(
    "[dropzone], [data-transfer], [data-dropzone],[data-upload],  .upload-area, .file-dropzone"
  );

  console.log("Detected potential drop zones:", dropZones.length);

  const uploaders = document.querySelectorAll(
    '[data-automation-id="file-upload-drop-zone"]'
  );
  console.log("Detected uploader:", uploaders);



  const cvField = document.querySelector('input[type="file"][name="resume"]');

  // Function to fetch and upload a file from a remote URL
// Function to fetch and upload a file from a remote URL
async function uploadFile(inputSelector, blobStorageUrl, fileName) {
  try {
    // Fetch the file from the blob storage URL
    const response = await fetch(blobStorageUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/octet-stream'
      }
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok ${response.statusText}`);
    }

    // Convert the response to a blob
    const blob = await response.blob();

    // Create a file in memory
    const file = new File([blob], fileName, { type: blob.type });

    // Create a DataTransfer object
    const dt = new DataTransfer();

    // Add the file to the DataTransfer object
    dt.items.add(file);

    // Get the file input element on the page
    const inputElement = document.querySelector(inputSelector);

    if (!inputElement) {
      throw new Error("File input element not found");
    }

    // Set the files property with our DataTransfer files list
    inputElement.files = dt.files;

    // Dispatch a 'change' event on the input to trigger any event handlers
    const event = new Event("change", { bubbles: true });
    inputElement.dispatchEvent(event);

    console.log("File upload successful");
  } catch (error) {
    console.error("File upload failed:", error);
  }
}

// Resume fill function
async function fillResume() {
  try {
    chrome.storage.local.get(['resumeBase64'], async (result) => {
      if (result.resumeBase64) {
        const resumeUrl = `data:application/pdf;base64,${result.resumeBase64}`;
        // console.log('Resume URL:', resumeUrl);

        await uploadFile(
          'input[type="file"][name="resume"]',
          resumeUrl,
          'resume.pdf'
        );
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
    chrome.storage.local.get(['cvBase64'], async (result) => {
      if (result.cvBase64) {
        const cvUrl = `data:application/pdf;base64,${result.cvBase64}`;
        // console.log('Resume URL:', cvUrl);

        await uploadFile(
          'input[type="file"][name="cv"]',
          cvUrl,
          'cv.pdf'
        );
      } else {
        console.error("Cv Base64 string not found in storage");
      }
    });
  } catch (error) {
    console.error("Error in fillResume:", error);
  }
}

fillCV();
fillResume();

 

  fillDetails(userDetails, mapDetailRegex);
  

  return;
};

const fillDetails = (userDetails, regexMap) => {
  const inputElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  const selectFields = document.querySelectorAll<HTMLSelectElement>("select");
  console.log("fields:", inputElements);
  const filledFields = {};
  const fieldMappings = {};
  const fillInputField = (userDetails, regexMap) => {
    // const inputElements = document.querySelectorAll("input[type='text'], input:not([type])");

    inputElements.forEach((input,index) => {
      let matchFound = false;
      let matchedKey = null;

      if (input.value) {
        return;
      }

      // First, check the input element's attributes for a regex match
      for (let key in regexMap) {
        if (matchFound) break; // If a match is found, exit the loop

        // Check various attributes of the input element
        const attributesToCheck = [
          "name",
          "id",
          "class",
          "title",
          "placeholder",
        ];
        attributesToCheck.some((attr) => {
          const value = input.getAttribute(attr);
          // console.log("value",value);
          if (value && regexMap[key].test(value)) {
            // console.log("value here",value,key);
            matchFound = true;
            matchedKey = key;
            return true; // Match found, break the some() loop
          }
          return false; // No match, continue the some() loop
        });

        // Check the associated label if a match hasn't been found
        if (!matchFound && input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label && regexMap[key].test(label.textContent)) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      // Then, check parent elements for a regex match
      if (!matchFound) {
        let parentElement = input.parentElement;
        while (!matchFound && parentElement) {
          // Get the text content of the parent element and trim it
          const parentText = parentElement.textContent.trim();
          // console.log("parentText", parentText);

          // Split the text content into an array of lines

          const lines = getTextLines(parentElement);
          // console.log("lines", lines);
          // If there are more than a certain number of lines, it's likely not a match
          if (lines.length > 2) break;

          // Check each line for a regex match
          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              // console.log("Match found for key:", key, "with line:", lineMatch);
              matchFound = true;
              matchedKey = key;
              break; // Match found, break the loop
            }
          }

          // Move up to check the next parent element
          parentElement = parentElement.parentElement;
        }
      }

      // If a match is found, set the value of the input element
      if (matchFound && matchedKey && userDetails[matchedKey]) {
        // console.log("match found", matchedKey,userData[matchedKey]);
        input.value = userDetails[matchedKey];
        // Trigger change and input events
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        filledFields[matchedKey] = userDetails[matchedKey];
        fieldMappings[matchedKey] = { index: index };

        console.log(fieldMappings);
        delete userDetails[matchedKey];
      }
     
    });
  };

  fillInputField(userDetails, regexMap);
  const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
  };
  
  // Check if fieldMappings is not empty before saving to localStorage
  if (!isEmptyObject(fieldMappings)) {
    localStorage.setItem('fieldMappings', JSON.stringify(fieldMappings));
    console.log('fieldMappings saved to localStorage:', fieldMappings);
  } else {
    console.log('fieldMappings is empty, not saving to localStorage');
  }

  function getTextLines(element) {
    let lines = [];
    let currentLine = "";

    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        // Append text nodes to the current line
        currentLine += node.textContent.trim();
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // If we hit a block-level element, treat it as a new line
        if (
          ["DIV", "P", "LABEL", "H1", "H2", "H3", "H4", "H5", "H6"].includes(
            node.tagName
          )
        ) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = "";
          }
          // Recursively traverse the block-level element
          Array.from(node.childNodes).forEach(traverse);
        } else {
          // Inline elements don't start a new line but may contain text or other inline elements
          Array.from(node.childNodes).forEach(traverse);
        }
      }
    }

    // Start the traversal from the provided element
    traverse(element);

    // If there's any remaining text, add it as a line
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  const fillSelectField = (userDetails, regexMap) => {
    const selectElements = document.querySelectorAll<HTMLSelectElement>('select, [role="option"], [role="listbox"], [role="generic"]');
    
    selectElements.forEach((select) => {
      let matchFound = false;
      let matchedKey = null;
  
      // First, check the select element's attributes for a regex match
      for (let key in regexMap) {
        if (matchFound) break; // If a match is found, exit the loop
  
        // Check various attributes of the select element
        const attributesToCheck = ["name", "id", "class", "title", "placeholder"];
        attributesToCheck.some((attr) => {
          const value = select.getAttribute(attr);
          if (value && regexMap[key].test(value)) {
            matchFound = true;
            matchedKey = key;
            return true; // Match found, break the some() loop
          }
          return false; // No match, continue the some() loop
        });
  
        // Check the associated label if a match hasn't been found
        if (!matchFound && select.id) {
          const label = document.querySelector(`label[for="${select.id}"]`);
          if (label && regexMap[key].test(label.textContent)) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }
  
      if (!matchFound) {
        let parentElement = select.parentElement;
        while (!matchFound && parentElement) {
          const lines = getTextLines(parentElement); // Get text lines from parent element
          if (lines.length > 2) break; // If too many lines, it's probably not a label
  
          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              matchFound = true;
              matchedKey = key;
              break; // Match found, break the loop
            }
          }
  
          parentElement = parentElement.parentElement; // Check the next parent
        }
      }
  
      // If a match is found, set the value of the select element
      if (matchFound && matchedKey && userDetails[matchedKey]) {
        const selectValue = userDetails[matchedKey];
        Array.from(select.options).forEach((option) => {
          if (option.text === selectValue || option.value === selectValue) {
            select.value = option.value;
            // Trigger change and input events
            select.dispatchEvent(new Event("change", { bubbles: true }));
            select.dispatchEvent(new Event("input", { bubbles: true }));
            filledFields[matchedKey] = userDetails[matchedKey];
          }
        });
      }
    });
  };
  
  fillSelectField(userDetails, selectInputRegex);

  function matchIgnoringExtras(value1, value2) {
    // Remove all non-word characters and spaces from both strings
    // and compare them in lower case.
    const cleanValue1 = value1.replace(/\W+|\s+/g, "").toLowerCase();
    const cleanValue2 = value2.replace(/\W+|\s+/g, "").toLowerCase();

    // Check if the cleaned strings are equal
    return cleanValue1 === cleanValue2;
  }

  // // Example usage:
  // const radioValue = "male";
  // const regexPattern = /male|female|other|prefer not to say/gi;

  const fillRadioButton = (userDetails, regexMap) => {
    // Select all radio input elements
    const radioButtons = document.querySelectorAll<HTMLInputElement>(
      "input[type='radio']"
    );

    radioButtons.forEach((radio) => {
      let matchFound = false;
      let matchedKey = null;
      // console.log("radio: " + radio.value)
      const radioValue = radio.value || "";
      // Check if the radio button's value matches any regex and find the corresponding user detail key
      for (let key in regexMap) {
        // console.log("radio inner: " + radioValue.trim().toLowerCase(), regexMap[key]);
        // const regexAsString = regexMap[key].toString().replace(/\/gi$/, '').replace(/^\//, ''); // Convert regex to string and remove the slashes and flags
        // console.log(matchIgnoringExtras(radio.value.trim, regexAsString)); // This will log 'true' or 'false'
        // console.log(radio.value.trim().toLowerCase()===regexMap[key])
        // regexMap[key].test(label.textContent)
        if (regexMap[key].test(radioValue.toLowerCase())) {
          // console.log("here......", radioValue)
          matchedKey = key;
          matchFound = true;
          break; // Match found, break the loop
        }
      }
      // console.log("match key: " , matchedKey,matchFound);

      // If a match is found and the user detail exists, set the radio button as checked
      if (matchFound && matchedKey && userDetails[matchedKey]) {
        // console.log("setting radio",userDetails[matchedKey].toLowerCase(),radioValue.toLowerCase())
        if (
          userDetails[matchedKey].toLowerCase() === radioValue.toLowerCase()
        ) {
          // console.log("user detail key: " + userDetails[matchedKey])
          radio.checked = true;
          // Trigger the 'change' event to ensure any associated event handlers are activated
          radio.dispatchEvent(new Event("change", { bubbles: true }));
          filledFields[matchedKey] = userDetails[matchedKey];
        }
      }
    });
  };

  fillRadioButton(userDetails, radioInputRegex);

  const fillDateField = (userDetails, regexMap) => {
    const dateInputs =
      document.querySelectorAll<HTMLInputElement>("input[type='date']");

    dateInputs.forEach((input) => {
      let matchFound = false;
      let matchedKey = null;

      // Check the input element's attributes for a regex match
      for (let key in regexMap) {
        if (matchFound) break;

        const attributesToCheck = [
          "name",
          "id",
          "class",
          "title",
          "placeholder",
        ];
        attributesToCheck.some((attr) => {
          const value = input.getAttribute(attr);
          if (value && regexMap[key].test(value)) {
            matchFound = true;
            matchedKey = key;
            return true;
          }
          return false;
        });

        // Check the associated label if a match hasn't been found
        if (!matchFound && input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label && regexMap[key].test(label.textContent.trim())) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      // Check parent elements for a match if needed
      if (!matchFound) {
        let parentElement = input.parentElement;
        while (!matchFound && parentElement) {
          const lines = getTextLines(parentElement); // Get text lines from parent element
          if (lines.length > 2) break; // If too many lines, it's probably not a label

          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              matchFound = true;
              matchedKey = key;
              break; // Match found, break the loop
            }
          }

          parentElement = parentElement.parentElement; // Check the next parent
        }
      }

      // If a match is found, set the value of the date input
      if (matchFound && matchedKey && userDetails[matchedKey]) {
        input.value = userDetails[matchedKey]; // Directly assign the value
        // Trigger change and input events
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("input", { bubbles: true }));

        filledFields[matchedKey] = userDetails[matchedKey];
      }
    });
  };

  fillDateField(userDetails, dateInputRegex);
  console.log("All filled fields:", filledFields); // Log all filled fields

  // Send filled fields to background.js
  if (Object.keys(filledFields).length > 0) {
    chrome.runtime.sendMessage({ action: 'filledFields', data: filledFields });
  }
  
};

function createFloatingPopup(count: number) {
  const popupDiv = document.createElement("div");

  // Apply styles to position the popup at the top-right corner
  popupDiv.style.position = "fixed";
  popupDiv.style.top = "10px"; // Adjust this to set the distance from the top
  popupDiv.style.right = "10px"; // Adjust this to set the distance from the right
  popupDiv.style.height = "50px";
  popupDiv.style.backgroundColor = "black"; // Customize popup styles
  popupDiv.style.border = "1px solid black"; // Customize popup styles
  popupDiv.style.zIndex = "1000";
  popupDiv.style.transition = "0.3s ease"; // Adding transition for smooth animation
  popupDiv.style.borderTopLeftRadius = "15px"; // Adding border radius to the top-left corner
  popupDiv.style.borderBottomLeftRadius = "15px"; // Adding border radius to the bottom-left corner

  popupDiv.style.display = "flex"; // Use flex display
  popupDiv.style.alignItems = "center"; // Center items vertically

  // Add the popup to the page
  document.body.appendChild(popupDiv);

  // Create and style the button
  const button = document.createElement("button");
  button.textContent = "Button";
  button.style.backgroundColor = "black"; // Customize button styles
  button.style.color = "white"; // Customize button styles
  button.style.border = "1px solid black"; // Customize button styles
  button.style.padding = "5px 10px"; // Adjust padding as needed
  popupDiv.appendChild(button);

  // Create and style the text content
  const textContent = document.createElement("div");
  textContent.textContent = "Fields: " + count;
  textContent.style.marginLeft = "10px"; // Adjust spacing between button and text
  textContent.style.color = "white"; // Customize text styles

  // Functionality for hover effect and animation
  popupDiv.addEventListener("mouseenter", () => {
    popupDiv.appendChild(textContent);
    // popupDiv.style.right = "150px"; // Slide to the left
  });

  popupDiv.addEventListener("mouseleave", () => {
    popupDiv.style.right = "10px"; // Return to the original position
    popupDiv.style.right = "10px"; // Return to the original position
    if (popupDiv.contains(textContent)) {
      popupDiv.removeChild(textContent); // Remove the text content
    }
  });

  // Close button event listener
  button.addEventListener("click", () => {
    // document.body.removeChild(popupDiv);
    onPopButtonClick();
  });
}

function createErrorFloatingPopup(
  count: number,
  message: string = "",
  duration: number = 10000
) {
  const popupDiv = document.createElement("div");

  // Apply styles to position the popup at the top-right corner
  popupDiv.style.position = "fixed";
  popupDiv.style.top = "10px";
  popupDiv.style.right = "10px";
  popupDiv.style.minHeight = "50px";
  popupDiv.style.backgroundColor = "#333"; // Darker background
  popupDiv.style.color = "white"; // Text color
  popupDiv.style.padding = "10px";
  popupDiv.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  popupDiv.style.zIndex = "10000";
  popupDiv.style.display = "flex";
  popupDiv.style.justifyContent = "center";
  popupDiv.style.alignItems = "center";
  popupDiv.style.borderRadius = "5px";
  popupDiv.innerHTML = message; // Set the message

  // Add the popup to the page
  document.body.appendChild(popupDiv);

  // Fade out and remove the popup after a specified duration if not a manual close type
  if (duration > 0) {
    setTimeout(() => {
      popupDiv.style.transition = "opacity 0.5s ease";
      popupDiv.style.opacity = "0";
      setTimeout(() => document.body.removeChild(popupDiv), 500); // Wait for fade out to finish
    }, duration);
  }
}

// Modify the existing logic to use the modified createFloatingPopup function
// Check if Email is not received and then show the login prompt
chrome.runtime.sendMessage(
  { message: "getLoginEmail" },
  function (response) {}
);
