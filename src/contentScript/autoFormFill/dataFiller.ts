import { 
    mapDetailRegex, 
    workExperienceRegex, 
    projectExperienceRegex, 
    educationExperienceRegex 
  } from './regexPatterns';
  import { fillDetails } from './fieldFiller';
  import { findElementByText, findAllButtonsInParent, programmaticallyClickButtons } from './utils';
  import { fillResume, fillCV } from './fileUploader';
  import { getToggleState } from '../../utils/storageHandler';
  
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