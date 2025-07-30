import { getUserData } from "../../utils/storageHandler";
import { userData } from "../messageListener";
import { FormData } from "../utils/types";
export function autofillICIMS(userData: FormData, iframeDoc?: Document | null): void {
    const inputs = iframeDoc.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select');
    inputs.forEach((input) => {
        console.log("INCOUT", input);
        
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
        }else if(fieldName.includes("addresscountry")){
            console.log("FOUND", input);
            input.removeAttribute("disabled")            
            let attempts = 10
            const interval = setInterval(() => {
            const options = Array.from(input.querySelectorAll("option"));
            console.log(options);
            if (options.length > 1) {
                const match = options.find(opt => opt.text.trim().toLowerCase() === userData.data.details.country.toLowerCase());
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
                }}, 1000);
            }
        });
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
                        setTimeout(() => {
                            getUserData((userData) => {
                                if(userData){
                                    autofillICIMS(userData, iframeDoc);
                                }
                            })
                        }, 500);
                    });
                }
            }
        });
    });
});

observer.observe(document.body, { childList: true, subtree: true });