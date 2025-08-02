import { FormData } from "../utils/types";

export default function fillZohoForm(data: FormData): void {
    function fillPersonalInfo(): void {
        const labels: NodeListOf<HTMLLabelElement> = document.querySelectorAll('label');
        labels.forEach((label) => {
            const labelText = label.textContent?.trim().toLowerCase() || "";
            const input = label.parentElement?.querySelector<HTMLInputElement | HTMLSelectElement>('input, select');
            if (!input) return;
            if (labelText.includes("first name")) {
                input.value = data.data.details.firstName;
            } else if (labelText.includes("last name")) {
                input.value = data.data.details.lastName;
            } else if (labelText.includes("email")) {
                input.value = data.data.details.email;
            } else if (labelText.includes("mobile")) {
                const mobileInputs = label.parentElement?.querySelectorAll<HTMLInputElement>('input');
                if (mobileInputs && mobileInputs.length > 1) {
                    mobileInputs[1].value = data.data.details.phoneNumber;
                }
            } else if (labelText.includes("referred by someone")) {
                input.value = "no";
            } else if (labelText.includes("relationship")) {
                input.value = data.data.details.maritalStatus;
            } else if (labelText.includes("zip")) {
                input.value = data.data.details.zip;
            } else if (labelText.includes("city")) {
                input.value = data.data.details.city;
            } else if (labelText.includes("country")) {
                input.value = data.data.details.country;
            } else if (labelText.includes("twitter")) {
                input.value = data.data.details.twitterUrl;
            } else if (labelText.includes("linkedin")) {
                input.value = data.data.details.linkedinUrl;
            } else if (labelText.includes("street")) {
                input.value = data.data.details.street;
            } else if (labelText.includes("state")) {
                input.value = data.data.details.state;
            }
        });
    }
    function fillExperience(index: number): void {
        const sections = document.querySelectorAll<HTMLDivElement>('.crc-form-tabularblock > div');
        const currentExperienceSection = sections[index];
        const currentWorkExperienceFromData = data.data.workExperiences[index];
        if (!currentExperienceSection || !currentWorkExperienceFromData) return;
        const experienceLabels = currentExperienceSection.querySelectorAll('label');
        experienceLabels.forEach((label) => {
            const labelText = label.textContent?.trim().toLowerCase() || "";
            const input = label.parentElement?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
            if (!input) return;
            if (labelText.includes("title")) {
                input.value = currentWorkExperienceFromData.jobTitle;
            } else if (labelText.includes("company")) {
                input.value = currentWorkExperienceFromData.companyName;
            } else if (labelText.includes("summary")) {
                input.value = currentWorkExperienceFromData.description;
            }
        });
    }
    let clicked = false;
    const observer = new MutationObserver((mutations) => {
        console.log("INSIDE OBSERVER");
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1 && !clicked) {
                    const button = document.querySelector<HTMLAnchorElement>('.tabular-group-add');
                    if (button) {
                        for (let index = 0; index < data.data.workExperiences.length; index++) {
                            button.click();
                            fillExperience(index);
                        }
                        clicked = true;
                    }
                }
            });
        });

        fillPersonalInfo();
    });

    observer.observe(document.body, { subtree: true, childList: true });
}