import { FormData } from "../utils/types";
export default function fillWorkdayForm(data: FormData): void {
    let saveClicked = false;
    
    // Page detection function for Application Questions
    const detectApplicationQuestionsPage = (): 'app-questions-1' | 'app-questions-2' | 'unknown' => {
        console.log('[workdaynewScript] Starting page detection...');
        
        // Enhanced selectors for page headings and content
        const selectors = [
            'h1, h2, h3, h4, h5, h6',
            '[role="heading"]',
            '.wd-heading',
            '[data-automation-id*="heading"]',
            '[data-automation-id*="title"]',
            '.css-*[class*="heading"]',
            'div[class*="title"]',
            'span[class*="title"]',
            '[aria-level]'
        ];
        
        // Check each selector type
        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                console.log(`[workdaynewScript] Found ${elements.length} elements with selector: ${selector}`);
                
                for (const element of elements) {
                    const elementText = element.textContent?.trim() || '';
                    console.log(`[workdaynewScript] Checking element text: "${elementText}"`);
                    
                    if (elementText.includes('Application Questions 1 of 2') || 
                        elementText.includes('Application Questions (1 of 2)') ||
                        elementText.includes('Application Questions - 1 of 2')) {
                        console.log('[workdaynewScript] Detected Application Questions 1 of 2 page');
                        return 'app-questions-1';
                    }
                    if (elementText.includes('Application Questions 2 of 2') || 
                        elementText.includes('Application Questions (2 of 2)') ||
                        elementText.includes('Application Questions - 2 of 2')) {
                        console.log('[workdaynewScript] Detected Application Questions 2 of 2 page');
                        return 'app-questions-2';
                    }
                }
            } catch (error) {
                console.warn(`[workdaynewScript] Error with selector ${selector}:`, error);
            }
        }
        
        // Check for Application Questions indicators
        const questionIndicators = [
            'fieldset',
            '[data-automation-id*="formField"]',
            'button[aria-haspopup="listbox"]',
            '.wd-input-dropdown'
        ];
        
        let hasDropdownQuestions = false;
        for (const indicator of questionIndicators) {
            const elements = document.querySelectorAll(indicator);
            if (elements.length > 0) {
                console.log(`[workdaynewScript] Found ${elements.length} question elements with: ${indicator}`);
                hasDropdownQuestions = true;
                break;
            }
        }
        
        // If we have dropdown questions but no clear page indicator, assume it's page 1
        if (hasDropdownQuestions) {
            console.log('[workdaynewScript] Found dropdown questions, assuming Application Questions 1 of 2');
            return 'app-questions-1';
        }
        
        // Final fallback: search entire document text
        const bodyText = document.body.textContent?.toLowerCase() || '';
        if (bodyText.includes('application questions')) {
            console.log('[workdaynewScript] Found "application questions" in body text, assuming page 1');
            return 'app-questions-1';
        }
        
        console.log('[workdaynewScript] Could not detect Application Questions page');
        return 'unknown';
    };
    const clickSaveAndContinue = async (): Promise<boolean> => {
        if (saveClicked) {
            console.log('[workdaynewScript] Save & Continue already clicked, preventing double-click');
            return false;
        }

        console.log('[workdaynewScript] Starting Save & Continue button clicking...');
        saveClicked = true;

        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = 10;

            const tryClick = () => {
                attempts++;
                console.log(`[workdaynewScript] Attempt ${attempts} to find and click Save & Continue...`);

                const buttons = document.querySelectorAll('button');
                let saveButton: HTMLElement | null = null;

                for (const button of buttons) {
                    const buttonText = button.textContent?.trim().toLowerCase() || '';
                    if (buttonText.includes('save and continue') || buttonText.includes('save & continue')) {
                        saveButton = button as HTMLElement;
                        break;
                    }
                }

                if (saveButton && !(saveButton as HTMLButtonElement).disabled) {
                    console.log('[workdaynewScript] Found Save & Continue button, clicking...');
                    saveButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    saveButton.focus();

                    setTimeout(() => {
                        saveButton?.click();
                        console.log('[workdaynewScript] Save & Continue button clicked successfully');
                        resolve(true);
                    }, 500);
                    return;
                }

                if (attempts >= maxAttempts) {
                    console.error('[workdaynewScript] Max attempts reached, Save & Continue button not found');
                    saveClicked = false; // Reset on failure
                    resolve(false);
                    return;
                }

                setTimeout(tryClick, 1000);
            };

            tryClick();
        });
    };

    const waitForFormValidation = async (): Promise<void> => {
        console.log('[workdaynewScript] Waiting for form validation...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    };

    const waitForAllSectionsFilled = async (): Promise<boolean> => {
        console.log('[workdaynewScript] Checking if all sections are filled...');

        const workExperiences = data?.data?.workExperiences;
        const educationExperiences = data?.data?.educationExperiences;

        const expectedWorkSections = workExperiences ? workExperiences.length : 0;
        const expectedEducationSections = educationExperiences ? educationExperiences.length : 0;

        // Wait up to 45 seconds for all sections to be filled
        const maxWaitTime = 45000;
        const checkInterval = 1500;
        let waitTime = 0;

        while (waitTime < maxWaitTime) {
            const workSections = document.querySelectorAll('[aria-labelledby*="Work-Experience"]').length - 1; // -1 for header
            const educationSections = document.querySelectorAll('[aria-labelledby*="Education"]').length - 1; // -1 for header

            // Also check if all required fields are filled
            const allWorkInputsFilled = document.querySelectorAll('[aria-labelledby*="Work-Experience"] input[required]:not([value=""]), [aria-labelledby*="Work-Experience"] input:invalid').length === 0;
            const allEducationInputsFilled = document.querySelectorAll('[aria-labelledby*="Education"] input[required]:not([value=""]), [aria-labelledby*="Education"] input:invalid').length === 0;

            console.log(`[workdaynewScript] Expected: Work=${expectedWorkSections}, Education=${expectedEducationSections}`);
            console.log(`[workdaynewScript] Found: Work=${workSections}, Education=${educationSections}`);
            console.log(`[workdaynewScript] Fields filled: Work=${allWorkInputsFilled}, Education=${allEducationInputsFilled}`);

            if (workSections >= expectedWorkSections && educationSections >= expectedEducationSections && allWorkInputsFilled && allEducationInputsFilled) {
                console.log('[workdaynewScript] All sections and fields filled, proceeding with button click');
                // Additional safety wait
                await new Promise(resolve => setTimeout(resolve, 3000));
                return true;
            }

            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waitTime += checkInterval;
        }

        console.warn('[workdaynewScript] Timeout waiting for all sections to be filled');
        return false;
    };

    const waitForAllRequiredFields = async (): Promise<boolean> => {
        console.log('[workdaynewScript] Checking if all required fields are filled...');

        const maxWaitTime = 30000; // 30 seconds max wait
        const checkInterval = 1000; // Check every second
        let waitTime = 0;

        while (waitTime < maxWaitTime) {
            // Check all required input fields
            const requiredInputs = document.querySelectorAll('input[required], input[aria-required="true"]');
            let allFilled = true;

            requiredInputs.forEach(input => {
                const inputElement = input as HTMLInputElement;
                if (!inputElement.value || inputElement.value.trim() === '') {
                    console.log(`[workdaynewScript] Field not filled: ${inputElement.name || inputElement.id}`);
                    allFilled = false;
                }
            });

            // Specifically check phone number field
            const phoneInputs = document.querySelectorAll('input[name*="phone"], input[id*="phone"], input[name*="Phone"], input[id*="Phone"]');
            let phoneFilled = false;
            phoneInputs.forEach(input => {
                const inputElement = input as HTMLInputElement;
                if (inputElement.value && inputElement.value.trim() !== '') {
                    phoneFilled = true;
                }
            });

            // Also check for phone number in any input that might contain it
            const allInputs = document.querySelectorAll('input[type="tel"], input[placeholder*="phone"], input[placeholder*="Phone"]');
            allInputs.forEach(input => {
                const inputElement = input as HTMLInputElement;
                if (inputElement.value && inputElement.value.trim() !== '') {
                    phoneFilled = true;
                }
            });

            if (allFilled && phoneFilled) {
                console.log('[workdaynewScript] All required fields including phone number are filled');
                return true;
            }

            console.log(`[workdaynewScript] Waiting for fields to be filled... (${waitTime}ms)`);
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waitTime += checkInterval;
        }

        console.warn('[workdaynewScript] Timeout waiting for required fields to be filled');
        return false;
    };

    const waitAndClickButton = async (): Promise<boolean> => {
        // Enhanced scroll and click mechanism for Save & Continue
        const maxScrollAttempts = 5;
        let scrollAttempts = 0;

        while (scrollAttempts < maxScrollAttempts) {
            console.log(`[workdaynewScript] Attempt ${scrollAttempts + 1} to find and click Save & Continue...`);

            // Try multiple strategies to find the button
            const buttonSelectors = [
                'button[data-automation-id*="SaveAndContinue"]',
                'button[data-automation-id*="saveAndContinue"]',
                'button[data-automation-id*="Next"]',
                'button[data-automation-id*="next"]',
                'footer[data-automation-id="bottomNavigation"] button',
                'button[data-automation-id="pageFooterNextButton"]',
                'button[aria-label*="Save and Continue"]',
                'button[aria-label*="Next"]'
            ];

            let button: HTMLButtonElement | null = null;

            // Try CSS selectors first
            for (const selector of buttonSelectors) {
                button = document.querySelector(selector) as HTMLButtonElement;
                if (button && !button.disabled && button.offsetParent !== null) {
                    break;
                }
                button = null;
            }

            // Fallback to text-based detection
            if (!button) {
                const buttons = document.querySelectorAll('button');
                for (const btn of buttons) {
                    const buttonText = btn.textContent?.trim().toLowerCase() || '';
                    if (buttonText.includes('save and continue') || buttonText.includes('save & continue') || buttonText.includes('next')) {
                        button = btn as HTMLButtonElement;
                        break;
                    }
                }
            }

            if (button) {
                console.log('[workdaynewScript] Found Save & Continue button:', button);

                // Ensure button is visible and clickable
                button.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Double-check button is still valid
                if (!button.disabled && button.offsetParent !== null) {
                    button.focus();

                    // Try multiple click methods
                    try {
                        button.click();
                        console.log('[workdaynewScript] Save & Continue button clicked successfully');
                        return true;
                    } catch (error) {
                        console.warn('[workdaynewScript] Standard click failed, trying dispatchEvent:', error);

                        // Fallback to dispatchEvent
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        button.dispatchEvent(clickEvent);
                        console.log('[workdaynewScript] Save & Continue button clicked via dispatchEvent');
                        return true;
                    }
                }
            }

            // Scroll down to look for button
            window.scrollBy(0, 300);
            await new Promise(resolve => setTimeout(resolve, 1000));
            scrollAttempts++;
        }

        console.warn('[workdaynewScript] Save & Continue button not found after scrolling');
        return false;
    };

    const waitAndClickButtonStep2 = async (): Promise<boolean> => {
        // For Step 2, wait for all sections to be filled first
        const isStep2 = document.querySelector('[aria-labelledby*="Work-Experience"], [aria-labelledby*="Education"]');
        if (isStep2) {
            const allFilled = await waitForAllSectionsFilled();
            if (!allFilled) {
                console.warn('[workdaynewScript] Not all sections filled, skipping button click');
                return false;
            }
        }

        return await waitAndClickButton();
    };

    const fillPersonalInfo = async (websiteIndex = 0): Promise<void> => {
        const inputs = document.querySelectorAll<HTMLInputElement>("input");
        console.log('[workdaynewScript] Found inputs:', inputs.length);
        console.log('[workdaynewScript] Data details:', data.data?.details);
        
        inputs.forEach(input => {
            const fieldName = (input.name || input.id || "").toLowerCase();
            const details = data.data?.details;
            if (!details) {
                console.warn('[workdaynewScript] No details found in data');
                return;
            }
            
            console.log('[workdaynewScript] Processing input:', fieldName, 'Element:', input);

            if (fieldName.includes("firstname")) input.value = details.firstName ?? "";
            else if (fieldName.includes("lastname")) input.value = details.lastName ?? "";
            else if (fieldName.includes("email")) input.value = details.email ?? "";
            else if (fieldName.includes("postalcode")) input.value = details.zip !== undefined ? String(details.zip) : "";
            else if (fieldName.includes("addressline1")) input.value = details.address1 ?? "";
            else if (fieldName.includes("city")) input.value = details.city ?? "";
            else if (input.id === "phoneNumber--phoneNumber" || (fieldName.includes("phonenumber") && !fieldName.includes("countryphone") && !fieldName.includes("code"))) {
                input.value = String(details.phoneNumber || '9874563210');
                console.log('[workdaynewScript] Phone number field found:', fieldName, 'ID:', input.id, 'Value set:', details.phoneNumber || '9874563210', 'Input element:', input);
                
                // Trigger events to ensure Workday recognizes the value
                input.dispatchEvent(new Event("input", { bubbles: true }));
                input.dispatchEvent(new Event("change", { bubbles: true }));
                input.focus();
                input.blur();
            }
            if (fieldName.includes("linkedinaccount")) {
                const linkedinUrl = details.linkedinUrl;
                input.value = linkedinUrl || ''; // Accept exact format without validation
                console.log('[workdaynewScript] LinkedIn URL set:', linkedinUrl);
            }
            else if (fieldName.includes("url")) {
                if (fieldName.includes('twitter') || fieldName.includes('x.com')) {
                    const twitterUrl = details.twitterUrl;
                    if (twitterUrl && twitterUrl.includes('twitter.com')) {
                        input.value = twitterUrl;
                    } else {
                        console.warn('[workdaynewScript] Invalid Twitter URL:', twitterUrl);
                    }
                } else if (fieldName.includes('facebook')) {
                    const facebookUrl = details.facebookUrl;
                    if (facebookUrl && facebookUrl.includes('facebook.com/')) {
                        input.value = facebookUrl;
                    } else {
                        console.warn('[workdaynewScript] Invalid Facebook URL:', facebookUrl);
                    }
                } else {
                    input.value = (details as any)[websiteIndex] || '';
                }
            }
            else if (fieldName.includes("selfidentifieddisabilitydata--name")) input.value = details.fullName ?? "";
            else if (fieldName.includes("extension")) input.value = details.phoneCode ?? "";
            else if (fieldName.includes("candidateispreviousworker")) {
                const noOption = document.querySelector<HTMLInputElement>('input[name="candidateIsPreviousWorker"][value="false"]');
                if (noOption) {
                    noOption.checked = true;
                    noOption.dispatchEvent(new Event("input", { bubbles: true }));
                    noOption.dispatchEvent(new Event("change", { bubbles: true }));
                    noOption.click(); // ensure UI reflects the change
                }
            }

            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
        const searchInput = document.querySelector<HTMLInputElement>('#source--source');
        console.log("search", searchInput);
        if (searchInput) {
            searchInput.value = "linkedin";
            searchInput.dispatchEvent(new Event("input", { bubbles: true }));
            const event = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13
            });
            searchInput.focus();
            searchInput.dispatchEvent(event);


            // Country dropdown selection
            const countryDropdownBtn = document.querySelector<HTMLButtonElement>('button[name="country"]');
            if (!countryDropdownBtn) return;
            countryDropdownBtn.click();
            setTimeout(() => {
                const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                const country = data.data?.details?.country;
                if (!country) return;
                options.forEach(option => {
                    if (option.innerText.trim().toLowerCase() === country.toLowerCase()) {
                        option.click();
                    }
                });
            }, 500);
            // state dropdown selection
            const stateDropdownSelection = document.querySelector<HTMLButtonElement>('button[name="countryRegion"]');
            if (!stateDropdownSelection) return;
            stateDropdownSelection.click();
            setTimeout(() => {
                const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                const state = data.data?.details?.state;
                if (!state) return;
                options.forEach(option => {
                    if (option.innerText.trim().toLowerCase() === state.toLowerCase()) {
                        option.click();
                    }
                });
            }, 500);
            // phone type dropdown selection
            const phoneTypeDropdownSelection = document.querySelector<HTMLButtonElement>('button[name="phoneType"]');
            if (!phoneTypeDropdownSelection) return;
            phoneTypeDropdownSelection.click();
            console.log(phoneTypeDropdownSelection);
            setTimeout(() => {
                const options = document.querySelectorAll<HTMLElement>('li[role="option"]');
                options.forEach(option => {
                    if (option.innerText.trim().toLowerCase() === "home") {
                        option.click();
                    }
                });
            }, 500);
            searchInput.focus()
            searchInput.dispatchEvent(event)

            // After personal info form filling is complete, click Save & Continue
            setTimeout(async () => {
                console.log('[workdaynewScript] Personal info filling complete, attempting Save & Continue...');
                await waitAndClickButton();
            }, 3000);
        };
    }
    // Application Questions 1 of 2 - Main application questions with proper validation
    async function fillApplicationQuestions1() {
        console.log('[workdaynewScript] Starting Application Questions 1 of 2...');
        
        const questionMapping = [
            {
                question: 'Would you consider relocating for this role?',
                keywords: ['relocating', 'relocate'],
                answer: 'No',
                fieldId: '15cb5c09d59b10194f4f39c81b0c0000'
            },
            {
                question: 'Are you subject to any non-compete or non-solicitation restrictions',
                keywords: ['non-compete', 'non-solicitation', 'restrictions'],
                answer: 'No',
                fieldId: '15cb5c09d59b10194f4f3a62c5b70002'
            },
            {
                question: 'In your current job, do you use or work on the Workday system?',
                keywords: ['workday system', 'current job'],
                answer: 'No',
                fieldId: '15cb5c09d59b10194f4f3afdc0fe0002'
            },
            {
                question: 'Are you authorized to work in the country where this job is located?',
                keywords: ['authorized to work', 'country'],
                answer: 'Yes',
                fieldId: '15cb5c09d59b10194f4f3b9884540001'
            },
            {
                question: 'Do you now or in the future require any immigration filing or visa sponsorship',
                keywords: ['immigration', 'visa sponsorship', 'work authorization'],
                answer: 'No',
                fieldId: '15cb5c09d59b10194f4f3b9884540004'
            },
            {
                question: 'Are you now, or have you ever been: (a) employed by the U.S. federal government',
                keywords: ['federal government', 'military officer', 'civilian equivalent'],
                answer: 'No',
                fieldId: '15cb5c09d59b10194f4f3b9884540007'
            },
            {
                question: 'Are you a current citizen, national or resident of any of the following countries/regions',
                keywords: ['export control', 'citizen', 'national', 'resident', 'iran', 'cuba', 'north korea'],
                answer: 'No',
                fieldId: '15cb5c09d59b10194f4f4410a73e0001'
            },
            {
                question: 'Are you related to a current Workday employee?',
                keywords: ['related', 'workday employee'],
                answer: 'No',
                fieldId: '15cb5c09d59b10194f4f45466cf80000'
            },
            {
                question: 'To the best of your knowledge, are you related to an employee of a customer',
                keywords: ['related', 'employee of a customer', 'government official'],
                answer: 'No',
                fieldId: '15cb5c09d59b10194f4f45466cf80004'
            },
            {
                question: 'I acknowledge that I have read, understood and reviewed the above questions',
                keywords: ['acknowledge', 'read', 'understood', 'reviewed', 'truthfully', 'accurately'],
                answer: 'Yes',
                fieldId: '15cb5c09d59b10194f4f45e1584d0000'
            }
        ];

        const maxRetries = 5;
        let retryCount = 0;
        
        // Wait for form to be ready
        await wait(2000);
        
        // Process all questions with retry mechanism
        while (retryCount < maxRetries) {
            console.log(`[workdaynewScript] Application Questions attempt ${retryCount + 1}/${maxRetries}`);
            
            let allQuestionsAnswered = true;
            let questionsProcessed = 0;
            
            for (const mapping of questionMapping) {
                try {
                    // Enhanced selectors for Application Questions dropdown buttons
                    const selectors = [
                        `button[name="${mapping.fieldId}"]`,
                        `button[id="primaryQuestionnaire--${mapping.fieldId}"]`,
                        `[data-automation-id="formField-${mapping.fieldId}"] button`,
                        `[data-fkit-id="primaryQuestionnaire--${mapping.fieldId}"] button`,
                        `button[aria-haspopup="listbox"]`,
                        `button[data-automation-id*="${mapping.fieldId}"]`,
                        `div[data-automation-id="formField-${mapping.fieldId}"] button`,
                        `fieldset button[aria-haspopup="listbox"]`,
                        `.wd-input-dropdown button`,
                        `button[role="combobox"]`,
                        `button.wd-input`
                    ];
                    
                    let dropdownButton: HTMLButtonElement | null = null;
                    
                    // Try direct selectors first
                    for (const selector of selectors) {
                        const buttons = document.querySelectorAll(selector);
                        for (const button of buttons) {
                            const buttonElement = button as HTMLButtonElement;
                            // Check if this button is for a dropdown (has listbox popup or combobox role)
                            if (buttonElement.getAttribute('aria-haspopup') === 'listbox' || 
                                buttonElement.getAttribute('role') === 'combobox' ||
                                buttonElement.textContent?.trim() === 'Select One') {
                                dropdownButton = buttonElement;
                                console.log(`[workdaynewScript] Found dropdown button with selector: ${selector}`);
                                break;
                            }
                        }
                        if (dropdownButton) break;
                    }
                    
                    // Fallback to fieldset text matching using keywords
                    if (!dropdownButton) {
                        const fieldsets = document.querySelectorAll('fieldset');
                        for (const fieldset of fieldsets) {
                            const legendText = fieldset.querySelector('legend')?.textContent?.toLowerCase() || '';
                            
                            // Check if any keywords match
                            const keywordMatch = mapping.keywords.some(keyword => 
                                legendText.includes(keyword.toLowerCase())
                            );
                            
                            if (keywordMatch) {
                                console.log(`[workdaynewScript] Found fieldset match using keywords: ${mapping.keywords}`);
                                dropdownButton = fieldset.querySelector('button[aria-haspopup="listbox"]');
                                if (dropdownButton) break;
                            }
                        }
                    }
                    
                    // Additional fallback: search by question text proximity
                    if (!dropdownButton) {
                        const allButtons = document.querySelectorAll('button');
                        for (const button of allButtons) {
                            const buttonElement = button as HTMLButtonElement;
                            const parentElement = buttonElement.closest('fieldset') || buttonElement.parentElement;
                            const contextText = parentElement?.textContent?.toLowerCase() || '';
                            
                            // Check if this is a dropdown button and matches our question
                            const isDropdownButton = buttonElement.getAttribute('aria-haspopup') === 'listbox' || 
                                                   buttonElement.getAttribute('role') === 'combobox' ||
                                                   buttonElement.textContent?.trim() === 'Select One';
                            
                            const keywordMatch = mapping.keywords.some(keyword => 
                                contextText.includes(keyword.toLowerCase())
                            );
                            
                            if (isDropdownButton && keywordMatch) {
                                console.log(`[workdaynewScript] Found button match using context keywords: ${mapping.keywords}`);
                                dropdownButton = buttonElement;
                                break;
                            }
                        }
                    }
                    
                    if (!dropdownButton) {
                        console.warn(`[workdaynewScript] Dropdown not found: ${mapping.question}`);
                        continue; // Skip to next question instead of failing
                    }
                    
                    // Check current value
                    const currentValue = dropdownButton.textContent?.trim();
                    if (currentValue && currentValue !== 'Select One') {
                        questionsProcessed++;
                        continue; // Already answered
                    }
                    
                    // Answer the question with improved dropdown handling
                    console.log(`[workdaynewScript] Processing question: ${mapping.question}`);
                    console.log(`[workdaynewScript] Found dropdown button:`, dropdownButton);
                    
                    // Ensure button is visible and clickable
                    dropdownButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await wait(500);
                    
                    // Multiple click strategies to ensure dropdown opens
                    console.log(`[workdaynewScript] Clicking dropdown button for: ${mapping.question}`);
                    
                    // Strategy 1: Direct click
                    dropdownButton.focus();
                    await wait(300);
                    dropdownButton.click();
                    await wait(800);
                    
                    // Check if dropdown opened by looking for options
                    let optionsVisible = document.querySelectorAll('li[role="option"], div[role="option"]').length > 0;
                    
                    if (!optionsVisible) {
                        console.log(`[workdaynewScript] Dropdown not opened, trying alternative click methods`);
                        
                        // Strategy 2: Mouse events
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        dropdownButton.dispatchEvent(clickEvent);
                        await wait(800);
                        
                        optionsVisible = document.querySelectorAll('li[role="option"], div[role="option"]').length > 0;
                    }
                    
                    if (!optionsVisible) {
                        console.log(`[workdaynewScript] Still no options visible, trying keyboard approach`);
                        
                        // Strategy 3: Keyboard events
                        dropdownButton.focus();
                        const keydownEvent = new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            bubbles: true
                        });
                        dropdownButton.dispatchEvent(keydownEvent);
                        await wait(800);
                    }
                    
                    // Final wait for options to appear
                    await wait(500);
                    
                    // Find and select option with multiple strategies
                    let optionSelected = false;
                    const maxOptionAttempts = 3;
                    
                    for (let attempt = 0; attempt < maxOptionAttempts && !optionSelected; attempt++) {
                        console.log(`[workdaynewScript] Option selection attempt ${attempt + 1} for: ${mapping.question}`);
                        
                        // Wait a bit more for options to load
                        await wait(300);
                        
                        const optionSelectors = [
                            'li[role="option"]',
                            'div[role="option"]',
                            '[data-automation-id*="option"]',
                            '.wd-popup-list-item'
                        ];
                        
                        for (const selector of optionSelectors) {
                            const options = document.querySelectorAll(selector);
                            console.log(`[workdaynewScript] Found ${options.length} options with selector: ${selector}`);
                            
                            for (const option of options) {
                                const optionText = option.textContent?.trim().toLowerCase() || '';
                                const answerText = mapping.answer.toLowerCase();
                                
                                console.log(`[workdaynewScript] Comparing option: "${optionText}" with answer: "${answerText}"`);
                                
                                // Enhanced matching logic
                                const isExactMatch = optionText === answerText;
                                const isContainedMatch = optionText.includes(answerText) || answerText.includes(optionText);
                                const isYesNoMatch = (answerText.includes('yes') && optionText.includes('yes')) || 
                                                   (answerText.includes('no') && optionText.includes('no'));
                                
                                if (isExactMatch || isContainedMatch || isYesNoMatch) {
                                    console.log(`[workdaynewScript] Selecting option: "${optionText}"`);
                                    
                                    // Multiple click strategies
                                    try {
                                        (option as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        await wait(200);
                                        (option as HTMLElement).click();
                                        await wait(500);
                                        
                                        // Verify selection worked
                                        const updatedButtonText = dropdownButton.textContent?.trim();
                                        if (updatedButtonText && updatedButtonText !== 'Select One') {
                                            console.log(`[workdaynewScript] Successfully selected: ${updatedButtonText}`);
                                            optionSelected = true;
                                            questionsProcessed++;
                                            break;
                                        }
                                    } catch (clickError) {
                                        console.warn(`[workdaynewScript] Click failed for option: ${optionText}`, clickError);
                                    }
                                }
                            }
                            
                            if (optionSelected) break;
                        }
                        
                        if (!optionSelected && attempt < maxOptionAttempts - 1) {
                            console.log(`[workdaynewScript] Option not selected, retrying...`);
                            // Close and reopen dropdown
                            document.body.click();
                            await wait(500);
                            dropdownButton.click();
                            await wait(800);
                        }
                    }
                    
                    if (!optionSelected) {
                        console.warn(`[workdaynewScript] Failed to select option for: ${mapping.question} - ${mapping.answer}`);
                        document.body.click(); // Close dropdown
                        allQuestionsAnswered = false;
                    }
                    
                } catch (error) {
                    console.error(`[workdaynewScript] Error with question: ${mapping.question}`, error);
                    allQuestionsAnswered = false;
                }
                
                await wait(200); // Brief pause between questions
            }
            
            // Check if all questions are answered
            const remainingQuestions = await checkRemainingApplicationQuestions();
            
            if (remainingQuestions === 0) {
                console.log('[workdaynewScript] All Application Questions 1 completed successfully');
                break;
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`[workdaynewScript] ${remainingQuestions} questions remaining, retrying...`);
                await wait(1500);
            }
        }
        
        // Final validation check
        const remaining = await checkRemainingApplicationQuestions();
        if (remaining === 0) {
            console.log('[workdaynewScript] Application Questions 1 validation passed');
        } else {
            console.warn(`[workdaynewScript] ${remaining} questions still need attention`);
        }
        
        // Wait for form validation to complete before clicking Save
        await waitUntilFormIsValid();
        
        // Click Save & Continue
        await waitAndClickButton();
    }

    // Helper function to check remaining unanswered application questions
    async function checkRemainingApplicationQuestions(): Promise<number> {
        const unansweredSelectors = [
            'button[data-automation-id*="formField"]',
            'button[aria-haspopup="listbox"]',
            'fieldset button'
        ];
        
        let unansweredCount = 0;
        
        for (const selector of unansweredSelectors) {
            const buttons = document.querySelectorAll(selector);
            for (const button of buttons) {
                const buttonText = (button as HTMLElement).textContent?.trim();
                if (buttonText === 'Select One' || buttonText === '') {
                    unansweredCount++;
                }
            }
        }
        
        console.log(`[workdaynewScript] Found ${unansweredCount} unanswered questions`);
        return unansweredCount;
    }

    // Helper function to wait until form is valid
    async function waitUntilFormIsValid(): Promise<void> {
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const invalidFields = document.querySelectorAll('.invalid');
            if (invalidFields.length === 0) {
                console.log('[workdaynewScript] Form is valid');
                return;
            }
            
            console.log(`[workdaynewScript] Form is not valid, waiting...`);
            await wait(500);
            attempts++;
        }
        
        console.warn('[workdaynewScript] Form is still not valid after waiting');
    }

    // Application Questions 2 of 2 - Employee relations and acknowledgment questions
    async function fillApplicationQuestions2() {
        console.log('[workdaynewScript] Filling Application Questions 2 of 2...');
        
        // Updated mapping for second page questions
        const questionMapping = [
            {
                question: 'Have you ever been convicted of a felony',
                answer: 'No',
                fieldId: 'felony-conviction'
            },
            {
                question: 'Have you ever been terminated or asked to resign from any position',
                answer: 'No',
                fieldId: 'termination-history'
            },
            {
                question: 'Are you subject to any non-compete or non-solicitation restrictions',
                answer: 'No',
                fieldId: 'non-compete-restrictions'
            },
            {
                question: 'Are you currently employed',
                answer: 'Yes',
                fieldId: 'current-employment'
            },
            {
                question: 'I acknowledge that I have read and understood',
                answer: 'Yes',
                fieldId: 'acknowledgment-terms'
            }
        ];

        // Process all questions with retry mechanism
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            let allQuestionsAnswered = true;
            let questionsProcessed = 0;
            
            for (const mapping of questionMapping) {
                try {
                    const selectors = [
                        `button[aria-labelledby*="${mapping.fieldId}"]`,
                        `button[data-automation-id*="${mapping.fieldId}"]`,
                        `div[data-automation-id="formField-${mapping.fieldId}"] button`,
                        `fieldset button[aria-haspopup="listbox"]`,
                        `.wd-input-dropdown button`,
                        `button[role="combobox"]`,
                        `button.wd-input`
                    ];
                    
                    let dropdownButton: HTMLButtonElement | null = null;
                    
                    // Try direct selectors first
                    for (const selector of selectors) {
                        const buttons = document.querySelectorAll(selector);
                        for (const button of buttons) {
                            const buttonElement = button as HTMLButtonElement;
                            const parentText = buttonElement.closest('fieldset, .css-1bnjvia')?.textContent?.toLowerCase() || '';
                            
                            if (parentText.includes(mapping.question.toLowerCase()) || 
                                buttonElement.textContent?.trim() === 'Select One') {
                                dropdownButton = buttonElement;
                                break;
                            }
                        }
                        if (dropdownButton) break;
                    }
                    
                    if (dropdownButton) {
                        const currentValue = dropdownButton.textContent?.trim();
                        if (currentValue && currentValue !== 'Select One') {
                            questionsProcessed++;
                            continue;
                        }
                        
                        dropdownButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        dropdownButton.focus();
                        dropdownButton.click();
                        
                        // Wait and select option
                        setTimeout(() => {
                            const options = document.querySelectorAll('li[role="option"], div[role="option"]');
                            options.forEach(option => {
                                const optionText = option.textContent?.trim().toLowerCase();
                                if (optionText === mapping.answer.toLowerCase()) {
                                    (option as HTMLElement).click();
                                }
                            });
                        }, 500);
                        
                        questionsProcessed++;
                    } else {
                        allQuestionsAnswered = false;
                    }
                    
                } catch (error) {
                    console.error(`Error with question: ${mapping.question}`, error);
                    allQuestionsAnswered = false;
                }
            }
            
            if (allQuestionsAnswered && questionsProcessed === questionMapping.length) {
                console.log('All voluntary disclosure questions answered successfully');
                break;
            }
            
            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`Retrying voluntary disclosure questions... Attempt ${retryCount + 1}`);
                setTimeout(() => {}, 1000);
            }
        }
    }
    
    function fillVoluntaryDisclosure() {
        console.log('[workdaynewScript] Processing voluntary disclosure section...');
        
        // Specifically target the terms and conditions checkbox
        const termsCheckbox = document.getElementById('termsAndConditions--acceptTermsAndAgreements') as HTMLInputElement;
        
        if (termsCheckbox) {
            console.log('[workdaynewScript] Found terms and conditions checkbox');
            
            // Scroll checkbox into view
            termsCheckbox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Click checkbox if not already checked
            if (!termsCheckbox.checked) {
                console.log('[workdaynewScript] Clicking terms and conditions checkbox');
                termsCheckbox.click();
            } else {
                console.log('[workdaynewScript] Terms and conditions checkbox already checked');
            }
        } else {
            console.warn('[workdaynewScript] Terms and conditions checkbox not found');
            
            // Fallback: find any checkbox in the voluntary disclosure section
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                const checkboxElement = checkbox as HTMLInputElement;
                if (!checkboxElement.checked) {
                    checkboxElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    checkboxElement.click();
                }
            });
        }
    }
    const fillExperience = (index: number): void => {
        const workExperiences = data?.data?.workExperiences;
        if (!workExperiences || !Array.isArray(workExperiences)) return;
        const exp = workExperiences[index];
        if (!exp) return;
        if (!exp.startDate) return;
        const [startYear, startMonth] = exp.startDate.split('-');
        let endYear = '', endMonth = '';
        if (exp.endDate) {
            [endYear, endMonth] = exp.endDate.split('-');
        }
        const sections = document.querySelectorAll<HTMLElement>('[aria-labelledby*="Work-Experience"]');
        const section = sections[index + 1];
        if (!section) return;
        const inputs = section.querySelectorAll<HTMLInputElement>("input");
        inputs.forEach(input => {
            const fieldName = (input.name || input.id || "").toLowerCase();
            if (exp.stillWorking) {
                if (fieldName.includes('currentlyworkhere')) input.click();
            }
            if (fieldName.includes("jobtitle")) input.value = exp.jobTitle || '';
            else if (fieldName.includes("companyname")) input.value = exp.companyName || '';
            else if (fieldName.includes("location")) input.value = exp.location || '';
            else if (fieldName.includes("startdate-datesectionmonth")) {
                input.value = startMonth;
                input.focus();
            }
            else if (fieldName.includes("startdate-datesectionyear")) {
                input.value = startYear;
                input.focus();
            }
            else if (fieldName.includes("enddate-datesectionmonth")) {
                input.value = endMonth || '';
                input.focus();
            }
            else if (fieldName.includes("enddate-datesectionyear")) {
                input.value = endYear || '';
                input.focus();
            }
            
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
        
        const textarea = section.querySelector<HTMLTextAreaElement>("textarea[id*='roleDescription']");
        if (textarea) {
            textarea.value = exp.description || '';
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
            textarea.dispatchEvent(new Event("change", { bubbles: true }));
        }
    };

    const fillEducation = async (index: number): Promise<void> => {
        const educationExperiences = data?.data?.educationExperiences;
        if (!educationExperiences || !Array.isArray(educationExperiences)) return;
        const edu = educationExperiences[index];
        if (!edu) return;
        const sections = document.querySelectorAll<HTMLElement>('[aria-labelledby*="Education"]');
        const section = sections[index + 1];
        if (!section) return;

        const inputs = section.querySelectorAll<HTMLInputElement>("input");
        inputs.forEach(input => {
            const fieldName = (input.name || input.id || "").toLowerCase();
            if (fieldName.includes("schoolname")) input.value = edu.collegeName || '';
            else if (fieldName.includes("fieldofstudy")) input.value = edu.courseName || '';
            else if (fieldName.includes("gradeaverage")) input.value = edu.grade || '';
            else if (fieldName.includes("firstyearattended")) {
                input.value = edu.startDate || '';
                input.focus();
            }
            else if (fieldName.includes("lastyearattended")) {
                input.value = edu.endDate || '';
                input.focus();
            }

            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });

        // Degree dropdown - enhanced selector and validation
        const degreeDropdownBtn = section.querySelector<HTMLButtonElement>('button[name="degree"], button[id*="degree"]');
        if (degreeDropdownBtn && edu.educationType) {
            console.log(`[workdaynewScript] Clicking degree dropdown for: ${edu.educationType}`);
            degreeDropdownBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 300));

            degreeDropdownBtn.focus();
            degreeDropdownBtn.click();

            setTimeout(() => {
                const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                console.log(`[workdaynewScript] Found ${options.length} degree options`);

                let optionFound = false;
                options.forEach(option => {
                    const optionText = option.innerText.trim().toLowerCase();
                    const targetDegree = edu.educationType.toLowerCase();

                    console.log(`[workdaynewScript] Checking option: "${optionText}" against "${targetDegree}"`);

                    if (optionText === targetDegree || optionText.includes(targetDegree) || targetDegree.includes(optionText)) {
                        console.log(`[workdaynewScript] Selecting degree option: ${optionText}`);
                        option.click();
                        optionFound = true;
                    }
                });

                if (!optionFound) {
                    console.warn(`[workdaynewScript] Degree option not found for: ${edu.educationType}`);
                }
            }, 800);
        } else {
            console.warn('[workdaynewScript] Degree dropdown not found or educationType missing');
        }
    };

    const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
    const observer = new MutationObserver(async (mutations) => {
        let shouldFillForm = false;
        mutations.forEach(async (mutation) => {
            mutation.addedNodes.forEach(async (node) => {
                if (node.nodeType === 1) {
                    const element = node as HTMLElement;
                    const input = element.querySelector<HTMLInputElement>("input");
                    if (input) {
                        shouldFillForm = true;
                        
                        // Detect which Application Questions page we're on
                        const currentPage = detectApplicationQuestionsPage();
                        console.log(`[workdaynewScript] Detected page: ${currentPage}`);
                        
                        if (currentPage === 'app-questions-1') {
                            await fillApplicationQuestions1();
                            console.log('[workdaynewScript] Application Questions 1 complete, clicking Save & Continue...');
                            await clickSaveAndContinue();
                        } else if (currentPage === 'app-questions-2') {
                            await fillApplicationQuestions2();
                            console.log('[workdaynewScript] Application Questions 2 complete, clicking Save & Continue...');
                            await clickSaveAndContinue();
                        }
                        // No fallback needed - page detection handles all application question pages
                        
                        fillVoluntaryDisclosure();
                    }

                    setTimeout(() => {
                        const buttons = element.querySelectorAll<HTMLButtonElement>('button');
                        buttons.forEach(async btn => {
                            const group = btn.closest<HTMLElement>('[role="group"]');
                            const labelId = group?.getAttribute('aria-labelledby');
                            const sectionTitle = labelId ? document.getElementById(labelId)?.innerText || '' : '';
                            const isAddButton = btn.innerText.trim().toLowerCase() === 'add' ||
                                btn.getAttribute('aria-label')?.toLowerCase().includes('add');
                            if (!isAddButton) return;
                            if (sectionTitle.includes('Work Experience')) {
                                const workExperiences = data?.data?.workExperiences;
                                if (!workExperiences || !Array.isArray(workExperiences)) return;
                                for (let i = 0; i < workExperiences.length; i++) {
                                    btn.click();
                                    await wait(1000);
                                    fillExperience(i);
                                }
                                // After work experience filling, click Save & Continue
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                console.log('[workdaynewScript] Work experience filling complete, clicking Save & Continue...');
                                saveClicked = false; // Reset flag to allow step 2 save click
                                await clickSaveAndContinue();
                            } else if (sectionTitle.includes('Education')) {
                                const educationExperiences = data.data.educationExperiences
                                if (!educationExperiences || !Array.isArray(educationExperiences)) return;
                                for (let i = 0; i < educationExperiences.length; i++) {
                                    btn.click();
                                    await wait(1000);
                                    await fillEducation(i);
                                }
                                // After education filling, click Save & Continue
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                console.log('[workdaynewScript] Education filling complete, clicking Save & Continue...');
                                
                            }
                        });
                    }, 500);
                }
            });
        });
        if (shouldFillForm) {
            console.log("Filling form...");
            fillPersonalInfo();
            
            // Use page detection for Application Questions and wait for completion
            const currentPage = detectApplicationQuestionsPage();
            if (currentPage === 'app-questions-1') {
                await fillApplicationQuestions1();
                console.log('[workdaynewScript] Application Questions 1 complete, clicking Save & Continue...');
                await clickSaveAndContinue();
            } else if (currentPage === 'app-questions-2') {
                await fillApplicationQuestions2();
                console.log('[workdaynewScript] Application Questions 2 complete, clicking Save & Continue...');
                await clickSaveAndContinue();
            }
            // No fallback needed - page detection handles all application question pages
            
            fillVoluntaryDisclosure();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}