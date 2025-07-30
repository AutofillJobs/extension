// Work Experience Handler for SuccessFactors
// This module handles clicking the add button and filling work experience entries

import dummyData from '../../../dummy_data.json';

export interface WorkExperience {
  jobTitle: string;
  companyName: string;
  startDate: string; // MM/DD/YYYY
  endDate: string;
  skills: string[];
  stillWorking: boolean;
  description: string;
  location: string;
  workType: string;
}

/**
 * Helper to dynamically select from a dropdown with polling.
 * Waits up to maxWaitMs for the option to appear.
 */
async function selectDropdownOptionDynamic(
  inputSelector: string,
  optionTitle: string,
  maxWaitMs: number = 5000
): Promise<void> {
  const allInputs = document.querySelectorAll(inputSelector);
  const input = allInputs[allInputs.length - 1] as HTMLInputElement;

  if (!input) {
    console.log(`❌ Dropdown input not found for ${optionTitle}`);
    return;
  }

  // Open the dropdown
  input.click();
  console.log(`🔍 Opened dropdown for: ${optionTitle}`);

  const start = Date.now();
  let optionFound = false;

  // Keep polling until the option appears or timeout
  while (Date.now() - start < maxWaitMs) {
    const option = Array.from(
      document.querySelectorAll(`a[title="${optionTitle}"]`)
    ).find((el) => el.getAttribute('role') === 'menuitem') as HTMLElement;

    if (option) {
      option.click();
      console.log(`✅ Selected: ${optionTitle}`);
      optionFound = true;
      break;
    }

    // Wait 300ms before trying again
    await new Promise((r) => setTimeout(r, 300));
  }

  if (!optionFound) {
    console.log(`❌ Option "${optionTitle}" not found within ${maxWaitMs}ms`);
  }
}

/**
 * Fill the work experience form fields
 */
async function fillWorkExperienceForm(
  experience: WorkExperience,
  index: number
): Promise<boolean> {
  try {
    console.log(`Starting to fill work experience form ${index + 1}`);

    await new Promise((resolve) => setTimeout(resolve, 1500)); // wait for UI components

    // --- Fill Employer ---
    const allEmployerFields = document.querySelectorAll(
      'input[data-testid="sfTextField"][name="VFLD1"]'
    );
    const employerField = allEmployerFields[
      allEmployerFields.length - 1
    ] as HTMLInputElement;
    if (employerField) {
      employerField.focus();
      employerField.value = experience.companyName;
      employerField.dispatchEvent(new Event('input', { bubbles: true }));
      employerField.dispatchEvent(new Event('change', { bubbles: true }));
      employerField.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(
        `✅ Filled Employer (${index + 1}): ${experience.companyName}`
      );
    } else {
      console.log('❌ Employer field not found');
    }

    // --- Fill Position Title ---
    const allPositionFields = document.querySelectorAll(
      'input[data-testid="sfTextField"][name="VFLD4"]'
    );
    const positionField = allPositionFields[
      allPositionFields.length - 1
    ] as HTMLInputElement;
    if (positionField) {
      positionField.focus();
      positionField.value = experience.jobTitle;
      positionField.dispatchEvent(new Event('input', { bubbles: true }));
      positionField.dispatchEvent(new Event('change', { bubbles: true }));
      positionField.dispatchEvent(new Event('blur', { bubbles: true }));
      console.log(
        `✅ Filled Position Title (${index + 1}): ${experience.jobTitle}`
      );
    } else {
      console.log('❌ Position Title field not found');
    }

    // --- Select Country ---
    console.log('Selecting country...');
    await selectDropdownOptionDynamic(
      'input[id$="_input"][title="More options for Country"]',
      'United States'
    );

    // --- Select Functional Area ---
    console.log('Selecting functional area...');
    await selectDropdownOptionDynamic(
      'input[id$="_input"][title="More options for Functional Area"]',
      'Information Technology'
    );

    // --- Select Industry ---
    console.log('Selecting industry...');
    await selectDropdownOptionDynamic(
      'input[id$="_input"][title="More options for Industry"]',
      'High Tech'
    );

    console.log(`✅ Work experience form ${index + 1} filled successfully`);
    return true;
  } catch (error) {
    console.error(`Error filling work experience form ${index}:`, error);
    return false;
  }
}

/**
 * Click the add button and fill work experience entries
 */
export async function autofillWorkExperience(): Promise<boolean> {
  try {
    const addButton =
      (document.querySelector(
        'div[role="button"][title="Add new row"].addRowButton'
      ) as HTMLElement) ||
      (document.querySelector(
        'div[id*="_addRowBtn"][class*="addRowButton"]'
      ) as HTMLElement) ||
      (document.querySelector(
        'div[title="Add new row"][onclick*="_addRow"]'
      ) as HTMLElement);

    if (!addButton) {
      console.log('Work experience add button not found');
      return false;
    }

    const experiences = dummyData.workExperiences as WorkExperience[];
    if (!experiences || !Array.isArray(experiences)) {
      console.log('No work experience data found in dummy data');
      return false;
    }

    for (let i = 0; i < experiences.length; i++) {
      const exp = experiences[i];
      console.log(`Adding work experience ${i + 1}: ${exp.jobTitle} at ${exp.companyName}`);

      addButton.click();
      await new Promise(res => setTimeout(res, 3000));

      const success = await fillWorkExperienceForm(exp, i);
      if (!success) {
        console.log(`Failed to fill work experience ${i + 1}`);
        break;
      }

      await new Promise(res => setTimeout(res, 1000));
    }

    return true;
  } catch (err) {
    console.error('Error autofilling work experience:', err);
    return false;
  }
}
