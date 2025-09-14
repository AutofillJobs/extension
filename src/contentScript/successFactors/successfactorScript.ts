// utils/waitForInput.ts
async function waitForInput(
  selector: string,
  timeout = 3000,
  context: Document | ShadowRoot = document
): Promise<HTMLInputElement | null> {
  return new Promise((resolve) => {
    const tryFind = () => context.querySelector(selector) as HTMLInputElement;
    const el = tryFind();
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const elNow = tryFind();
      if (elNow) {
        resolve(elNow);
        observer.disconnect();
      }
    });

    observer.observe(context, { childList: true, subtree: true });

    setTimeout(() => {
      console.warn(`⚠️ Timeout waiting for ${selector}`);
      resolve(null);
      observer.disconnect();
    }, timeout);
  });
}

async function fillWithRetry(
  selector: string,
  value: string,
  label: string,
  retries = 3 
) {
  for (let i = 0; i < retries; i++) {
    let input = await waitForInput(selector, 5000, document);
    if (!input) {
      const iframes = document.querySelectorAll("iframe");
      for (const iframe of Array.from(iframes)) {
        try {
          const iframeDoc = iframe.contentDocument;
          if (iframeDoc) {
            input = await waitForInput(selector, 5000, iframeDoc);
            if (input) break; 
          }
        } catch (err) {
          console.warn(`Could not access an iframe due to security policy. This is usually normal.`);
        }
      }
    }
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      console.log(`✅ Filled ${label}: ${value}`);
      return true; // Success! Exit the function.
    }
    console.log(`⏳ Retry ${i + 1}/${retries} for ${label}. Element not found.`);
  }

  console.warn(`❌ Failed to fill ${label} after all retries.`);
  return false;
}

// SuccessFactors auto-next button function
async function clickSuccessFactorsNextButton(): Promise<boolean> {
  console.log("🔄 SuccessFactors: Looking for next/continue button...");
  
  // Wait for form validation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // SuccessFactors-specific button selectors
  const buttonSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    'button[id*="continue"]',
    'button[id*="next"]',
    'button[id*="submit"]',
    'input[id*="continue"]',
    'input[id*="next"]',
    'input[id*="submit"]',
    'button[value*="Continue"]',
    'button[value*="Next"]',
    'button[value*="Submit"]',
    'input[value*="Continue"]',
    'input[value*="Next"]',
    'input[value*="Submit"]',
    '.btn-primary',
    '.btn-success',
    '.submit-btn',
    '.continue-btn',
    '.next-btn'
  ];

  // Check main document first
  for (const selector of buttonSelectors) {
    const button = document.querySelector<HTMLButtonElement | HTMLInputElement>(selector);
    if (button && !button.disabled && button.offsetParent !== null) {
      console.log(`✅ SuccessFactors: Found button with selector: ${selector}`);
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        button.click();
        console.log("✅ SuccessFactors: Successfully clicked next button");
        return true;
      } catch (error) {
        console.warn("⚠️ SuccessFactors: Error clicking button:", error);
      }
    }
  }

  // Check iframes (SuccessFactors often uses iframes)
  const iframes = document.querySelectorAll("iframe");
  for (const iframe of Array.from(iframes)) {
    try {
      const iframeDoc = iframe.contentDocument;
      if (iframeDoc) {
        for (const selector of buttonSelectors) {
          const button = iframeDoc.querySelector<HTMLButtonElement | HTMLInputElement>(selector);
          if (button && !button.disabled && button.offsetParent !== null) {
            console.log(`✅ SuccessFactors: Found button in iframe with selector: ${selector}`);
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await new Promise(resolve => setTimeout(resolve, 500));
            
            try {
              button.click();
              console.log("✅ SuccessFactors: Successfully clicked next button in iframe");
              return true;
            } catch (error) {
              console.warn("⚠️ SuccessFactors: Error clicking button in iframe:", error);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Could not access iframe due to security policy");
    }
  }

  // Fallback: text-based search in main document
  const allButtons = document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input[type="submit"], input[type="button"]');
  for (const button of allButtons) {
    const text = (button.textContent || button.value || '').toLowerCase();
    if ((text.includes('continue') || text.includes('next') || text.includes('submit')) && 
        !button.disabled && button.offsetParent !== null) {
      console.log(`✅ SuccessFactors: Found button by text: ${text}`);
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        button.click();
        console.log("✅ SuccessFactors: Successfully clicked next button via text search");
        return true;
      } catch (error) {
        console.warn("⚠️ SuccessFactors: Error clicking button via text search:", error);
      }
    }
  }

  console.warn("❌ SuccessFactors: No next/submit button found");
  return false;
}

export default async function fillSuccessFactorsForm(userData: any) {
  console.log("🚀 Autofilling SuccessFactors form...");

  try {
    if (!userData?.data?.details) {
      console.warn("⚠️ No user data available for SuccessFactors form.");
      return;
    }

    const details = userData.data.details;

    if (details.firstName) {
      await fillWithRetry(
        'input[id*="nameComponent_firstName"], input[name*="firstName"], input#firstName',
        details.firstName,
        "First Name"
      );
    }

    if (details.lastName) {
      await fillWithRetry(
        'input[id*="nameComponent_lastName"], input[name*="lastName"], input#lastName',
        details.lastName,
        "Last Name"
      );
    }

    if (details.email) {
      await fillWithRetry(
        'input[id*="email"], input[name*="emailAddress"], input#email',
        details.email,
        "Email"
      );
    }

    if (details.phone) {
      await fillWithRetry(
        'input[id*="phone"], input[name*="phoneNumber"], input#phone',
        details.phone,
        "Phone"
      );
    }

    console.log("🎉 SuccessFactors form autofill complete!");
    
    // Auto-click next button after filling
    setTimeout(() => {
      clickSuccessFactorsNextButton();
    }, 3000);
    
  } catch (error) {
    console.error("❌ Error autofilling SuccessFactors form:", error);
  }
}







