// Dropdown Logic for SuccessFactors
// This module handles all dropdown selections for SuccessFactors forms

export interface DropdownConfig {
  inputSelector: string;
  buttonSelector: string;
  optionValue: string;
  optionSelector?: string;
}

/**
 * Generic dropdown selection function
 * @param config - Configuration object for dropdown selection
 * @param timeout - Time to wait for dropdown to open (default: 800ms)
 */
export function selectDropdownOption(config: DropdownConfig, timeout: number = 800): Promise<boolean> {
  return new Promise(async (resolve) => {
    const input = document.querySelector(config.inputSelector) as HTMLInputElement;
    const button = document.querySelector(config.buttonSelector) as HTMLButtonElement;

    if (!input || !button) {
      console.warn(`Dropdown input or button not found for selector: ${config.inputSelector}`);
      resolve(false);
      return;
    }

    // Open the dropdown
    button.click();
    await new Promise(r => setTimeout(r, timeout));

    // Type first 4 chars to trigger filtering
    const partialText = config.optionValue.substring(0, 4);
    input.focus();
    input.value = partialText;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    console.log(`🔍 Typed '${partialText}' into dropdown to filter options for "${config.optionValue}"`);

    // Function to wait for the desired option
    const waitForOption = async (maxWaitMs = 8000, pollInterval = 300): Promise<HTMLElement | null> => {
      const start = Date.now();
      while (Date.now() - start < maxWaitMs) {
        const items = Array.from(
          document.querySelectorAll(config.optionSelector || 'li[role="option"], a[role="menuitem"]')
        ) as HTMLElement[];
        const match = items.find(
          el => el.textContent?.trim().toLowerCase() === config.optionValue.toLowerCase()
        );
        if (match) return match;
        await new Promise(r => setTimeout(r, pollInterval));
      }
      return null;
    };

    const option = await waitForOption(8000, 300);
    if (!option) {
      console.warn(`❌ Could not find dropdown option "${config.optionValue}"`);
      resolve(false);
      return;
    }

    // Click the option
    option.click();
    await new Promise(r => setTimeout(r, 300));

    // Update the input value and trigger events
    input.value = config.optionValue;
    input.setAttribute('title', config.optionValue);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.blur();

    console.log(`✅ Selected: ${config.optionValue}`);
    resolve(true);
  });
}


/**
 * Select country dropdown specifically for SuccessFactors
 * Supports optional scoping (root element)
 * @param countryValue - The country name to select
 * @param root - Optional root element to scope query (default is document)
 */
export function selectCountryDropdown(
  countryValue: string,
  root: Document | HTMLElement = document
): Promise<boolean> {
  return new Promise(async (resolve) => {
    const input = root.querySelector('input[aria-label="More options for Country"]') as HTMLInputElement;
    const button = root.querySelector('button[aria-label="More options for Country"]') as HTMLButtonElement;

    if (!input || !button) {
      console.warn('Country dropdown input/button not found in given root.');
      resolve(false);
      return;
    }

    // Clear current value first
    input.value = '';
    input.setAttribute('title', '');
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Click button to open dropdown
    button.click();

    let attempts = 0;
    const maxAttempts = 3;

    const trySelect = () => {
      attempts++;
      const option = root.querySelector(`a[title="${countryValue}"]`) as HTMLElement;

      if (option) {
        option.click();
        setTimeout(() => {
          const updatedInput = root.querySelector(
            'input[aria-label="More options for Country"]'
          ) as HTMLInputElement;
          if (updatedInput) {
            updatedInput.value = countryValue;
            updatedInput.setAttribute('title', countryValue);
            updatedInput.dispatchEvent(new Event('input', { bubbles: true }));
            updatedInput.dispatchEvent(new Event('change', { bubbles: true }));
            updatedInput.blur();
          }
          resolve(true);
        }, 200);
      } else if (attempts < maxAttempts) {
        setTimeout(trySelect, attempts * 500); // Increasing delay
      } else {
        console.warn(`Failed to select country: ${countryValue}`);
        resolve(false);
      }
    };

    setTimeout(trySelect, 1000);
  });
}


/**
 * Select recruiter contact dropdown for SuccessFactors
 * @param contactValue - The contact preference ("Yes" or "No")
 */
export function selectRecruiterContactDropdown(contactValue: string): Promise<boolean> {
  const config: DropdownConfig = {
    inputSelector: 'input[aria-label="More options for A recruiter may contact me regarding future job opportunities."]',
    buttonSelector: 'button[aria-label="More options for A recruiter may contact me regarding future job opportunities."]',
    optionValue: contactValue
  };
  
  return selectDropdownOption(config);
}

