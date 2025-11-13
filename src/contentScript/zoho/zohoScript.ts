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
    // Zoho auto-next button function
    async function clickZohoNextButton(): Promise<boolean> {
        console.log("🔄 Zoho: Looking for next/continue button...");
        
        // Wait for form validation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Zoho-specific button selectors
        const buttonSelectors = [
            'input[type="submit"][value*="Submit"]',
            'input[type="submit"][value*="Continue"]',
            'input[type="submit"][value*="Next"]',
            'button[type="submit"]',
            'button.btn-primary',
            'button.btn-success',
            '.btn-submit',
            '.submit-button',
            'input[value="Submit Application"]',
            'input[value="Continue"]',
            'input[value="Next"]',
            '.crc-form-submit',
            '.form-submit-btn'
        ];

        for (const selector of buttonSelectors) {
            const button = document.querySelector<HTMLButtonElement | HTMLInputElement>(selector);
            if (button && !button.disabled && button.offsetParent !== null) {
                console.log(`✅ Zoho: Found button with selector: ${selector}`);
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 500));
                
                try {
                    button.click();
                    console.log("✅ Zoho: Successfully clicked next button");
                    return true;
                } catch (error) {
                    console.warn("⚠️ Zoho: Error clicking button:", error);
                }
            }
        }

        // Fallback: text-based search
        const allButtons = document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input[type="submit"], input[type="button"]');
        for (const button of allButtons) {
            const text = (button.textContent || button.value || '').toLowerCase();
            if ((text.includes('submit') || text.includes('continue') || text.includes('next')) && 
                !button.disabled && button.offsetParent !== null) {
                console.log(`✅ Zoho: Found button by text: ${text}`);
                button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await new Promise(resolve => setTimeout(resolve, 500));
                
                try {
                    button.click();
                    console.log("✅ Zoho: Successfully clicked next button via text search");
                    return true;
                } catch (error) {
                    console.warn("⚠️ Zoho: Error clicking button via text search:", error);
                }
            }
        }

        console.warn("❌ Zoho: No next/submit button found");
        return false;
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
                        
                        // Auto-click next button after filling experiences
                        setTimeout(() => {
                            clickZohoNextButton();
                        }, 3000);
                    }
                }
            });
        });
        fillPersonalInfo();
        
        // Auto-click next button after filling personal info (if no experiences)
        if (data.data.workExperiences.length === 0) {
            setTimeout(() => {
                clickZohoNextButton();
            }, 3000);
        }
    });

    observer.observe(document.body, { subtree: true, childList: true });
}