// SuccessFactors Application Autofill Script
// This script will autofill the SAP SuccessFactors application form using dummy data.

import dummyData from '../../../dummy_data.json';
import { selectCountryDropdown, selectRecruiterContactDropdown, selectStateDropdown, selectEducationLevelDropdown, selectCompletionLevelDropdown, selectStudyRegionDropdown, selectStudyCountryDropdown, selectStudySchoolDropdown } from './dropDownLogic';

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
      { name: 'zip', dummyKey: 'postalCode' }
    ];

    fieldMappings.forEach(field => {
      const selectors = [
        `input[name="${field.name}"]`,
        `input[data-testid="sfTextField"][name="${field.name}"]`,
        `input[id*="_txtFld"][name="${field.name}"]`,
        `input[id="${field.name}"]`,
        `input[name="${field.name}"][data-testid="sfTextField"]`
      ];
      let input = null;
      for (const selector of selectors) {
        input = document.querySelector(selector) as HTMLInputElement;
        if (input) break;
      }
      const value = dummyData[field.dummyKey];
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
          }, 1500); // Wait for country selection to complete and state options to load
        }
      }

      // Autofill recruiter contact dropdown (independent of country/state)
      if (dummyData.recruiterContact) {
        selectRecruiterContactDropdown(dummyData.recruiterContact);
      }

      // Autofill education level dropdown (independent)
      if (dummyData.educationLevel) {
        selectEducationLevelDropdown(dummyData.educationLevel);
      }

      // Autofill completion level dropdown (independent)
      if (dummyData.completionLevel) {
        selectCompletionLevelDropdown(dummyData.completionLevel);
      }

      // Autofill study region dropdown (independent)
      if (dummyData.studyRegion) {
        const studyRegionSelected = await selectStudyRegionDropdown(dummyData.studyRegion);
        
        // Only select study country after study region is successfully selected
        if (studyRegionSelected && dummyData.studyCountry) {
          setTimeout(async () => {
            const studyCountrySelected = await selectStudyCountryDropdown(dummyData.studyCountry);
            
            // Only select study school after study country is successfully selected
            if (studyCountrySelected && dummyData.studySchool) {
              setTimeout(() => {
                selectStudySchoolDropdown(dummyData.studySchool);
              }, 2000); // Wait for country selection to complete and school options to load
            }
          }, 1500); // Wait for region selection to complete and country options to load
        }
      }
    };

    autofillDropdowns();
  }, 2000);
}

window.addEventListener('load', autofillSuccessFactorsForm);