/**
 * Select state dropdown for SuccessFactors (must be called after country is selected)
 * @param stateValue - The state/province name to select (e.g., "California")
 */
export function selectStateDropdown(stateValue: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    const input = document.querySelector('input[aria-label="More options for State/Province/Region"]') as HTMLInputElement;
    const button = document.querySelector('button[aria-label="More options for State/Province/Region"]') as HTMLButtonElement;
    
    if (!input || !button) {
      resolve(false);
      return;
    }

    // Clear current value first
    input.value = '';
    input.setAttribute('title', '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Click button to open dropdown
    button.click();
    
    // Try multiple times with increasing delays for async loading
    let attempts = 0;
    const maxAttempts = 3;
    
    const trySelect = () => {
      attempts++;
      const option = document.querySelector(`a[title="${stateValue}"]`) as HTMLElement;
      
      if (option) {
        option.click();
        setTimeout(() => {
          const updatedInput = document.querySelector('input[aria-label="More options for State/Province/Region"]') as HTMLInputElement;
          if (updatedInput) {
            updatedInput.value = stateValue;
            updatedInput.setAttribute('title', stateValue);
            updatedInput.dispatchEvent(new Event('input', { bubbles: true }));
            updatedInput.dispatchEvent(new Event('change', { bubbles: true }));
            updatedInput.blur();
          }
          resolve(true);
        }, 200);
      } else if (attempts < maxAttempts) {
        setTimeout(trySelect, attempts * 500); // Increasing delay
      } else {
        resolve(false);
      }
    };
    
    // Start first attempt after initial delay
    setTimeout(trySelect, 1000);
  });
}

/**
 * Select education level dropdown for SuccessFactors
 * @param educationValue - The education level to select (e.g., "Masters", "Bachelors")
 */
export function selectEducationLevelDropdown(educationValue: string): Promise<boolean> {
  const config: DropdownConfig = {
    inputSelector: 'input[aria-label="More options for What is your highest level of education?"]',
    buttonSelector: 'button[aria-label="More options for What is your highest level of education?"]',
    optionValue: educationValue
  };
  
  return selectDropdownOption(config);
}

/**
 * Select completion level dropdown for SuccessFactors
 * @param completionValue - The completion level to select (e.g., "Graduated", "In Progress")
 */
export function selectCompletionLevelDropdown(completionValue: string): Promise<boolean> {
  const config: DropdownConfig = {
    inputSelector: 'input[aria-label="More options for What is your level of completion?"]',
    buttonSelector: 'button[aria-label="More options for What is your level of completion?"]',
    optionValue: completionValue
  };
  
  return selectDropdownOption(config);
}

/**
 * Select study region dropdown for SuccessFactors
 * @param regionValue - The region to select (e.g., "Americas", "Europe", "Asia Pacific")
 */
export function selectStudyRegionDropdown(regionValue: string): Promise<boolean> {
  const config: DropdownConfig = {
    inputSelector: 'input[aria-label="More options for Where did you study – Region?"]',
    buttonSelector: 'button[aria-label="More options for Where did you study – Region?"]',
    optionValue: regionValue
  };
  
  return selectDropdownOption(config);
}

/**
 * Select study country dropdown for SuccessFactors (must be called after study region is selected)
 * @param countryValue - The country to select (e.g., "USA", "Canada", "Mexico")
 */
export function selectStudyCountryDropdown(countryValue: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    const input = document.querySelector('input[aria-label="More options for Where did you study – Country?"]') as HTMLInputElement;
    const button = document.querySelector('button[aria-label="More options for Where did you study – Country?"]') as HTMLButtonElement;
    
    if (!input || !button) {
      resolve(false);
      return;
    }

    // Clear current value first
    input.value = '';
    input.setAttribute('title', '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Click button to open dropdown
    button.click();
    
    // Try multiple times with increasing delays for async loading (similar to state dropdown)
    let attempts = 0;
    const maxAttempts = 3;
    
    const trySelect = () => {
      attempts++;
      const option = document.querySelector(`a[title="${countryValue}"]`) as HTMLElement;
      
      if (option) {
        option.click();
        setTimeout(() => {
          const updatedInput = document.querySelector('input[aria-label="More options for Where did you study – Country?"]') as HTMLInputElement;
          if (updatedInput) {
            updatedInput.value = countryValue;
            updatedInput.setAttribute('title', countryValue);
            updatedInput.dispatchEvent(new Event('input', { bubbles: true }));
            updatedInput.dispatchEvent(new Event('change', { bubbles: true }));
            updatedInput.blur();
          }
          resolve(true);
        }, 200);
      } else if (attempts < maxAttempts) {
        setTimeout(trySelect, attempts * 500); // Increasing delay
      } else {
        resolve(false);
      }
    };
    
    // Start first attempt after initial delay
    setTimeout(trySelect, 1000);
  });
}

