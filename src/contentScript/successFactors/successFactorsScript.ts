// SuccessFactors Application Autofill Script
// This script will autofill the SAP SuccessFactors application form using dummy data.
import { uploadResumeToSuccessFactors } from './documentUpload';
import dummyData from '../../../dummy_data.json';
import { 
  selectCountryDropdown, 
  selectRecruiterContactDropdown, 
  selectStateDropdown, 
  selectEducationLevelDropdown, 
  selectCompletionLevelDropdown, 
  selectStudyRegionDropdown,
  selectStudyCountryDropdown, 
  selectStudySchoolDropdown, 
  selectTravelPercentageDropdown 
} from './dropDownLogic';
import { autofillWorkExperience } from './experienceHandler';
import { autofillEducation } from './educationHandler';
import { fillJobSpecificInfoForm } from './jobSpecificInfo';


function isSuccessFactorsPage(): boolean {
  return window.location.href.includes('career5.successfactors.eu');
}

export function autofillSuccessFactorsForm() {
  if (!isSuccessFactorsPage()) return;

  // Wait for the form to load completely
  setTimeout(() => {
    const fieldMappings = [
      { name: 'firstName', dummyKey: 'firstName' },
      { name: 'middleName', dummyKey: 'middleName' },
      { name: 'lastName', dummyKey: 'lastName' },
      { name: 'contactEmail', dummyKey: 'email' },
      { name: 'cellPhone', dummyKey: 'phoneNumber' },
      { name: 'address', dummyKey: 'address1' },
      { name: 'customAddress2', dummyKey: 'address2' },
      { name: 'city', dummyKey: 'city' },
      { name: 'zip', dummyKey: 'zip' }
    ];

    // Fill text fields
    fieldMappings.forEach(field => {
      const selectors = [
        `input[name="${field.name}"]`,
        `input[data-testid="sfTextField"][name="${field.name}"]`,
        `input[id*="_txtFld"][name="${field.name}"]`,
        `input[id="${field.name}"]`,
        `input[name="${field.name}"][data-testid="sfTextField"]`
      ];
      let input: HTMLInputElement | null = null;
      for (const selector of selectors) {
        input = document.querySelector(selector) as HTMLInputElement;
        if (input) break;
      }
      const value = (dummyData as any)[field.dummyKey];
      if (input && value) {
        input.focus();
        input.value = '';
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
        input.dispatchEvent(new Event('keyup', { bubbles: true }));
      }
    });

    // Autofill dropdowns sequentially (country first, then state)
    const autofillDropdowns = async () => {
      if (dummyData.country) {
        const countrySelected = await selectCountryDropdown(dummyData.country);

        // Only select state after country is successfully selected
        if (countrySelected && dummyData.state) {
          setTimeout(() => {
            selectStateDropdown(dummyData.state);
          }, 1500);
        }
      }

      // Independent dropdowns
      if (dummyData.recruiterContact) {
        selectRecruiterContactDropdown(dummyData.recruiterContact);
      }

      if (dummyData.travelPercentage) {
        selectTravelPercentageDropdown(dummyData.travelPercentage);
      }

      if (dummyData.educationLevel) {
        selectEducationLevelDropdown(dummyData.educationLevel);
      }

      if (dummyData.completionLevel) {
        selectCompletionLevelDropdown(dummyData.completionLevel);
      }

      if (dummyData.studyRegion) {
        const studyRegionSelected = await selectStudyRegionDropdown(dummyData.studyRegion);

        if (studyRegionSelected && dummyData.studyCountry) {
          setTimeout(async () => {
            const studyCountrySelected = await selectStudyCountryDropdown(dummyData.studyCountry);

            if (studyCountrySelected && dummyData.studySchool) {
              setTimeout(() => {
                selectStudySchoolDropdown(dummyData.studySchool);
              }, 2000);
            }
          }, 1500);
        }
      }
    };

    autofillDropdowns();

    // Autofill work experience and then education
    setTimeout(async () => {
      console.log('Starting work experience autofill...');
      await autofillWorkExperience();

      // Add a pause before starting education
      setTimeout(async () => {
        console.log('Starting education autofill...');
        const eduDone = await autofillEducation();

        // After education completes, move to job-specific info
       if (eduDone) {
  console.log('Education completed.');

  console.log('Starting job-specific info autofill...');
  setTimeout(async () => {
    try {
      // Fill the job-specific section
      await fillJobSpecificInfoForm();

      // Upload resume to SuccessFactors
      await uploadResumeToSuccessFactors();

      // After everything is filled, directly click the Apply button (no confirmation)
     /* setTimeout(() => {
        const applyButton = document.querySelector(
          'span.rcmSaveButton[id="281:_submitBtn"]'
        ) as HTMLElement;

        if (applyButton) {
          console.log("Clicking the Apply button...");
          applyButton.click();
        } else {
          console.warn("Apply button not found!");
        }
      }, 3000);*/

    } catch (error) {
      console.error("Error in job-specific info autofill:", error);
    }
  }, 4000);
}

      }, 5000);
    }, 8000); // Wait for all dropdowns to complete before starting
  }, 2000);
}

window.addEventListener('load', autofillSuccessFactorsForm);
