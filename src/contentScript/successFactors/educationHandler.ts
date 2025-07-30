import dummyData from '../../../dummy_data.json';
import { selectCountryDropdown } from './dropDownLogic';  // <-- Make sure this path is correct

export interface EducationData {
  collegeName: string;
  degree: string;
  fieldOfStudy: string;
  country: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

/**
 * Dynamically selects an option in a dropdown using aria-label,
 * polling until the option appears.
 */
async function selectDropdownOptionDynamic(
  label: string,
  value: string,
  maxWaitMs: number = 8000
): Promise<boolean> {
  console.log(`Attempting to select '${value}' for '${label}'`);

  const inputSelector = `input[aria-label="More options for ${label}"]`;
  const buttonSelector = `button[aria-label="More options for ${label}"]`;

  const input = document.querySelector<HTMLInputElement>(inputSelector);
  const button = document.querySelector<HTMLElement>(buttonSelector);

  const target = input || button;
  if (!target) {
    console.warn(`Dropdown control not found for label: ${label}`);
    return false;
  }

  target.click();
  await new Promise(r => setTimeout(r, 500));

  const startTime = Date.now();
  let found = false;

  if (input) {
    input.focus();
    input.value = value.substring(0, 6);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 500));
  }

  while (Date.now() - startTime < maxWaitMs) {
    const anchors = Array.from(document.querySelectorAll('a[role="menuitem"]')) as HTMLElement[];
    const match = anchors.find(a => a.getAttribute('title')?.toLowerCase() === value.toLowerCase());

    if (match) {
      match.click();
      console.log(`✅ Selected: ${value}`);
      found = true;
      break;
    }

    await new Promise(r => setTimeout(r, 400));
  }

  if (!found) {
    console.warn(`❌ Could not select '${value}' for '${label}'`);
  }

  return found;
}

/**
 * Expands the Education section if collapsed.
 */
async function expandEducationSection(): Promise<HTMLElement | null> {
  const headers = Array.from(document.querySelectorAll('button.topBar')) as HTMLElement[];
  const header = headers.find(btn => btn.textContent?.trim().includes('Education'));
  if (!header) {
    console.log('Education section header not found');
    return null;
  }

  const isExpanded = header.getAttribute('aria-expanded') === 'true';
  if (!isExpanded) {
    console.log('Expanding Education section...');
    header.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const sectionContentId = header.id.replace(':topBar', ':sectionContent');
  const sectionContent = document.getElementById(sectionContentId) as HTMLElement | null;
  return sectionContent;
}

/**
 * Fill one Education form row (always fills the last added row)
 */
async function fillEducationForm(edu: any, index: number, sectionContent: HTMLElement): Promise<void> {
  console.log(`Filling education form ${index + 1}`);

  await new Promise(resolve => setTimeout(resolve, 1500));

  const allSchoolFields = document.querySelectorAll<HTMLInputElement>(
    'input[data-testid="sfTextField"][name="VFLD1"]'
  );
  const schoolField = allSchoolFields[allSchoolFields.length - 1];

  if (!schoolField) {
    console.error('Could not find current education row (VFLD1 input not found).');
    return;
  }

  // Fill school/college
  schoolField.focus();
  schoolField.value = edu.collegeName;
  schoolField.dispatchEvent(new Event('input', { bubbles: true }));
  schoolField.dispatchEvent(new Event('change', { bubbles: true }));
  schoolField.dispatchEvent(new Event('blur', { bubbles: true }));
  console.log(`✅ Entered College/University: ${edu.collegeName}`);

  const startYear = edu.startDate.substring(0, 4);
  const endYear = edu.endDate.substring(0, 4);

  // Use dynamic dropdown for Country (fixes static click issue)
  await selectDropdownOptionDynamic('Country', edu.country);

  // Remaining dropdowns (use generic)
  await selectDropdownOptionDynamic('Degree', edu.degree);
  await selectDropdownOptionDynamic('Area of Study', edu.fieldOfStudy);
  await selectDropdownOptionDynamic('Start Year', startYear);
  await selectDropdownOptionDynamic('End Year', endYear);
}

/**
 * Autofill the Education section
 */
export async function autofillEducation(): Promise<boolean> {
  try {
    console.log('Starting autofillEducation...');

    const sectionContent = await expandEducationSection();
    if (!sectionContent) {
      console.log('Education section not found');
      return false;
    }

    const addButton = sectionContent.querySelector('.addRowButton') as HTMLElement | null;
    if (!addButton) {
      console.log('Add button not found in Education section');
      return false;
    }

    const educations = (dummyData as any).educationExperiences;
    if (!educations || !Array.isArray(educations)) {
      console.log('No education data found in dummy data');
      return false;
    }

    for (let i = 0; i < educations.length; i++) {
      console.log(`Adding education entry ${i + 1}`);
      addButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000));
      await fillEducationForm(educations[i], i, sectionContent);
      console.log(`✅ Filled Education form ${i + 1}`);
    }

    return true;
  } catch (err) {
    console.error('Error autofilling education:', err);
    return false;
  }
}