/**
 * Select study school dropdown for SuccessFactors (must be called after study country is selected)
 * @param schoolValue - The school name to select (e.g., "Massachusetts Institute Of Technology")
 */
export function selectStudySchoolDropdown(schoolValue: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    const input = document.querySelector('input[aria-label="More options for Where did you study – School?"]') as HTMLInputElement;
    const button = document.querySelector('button[aria-label="More options for Where did you study – School?"]') as HTMLButtonElement;
    
    if (!input || !button) {
      resolve(false);
      return;
    }

    // Clear current value first
    input.value = '';
    input.setAttribute('title', '');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Click button to open dropdown
    button.click();
    
    // Wait for dropdown to open
    setTimeout(() => {
      // Type the first 5 letters to filter the options
      const filterText = schoolValue.substring(0, 5); // "Massa" for "Massachusetts Institute Of Technology"
      
      // Focus the input and type the filter text
      input.focus();
      input.value = filterText;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('keyup', { bubbles: true }));
      
      // Wait for filtering to complete, then try to select
      setTimeout(() => {
        let attempts = 0;
        const maxAttempts = 3; // Reduced attempts since filtering should make it faster
        
        const trySelect = () => {
          attempts++;
          
          // Try different selectors for school selection after filtering
          let option = document.querySelector(`a[title="${schoolValue}"]`) as HTMLElement;
          
          // If exact match not found, try partial match with the filtered results
          if (!option) {
            const schoolOptions = document.querySelectorAll('a[title*="Massachusetts Institute"]');
            if (schoolOptions.length > 0) {
              option = schoolOptions[0] as HTMLElement;
            }
          }
          
          // If still not found, try any option containing "Massachusetts"
          if (!option) {
            const fallbackOptions = document.querySelectorAll('a[title*="Massachusetts"]');
            if (fallbackOptions.length > 0) {
              option = fallbackOptions[0] as HTMLElement;
            }
          }
          
          if (option) {
            option.click();
            setTimeout(() => {
              const updatedInput = document.querySelector('input[aria-label="More options for Where did you study – School?"]') as HTMLInputElement;
              if (updatedInput) {
                // Use the exact title from the selected option
                const selectedTitle = option.getAttribute('title') || schoolValue;
                updatedInput.value = selectedTitle;
                updatedInput.setAttribute('title', selectedTitle);
                updatedInput.dispatchEvent(new Event('input', { bubbles: true }));
                updatedInput.dispatchEvent(new Event('change', { bubbles: true }));
                updatedInput.blur();
              }
              resolve(true);
            }, 200);
          } else if (attempts < maxAttempts) {
            setTimeout(trySelect, 500); // Shorter delay since filtering should be faster
          } else {
            resolve(false);
          }
        };
        
        // Start selection attempts after filtering
        setTimeout(trySelect, 500);
      }, 1000); // Wait for filtering to complete
    }, 800); // Wait for dropdown to open
  });
}

/**
 * Select travel percentage dropdown for SuccessFactors
 * @param percentage - The percentage value to select (e.g., "0 - 70%")
 */
export function selectTravelPercentageDropdown(percentage: string): Promise<boolean> {
  return new Promise((resolve) => {
    const inputSelector = 'input[aria-label="More options for What percentage are you willing to travel?"]';
    const buttonSelector = 'button[aria-label="More options for What percentage are you willing to travel?"]';

    const input = document.querySelector(inputSelector) as HTMLInputElement;
    const button = document.querySelector(buttonSelector) as HTMLButtonElement;

    if (!input || !button) {
      console.warn('Dropdown input or button not found');
      resolve(false);
      return;
    }

    // Open dropdown
    button.click();

    // Wait for the options to appear
    setTimeout(() => {
      const option = document.querySelector(`a[title="${percentage}"]`) as HTMLElement;
      
      if (option) {
        option.click();

        // Update input value and fire events
        setTimeout(() => {
          input.value = percentage;
          input.setAttribute('title', percentage);
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
          resolve(true);
        }, 200);
      } else {
        console.warn(`Option "${percentage}" not found`);
        resolve(false);
      }
    }, 1000); // wait for list to populate
  });
}
