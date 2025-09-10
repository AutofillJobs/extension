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

    // Wait and set with retries (adapted from LeverScript)
    function waitAndSet(selectors: string[], value: string, fieldName: string, retries = 50, delay = 200) {
        let attempt = 0;
        const interval = setInterval(() => {
            for (const sel of selectors) {
                const input = document.querySelector<HTMLInputElement>(sel);
                if (input && input.offsetParent !== null) {
                    console.log(`✅ [${fieldName}] Found and filling: "${value}"`);
                    setReactValue(input, value);
                    clearInterval(interval);
                    return;
                }
            }
            attempt++;
            if (attempt >= retries) {
                console.error(`❌ [${fieldName}] Failed to find after ${retries} attempts`);
                clearInterval(interval);
            }
        }, delay);
    }

    // Get field value with fallbacks (adapted for FormData type)
    function getFieldValue(primaryField: string, ...fallbackFields: string[]): string | undefined {
        // Access details specifically
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

    // Fill personal info (collect all inputs like Workday, match by name)
    async function fillPersonalInfo(): Promise<void> {
        console.log("🎯 Starting personal info filling...");

        const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input'));

        for (const input of inputs) {
            const name = input.name;
            const id = input.id;
            if (!name && !id) continue;

            let value: string | undefined;

            // Match by name first (stable in Oracle)
            if (name === 'firstName') value = getFieldValue('firstName');
            else if (name === 'lastName') value = getFieldValue('lastName');
            else if (name === 'middleNames') value = getFieldValue('middleName');
            else if (name === 'title') value = getFieldValue('prefix', 'title');
            else if (name === 'country') value = getFieldValue('country');
            else if (name === 'addressLine1') value = getFieldValue('address1', 'addressLine1');
            else if (name === 'city') value = getFieldValue('city');
            else if (name === 'postalCode') value = getFieldValue('zip', 'postalCode');
            else if (name === 'region2') value = getFieldValue('state', 'region2');
            else if (name === 'email') value = getFieldValue('email');
            else if (name === 'phoneNumber') value = getFieldValue('phoneNumber', 'phone');

            // Fallback by id if name didn't match
            if (!value) {
                if (id?.includes('firstName')) value = getFieldValue('firstName');
                else if (id?.includes('lastName')) value = getFieldValue('lastName');
                else if (id?.includes('middleNames')) value = getFieldValue('middleName');
                else if (id?.includes('title')) value = getFieldValue('prefix', 'title');
                else if (id?.includes('country')) value = getFieldValue('country');
                else if (id?.includes('addressLine1')) value = getFieldValue('address1', 'addressLine1');
                else if (id?.includes('city')) value = getFieldValue('city');
                else if (id?.includes('postalCode')) value = getFieldValue('zip', 'postalCode');
                else if (id?.includes('region2')) value = getFieldValue('state', 'region2');
                else if (id?.includes('email')) value = getFieldValue('email');
                else if (id?.includes('phoneNumber')) value = getFieldValue('phoneNumber', 'phone');
            }

            if (value) {
                setReactValue(input, value);
            }
        }

        console.log("🎉 Personal info filling complete");
    }

    // Click Next button
    async function clickNextButton(): Promise<boolean> {
        const selectors = [
            'button[data-automation-id*="Next"]',
            'button[data-automation-id*="next"]',
            'button[aria-label*="Next"]',
            'button[title*="Next"]',
            'button:enabled'
        ];

        for (let attempt = 0; attempt < 10; attempt++) {
            for (const sel of selectors) {
                const btn = document.querySelector<HTMLButtonElement>(sel);
                if (btn) {
                    const text = (btn.textContent || '').trim().toLowerCase();
                    if ((text.includes('next') || text.includes('save') || text.includes('continue')) && !btn.disabled && btn.offsetParent !== null) {
                        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        await wait(300);
                        btn.focus();
                        try {
                            btn.click();
                            console.log("✅ Next button clicked");
                            return true;
                        } catch (err) {
                            btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                            btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                            btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                            console.log("✅ Next button dispatched events");
                            return true;
                        }
                    }
                }
            }

            // Text-based fallback
            const allButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
            for (const b of allButtons) {
                const txt = (b.textContent || '').trim().toLowerCase();
                if ((txt.includes('next') || txt.includes('save') || txt.includes('continue')) && !b.disabled && b.offsetParent !== null) {
                    b.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await wait(200);
                    try { b.click(); } catch { b.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
                    console.log("✅ Next button clicked via text fallback");
                    return true;
                }
            }

            await wait(500 + attempt * 100);
        }

        console.warn("❌ Next button not found");
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
            await fillPersonalInfo();
            await wait(500);
            await clickNextButton();
        } catch (err) {
            console.error("❌ Autofill error", err);
        } finally {
            running = false;
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}