import { FormData } from "../utils/types";

export default function fillOracleForm(data: FormData): void {
    console.log("🚀 Oracle form filler started");

    const details = data?.data?.details || {};
    const rawDetails = data?.data?.details || (data as any);

    // React-friendly value setter (from LeverScript)
    function setReactValue(input: HTMLInputElement | HTMLSelectElement, value: string) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        nativeSetter?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        console.log(`✅ Filled field with value: "${value}"`);
    }

    // Get field value with fallbacks (adapted for FormData type)
    function getFieldValue(primaryField: string, ...fallbackFields: string[]): string | undefined {
        if (details && primaryField in details) return details[primaryField as keyof typeof details];
        if (rawDetails && rawDetails[primaryField]) return rawDetails[primaryField];

        for (const fallback of fallbackFields) {
            if (details && fallback in details) return details[fallback as keyof typeof details];
            if (rawDetails && rawDetails[fallback]) return rawDetails[fallback];
        }
        return undefined;
    }

    // Small wait helper
    const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

    // Prevent overlapping runs
    let running = false;

    // Enhanced dropdown selection function (like Workday)
    async function selectFromDropdown(button: HTMLElement, targetValue: string, fieldName: string): Promise<boolean> {
        console.log(`🎯 Selecting from dropdown for ${fieldName}: ${targetValue}`);
        
        try {
            // Focus and click the dropdown
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await wait(300);
            button.focus();
            button.click();
            await wait(800);

            // Wait for options to appear
            const options = document.querySelectorAll<HTMLElement>('[role="option"]');
            console.log(`Found ${options.length} options for ${fieldName}`);

            if (options.length === 0) {
                console.warn(`No options found for ${fieldName}`);
                return false;
            }

            // Find and select matching option
            for (const option of options) {
                const optionText = option.textContent?.trim().toLowerCase() || '';
                const searchValue = targetValue.toLowerCase();

                // Check exact match or partial match
                if (optionText === searchValue || 
                    optionText.includes(searchValue) || 
                    searchValue.includes(optionText)) {
                    
                    console.log(`✅ Selecting option: ${optionText} for ${fieldName}`);
                    option.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await wait(200);
                    option.click();
                    await wait(300);
                    return true;
                }
            }

            // If no match found, select "Other" for education degree
            if (fieldName.includes('degree') || fieldName.includes('education')) {
                for (const option of options) {
                    const optionText = option.textContent?.trim().toLowerCase() || '';
                    if (optionText.includes('other')) {
                        console.log(`✅ Selecting "Other" option for ${fieldName}`);
                        option.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await wait(200);
                        option.click();
                        await wait(300);
                        return true;
                    }
                }
            }

            console.warn(`❌ No matching option found for ${fieldName}: ${targetValue}`);
            return false;

        } catch (error) {
            console.error(`Error selecting from dropdown for ${fieldName}:`, error);
            return false;
        }
    }

    // Fill personal info with enhanced dropdown handling
    async function fillPersonalInfo(): Promise<void> {
        console.log("🎯 Starting personal info filling...");

        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));

        for (const input of inputs) {
            const name = input.name;
            const id = input.id;
            if (!name && !id) continue;

            let value: string | undefined;
            const isCombobox = input.getAttribute('role') === 'combobox' || 
                              input.getAttribute('aria-haspopup') === 'grid' ||
                              input.getAttribute('aria-autocomplete') === 'list' ||
                              input.classList.contains('cx-select-input');

            // Match by name first
            if (name === 'firstName') value = getFieldValue('firstName');
            else if (name === 'lastName') value = getFieldValue('lastName');
            else if (name === 'middleNames') value = getFieldValue('middleName');
            else if (name === 'title') value = getFieldValue('prefix', 'title');
            else if (name === 'country') value = getFieldValue('country');
            else if (name === 'addressLine1') value = getFieldValue('address1', 'addressLine1', 'address');
            else if (name === 'city') value = getFieldValue('city');
            else if (name === 'postalCode') value = getFieldValue('zip', 'postalCode', 'zipCode');
            else if (name === 'region1') value = getFieldValue('state', 'region1', 'region');
            else if (name === 'region2') value = getFieldValue('state', 'region2', 'region');
            else if (name === 'state') value = getFieldValue('state', 'region2', 'region1');
            else if (name === 'email') value = getFieldValue('email');
            else if (name === 'phoneNumber') value = getFieldValue('phoneNumber', 'phone');

            // Fallback by id if name didn't match
            if (!value) {
                if (id?.includes('firstName')) value = getFieldValue('firstName');
                else if (id?.includes('lastName')) value = getFieldValue('lastName');
                else if (id?.includes('middleNames') || id?.includes('middleName')) value = getFieldValue('middleName');
                else if (id?.includes('city')) value = getFieldValue('city');
                else if (id?.includes('postalCode') || id?.includes('postal') || id?.includes('zip')) value = getFieldValue('zip', 'postalCode', 'zipCode');
                else if (id?.includes('region') || id?.includes('state')) value = getFieldValue('state', 'region1', 'region2');
                else if (id?.includes('email')) value = getFieldValue('email');
                else if (id?.includes('phoneNumber') || id?.includes('phone')) value = getFieldValue('phoneNumber', 'phone');
            }

            if (value && input.offsetParent !== null) {
                console.log(`🎯 Processing ${name || id} with: ${value}`);

                if (isCombobox) {
                    // Handle as dropdown (like Workday approach)
                    input.focus();
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));

                    // Wait for dropdown options and select matching option
                    setTimeout(async () => {
                        const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                        for (const option of options) {
                            const optionText = option.textContent?.trim() || '';
                            if (optionText.toLowerCase() === value.toLowerCase() || 
                                optionText.toLowerCase().includes(value.toLowerCase()) ||
                                value.toLowerCase().includes(optionText.toLowerCase())) {
                                
                                console.log(`✅ Selecting option: ${optionText} for ${name || id}`);
                                option.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                await wait(200);
                                option.click();
                                break;
                            }
                        }
                    }, 800);
                } else {
                    // Handle as regular input
                    setReactValue(input, value);
                }
                await wait(300);
            }
        }

        // Handle dropdowns for state, city, postal code
        await handleLocationDropdowns();

        console.log("🎉 Personal info filling complete");
    }

    // Handle location-specific dropdowns
    async function handleLocationDropdowns(): Promise<void> {
        console.log("📍 Handling location dropdowns...");

        // Handle state dropdown
        const state = getFieldValue('state', 'region2', 'region1');
        if (state) {
            const stateButton = document.querySelector<HTMLButtonElement>('button[name="countryRegion"]') ||
                               document.querySelector<HTMLButtonElement>('button[name="region2"]') ||
                               document.querySelector<HTMLButtonElement>('button[name="state"]');
            
            if (stateButton) {
                await selectFromDropdown(stateButton, state, 'state');
            }
        }

        // Handle city if it's a dropdown
        const city = getFieldValue('city');
        if (city) {
            const cityButton = document.querySelector<HTMLButtonElement>('button[name="city"]');
            if (cityButton) {
                await selectFromDropdown(cityButton, city, 'city');
            }
        }
    }

    // Fill education with enhanced dropdown handling
    async function fillEducation(): Promise<void> {
        console.log("🎓 Starting education filling...");

        const educationExperiences = data?.data?.educationExperiences || [];
        if (educationExperiences.length === 0) {
            console.log("No education experiences to fill");
            return;
        }

        for (let idx = 0; idx < educationExperiences.length; idx++) {
            const edu = educationExperiences[idx];
            console.log(`Filling education ${idx + 1}: ${edu.collegeName}`);

            // Click "Add Education" button if not the first one
            if (idx > 0) {
                const addButton = document.querySelector<HTMLButtonElement>('button[data-qa*="add"]') || 
                                  document.querySelector<HTMLButtonElement>('button[id*="profileItemsAddButton"]') || 
                                  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(btn => 
                                      btn.textContent?.toLowerCase().includes('add education') && 
                                      !btn.textContent?.toLowerCase().includes('save')
                                  );
                if (addButton && !addButton.disabled) {
                    addButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    addButton.click();
                    await wait(1000);
                }
            }

            await wait(1000);

            // Fill school/college name (enhanced handling)
            const collegeInput = document.querySelector<HTMLInputElement>('input[name="educationalEstablishment"]');
            if (collegeInput && edu.collegeName) {
                collegeInput.focus();
                collegeInput.value = edu.collegeName;
                collegeInput.dispatchEvent(new Event('input', { bubbles: true }));
                collegeInput.dispatchEvent(new Event('change', { bubbles: true }));

                // If it's a combobox, wait for options
                if (collegeInput.getAttribute('role') === 'combobox') {
                    setTimeout(async () => {
                        const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                        for (const option of options) {
                            const optionText = option.textContent?.trim() || '';
                            if (optionText.toLowerCase().includes(edu.collegeName.toLowerCase())) {
                                option.click();
                                break;
                            }
                        }
                    }, 800);
                }
                await wait(500);
            }

            // Fill degree with dropdown selection (select "Other" if not found)
            const degreeInput = document.querySelector<HTMLInputElement>('input[name="contentItemId"]');
            if (degreeInput && edu.educationType) {
                const isCombobox = degreeInput.getAttribute('role') === 'combobox';
                
                if (isCombobox) {
                    degreeInput.focus();
                    degreeInput.value = edu.educationType;
                    degreeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    degreeInput.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(async () => {
                        const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                        let optionSelected = false;

                        // Try to find exact or partial match
                        for (const option of options) {
                            const optionText = option.textContent?.trim().toLowerCase() || '';
                            const degreeText = edu.educationType.toLowerCase();

                            if (optionText.includes(degreeText) || degreeText.includes(optionText) ||
                                (degreeText.includes('bachelor') && optionText.includes('bachelor')) ||
                                (degreeText.includes('master') && optionText.includes('master'))) {
                                
                                console.log(`✅ Selecting degree: ${optionText}`);
                                option.click();
                                optionSelected = true;
                                break;
                            }
                        }

                        // If no match found, select "Other"
                        if (!optionSelected) {
                            for (const option of options) {
                                const optionText = option.textContent?.trim().toLowerCase() || '';
                                if (optionText.includes('other')) {
                                    console.log(`✅ Selecting "Other" for degree`);
                                    option.click();
                                    break;
                                }
                            }
                        }
                    }, 800);
                } else {
                    setReactValue(degreeInput, edu.educationType);
                }
                await wait(500);
            }

            // Fill major/field of study
            const majorInput = document.querySelector<HTMLInputElement>('input[name="major"]');
            if (majorInput && edu.courseName) {
                majorInput.focus();
                await wait(200);
                setReactValue(majorInput, edu.courseName);
                await wait(500);
            }

            // Fill GPA
            const gpaInput = document.querySelector<HTMLInputElement>('input[name="gpa"]');
            if (gpaInput && edu.grade) {
                gpaInput.focus();
                await wait(200);
                setReactValue(gpaInput, edu.grade);
                await wait(500);
            }

            // Handle current/past education buttons
            const pillButtons = document.querySelectorAll<HTMLButtonElement>('button.cx-select-pill-section');
            if (pillButtons.length > 0) {
                const currentButton = Array.from(pillButtons).find(btn => 
                    btn.textContent?.toLowerCase().includes('current') || 
                    btn.textContent?.toLowerCase().includes('yes')
                );
                const pastButton = Array.from(pillButtons).find(btn => 
                    btn.textContent?.toLowerCase().includes('past') || 
                    btn.textContent?.toLowerCase().includes('no')
                );
                
                if (edu.stillStudying && currentButton) {
                    currentButton.click();
                    console.log("✅ Clicked current education button");
                } else if (!edu.stillStudying && pastButton) {
                    pastButton.click();
                    console.log("✅ Clicked past education button");
                }
                await wait(500);
            }

            // Click Save button
            const saveButton = document.querySelector<HTMLButtonElement>('button[data-qa="profileItemInlineSaveButton"]');
            if (saveButton && !saveButton.disabled) {
                saveButton.click();
                console.log("✅ Save button clicked for education");
                await wait(1000);
            }
        }

        console.log("🎉 Education filling complete");
    }

    // Enhanced experience filling with date dropdown handling
    async function fillExperience(): Promise<void> {
        console.log("💼 Starting experience filling...");

        const workExperiences = data?.data?.workExperiences || [];
        if (workExperiences.length === 0) {
            console.log("No work experiences to fill");
            return;
        }

        for (let idx = 0; idx < workExperiences.length; idx++) {
            const exp = workExperiences[idx];
            console.log(`Filling experience ${idx + 1}: ${exp.jobTitle} at ${exp.companyName}`);

            // Always click "Add Experience" button before filling
            const addButton = document.querySelector<HTMLButtonElement>('button[data-qa*="add"]') || 
                              document.querySelector<HTMLButtonElement>('button[id*="profileItemsAddButton"]') || 
                              Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(btn => 
                                  btn.textContent?.toLowerCase().includes('add experience') && 
                                  !btn.textContent?.toLowerCase().includes('save')
                              );
            
            if (addButton && !addButton.disabled) {
                addButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                addButton.click();
                console.log("✅ Clicked Add Experience button");
                await wait(1500);
            }

            // Fill employer name
            const employerInput = document.querySelector<HTMLInputElement>('input[name="employerName"]');
            if (employerInput && exp.companyName) {
                employerInput.focus();
                await wait(200);
                setReactValue(employerInput, exp.companyName);
                await wait(300);
            }

            // Fill job title
            const jobTitleInput = document.querySelector<HTMLInputElement>('input[name="jobTitle"]');
            if (jobTitleInput && exp.jobTitle) {
                jobTitleInput.focus();
                await wait(200);
                setReactValue(jobTitleInput, exp.jobTitle);
                await wait(300);
            }

            // Handle start date with dropdown selection (like Workday)
            if (exp.startDate) {
                const startDate = new Date(exp.startDate);
                const startMonth = startDate.toLocaleString('default', { month: 'long' });
                const startYear = startDate.getFullYear().toString();

                // Fill start month
                const startMonthInput = document.querySelector<HTMLInputElement>('input[name="startDate"][id*="month"]');
                if (startMonthInput) {
                    if (startMonthInput.getAttribute('role') === 'combobox') {
                        // Handle as dropdown
                        startMonthInput.focus();
                        startMonthInput.value = startMonth;
                        startMonthInput.dispatchEvent(new Event('input', { bubbles: true }));
                        startMonthInput.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(async () => {
                            const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                            for (const option of options) {
                                const optionText = option.textContent?.trim() || '';
                                if (optionText.toLowerCase() === startMonth.toLowerCase()) {
                                    option.click();
                                    break;
                                }
                            }
                        }, 800);
                    } else {
                        setReactValue(startMonthInput, startMonth);
                    }
                    await wait(500);
                }

                // Fill start year
                const startYearInput = document.querySelector<HTMLInputElement>('input[name="startDate"][id*="year"]');
                if (startYearInput) {
                    if (startYearInput.getAttribute('role') === 'combobox') {
                        // Handle as dropdown
                        startYearInput.focus();
                        startYearInput.value = startYear;
                        startYearInput.dispatchEvent(new Event('input', { bubbles: true }));
                        startYearInput.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(async () => {
                            const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                            for (const option of options) {
                                const optionText = option.textContent?.trim() || '';
                                if (optionText === startYear) {
                                    option.click();
                                    break;
                                }
                            }
                        }, 800);
                    } else {
                        setReactValue(startYearInput, startYear);
                    }
                    await wait(500);
                }
            }

            // Handle end date (only if not current job)
            if (exp.endDate && !exp.stillWorking) {
                const endDate = new Date(exp.endDate);
                const endMonth = endDate.toLocaleString('default', { month: 'long' });
                const endYear = endDate.getFullYear().toString();

                // Fill end month
                const endMonthInput = document.querySelector<HTMLInputElement>('input[name="endDate"][id*="month"]');
                if (endMonthInput) {
                    if (endMonthInput.getAttribute('role') === 'combobox') {
                        endMonthInput.focus();
                        endMonthInput.value = endMonth;
                        endMonthInput.dispatchEvent(new Event('input', { bubbles: true }));
                        endMonthInput.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(async () => {
                            const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                            for (const option of options) {
                                const optionText = option.textContent?.trim() || '';
                                if (optionText.toLowerCase() === endMonth.toLowerCase()) {
                                    option.click();
                                    break;
                                }
                            }
                        }, 800);
                    } else {
                        setReactValue(endMonthInput, endMonth);
                    }
                    await wait(500);
                }

                // Fill end year
                const endYearInput = document.querySelector<HTMLInputElement>('input[name="endDate"][id*="year"]');
                if (endYearInput) {
                    if (endYearInput.getAttribute('role') === 'combobox') {
                        endYearInput.focus();
                        endYearInput.value = endYear;
                        endYearInput.dispatchEvent(new Event('input', { bubbles: true }));
                        endYearInput.dispatchEvent(new Event('change', { bubbles: true }));

                        setTimeout(async () => {
                            const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                            for (const option of options) {
                                const optionText = option.textContent?.trim() || '';
                                if (optionText === endYear) {
                                    option.click();
                                    break;
                                }
                            }
                        }, 800);
                    } else {
                        setReactValue(endYearInput, endYear);
                    }
                    await wait(500);
                }
            }

            // Fill description
            const textarea = document.querySelector<HTMLTextAreaElement>("textarea");
            if (textarea && exp.description) {
                textarea.focus();
                await wait(200);
                textarea.value = exp.description;
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
                textarea.dispatchEvent(new Event("change", { bubbles: true }));
                console.log(`✅ Filled description`);
                await wait(300);
            }

            // Click Save button and wait 1 second
            const saveButton = document.querySelector<HTMLButtonElement>('button[data-qa="profileItemInlineSaveButton"]');
            if (saveButton && !saveButton.disabled) {
                saveButton.click();
                console.log("✅ Save button clicked for experience");
                await wait(1000);
            }
        }

        console.log("🎉 Experience filling complete");
    }

    // Enhanced voluntary disclosure with date dropdown handling
    async function fillVoluntaryDisclosure(): Promise<void> {
        console.log("📋 Starting voluntary disclosure filling...");

        try {
            // Fill earliest available date (current date + 1 month) with dropdown handling
            const today = new Date();
            const availableDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
            
            const day = availableDate.getDate().toString().padStart(2, '0');
            const month = availableDate.toLocaleString('default', { month: 'long' });
            const year = availableDate.getFullYear().toString();

            // Fill day with dropdown handling
            const dayInput = document.querySelector<HTMLInputElement>('input[id*="day-earliestAvailableDate"]');
            if (dayInput) {
                if (dayInput.getAttribute('role') === 'combobox') {
                    dayInput.focus();
                    dayInput.value = day;
                    dayInput.dispatchEvent(new Event('input', { bubbles: true }));
                    dayInput.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(async () => {
                        const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                        for (const option of options) {
                            const optionText = option.textContent?.trim() || '';
                            if (optionText === day) {
                                option.click();
                                break;
                            }
                        }
                    }, 800);
                } else {
                    setReactValue(dayInput, day);
                }
                await wait(300);
            }

            // Fill month with dropdown handling
            const monthInput = document.querySelector<HTMLInputElement>('input[id*="month-earliestAvailableDate"]');
            if (monthInput) {
                if (monthInput.getAttribute('role') === 'combobox') {
                    monthInput.focus();
                    monthInput.value = month;
                    monthInput.dispatchEvent(new Event('input', { bubbles: true }));
                    monthInput.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(async () => {
                        const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                        for (const option of options) {
                            const optionText = option.textContent?.trim() || '';
                            if (optionText.toLowerCase() === month.toLowerCase()) {
                                option.click();
                                break;
                            }
                        }
                    }, 800);
                } else {
                    setReactValue(monthInput, month);
                }
                await wait(300);
            }

            // Fill year with dropdown handling
            const yearInput = document.querySelector<HTMLInputElement>('input[id*="year-earliestAvailableDate"]');
            if (yearInput) {
                if (yearInput.getAttribute('role') === 'combobox') {
                    yearInput.focus();
                    yearInput.value = year;
                    yearInput.dispatchEvent(new Event('input', { bubbles: true }));
                    yearInput.dispatchEvent(new Event('change', { bubbles: true }));

                    setTimeout(async () => {
                        const options = document.querySelectorAll<HTMLElement>('[role="option"]');
                        for (const option of options) {
                            const optionText = option.textContent?.trim() || '';
                            if (optionText === year) {
                                option.click();
                                break;
                            }
                        }
                    }, 800);
                } else {
                    setReactValue(yearInput, year);
                }
                await wait(300);
            }

            console.log(`✅ Filled earliest available date: ${day}/${month}/${year}`);

            // Rest of the voluntary disclosure code remains the same...
            // Fill gender
            const gender = getFieldValue('gender');
            if (gender) {
                const genderButtons = document.querySelectorAll<HTMLButtonElement>('button.cx-select-pill-section');
                for (const button of genderButtons) {
                    const buttonText = button.textContent?.toLowerCase().trim();
                    if (buttonText === gender.toLowerCase()) {
                        button.click();
                        console.log(`✅ Selected gender: ${gender}`);
                        await wait(300);
                        break;
                    }
                }
            }

            // Fill full name
            const firstName = getFieldValue('firstName') || '';
            const lastName = getFieldValue('lastName') || '';
            const fullName = `${firstName} ${lastName}`.trim();

            if (fullName) {
                const fullNameInput = document.querySelector<HTMLInputElement>('input[name="fullName"]');
                if (fullNameInput) {
                    setReactValue(fullNameInput, fullName);
                    await wait(300);
                }
            }

            // Handle Yes/No questions
            const questionContainers = document.querySelectorAll<HTMLUListElement>('ul.cx-select-pills-container[aria-label]');
            
            for (const container of questionContainers) {
                const question = container.getAttribute('aria-label')?.toLowerCase() || '';
                
                let shouldClickYes = false;
                
                if (question.includes('legally authorized to work')) {
                    shouldClickYes = true;
                } else if (question.includes('ex-oracle employee')) {
                    shouldClickYes = false;
                } else if (question.includes('employed by the government')) {
                    shouldClickYes = false;
                }

                const buttons = container.querySelectorAll<HTMLButtonElement>('button.cx-select-pill-section');
                for (const button of buttons) {
                    const buttonText = button.textContent?.toLowerCase().trim();
                    if ((shouldClickYes && buttonText === 'yes') || (!shouldClickYes && buttonText === 'no')) {
                        button.click();
                        console.log(`✅ Clicked "${buttonText}" for question: ${question.substring(0, 50)}...`);
                        await wait(300);
                        break;
                    }
                }
            }

            console.log("🎉 Voluntary disclosure filling complete");
        } catch (error) {
            console.error("❌ Error filling voluntary disclosure:", error);
        }
    }

    // Enhanced Oracle auto-next button function
    async function clickOracleNextButton(): Promise<boolean> {
        console.log("🔄 Oracle: Looking for next/continue button...");
        
        await wait(2000);
        
        const buttonSelectors = [
            'button[data-automation-id*="Next"]',
            'button[data-automation-id*="next"]',
            'button[data-automation-id*="Continue"]',
            'button[data-automation-id*="continue"]',
            'button[data-automation-id*="Submit"]',
            'button[data-automation-id*="submit"]',
            'button[aria-label*="Next"]',
            'button[aria-label*="Continue"]',
            'button[title*="Next"]',
            'button[title*="Continue"]',
            'button[type="submit"]'
        ];

        for (let attempt = 0; attempt < 10; attempt++) {
            for (const selector of buttonSelectors) {
                const button = document.querySelector<HTMLButtonElement | HTMLInputElement>(selector);
                if (button && !button.disabled && button.offsetParent !== null) {
                    const text = (button.textContent || button.value || '').trim().toLowerCase();
                    if (text.includes('next') || text.includes('save') || text.includes('continue') || text.includes('submit')) {
                        console.log(`✅ Oracle: Found button: ${text}`);
                        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await wait(500);
                        button.focus();
                        
                        try {
                            button.click();
                            console.log("✅ Oracle: Successfully clicked next button");
                            return true;
                        } catch (error) {
                            button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            console.log("✅ Oracle: Successfully dispatched click events");
                            return true;
                        }
                    }
                }
            }

            const allButtons = document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input[type="submit"], input[type="button"]');
            for (const button of allButtons) {
                const text = (button.textContent || button.value || '').trim().toLowerCase();
                if ((text.includes('next') || text.includes('save') || text.includes('continue') || text.includes('submit')) && 
                    !button.disabled && button.offsetParent !== null) {
                    
                    button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await wait(300);
                    
                    try {
                        button.click();
                        console.log("✅ Oracle: Successfully clicked next button via text search");
                        return true;
                    } catch (error) {
                        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        console.log("✅ Oracle: Successfully dispatched click via text search");
                        return true;
                    }
                }
            }

            await wait(500 + attempt * 100);
        }

        console.warn("❌ Oracle: No next/submit button found after all attempts");
        return false;
    }

    // MutationObserver to trigger autofill
    const observer = new MutationObserver(async (mutations) => {
        let shouldRun = false;
        for (const m of mutations) {
            for (const n of Array.from(m.addedNodes)) {
                if (n && n.nodeType === 1) {
                    const el = n as HTMLElement;
                    if (el.querySelector('input') || el.querySelector('button')) {
                        shouldRun = true;
                        break;
                    }
                }
            }
            if (shouldRun) break;
        }

        if (!shouldRun) return;
        if (running) return;
        running = true;

        try {
            console.log("🔄 Observer triggered — running autofill");
            const path = window.location.pathname;
            if (path.includes("/section/1")) {
                await fillPersonalInfo();
            } else if (path.includes("/section/2")) {
                await fillEducation();
                await fillExperience();
            } else if (path.includes("/section/3")) {
                await fillVoluntaryDisclosure();
            }
            await clickOracleNextButton();
        } catch (err) {
            console.error("❌ Autofill error", err);
        } finally {
            running = false;
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}