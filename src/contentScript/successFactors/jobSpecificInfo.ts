export async function fillJobSpecificInfoForm(): Promise<void> {
  console.log("Starting job-specific info autofill...");

  // Open the Job-Specific Information section
  const sectionButton = document.getElementById('280:topBar') as HTMLButtonElement;
  if (sectionButton) {
    sectionButton.click();
    console.log('Opened Job-Specific Information section');
    await new Promise(r => setTimeout(r, 1500));
  } else {
    console.warn('Job-Specific Information section button not found');
    return;
  }

  // 1. Tick the consent checkbox
  const consentCheckbox = document.getElementById('223:') as HTMLInputElement;
  if (consentCheckbox && !consentCheckbox.checked) {
    consentCheckbox.click();
    console.log('Checked consent checkbox');
    await new Promise(r => setTimeout(r, 1000));
  }

  // Generic helper to select from dropdown
  const selectDropdownOption = async (
    buttonId: string,
    optionText: string,
    extraDelay: number = 2000
  ) => {
    const button = document.getElementById(buttonId) as HTMLButtonElement;
    if (!button) {
      console.warn(`Button with ID ${buttonId} not found`);
      return false;
    }

    button.click();
    await new Promise(r => setTimeout(r, extraDelay));

    // Retry finding option
    let match: HTMLElement | undefined;
    for (let i = 0; i < 5 && !match; i++) {
      const options = Array.from(
        document.querySelectorAll('li[role="option"] a, a[role="menuitem"]')
      ) as HTMLElement[];
      match = options.find(el => el.textContent?.trim() === optionText);
      if (!match) await new Promise(r => setTimeout(r, 500));
    }

    if (match) {
      match.click();
      console.log(`Selected '${optionText}' for ${buttonId}`);
      await new Promise(r => setTimeout(r, 1000));
      return true;
    } else {
      console.warn(`Option '${optionText}' not found for ${buttonId}`);
      return false;
    }
  };

  // 2. Are you legally authorized to work?
  await selectDropdownOption('233:_selectButton', 'Yes');

  // 3. Will you require sponsorship?
  await selectDropdownOption('240:_selectButton', 'No');

  // 4. Are you currently employed by:
  await selectDropdownOption('251:_selectButton', 'None of the Above');

  // 5. Country Selection (United States)
  const country = 'United States';
  const countryButton = document.getElementById('267:_selectButton') as HTMLButtonElement;
  const countryInput = document.getElementById('267:_input') as HTMLInputElement;
  if (countryButton && countryInput) {
    countryButton.click();
    await new Promise(r => setTimeout(r, 1500));
    countryInput.focus();
    countryInput.value = country.substring(0, 4); // e.g., "Unit"
    countryInput.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 2500)); // Wait for filtering
    await selectDropdownOption('267:_selectButton', country);
    console.log(`Selected Current Country: ${country}`);
  }

  // 6. Gender: Male (only proceed after country selection)
  await selectDropdownOption('274:_selectButton', 'Male');

  // 7. English Fluency – Select Yes radio
  const radioContainer = document.getElementById('211:_anchor');
  if (radioContainer) {
    const radioIcon = radioContainer.querySelector('.radioIcon') as HTMLElement;
    if (radioIcon) {
      radioIcon.click();
      console.log("Selected 'Yes' for English fluency");
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log("✅ Job-Specific Information form completed");
}
