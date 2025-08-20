// utils/waitForInput.ts
async function waitForInput(
  selector: string,
  timeout = 6000,
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
  } catch (error) {
    console.error("❌ Error autofilling SuccessFactors form:", error);
  }
}