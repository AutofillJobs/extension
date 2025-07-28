interface Experience {
    title: string;
    company: string;
    location: string;
    startMonth: string;
    startYear: string;
    endMonth?: string;
    endYear?: string;
}

interface Education {
    collegeName: string;
    degree: string;
    field: string;
    cpga: number;
    startDate: string;
    endDate: string;
}

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    postalCode: number;
    addressLine1: string;
    city: string;
    phoneNumber: number;
    linkedinAccount: string;
    country: string;
    websites: string[];
    experience: Experience[];
    education: Education[];
}

export default function fillWorkdayForm(): void {
    const data: FormData = {
        firstName: "Sreehari",
        lastName: "Jayaram",
        email: "sreeharijayaram21@gmail.com",
        postalCode: 673521,
        addressLine1: "Kammana House, Iringal PO, Koyilandi",
        city: "Kozhikode",
        phoneNumber: 9876543210,
        linkedinAccount: "sreehari@linkedin.com",
        country: "india",
        websites: ["https://www.sreehari.com"],
        experience: [
            {
                title: "Backend Engineer",
                company: "Cred",
                location: "Bangalore",
                startMonth: "03",
                startYear: "2024"
            },
            {
                title: "Full Stack Intern",
                company: "Cyberlence",
                location: "Remote",
                startMonth: "06",
                startYear: "2023",
                endMonth: "10",
                endYear: "2023"
            }
        ],
        education: [
            {
                collegeName: "Federal Institute of Science and Technology",
                degree: "MCA",
                field: "Computer science",
                cpga: 9.8,
                startDate: "2023",
                endDate: "2025"
            },
            {
                collegeName: "Calicut University",
                degree: "BCA",
                field: "Computer science",
                cpga: 9.0,
                startDate: "2020",
                endDate: "2023"
            }
        ]
    };

    const fillPersonalInfo = (websiteIndex = 0): void => {
        const inputs = document.querySelectorAll<HTMLInputElement>("input");
        inputs.forEach(input => {
            const fieldName = (input.name || input.id || "").toLowerCase();
            if (fieldName.includes("firstname")) input.value = data.firstName;
            else if (fieldName.includes("lastname")) input.value = data.lastName;
            else if (fieldName.includes("email")) input.value = data.email;
            else if (fieldName.includes("postalcode")) input.value = String(data.postalCode);
            else if (fieldName.includes("addressline1")) input.value = data.addressLine1;
            else if (fieldName.includes("city")) input.value = data.city;
            else if (fieldName.includes("phonenumber")) input.value = String(data.phoneNumber);
            else if (fieldName.includes("linkedinaccount")) input.value = data.linkedinAccount;
            else if (fieldName.includes("url")) input.value = data.websites[websiteIndex];
            else if (fieldName.includes("selfidentifieddisabilitydata--name")) input.value = data.firstName + data.lastName;

            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });

        // Country dropdown selection
        const countryDropdownBtn = document.querySelector<HTMLButtonElement>('button[name="country"]');
        if (!countryDropdownBtn) return;
        countryDropdownBtn.click();
        setTimeout(() => {
            const options = document.querySelectorAll<HTMLElement>('[role="option"]');
            options.forEach(option => {
                if (option.innerText.trim().toLowerCase() === data.country.toLowerCase()) {
                    option.click();
                }
            });
        }, 500);
    };

    const fillExperience = (index: number): void => {
        const exp = data.experience[index];
        if (!exp) return;
        const sections = document.querySelectorAll<HTMLElement>('[aria-labelledby*="Work-Experience"]');
        const section = sections[index + 1];
        if (!section) return;

        const inputs = section.querySelectorAll<HTMLInputElement>("input");
        inputs.forEach(input => {
            const fieldName = (input.name || input.id || "").toLowerCase();
            if (!exp.endMonth || !exp.endYear) {
                if (fieldName.includes('currentlyworkhere')) input.click();
            }
            if (fieldName.includes("jobtitle")) input.value = exp.title;
            else if (fieldName.includes("companyname")) input.value = exp.company;
            else if (fieldName.includes("location")) input.value = exp.location;
            else if (fieldName.includes("startdate-datesectionmonth")){
                input.value = exp.startMonth;
                input.focus()
            } 
            else if (fieldName.includes("startdate-datesectionyear")){
                input.value = exp.startYear;
                input.focus()

            } 
            else if (fieldName.includes("enddate-datesectionmonth")){
                input.value = exp.endMonth || '';
                input.focus()

            } 
            else if (fieldName.includes("enddate-datesectionyear")){
                input.value = exp.endYear || '';
                input.focus()
            } 

            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
        });
    };

    const fillEducation = (index: number): void => {
        const edu = data.education[index];
        if (!edu) return;
        const sections = document.querySelectorAll<HTMLElement>('[aria-labelledby*="Education"]');
        const section = sections[index + 1];
        if (!section) return;

        const inputs = section.querySelectorAll<HTMLInputElement>("input");
        inputs.forEach(input => {
            const fieldName = (input.name || input.id || "").toLowerCase();
            if (fieldName.includes("schoolname")) input.value = edu.collegeName;
            else if (fieldName.includes("fieldofstudy")) input.value = edu.field;
            else if (fieldName.includes("gradeaverage")) input.value = String(edu.cpga);
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
                if (option.innerText.trim().toLowerCase() === edu.degree.toLowerCase()) {
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
                    if (input) shouldFillForm = true;

                    setTimeout(() => {
                        const buttons = element.querySelectorAll<HTMLButtonElement>('button.css-f176sn');
                        buttons.forEach(async btn => {
                            const group = btn.closest<HTMLElement>('[role="group"]');
                            const labelId = group?.getAttribute('aria-labelledby');
                            const sectionTitle = labelId ? document.getElementById(labelId)?.innerText || '' : '';

                            if (sectionTitle.includes('Work Experience')) {
                                for (let i = 0; i < data.experience.length; i++) {
                                    btn.click();
                                    await wait(1000);
                                    fillExperience(i);
                                }
                            } else if (sectionTitle.includes('Education')) {
                                for (let i = 0; i < data.education.length; i++) {
                                    btn.click();
                                    await wait(1000);
                                    fillEducation(i);
                                }
                            } else if (sectionTitle.includes('Websites')) {
                                for (let i = 0; i < data.websites.length; i++) {
                                    btn.click();
                                    await wait(1000);
                                    fillPersonalInfo(i);
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
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}
