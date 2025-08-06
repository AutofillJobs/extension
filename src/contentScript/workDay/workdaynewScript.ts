import { FormData } from "../utils/types";
export default function fillWorkdayForm(data: FormData): void {
    const fillPersonalInfo =  (websiteIndex = 0): void => {
        const inputs = document.querySelectorAll<HTMLInputElement>("input");
        console.log(inputs);
        inputs.forEach(input => {
            const fieldName = (input.name || input.id || "").toLowerCase();
            const details = data.data?.details;
            if (!details) return;

            if (fieldName.includes("firstname")) input.value = details.firstName ?? "";
            else if (fieldName.includes("lastname")) input.value = details.lastName ?? "";
            else if (fieldName.includes("email")) input.value = details.email ?? "";
            else if (fieldName.includes("postalcode")) input.value = details.zip !== undefined ? String(details.zip) : "";
            else if (fieldName.includes("addressline1")) input.value = details.address1 ?? "";
            else if (fieldName.includes("city")) input.value = details.city;
            else if (fieldName.includes("phonenumber")) input.value = String(details.phoneNumber);
            else if (fieldName.includes("linkedinaccount")) input.value = details.linkedinUrl;
            else if (fieldName.includes("url")) input.value = details[websiteIndex];
            else if (fieldName.includes("selfidentifieddisabilitydata--name")) input.value = details.fullName;
            else if(fieldName.includes("extension")) input.value = details.phoneCode
            else if(fieldName.includes("candidateispreviousworker")){
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
        
       };
}
    function fillQuestionaire(){
        const workAuthorizationDropDown = document.querySelector<HTMLButtonElement>('button[name="3403860341171001f57d5c603f290001"]');
        console.log("aaaaa",workAuthorizationDropDown);
        
        if (!workAuthorizationDropDown) return;        
        workAuthorizationDropDown.click();
        setTimeout(() => {
            const options = document.querySelectorAll<HTMLElement>('li[role="option"]');
            const workAuthorization = data.data?.details?.workAuthorization;
            if(!workAuthorization) return;
            options.forEach(option => {
                if (option.innerText.trim().toLowerCase() === workAuthorization.toLowerCase()) {
                    option.click();
                }
            });
        }, 500);
        const visaSponsorShipDropdown = document.querySelector<HTMLButtonElement>('button[name="3403860341171001f57d5cf9af3d0001"]');
        console.log("bbbb",visaSponsorShipDropdown);
        
        if (!visaSponsorShipDropdown) return;        
        visaSponsorShipDropdown.click();
        setTimeout(() => {
            const options = document.querySelectorAll<HTMLElement>('li[role="option"]');
            const visaSponsorship = data?.data?.details?.visaSponsorship;
            if(!visaSponsorship) return;
            options.forEach(option => {
                if (option.innerText.trim().toLowerCase() === visaSponsorship.toLowerCase()) {
                    option.click();
                }
            });
        }, 500);
    }
    function fillVoluntaryDisclosure(){
        const genderDropdown = document.querySelector<HTMLButtonElement>('button[name="gender"]');
        console.log("gender",genderDropdown);
        
        if (!genderDropdown) return;        
        genderDropdown.click();
        setTimeout(() => {
            const options = document.querySelectorAll<HTMLElement>('li[role="option"]');
            const gender = data.data?.details?.gender;
            if(!gender) return;
            options.forEach(option => {
                console.log("gender option", option);
                
                if (option.innerText.trim().toLowerCase() === gender.toLowerCase()) {
                    option.click();
                }
            });
        }, 500);

        const veteranDropdown = document.querySelector<HTMLButtonElement>('button[name="veteranStatus"]');
        if (!veteranDropdown) return;        
        veteranDropdown.click();
        setTimeout(() => {
            const options = document.querySelectorAll<HTMLElement>('li[role="option"]');
            const veteranStatus = data.data?.details?.veteranStatus;
            if(!veteranStatus) return;
            options.forEach(option => {
                if (option.innerText.trim().toLowerCase() === veteranStatus.toLowerCase()) {
                    option.click();
                }
            });
        }, 500);
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
            if (fieldName.includes("jobtitle")) input.value = exp.jobTitle;
            else if (fieldName.includes("companyname")) input.value = exp.companyName;
            else if (fieldName.includes("location")) input.value = exp.location;
            else if (fieldName.includes("startdate-datesectionmonth")){
                input.value = startMonth;
                input.focus()
            } 
            else if (fieldName.includes("startdate-datesectionyear")){
                input.value = startYear;
                input.focus()

            } 
            else if (fieldName.includes("enddate-datesectionmonth")){
                input.value = endMonth || '';
                input.focus()

            } 
            else if (fieldName.includes("enddate-datesectionyear")){
                input.value = endYear || '';
                input.focus()
            } 
            const textarea = section.querySelector<HTMLTextAreaElement>("textarea[id*='roleDescription']");
            if(textarea){
                textarea.value = exp.description
            }
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    };

    const fillEducation = (index: number): void => {
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
            if (fieldName.includes("schoolname")) input.value = edu.collegeName;
            else if (fieldName.includes("fieldofstudy")) input.value = edu.courseName;
            else if (fieldName.includes("gradeaverage")) input.value = edu.grade;
            else if (fieldName.includes("firstyearattended")){
                input.value = edu.startDate;
                input.focus()
            } 
            else if (fieldName.includes("lastyearattended")){
                input.value = edu.endDate;
                input.focus()
            } 

            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });

        // Degree dropdown
        const degreeDropdownBtn = section.querySelector<HTMLButtonElement>('button[name="degree"]');
        if (!degreeDropdownBtn) return;
        degreeDropdownBtn.click();
        setTimeout(() => {
            const options = document.querySelectorAll<HTMLElement>('[role="option"]');
            options.forEach(option => {
                if (option.innerText.trim().toLowerCase() === edu.educationType.toLowerCase()) {
                    option.click();
                }
            });
        }, 500);
    };

    const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
    const observer = new MutationObserver(mutations => {
        let shouldFillForm = false;
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    const element = node as HTMLElement;
                    const input = element.querySelector<HTMLInputElement>("input");
                    if (input) {
                        shouldFillForm = true;
                        fillQuestionaire();
                        fillVoluntaryDisclosure();
                    }

                    setTimeout(() => {
                        const buttons = element.querySelectorAll<HTMLButtonElement>('button');
                        buttons.forEach(async btn => {
                            const group = btn.closest<HTMLElement>('[role="group"]');
                            const labelId = group?.getAttribute('aria-labelledby');
                            const sectionTitle = labelId ? document.getElementById(labelId)?.innerText || '' : '';
                            const isAddButton = btn.innerText.trim().toLowerCase() === 'add' || btn.getAttribute('aria-label')?.toLowerCase().includes('add');
                            if (!isAddButton) return;
                            if (sectionTitle.includes('Work Experience')) {
                                const workExperiences = data?.data?.workExperiences;
                                if (!workExperiences || !Array.isArray(workExperiences)) return;
                                for (let i = 0; i < workExperiences.length; i++) {
                                    btn.click();
                                    await wait(1000);
                                    fillExperience(i);
                                }
                            } else if (sectionTitle.includes('Education')) {
                                const educationExperiences = data.data.educationExperiences
                                if(!educationExperiences || !Array.isArray(educationExperiences)) return;
                                for (let i = 0; i < educationExperiences.length; i++) {
                                    btn.click();
                                    await wait(1000);
                                    fillEducation(i);
                                }
                            }
                        });
                    }, 500);
                }
            });
        });
        if (shouldFillForm) {
            console.log("Filling form...");
            fillPersonalInfo();
            fillQuestionaire();
            fillVoluntaryDisclosure();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
