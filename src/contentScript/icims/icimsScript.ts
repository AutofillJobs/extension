import { getUserData } from "../../utils/storageHandler";
import { userData } from "../messageListener";
import { FormData } from "../utils/types";
// iCIMS auto-next button function
async function clickICIMSNextButton(iframeDoc?: Document | null): Promise<boolean> {
    console.log("🔄 iCIMS: Looking for next/continue button...");

    // Wait for form validation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const searchDoc = iframeDoc || document;

    // iCIMS-specific button selectors
    const buttonSelectors = [
        'input[type="submit"][value*="Continue"]',
        'input[type="submit"][value*="Next"]',
        'input[type="submit"][value*="Submit"]',
        'input[type="button"][value*="Continue"]',
        'input[type="button"][value*="Next"]',
        'button[type="submit"]',
        'button.btn',
        'input[id*="continue"]',
        'input[id*="next"]',
        'input[id*="submit"]',
        '.btn-primary',
        '.submit-btn'
    ];

    for (const selector of buttonSelectors) {
        const button = searchDoc.querySelector<HTMLButtonElement | HTMLInputElement>(selector);
        if (button && !button.disabled && button.offsetParent !== null) {
            console.log(`✅ iCIMS: Found button with selector: ${selector}`);
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                button.click();
                console.log("✅ iCIMS: Successfully clicked next button");
                return true;
            } catch (error) {
                console.warn("⚠️ iCIMS: Error clicking button:", error);
            }
        }
    }

    // Fallback: text-based search
    const allButtons = searchDoc.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input[type="submit"], input[type="button"]');
    for (const button of allButtons) {
        const text = (button.textContent || button.value || '').toLowerCase();
        if ((text.includes('continue') || text.includes('next') || text.includes('submit')) &&
            !button.disabled && button.offsetParent !== null) {
            console.log(`✅ iCIMS: Found button by text: ${text}`);
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                button.click();
                console.log("✅ iCIMS: Successfully clicked next button via text search");
                return true;
            } catch (error) {
                console.warn("⚠️ iCIMS: Error clicking button via text search:", error);
            }
        }
    }

    console.warn("❌ iCIMS: No next/submit button found");
    return false;
}

export function autofillICIMS(userData: FormData, iframeDoc?: Document | null): void {
    const inputs = iframeDoc.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select');
    inputs.forEach((input) => {
        const fieldName = (input.name || input.id || "").toLowerCase();
        console.log(fieldName);

        if (fieldName.includes("firstname") || fieldName.includes("2008")) {
            input.value = userData.data.details.firstName;
        } else if (fieldName.includes("lastname")) {
            input.value = userData.data.details.lastName;
        } else if (fieldName.includes("2092")) {
            input.value = `${userData.data.details.firstName} ${userData.data.details.lastName}`;
        } else if (fieldName.includes("rcf2051")) {
            input.value = userData.data.details.email;
        } else if (fieldName.includes("phonenumber")) {
            input.value = userData.data.details.phoneNumber;
        } else if (fieldName.includes("addressstreet1")) {
            input.value = userData.data.details.address1;
        } else if (fieldName.includes("addressstreet2")) {
            input.value = userData.data.details.address2;
        } else if (fieldName.includes("city")) {
            input.value = userData.data.details.city;
        } else if (fieldName.includes("zip")) {
            input.value = userData.data.details.zip;
        } else if (fieldName.includes("addresstype") || fieldName.includes("phonetype") || fieldName.includes("gender")) {
            const options = input.querySelectorAll("option");
            options.forEach((option) => {
                const text = option.text.trim().toLowerCase();
                if (fieldName.includes("addresstype") && text === "home") {
                    input.value = option.value;
                } else if (fieldName.includes("phonetype") && text === "mobile") {
                    input.value = option.value;
                } else if (fieldName.includes("country") && text === userData.data.details.country.trim().toLowerCase()) {
                    input.value = option.value;
                } else if (fieldName.includes("gender") && text === userData.data.details.gender.toLowerCase()) {
                    input.value = option.value;
                }
            });
        } else if (fieldName.includes("addresscountry")) {
            console.log("FOUND", input);
            input.removeAttribute("disabled")
            let attempts = 10
            const interval = setInterval(() => {
                const options = Array.from(input.querySelectorAll("option"));
                console.log(options);
                if (options.length > 1) {
                    const match = options.find(opt => opt.text.trim().toLowerCase() === "unitedstates");
                    if (match) {
                        input.value = match.value;
                        // Dispatch events so iCIMS detects change
                        input.dispatchEvent(new Event("input", { bubbles: true }));
                        input.dispatchEvent(new Event("change", { bubbles: true }));
                        clearInterval(interval);
                    }
                }
                if (--attempts === 0) {
                    clearInterval(interval);
                }
            }, 1000);
        }
    });

    // Auto-click next button after filling
    setTimeout(() => {
        clickICIMSNextButton(iframeDoc);
    }, 4000);
}

// Observe DOM changes since iCIMS loads dynamically
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        console.log("Inside mutation");
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as HTMLElement;
                if (element.id === 'icims_content_iframe') {
                    const iframe = document.querySelector<HTMLIFrameElement>('#icims_content_iframe');
                    if (!iframe) {
                        console.log(' iCIMS iframe not found');
                        return;
                    }
                    iframe.addEventListener('load', () => {
                        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                        if (!iframeDoc) return;
                        const iframeObserver = new MutationObserver((ifrmamutes) => {
                            ifrmamutes.forEach((iframemut) => {
                                iframemut.addedNodes.forEach((iframeNode) => {
                                    if (iframeNode.nodeType === Node.ELEMENT_NODE) {
                                        // console.log("SDSDS", iframeNode); 

                                    }
                                })
                            })

                        })
                        setTimeout(() => {
                            getUserData((userData) => {
                                if (userData) {
                                    autofillICIMS(userData, iframeDoc);
                                    // Auto-click next button after filling
                                    setTimeout(() => {
                                        clickICIMSNextButton(iframeDoc);
                                    }, 3000); // 3 second delay after autofill
                                }
                            })
                        }, 500);
                        const iframeBody = iframeDoc.body;
                        if (iframeBody) {
                            iframeObserver.observe(iframeBody, { childList: true, subtree: true });
                        }
                    });
                }
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });