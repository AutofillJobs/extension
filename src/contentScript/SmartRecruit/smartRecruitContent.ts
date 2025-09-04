import {
  detectPreliminaryQuestionsPage,
  fillPreliminaryQuestions,
} from "./preliminaryScript";

export const domHelpers = {
  waitForElement: async (
    selectors: string | string[],
    timeout = 5000
  ): Promise<HTMLElement | null> => {
    const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      for (const selector of selectorArray) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) return element;
      }
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  },

  waitForElements: async (
    parent: HTMLElement,
    selector: string,
    timeout = 3000
  ): Promise<HTMLElement[]> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const elements = Array.from(
        parent.querySelectorAll(selector)
      ) as HTMLElement[];
      if (elements.length > 0) return elements;
      await new Promise((r) => setTimeout(r, 200));
    }
    return [];
  },

  isVisible: (element: HTMLElement): boolean => {
    return !!(
      element.offsetWidth ||
      element.offsetHeight ||
      element.getClientRects().length
    );
  },

  delay: (ms: number) => new Promise((r) => setTimeout(r, ms)),
};

const waitForNewForm = async (
  selector: string,
  initialCount: number,
  context: string,
  timeout = 5000
): Promise<HTMLElement | null> => {
  console.log(
    ` waitForNewForm (${context}): Looking for new form with selector '${selector}'. Initial count: ${initialCount}`
  );
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const forms = document.querySelectorAll(selector);
    console.log(
      ` waitForNewForm (${context}): Polling... Found ${forms.length} forms.`
    );
    if (forms.length > initialCount) {
      return forms[forms.length - 1] as HTMLElement;
    }
    await domHelpers.delay(200);
  }
  console.log(
    ` waitForNewForm (${context}): Timed out. No new form appeared matching selector '${selector}'.`
  );
  return null;
};

function waitForElement(
  selector: string,
  timeout = 5000
): Promise<HTMLElement | null> {
  return domHelpers.waitForElement(selector, timeout);
}

async function fillInput(selector: string, value: string) {
  if (!value) return;

  console.log(`Searching for: ${selector} to fill with: "${value}"`);

  const selectorStrategies = [
    selector,
    `[data-test="${selector}"]`,
    `[id="${selector}"]`,
    `#${selector}`,
    `.${selector}`,
    `[name="${selector}"]`,
    `[placeholder*="${selector}"]`,
    `[aria-label*="${selector}"]`,
  ];

  let element = null;
  for (const sel of selectorStrategies) {
    try {
      element = document.querySelector(sel);
      if (element) {
        console.log(` Found element with selector: ${sel}`);
        break;
      }
    } catch (error) {
      console.warn(`Invalid selector: ${sel}`, error);
    }
  }

  if (!element) {
    console.warn(` Element not found with any selector: ${selector}`);
    return;
  }

  try {
    let targetInput: HTMLInputElement | null = null;

    if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
      targetInput = element as HTMLInputElement;
    }

    if (!targetInput) {
      const nestedInput = element.querySelector("input, textarea");
      if (nestedInput && nestedInput instanceof HTMLInputElement) {
        targetInput = nestedInput;
      }
    }

    if (!targetInput) {
      const deepInputs = [
        element.querySelector("input"),
        element.querySelector("textarea"),
        element.shadowRoot?.querySelector("input"),
        element.shadowRoot?.querySelector("textarea"),
      ].filter(Boolean);

      if (deepInputs.length > 0) {
        targetInput = deepInputs[0] as HTMLInputElement;
      }
    }

    if (!targetInput) {
      console.warn(` No input element found within: ${selector}`);
      return;
    }

    console.log(
      `Filling input: ${targetInput.id || targetInput.name || selector}`
    );

    targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
    await domHelpers.delay(200);

    targetInput.value = "";

    targetInput.value = value;

    targetInput.focus();

    const events = ["input", "change", "blur"];
    events.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      targetInput!.dispatchEvent(event);
    });

    const nativeSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    );
    if (nativeSetter && nativeSetter.set) {
      try {
        nativeSetter.set.call(targetInput, value);
      } catch (error) {
        console.warn("Native setter failed:", error);
      }
    }

    if ((targetInput as any)._valueTracker) {
      (targetInput as any)._valueTracker.setValue(value);
    }

    const inputEvent = new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      data: value,
      inputType: "insertText",
    });
    targetInput.dispatchEvent(inputEvent);

    setTimeout(() => {
      const actualValue = targetInput!.value;

      if (actualValue !== value) {
        console.warn(` Value mismatch - attempting direct DOM manipulation`);
        targetInput!.setAttribute("value", value);
        targetInput!.value = value;
        console.log(` Applied fallback value setting`);
      }
    }, 300);
  } catch (error) {
    console.error(` Error filling ${selector}:`, error);
  }
}

async function fillAutocomplete(selector: string, value: string) {
  if (!value) return;

  const element = await domHelpers.waitForElement(
    `[id="${selector}"], [data-test="${selector}"], #${selector}`
  );
  if (!element) {
    console.warn(` Autocomplete element not found: ${selector}`);
    return;
  }

  console.log(` Filling autocomplete: ${selector} with value: "${value}"`);

  try {
    let targetInput = element as HTMLInputElement;

    if (element.tagName.startsWith("SPL-")) {
      const nestedInput = element.querySelector("input") as HTMLInputElement;
      if (nestedInput) {
        targetInput = nestedInput;
      }
    }

    targetInput.value = "";
    targetInput.focus();

    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      targetInput.value += char;

      targetInput.dispatchEvent(new Event("input", { bubbles: true }));
      targetInput.dispatchEvent(new Event("keydown", { bubbles: true }));

      await domHelpers.delay(100);
    }

    await domHelpers.delay(1000);

    const suggestions = document.querySelectorAll(
      '[role="option"], .suggestion-item, .dropdown-item'
    );
    if (suggestions.length > 0) {
      for (const suggestion of Array.from(suggestions)) {
        const text = suggestion.textContent?.trim().toLowerCase();
        if (
          text === value.toLowerCase() ||
          text?.includes(value.toLowerCase())
        ) {
          (suggestion as HTMLElement).click();
          console.log(` Selected suggestion: ${suggestion.textContent}`);
          break;
        }
      }
    }

    targetInput.dispatchEvent(new Event("change", { bubbles: true }));
    targetInput.dispatchEvent(new Event("blur", { bubbles: true }));

    console.log(`Autocomplete filled: ${selector}`);
  } catch (error) {
    console.error(` Error filling autocomplete ${selector}:`, error);

    await fillInput(`#${selector}`, value);
  }
}

async function fillTextarea(selector: string, value: string) {
  if (!value) return;

  const element = await domHelpers.waitForElement(
    `[id="${selector}"], #${selector}`
  );
  if (element) {
    const textarea =
      (element.querySelector("textarea") as HTMLTextAreaElement) ||
      (element as HTMLTextAreaElement);
    textarea.value = value;
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(` Textarea filled: ${selector}`);
  }
}

async function fillYourProfiles(details: any) {
  console.log(" Filling Your Profiles section...");
  if (!details) {
    console.warn("No details provided to fillYourProfiles");
    return;
  }

  const profilesSection = await domHelpers.waitForElement('[data-test="web"]');
  if (!profilesSection) {
    console.warn(" Your Profiles section not found");
    return;
  }

  if (details.linkedinUrl) {
    await fillInput("#linkedin-input", details.linkedinUrl);
  }

  if (details.twitterUrl) {
    await fillInput("#twitter-input", details.twitterUrl);
  }

  if (details.facebookUrl) {
    await fillInput("#facebook-input", details.facebookUrl);
  }

  if (details.githubUrl || details.websiteUrl) {
    const websiteUrl = details.websiteUrl || details.githubUrl;
    await fillInput("#website-input", websiteUrl);
  }

  console.log(" Your Profiles section filled.");
}

// Function to handle clicking the 'Next' or 'Continue' button
async function clickNextButton(): Promise<boolean> {
  console.log(" Looking for Next/Continue button...");

  const primarySelectors = [
    'button[data-test="next-button"]',
    'button[type="submit"]',
    ".next-button",
    ".c-spl-button",
    ".spl-button",
  ];
  const textCandidates = [
    "next",
    "continue",
    "save and continue",
    "save & continue",
  ];

  for (const sel of primarySelectors) {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el && domHelpers.isVisible(el) && !(el as HTMLButtonElement).disabled) {
      console.log(` Found Next/Continue via selector: ${sel}`);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await domHelpers.delay(400);
      el.click();
      await domHelpers.delay(3000);
      return true;
    }
  }

  const broadSel =
    'button, [role="button"], input[type="submit"], a, .c-spl-button, .spl-button, .btn, .button, [class*="button" i]';
  const candidates = Array.from(
    document.querySelectorAll(broadSel)
  ) as HTMLElement[];
  const visible = candidates.filter(
    (e) => domHelpers.isVisible(e) && !(e as HTMLButtonElement).disabled
  );
  for (const e of visible) {
    const txt = (e.innerText || e.textContent || "").trim().toLowerCase();
    if (!txt) continue;
    if (textCandidates.some((t) => txt.includes(t))) {
      console.log(` Found Next/Continue by text: "${txt}"`);
      e.scrollIntoView({ behavior: "smooth", block: "center" });
      await domHelpers.delay(400);
      e.click();
      await domHelpers.delay(3000);
      return true;
    }
  }

  console.warn("No Next/Continue button found on the page.");
  return false;
}

async function fillHiringManagerMessage(details: any) {
  console.log(" Filling Message to the Hiring Team section...");
  if (!details) {
    console.warn(" No details provided to fillHiringManagerMessage");
    return;
  }

  const messageSection = await domHelpers.waitForElement(
    '[data-test="hiring-manager-message-container"]'
  );
  if (!messageSection) {
    console.warn(" Message to the Hiring Team section not found");
    return;
  }

  if (details.coverLetter || details.hiringManagerMessage) {
    const message = details.hiringManagerMessage || details.coverLetter;

    const container = await domHelpers.waitForElement(
      '[data-test="hiring-manager-message-container"]'
    );
    if (container) {
      const findAndFillTextarea = () => {
        const approaches = [
          () => container.querySelector("textarea"),
          () => {
            const splTextarea = container.querySelector("spl-textarea");
            return (
              splTextarea?.querySelector("textarea") ||
              splTextarea?.shadowRoot?.querySelector("textarea")
            );
          },

          () => {
            const ocTextarea = container.querySelector("oc-textarea");
            return (
              ocTextarea?.querySelector("textarea") ||
              ocTextarea?.shadowRoot?.querySelector("textarea")
            );
          },

          () => container.querySelector("* textarea"),
        ];

        for (const approach of approaches) {
          try {
            const textarea = approach() as HTMLTextAreaElement;
            if (textarea) {
              return textarea;
            }
          } catch (e) {
            console.log("Error finding textarea:", e);
          }
        }
        return null;
      };

      const textarea = findAndFillTextarea();

      if (textarea) {
        setTimeout(() => {
          textarea.value = "";

          Object.defineProperty(textarea, "value", {
            value: message,
            writable: true,
          });

          const methods = [
            () => textarea.dispatchEvent(new Event("input", { bubbles: true })),
            () =>
              textarea.dispatchEvent(new Event("change", { bubbles: true })),
            () => textarea.dispatchEvent(new Event("focus", { bubbles: true })),

            () => {
              const nativeSetter = Object.getOwnPropertyDescriptor(
                window.HTMLTextAreaElement.prototype,
                "value"
              )?.set;
              if (nativeSetter) {
                nativeSetter.call(textarea, message);
                textarea.dispatchEvent(new Event("input", { bubbles: true }));
              }
            },

            () => {
              const formControl = textarea.closest("[formcontrolname]");
              if (formControl) {
                formControl.dispatchEvent(
                  new Event("input", { bubbles: true })
                );
                formControl.dispatchEvent(
                  new Event("change", { bubbles: true })
                );
              }
            },
          ];

          methods.forEach((method, index) => {
            setTimeout(() => {
              try {
                method();
                console.log(`Applied method ${index + 1}`);
              } catch (e) {
                console.log(`Method ${index + 1} failed:`, e);
              }
            }, index * 100);
          });

          setTimeout(() => {
            console.log(
              ` Final textarea value: ${textarea.value.substring(0, 50)}...`
            );
            console.log(` Expected value: ${message.substring(0, 50)}...`);
            console.log(` Values match: ${textarea.value === message}`);
          }, (methods.length + 1) * 100);
        }, 1000);
      } else {
        console.warn(" Textarea element not found");

        const allInputs = container.querySelectorAll(
          'textarea, input[type="text"]'
        );
        console.log(`Found ${allInputs.length} input elements:`, allInputs);

        const formControls = container.querySelectorAll("[formcontrolname]");
        formControls.forEach((control, index) => {
          console.log(`Form control ${index}:`, control);
          const internalTextarea = control.querySelector("textarea");
          if (internalTextarea) {
            internalTextarea.value = message;
            internalTextarea.dispatchEvent(
              new Event("input", { bubbles: true })
            );
            console.log(` Filled internal textarea ${index}`);
          }
        });
      }
    } else {
      console.warn("Hiring manager message container not found");
    }
  }

  console.log(" Message to the Hiring Team section filled.");
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fillPersonalInfo(details: any) {
  console.log("Filling Personal Information...");
  if (!details) {
    console.warn(" No details provided to fillPersonalInfo");
    return;
  }

  await domHelpers.waitForElement("spl-input#first-name-input");
  await domHelpers.waitForElement("spl-input#last-name-input");
  await domHelpers.waitForElement("spl-input#email-input");
  await domHelpers.waitForElement("spl-phone-field#spl-form-element_5");
  await domHelpers.waitForElement("spl-autocomplete#spl-form-element_10");

  await fillInput("spl-input#first-name-input", details.firstName || "");
  await fillInput("spl-input#last-name-input", details.lastName || "");
  await fillInput("spl-input#email-input", details.email || "");
  await fillInput("spl-input#confirm-email-input", details.email || "");

  console.log(" Filling city using component-aware approach...");

  let cityValue = details.city || details.location?.city || "";
  if (cityValue.includes(",")) {
    cityValue = cityValue.split(",")[0].trim();
  }

  const cityComponents = [
    'spl-autocomplete[data-test="location-autocomplete"]',
    'spl-autocomplete[label="City"]',
    "#spl-form-element_10",
  ];

  let cityComponent: HTMLElement | null = null;
  let cityInput: HTMLInputElement | null = null;

  for (const selector of cityComponents) {
    cityComponent = document.querySelector(selector) as HTMLElement;
    if (cityComponent) {
      break;
    }
  }

  if (cityComponent) {
    cityComponent.click();
    await delay(1000);

    if (cityComponent.shadowRoot) {
      cityInput =
        (cityComponent.shadowRoot.querySelector("input") as HTMLInputElement) ||
        (cityComponent.shadowRoot.querySelector(
          'input[type="text"]'
        ) as HTMLInputElement) ||
        (cityComponent.shadowRoot.querySelector(
          "spl-input input"
        ) as HTMLInputElement);

      if (!cityInput) {
        const shadowSplInput =
          cityComponent.shadowRoot.querySelector("spl-input");
        if (shadowSplInput && shadowSplInput.shadowRoot) {
          cityInput = shadowSplInput.shadowRoot.querySelector(
            "input"
          ) as HTMLInputElement;
        }
      }
    }

    if (!cityInput) {
      await delay(2000);

      if (cityComponent.shadowRoot) {
        cityInput =
          (cityComponent.shadowRoot.querySelector(
            "input"
          ) as HTMLInputElement) ||
          (cityComponent.shadowRoot.querySelector(
            'input[type="text"]'
          ) as HTMLInputElement);
      }
    }

    if (!cityInput) {
      cityInput =
        (document.querySelector(
          'input[placeholder*="City" i]'
        ) as HTMLInputElement) ||
        (document.querySelector(
          'input[placeholder*="city" i]'
        ) as HTMLInputElement) ||
        (document.querySelector("input.c-spl-input") as HTMLInputElement) ||
        (document.querySelector(
          'input[data-test*="location"]'
        ) as HTMLInputElement);
    }

    if (cityInput) {
      cityInput.click();
      cityInput.focus();
      cityInput.value = "";

      for (const char of cityValue) {
        cityInput.value += char;
        cityInput.dispatchEvent(new Event("input", { bubbles: true }));
        await delay(50);
      }

      await delay(1500);

      const autocompleteSelectors = [
        ".c-spl-autocomplete-default-option",
        ".c-spl-autocomplete-option-content",
        "spl-typography-body",
        '[role="option"]',
        "spl-select-option",
        ".sr-autocomplete-option",
      ];

      let hasAutocompleteOptions = false;
      for (const selector of autocompleteSelectors) {
        if (document.querySelector(selector)) {
          hasAutocompleteOptions = true;
          break;
        }
      }

      if (hasAutocompleteOptions) {
        cityInput.focus();
        await delay(500);

        const arrowDownEvent = new KeyboardEvent("keydown", {
          key: "ArrowDown",
          code: "ArrowDown",
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true,
          composed: true,
        });
        cityInput.dispatchEvent(arrowDownEvent);
        await delay(400);

        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
          composed: true,
        });
        cityInput.dispatchEvent(enterEvent);
        await delay(600);

        cityInput.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
        );

        await delay(300);

        const finalValue = cityInput.value;
        if (finalValue && finalValue !== cityValue) {
          console.log(
            `Autocomplete selection successful. New value: "${finalValue}"`
          );
        } else {
          console.log(
            ` Autocomplete selection may not have worked. Value remains: "${finalValue}"`
          );
        }
      } else {
        console.log(
          " No autocomplete options found for city, keeping typed value"
        );
      }

      cityInput.dispatchEvent(new Event("blur", { bubbles: true }));
      console.log(" City filled and processed successfully:", cityValue);
    } else {
      console.warn(" Could not find city input within component");
    }
  } else {
    console.warn(" Could not find city component");
  }

  console.log(" Filling phone number...");

  const phoneContainer = document.querySelector(
    "spl-phone-field#spl-form-element_5"
  );
  console.log(" Phone container found:", !!phoneContainer);

  if (phoneContainer && phoneContainer.shadowRoot) {
    const splInternalFormField = phoneContainer.shadowRoot.querySelector(
      "spl-internal-form-field"
    );
    if (splInternalFormField && splInternalFormField.shadowRoot) {
      function deepFindInputs(
        element: Element | Document | ShadowRoot
      ): HTMLInputElement[] {
        const inputs: HTMLInputElement[] = [];

        try {
          if (element instanceof Element && element.shadowRoot) {
            const shadowInputs = element.shadowRoot.querySelectorAll("input");
            shadowInputs.forEach((input) =>
              inputs.push(input as HTMLInputElement)
            );

            const shadowElements = element.shadowRoot.querySelectorAll("*");
            shadowElements.forEach((el) => {
              inputs.push(...deepFindInputs(el));
            });
          }

          // Check regular DOM
          if (element instanceof Document || element instanceof ShadowRoot) {
            const regularInputs = element.querySelectorAll("input");
            regularInputs.forEach((input) =>
              inputs.push(input as HTMLInputElement)
            );

            const allElements = element.querySelectorAll("*");
            allElements.forEach((el) => {
              if (el.shadowRoot) {
                inputs.push(...deepFindInputs(el.shadowRoot));
              }
            });
          }
        } catch (e) {
          console.log("Error in deep search:", e);
        }

        return inputs;
      }

      // Search across all possible layers
      const allInputs = deepFindInputs(splInternalFormField.shadowRoot);
      console.log(" Ultra-deep search found inputs:", allInputs.length);

      // Also search in parent containers
      const parentInputs = deepFindInputs(document);
      console.log(" Document-wide search found inputs:", parentInputs.length);

      // Combine and deduplicate
      const uniqueInputs = [...new Set([...allInputs, ...parentInputs])];
      console.log(" Total unique inputs found:", uniqueInputs.length);

      // Smart phone input detection
      let phoneInput: HTMLInputElement | null = null;

      const phoneKeywords = ["phone", "tel", "mobile", "cell", "contact"];

      for (const input of uniqueInputs) {
        const inputText = (
          input.type +
          " " +
          input.id +
          " " +
          input.name +
          " " +
          input.placeholder +
          " " +
          input.className
        ).toLowerCase();

        const isPhoneRelated = phoneKeywords.some((keyword) =>
          inputText.includes(keyword)
        );

        if (isPhoneRelated || input.type === "tel") {
          phoneInput = input;
          console.log(` Phone input candidate:`, {
            type: input.type,
            id: input.id,
            name: input.name,
            placeholder: input.placeholder,
            className: input.className,
            related: isPhoneRelated,
          });
          break;
        }
      }

      // Fallback to first text/tel input
      const phoneValue = details.phoneNumber || "+55 2025550147";
      if (!phoneInput) {
        phoneInput =
          uniqueInputs.find((input) => input.type === "tel") ||
          uniqueInputs.find((input) => input.type === "text") ||
          uniqueInputs[0] ||
          null;
      }

      if (phoneInput) {
        phoneInput.focus();
        phoneInput.value = phoneValue;
        phoneInput.dispatchEvent(
          new Event("input", { bubbles: true, cancelable: true })
        );
        phoneInput.dispatchEvent(
          new Event("change", { bubbles: true, cancelable: true })
        );
        phoneInput.dispatchEvent(
          new Event("blur", { bubbles: true, cancelable: true })
        );
        console.log(
          "Phone number filled via ultra-comprehensive search:",
          phoneValue
        );
      } else {
        console.warn(" No phone input found via ultra-comprehensive search");
      }
    }
  } else {
    console.warn(" Phone container or shadow root not found");
  }

  console.log("Personal Information Done.");
}

async function fillEducationForm(form: HTMLElement, education: any) {
  console.log(
    `Filling education form with data:`,
    JSON.stringify(education, null, 2)
  );

  const fillField = async (
    selector: string,
    value: string,
    fieldName: string
  ) => {
    if (!value) return console.log(` Skipping ${fieldName} (no value).`);
    console.log(`Filling ${fieldName} with value: "${value}"`);
    try {
      const element = form.querySelector(selector) as HTMLElement;
      if (!element) return console.warn(` ${fieldName} element not found.`);

      const findInputElement = (
        rootElement: Element
      ): HTMLInputElement | HTMLTextAreaElement | null => {
        const stack: Element[] = [rootElement];
        while (stack.length > 0) {
          const el = stack.pop();
          if (!el) continue;

          if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
            return el as HTMLInputElement | HTMLTextAreaElement;
          }

          if (el.shadowRoot) {
            const inputInShadow =
              el.shadowRoot.querySelector("input, textarea");
            if (inputInShadow)
              return inputInShadow as HTMLInputElement | HTMLTextAreaElement;
            Array.from(el.shadowRoot.children).forEach((child) =>
              stack.push(child)
            );
          }

          Array.from(el.children).forEach((child) => stack.push(child));
        }
        return null;
      };

      let input: HTMLInputElement | HTMLTextAreaElement | null =
        findInputElement(element);

      if (!input)
        return console.warn(` No writable input found for ${fieldName}.`);

      input.scrollIntoView({ behavior: "smooth", block: "center" });
      await domHelpers.delay(300);
      input.focus();
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await domHelpers.delay(1500);

      await domHelpers.delay(3000);

      const autocompleteSelectors = [
        ".c-spl-autocomplete-default-option",
        ".c-spl-autocomplete-option-content",
        "spl-typography-body",
        '[role="option"]',
        "spl-select-option",
      ];

      let hasAutocompleteOptions = false;
      for (const selector of autocompleteSelectors) {
        if (document.querySelector(selector)) {
          hasAutocompleteOptions = true;
          console.log(
            ` Found autocomplete options using selector: ${selector}`
          );
          break;
        }
      }

      if (hasAutocompleteOptions) {
        console.log(
          ` Using keyboard navigation for ${fieldName} autocomplete selection`
        );

        input.focus();
        await domHelpers.delay(500);

        console.log(` Pressing Arrow Down to select first autocomplete option`);

        const arrowDownEvent = new KeyboardEvent("keydown", {
          key: "ArrowDown",
          code: "ArrowDown",
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true,
          composed: true,
        });

        input.dispatchEvent(arrowDownEvent);
        await domHelpers.delay(400);

        console.log(`⏎ Pressing Enter to confirm selection`);
        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
          composed: true,
        });

        input.dispatchEvent(enterEvent);
        await domHelpers.delay(600);

        input.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
        );

        await domHelpers.delay(300);

        const finalValue = input.value;
        if (finalValue && finalValue !== value) {
          console.log(
            ` Autocomplete selection successful. New value: "${finalValue}"`
          );
        } else {
          console.log(
            ` Autocomplete selection may not have worked. Value remains: "${finalValue}"`
          );
        }
      } else {
        console.log(
          ` No autocomplete options found for ${fieldName}, keeping typed value`
        );
      }
      input.dispatchEvent(new Event("blur", { bubbles: true }));
      console.log(` ${fieldName} filled.`);
    } catch (error) {
      console.error(` Error filling ${fieldName}:`, error);
    }
  };

  const fillDatePicker = async (
    selector: string,
    dateStr: string,
    fieldName: string
  ) => {
    if (!dateStr) {
      console.log(` Skipping ${fieldName} as no date was provided.`);
      return;
    }
    console.log(` Filling date for ${fieldName} with value: "${dateStr}"`);

    try {
      // Find the experience form container first
      const formContainer = await domHelpers.waitForElement(selector, 5000);
      if (!formContainer) {
        console.warn(` Experience form container not found: ${selector}`);
        return;
      }

      let dateInput = null;

      console.log(
        ` Searching for spl-date-field elements with specific labels...`
      );

      const allDateFields = formContainer.querySelectorAll("spl-date-field");
      console.log(
        ` Found ${allDateFields.length} spl-date-field elements:`,
        allDateFields
      );

      if (fieldName.toLowerCase().includes("start")) {
        dateInput =
          formContainer.querySelector('spl-date-field[label="From"]') ||
          formContainer.querySelector('spl-date-field[label*="Start"]') ||
          formContainer.querySelector('spl-date-field[label*="start"]') ||
          Array.from(allDateFields).find(
            (field) =>
              field.getAttribute("label")?.toLowerCase().includes("from") ||
              field.getAttribute("label")?.toLowerCase().includes("start")
          ) ||
          allDateFields[0]; // First date field as fallback

        console.log(` Found start date field:`, dateInput);
      } else if (fieldName.toLowerCase().includes("end")) {
        dateInput =
          formContainer.querySelector('spl-date-field[label="To"]') ||
          formContainer.querySelector('spl-date-field[label*="End"]') ||
          formContainer.querySelector('spl-date-field[label*="end"]') ||
          Array.from(allDateFields).find(
            (field) =>
              field.getAttribute("label")?.toLowerCase().includes("to") ||
              field.getAttribute("label")?.toLowerCase().includes("end")
          ) ||
          allDateFields[1] ||
          allDateFields[0]; // Second date field as fallback

        console.log(` Found end date field:`, dateInput);
      }

      // Method 2: If no specific label match, use position-based selection
      if (!dateInput && allDateFields.length > 0) {
        if (fieldName.toLowerCase().includes("start")) {
          dateInput = allDateFields[0];
          console.log(` Using first date field as start:`, dateInput);
        } else if (fieldName.toLowerCase().includes("end")) {
          dateInput =
            allDateFields.length > 1 ? allDateFields[1] : allDateFields[0];
          console.log(` Using second date field as end:`, dateInput);
        }
      }

      // Method 3: Search for other date-related elements as fallback
      if (!dateInput) {
        const dateFields = formContainer.querySelectorAll(
          'spl-date-field, spl-date-picker, [type="month-year"], [placeholder="Pick a date"]'
        );
        console.log(
          ` Found ${dateFields.length} date fields as fallback:`,
          dateFields
        );

        if (fieldName.toLowerCase().includes("start")) {
          dateInput = dateFields[0];
        } else if (fieldName.toLowerCase().includes("end")) {
          dateInput = dateFields.length > 1 ? dateFields[1] : dateFields[0];
        }
      }

      if (!dateInput) {
        console.warn(` Date input not found with any selector: ${selector}`);
        return;
      }

      console.log(` Found date input element:`, dateInput);

      if (!domHelpers.isVisible(dateInput as HTMLElement)) {
        console.warn(` Date input is not visible: ${selector}`);
        return;
      }

      // Find the actual input element within the date picker - prioritize shadow DOM
      let inputElement: HTMLInputElement | null = null;

      const searchMethods = [
        () => dateInput.querySelector("input"),
        () => (dateInput as any).shadowRoot?.querySelector("input"),
        () => dateInput.querySelector('[contenteditable="true"]'),
        () => dateInput.querySelector('input[type="text"]'),
        () => dateInput.querySelector('input[type="date"]'),
        () => dateInput.querySelector('input[placeholder="Pick a date"]'),
        () => {
          if (dateInput.tagName === "SPL-DATE-FIELD") {
            const shadow = (dateInput as any).shadowRoot;
            return (
              shadow?.querySelector("input") ||
              shadow?.querySelector('[type="date"]')
            );
          }
          return null;
        },
      ];

      for (const method of searchMethods) {
        const found = method();
        if (found) {
          inputElement = found as HTMLInputElement;
          break;
        }
      }

      // Fallback to the dateInput itself if no input found
      if (!inputElement) {
        inputElement = dateInput as HTMLInputElement;
      }

      console.log(` Found input element:`, inputElement);

      // For spl-date-field, try interacting with the calendar UI
      if (dateInput.tagName === "SPL-DATE-FIELD") {
        console.log(
          ` Handling spl-date-field for ${fieldName} by interacting with calendar UI.`
        );

        (dateInput as HTMLElement).click();
        await domHelpers.delay(700);

        // Try calendar container
        const calendarContainer = await domHelpers.waitForElement(
          '.flatpickr-calendar, .spl-date-picker-calendar, [role="dialog"][aria-label*="calendar"]',
          3000
        );

        if (calendarContainer) {
          console.log(` Found calendar container:`, calendarContainer);

          const [year, month] = dateStr.split("-").map(Number);

          // Year
          let yearSelector = calendarContainer.querySelector(
            ".cur-year"
          ) as HTMLInputElement;
          if (!yearSelector) {
            yearSelector = calendarContainer.querySelector(
              "select.flatpickr-monthDropdown-months + .numInput"
            ) as HTMLInputElement;
          }
          if (yearSelector) {
            yearSelector.value = year.toString();
            yearSelector.dispatchEvent(new Event("input", { bubbles: true }));
            yearSelector.dispatchEvent(new Event("change", { bubbles: true }));
            await domHelpers.delay(200);
          }

          // Month
          let monthDropdown = calendarContainer.querySelector(
            `.flatpickr-monthDropdown-months`
          ) as HTMLSelectElement;
          if (!monthDropdown) {
            monthDropdown = calendarContainer.querySelector(
              `select[aria-label*="month"]`
            ) as HTMLSelectElement;
          }
          if (monthDropdown) {
            monthDropdown.value = (month - 1).toString();
            monthDropdown.dispatchEvent(new Event("input", { bubbles: true }));
            monthDropdown.dispatchEvent(new Event("change", { bubbles: true }));
            await domHelpers.delay(200);
          }

          // Pick a day
          const dayToClick =
            calendarContainer.querySelector(".flatpickr-day.today") ||
            calendarContainer.querySelector(
              ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)"
            ) ||
            calendarContainer.querySelector(".spl-calendar-day");

          if (dayToClick) {
            (dayToClick as HTMLElement).click();
            await domHelpers.delay(300);
          }

          (dateInput as HTMLElement).dispatchEvent(
            new Event("blur", { bubbles: true })
          );
          await domHelpers.delay(200);

          console.log(
            ` Date picker filled successfully for ${fieldName} via calendar interaction.`
          );
          return;
        }
      }

      // Fallback: type directly into input
      let targetInput = inputElement;

      if (!targetInput) {
        console.warn(
          ` No target input element found for date field ${fieldName}. Skipping.`
        );
        return;
      }

      console.log(
        ` Attempting to fill date using generic typing approach for ${fieldName}: ${dateStr}`
      );

      targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
      await domHelpers.delay(300);
      targetInput.focus();
      targetInput.click();
      await domHelpers.delay(200);

      // Clear the field
      targetInput.value = "";
      targetInput.dispatchEvent(
        new Event("input", { bubbles: true, composed: true })
      );
      targetInput.dispatchEvent(
        new Event("change", { bubbles: true, composed: true })
      );
      await domHelpers.delay(100);

      // Type characters
      for (const char of dateStr) {
        targetInput.value += char;
        targetInput.dispatchEvent(
          new Event("input", { bubbles: true, composed: true })
        );
        await domHelpers.delay(50);
      }

      // Ensure final value
      targetInput.value = dateStr;
      targetInput.setAttribute("value", dateStr); // important for custom elements
      targetInput.dispatchEvent(
        new Event("input", { bubbles: true, composed: true })
      );
      targetInput.dispatchEvent(
        new Event("change", { bubbles: true, composed: true })
      );
      await domHelpers.delay(300);

      // Also update host component directly (important for spl-date-field)
      if (dateInput.tagName === "SPL-DATE-FIELD") {
        (dateInput as any).value = new Date(dateStr); // use Date object
        dateInput.setAttribute("value", dateStr);

        [
          "input",
          "change",
          "blur",
          "value-changed",
          "date-changed",
          "spl-change",
        ].forEach((evt) => {
          dateInput.dispatchEvent(
            new CustomEvent(evt, {
              detail: { value: new Date(dateStr) },
              bubbles: true,
              composed: true,
            })
          );
        });

        if (typeof (dateInput as any).reportValidity === "function") {
          (dateInput as any).reportValidity();
        }
        if (typeof (dateInput as any).checkValidity === "function") {
          (dateInput as any).checkValidity();
        }
      }

      // Confirm with Enter if calendar is open
      const calendar = document.querySelector(".flatpickr-calendar");
      if (calendar && domHelpers.isVisible(calendar as HTMLElement)) {
        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
          composed: true,
        });
        targetInput.dispatchEvent(enterEvent);
        await domHelpers.delay(500);
      }

      // Trigger blur
      targetInput.dispatchEvent(
        new Event("blur", { bubbles: true, composed: true })
      );
      await domHelpers.delay(300);

      // Verify
      if (targetInput.value !== dateStr) {
        console.warn(
          ` Value mismatch for ${fieldName}. Expected "${dateStr}", got "${targetInput.value}". Forcing value.`
        );
        targetInput.value = dateStr;
        targetInput.setAttribute("value", dateStr);
        targetInput.dispatchEvent(
          new Event("input", { bubbles: true, composed: true })
        );
        targetInput.dispatchEvent(
          new Event("change", { bubbles: true, composed: true })
        );
        targetInput.dispatchEvent(
          new Event("blur", { bubbles: true, composed: true })
        );
        await domHelpers.delay(200);
      }

      console.log(
        ` Date input filled successfully for ${fieldName}: ${targetInput.value}`
      );
    } catch (error) {
      console.error(`Error filling date input ${fieldName}:`, error);
    }
  };

  await fillField(
    '[data-test="institution-autocomplete"]',
    education.collegeName,
    "Institution"
  );
  await fillField(
    '[data-test="education-degree"]',
    education.courseName,
    "Degree"
  );
  await fillField(
    '[data-test="education-major"]',
    education.field,
    "Major/Field of Study"
  );
  await fillField(
    '[data-test="location-autocomplete"]',
    education.location,
    "Location"
  );
  await fillField(
    '[data-test="education-description"]',
    education.description,
    "Description"
  );
  await fillDatePicker(
    '[data-test="education-date-from"]',
    education.startDate,
    "Start Date"
  );

  if (education.current) {
    const checkbox = form.querySelector(
      '[data-test="education-current"] spl-checkbox'
    ) as HTMLElement;
    if (checkbox) checkbox.click();
    else console.warn('"I currently attend" checkbox not found.');
  } else {
    await fillDatePicker(
      '[data-test="education-date-to"]',
      education.endDate,
      "End Date"
    );
  }

  const saveButton = form.querySelector(
    '[data-test="education-save"]'
  ) as HTMLElement;
  if (saveButton) {
    saveButton.click();
    await domHelpers.delay(1000);
    console.log("Education entry saved.");
  } else {
    console.warn(" Save button not found.");
  }
}

async function fillExperienceForm(form: HTMLElement, experience: any) {
  console.log(
    ` Filling experience form with data:`,
    JSON.stringify(experience, null, 2)
  );
  console.log(" DEBUG: Form element received:", form);
  console.log(" DEBUG: Form is visible:", domHelpers.isVisible(form));

  const fillField = async (
    selector: string,
    value: string,
    fieldName: string
  ) => {
    if (!value) {
      console.log(` Skipping ${fieldName} as no value was provided.`);
      return;
    }
    console.log(` Searching for ${fieldName} with selector: ${selector}`);
    try {
      const element = form.querySelector(selector) as HTMLElement;
      if (!element) {
        console.warn(
          ` ${fieldName} element not found with selector: ${selector}`
        );
        console.log(
          "DEBUG: Available elements in form:",
          Array.from(form.querySelectorAll("*"))
            .map(
              (el) =>
                el.tagName +
                (el.getAttribute("data-test")
                  ? `[data-test="${el.getAttribute("data-test")}"]`
                  : "")
            )
            .slice(0, 10)
        );
        return;
      }
      console.log(`Found ${fieldName} element:`, element);

      let input: HTMLInputElement | HTMLTextAreaElement | null = null;

      if (element.shadowRoot) {
        input = element.shadowRoot.querySelector("input, textarea");
        if (input) console.log(" Input found in shadow DOM");
      }

      if (!input) {
        const nestedComponents = element.querySelectorAll(
          "spl-date-field, spl-autocomplete, spl-textarea, spl-input"
        );
        for (const nestedComponent of nestedComponents) {
          if (nestedComponent.shadowRoot) {
            input = nestedComponent.shadowRoot.querySelector("input, textarea");
            if (input) {
              console.log(" Input found in nested component shadow DOM");
              break;
            }
          }
        }
      }

      if (!input && element.tagName === "SPL-AUTOCOMPLETE") {
        if (element.shadowRoot) {
          const shadowInput = element.shadowRoot.querySelector("spl-input");
          if (shadowInput && shadowInput.shadowRoot) {
            input = shadowInput.shadowRoot.querySelector("input");
            if (input)
              console.log(
                " Input found in deep shadow DOM (spl-autocomplete -> spl-input -> input)"
              );
          }
          if (!input) {
            input = element.shadowRoot.querySelector("input");
            if (input)
              console.log(" Input found in spl-autocomplete shadow DOM");
          }
        }
      }

      if (!input) {
        input = element.querySelector("input, textarea");
        if (input) console.log(" Input found in light DOM");
      }

      if (!input) {
        console.warn(
          ` No writable input field found inside ${fieldName} element.`
        );
        return;
      }
      console.log(`Found input for ${fieldName}:`, input);

      console.log(` Filling ${fieldName} with value: "${value}"`);

      input.scrollIntoView({ behavior: "smooth", block: "center" });
      await domHelpers.delay(300);
      input.focus();
      input.click();
      await domHelpers.delay(100);
      input.blur();
      await domHelpers.delay(100);
      input.focus();
      await domHelpers.delay(200);

      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));

      for (const char of value) {
        input.dispatchEvent(
          new KeyboardEvent("keydown", { key: char, bubbles: true })
        );
        input.value += char;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(
          new KeyboardEvent("keyup", { key: char, bubbles: true })
        );
        await domHelpers.delay(75);
      }

      await domHelpers.delay(3000);

      const autocompleteSelectors = [
        ".c-spl-autocomplete-default-option",
        ".c-spl-autocomplete-option-content",
        "spl-typography-body",
        '[role="option"]',
        "spl-select-option",
      ];

      let hasAutocompleteOptions = false;
      for (const selector of autocompleteSelectors) {
        if (document.querySelector(selector)) {
          hasAutocompleteOptions = true;
          console.log(
            ` Found autocomplete options using selector: ${selector}`
          );
          break;
        }
      }

      if (hasAutocompleteOptions) {
        console.log(
          ` Using keyboard navigation for ${fieldName} autocomplete selection`
        );

        input.focus();
        await domHelpers.delay(500);

        console.log(` Pressing Arrow Down to select first autocomplete option`);

        const arrowDownEvent = new KeyboardEvent("keydown", {
          key: "ArrowDown",
          code: "ArrowDown",
          keyCode: 40,
          which: 40,
          bubbles: true,
          cancelable: true,
          composed: true,
        });

        input.dispatchEvent(arrowDownEvent);
        await domHelpers.delay(400);

        console.log(`⏎ Pressing Enter to confirm selection`);
        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
          composed: true,
        });

        input.dispatchEvent(enterEvent);
        await domHelpers.delay(600);

        input.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
        );

        await domHelpers.delay(300);

        const finalValue = input.value;
        if (finalValue && finalValue !== value) {
          console.log(
            ` Autocomplete selection successful. New value: "${finalValue}"`
          );
        } else {
          console.log(
            `Autocomplete selection may not have worked. Value remains: "${finalValue}"`
          );
        }
      } else {
        console.log(
          ` No autocomplete options found for ${fieldName}, keeping typed value`
        );
      }

      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("blur", { bubbles: true }));

      if (fieldName === "Job Title") {
        const form = input.closest("form");
        if (form) {
          form.dispatchEvent(new Event("input", { bubbles: true }));
          form.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      await domHelpers.delay(300);

      if (input.value !== value) {
        console.warn(
          ` After autocomplete, value for ${fieldName} did not stick. Forcing value.`
        );
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("blur", { bubbles: true }));
        await domHelpers.delay(200);
      }

      console.log(` ${fieldName} filled.`);
    } catch (error) {
      console.error(` Error filling ${fieldName}:`, error);
    }
  };

  const fillDatePicker = async (
    selector: string,
    dateStr: string,
    fieldName: string
  ) => {
    if (!dateStr) {
      console.log(` Skipping ${fieldName} as no date was provided.`);
      return;
    }
    console.log(` Filling date for ${fieldName} with value: "${dateStr}"`);

    try {
      // Find the experience form container first
      const formContainer = await domHelpers.waitForElement(selector, 5000);
      if (!formContainer) {
        console.warn(` Experience form container not found: ${selector}`);
        return;
      }

      let dateInput = null;

      console.log(
        ` Searching for spl-date-field elements with specific labels...`
      );

      const allDateFields = formContainer.querySelectorAll("spl-date-field");
      console.log(
        ` Found ${allDateFields.length} spl-date-field elements:`,
        allDateFields
      );

      if (fieldName.toLowerCase().includes("start")) {
        dateInput =
          formContainer.querySelector('spl-date-field[label="From"]') ||
          formContainer.querySelector('spl-date-field[label*="Start"]') ||
          formContainer.querySelector('spl-date-field[label*="start"]') ||
          Array.from(allDateFields).find(
            (field) =>
              field.getAttribute("label")?.toLowerCase().includes("from") ||
              field.getAttribute("label")?.toLowerCase().includes("start")
          ) ||
          allDateFields[0]; // First date field as fallback

        console.log(` Found start date field:`, dateInput);
      } else if (fieldName.toLowerCase().includes("end")) {
        dateInput =
          formContainer.querySelector('spl-date-field[label="To"]') ||
          formContainer.querySelector('spl-date-field[label*="End"]') ||
          formContainer.querySelector('spl-date-field[label*="end"]') ||
          Array.from(allDateFields).find(
            (field) =>
              field.getAttribute("label")?.toLowerCase().includes("to") ||
              field.getAttribute("label")?.toLowerCase().includes("end")
          ) ||
          allDateFields[1] ||
          allDateFields[0]; // Second date field as fallback

        console.log(` Found end date field:`, dateInput);
      }

      // Method 2: If no specific label match, use position-based selection
      if (!dateInput && allDateFields.length > 0) {
        if (fieldName.toLowerCase().includes("start")) {
          dateInput = allDateFields[0];
          console.log(` Using first date field as start:`, dateInput);
        } else if (fieldName.toLowerCase().includes("end")) {
          dateInput =
            allDateFields.length > 1 ? allDateFields[1] : allDateFields[0];
          console.log(` Using second date field as end:`, dateInput);
        }
      }

      // Method 3: Search for other date-related elements as fallback
      if (!dateInput) {
        const dateFields = formContainer.querySelectorAll(
          'spl-date-field, spl-date-picker, [type="month-year"], [placeholder="Pick a date"]'
        );
        console.log(
          ` Found ${dateFields.length} date fields as fallback:`,
          dateFields
        );

        if (fieldName.toLowerCase().includes("start")) {
          dateInput = dateFields[0];
        } else if (fieldName.toLowerCase().includes("end")) {
          dateInput = dateFields.length > 1 ? dateFields[1] : dateFields[0];
        }
      }

      if (!dateInput) {
        console.warn(` Date input not found with any selector: ${selector}`);
        return;
      }

      console.log(` Found date input element:`, dateInput);

      if (!domHelpers.isVisible(dateInput as HTMLElement)) {
        console.warn(` Date input is not visible: ${selector}`);
        return;
      }

      // Find the actual input element within the date picker - prioritize shadow DOM
      let inputElement: HTMLInputElement | null = null;

      const searchMethods = [
        () => dateInput.querySelector("input"),
        () => (dateInput as any).shadowRoot?.querySelector("input"),
        () => dateInput.querySelector('[contenteditable="true"]'),
        () => dateInput.querySelector('input[type="text"]'),
        () => dateInput.querySelector('input[type="date"]'),
        () => dateInput.querySelector('input[placeholder="Pick a date"]'),
        () => {
          if (dateInput.tagName === "SPL-DATE-FIELD") {
            const shadow = (dateInput as any).shadowRoot;
            return (
              shadow?.querySelector("input") ||
              shadow?.querySelector('[type="date"]')
            );
          }
          return null;
        },
      ];

      for (const method of searchMethods) {
        const found = method();
        if (found) {
          inputElement = found as HTMLInputElement;
          break;
        }
      }

      // Fallback to the dateInput itself if no input found
      if (!inputElement) {
        inputElement = dateInput as HTMLInputElement;
      }

      console.log(` Found input element:`, inputElement);

      // For spl-date-field, try interacting with the calendar UI
      if (dateInput.tagName === "SPL-DATE-FIELD") {
        console.log(
          ` Handling spl-date-field for ${fieldName} by interacting with calendar UI.`
        );

        (dateInput as HTMLElement).click();
        await domHelpers.delay(700);

        // Try calendar container
        const calendarContainer = await domHelpers.waitForElement(
          '.flatpickr-calendar, .spl-date-picker-calendar, [role="dialog"][aria-label*="calendar"]',
          3000
        );

        if (calendarContainer) {
          console.log(` Found calendar container:`, calendarContainer);

          const [year, month] = dateStr.split("-").map(Number);

          // Year
          let yearSelector = calendarContainer.querySelector(
            ".cur-year"
          ) as HTMLInputElement;
          if (!yearSelector) {
            yearSelector = calendarContainer.querySelector(
              "select.flatpickr-monthDropdown-months + .numInput"
            ) as HTMLInputElement;
          }
          if (yearSelector) {
            yearSelector.value = year.toString();
            yearSelector.dispatchEvent(new Event("input", { bubbles: true }));
            yearSelector.dispatchEvent(new Event("change", { bubbles: true }));
            await domHelpers.delay(200);
          }

          // Month
          let monthDropdown = calendarContainer.querySelector(
            `.flatpickr-monthDropdown-months`
          ) as HTMLSelectElement;
          if (!monthDropdown) {
            monthDropdown = calendarContainer.querySelector(
              `select[aria-label*="month"]`
            ) as HTMLSelectElement;
          }
          if (monthDropdown) {
            monthDropdown.value = (month - 1).toString();
            monthDropdown.dispatchEvent(new Event("input", { bubbles: true }));
            monthDropdown.dispatchEvent(new Event("change", { bubbles: true }));
            await domHelpers.delay(200);
          }

          // Pick a day
          const dayToClick =
            calendarContainer.querySelector(".flatpickr-day.today") ||
            calendarContainer.querySelector(
              ".flatpickr-day:not(.prevMonthDay):not(.nextMonthDay)"
            ) ||
            calendarContainer.querySelector(".spl-calendar-day");

          if (dayToClick) {
            (dayToClick as HTMLElement).click();
            await domHelpers.delay(300);
          }

          (dateInput as HTMLElement).dispatchEvent(
            new Event("blur", { bubbles: true })
          );
          await domHelpers.delay(200);

          console.log(
            ` Date picker filled successfully for ${fieldName} via calendar interaction.`
          );
          return;
        }
      }

      // Fallback: type directly into input
      let targetInput = inputElement;

      if (!targetInput) {
        console.warn(
          ` No target input element found for date field ${fieldName}. Skipping.`
        );
        return;
      }

      console.log(
        ` Attempting to fill date using generic typing approach for ${fieldName}: ${dateStr}`
      );

      targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
      await domHelpers.delay(300);
      targetInput.focus();
      targetInput.click();
      await domHelpers.delay(200);

      // Clear the field
      targetInput.value = "";
      targetInput.dispatchEvent(
        new Event("input", { bubbles: true, composed: true })
      );
      targetInput.dispatchEvent(
        new Event("change", { bubbles: true, composed: true })
      );
      await domHelpers.delay(100);

      // Type characters
      for (const char of dateStr) {
        targetInput.value += char;
        targetInput.dispatchEvent(
          new Event("input", { bubbles: true, composed: true })
        );
        await domHelpers.delay(50);
      }

      // Ensure final value
      targetInput.value = dateStr;
      targetInput.setAttribute("value", dateStr); // important for custom elements
      targetInput.dispatchEvent(
        new Event("input", { bubbles: true, composed: true })
      );
      targetInput.dispatchEvent(
        new Event("change", { bubbles: true, composed: true })
      );
      await domHelpers.delay(300);

      // Also update host component directly (important for spl-date-field)
      if (dateInput.tagName === "SPL-DATE-FIELD") {
        (dateInput as any).value = new Date(dateStr); // use Date object
        dateInput.setAttribute("value", dateStr);

        [
          "input",
          "change",
          "blur",
          "value-changed",
          "date-changed",
          "spl-change",
        ].forEach((evt) => {
          dateInput.dispatchEvent(
            new CustomEvent(evt, {
              detail: { value: new Date(dateStr) },
              bubbles: true,
              composed: true,
            })
          );
        });

        if (typeof (dateInput as any).reportValidity === "function") {
          (dateInput as any).reportValidity();
        }
        if (typeof (dateInput as any).checkValidity === "function") {
          (dateInput as any).checkValidity();
        }
      }

      // Confirm with Enter if calendar is open
      const calendar = document.querySelector(".flatpickr-calendar");
      if (calendar && domHelpers.isVisible(calendar as HTMLElement)) {
        const enterEvent = new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
          composed: true,
        });
        targetInput.dispatchEvent(enterEvent);
        await domHelpers.delay(500);
      }

      // Trigger blur
      targetInput.dispatchEvent(
        new Event("blur", { bubbles: true, composed: true })
      );
      await domHelpers.delay(300);

      // Verify
      if (targetInput.value !== dateStr) {
        console.warn(
          ` Value mismatch for ${fieldName}. Expected "${dateStr}", got "${targetInput.value}". Forcing value.`
        );
        targetInput.value = dateStr;
        targetInput.setAttribute("value", dateStr);
        targetInput.dispatchEvent(
          new Event("input", { bubbles: true, composed: true })
        );
        targetInput.dispatchEvent(
          new Event("change", { bubbles: true, composed: true })
        );
        targetInput.dispatchEvent(
          new Event("blur", { bubbles: true, composed: true })
        );
      }

      console.log(
        ` Date input filled successfully for ${fieldName}: ${targetInput.value}`
      );
    } catch (error) {
      console.error(`Error filling date input ${fieldName}:`, error);
    }
  };

  await fillField(
    '[data-test="job-title-autocomplete"]',
    experience.jobTitle || "",
    "Job Title"
  );
  await fillField(
    '[data-test="company-autocomplete"]',
    experience.companyName || "",
    "Company"
  );
  await fillField(
    '[data-test="location-autocomplete"]',
    experience.location || "",
    "Location"
  );
  await fillField(
    '[data-test="experience-description"]',
    experience.summary || "",
    "Description"
  );
  await fillDatePicker(
    '[data-test="experience-date-from"]',
    experience.startDate || "2020-05-01",
    "Start Date"
  );

  if (experience.isCurrent) {
    const checkbox = form.querySelector(
      '[data-test="experience-current"] spl-checkbox'
    ) as HTMLElement;
    if (checkbox) {
      console.log(' Clicking "I currently work here" checkbox...');
      checkbox.click();
      await domHelpers.delay(200);
    } else {
      console.warn("I currently work here checkbox not found.");
    }
  } else {
    console.log("Not a current job, filling end date.");
    await fillDatePicker(
      '[data-test="experience-date-to"]',
      experience.endDate || "2021-06-10",
      "End Date"
    );
  }

  console.log(" Saving experience entry...");
  const saveButton = form.querySelector(
    '[data-test="experience-save"]'
  ) as HTMLElement;
  if (saveButton) {
    saveButton.click();
    await domHelpers.delay(1000);
    console.log(" Experience entry saved successfully.");
  } else {
    console.warn(" Save button not found. Experience entry may not be saved.");
  }
}

async function fillExperience(experienceData: any[]) {
  console.log(" Filling Experience section...");
  if (!experienceData || experienceData.length === 0) {
    console.warn(
      " No experience data provided to fillExperience function. Skipping section."
    );
    return;
  }
  console.log(` Found ${experienceData.length} experience entries to fill.`);

  const section = await domHelpers.waitForElement(
    'div[data-test="experience"]'
  );
  if (!section) {
    console.error(" Experience section container not found.");
    return;
  }
  console.log(" Found experience section container:", section);

  const formSelector = "oc-experience-edit-form";
  const altFormSelectors = [
    "oc-experience-edit-form",
    '[data-test="experience-edit-form"]',
    ".experience-edit-form",
    'oc-experience-edit-form[data-test="experience-edit-form"]',
  ];

  let existingForms: NodeListOf<Element> =
    document.querySelectorAll(formSelector);

  if (existingForms.length === 0) {
    for (const altSelector of altFormSelectors) {
      existingForms = document.querySelectorAll(altSelector);
      if (existingForms.length > 0) {
        console.log(
          ` DEBUG: Found forms using alternative selector: ${altSelector}`
        );
        break;
      }
    }
  }

  console.log(" DEBUG: Found", existingForms.length, "existing forms");
  console.log(
    " DEBUG: First form visibility:",
    existingForms.length > 0
      ? domHelpers.isVisible(existingForms[0] as HTMLElement)
      : "N/A"
  );

  let formsToFillCount = experienceData.length;

  if (
    existingForms.length > 0 &&
    domHelpers.isVisible(existingForms[0] as HTMLElement)
  ) {
    console.log(
      "An experience form is already visible. Filling the first entry now."
    );
    console.log(
      "DEBUG: About to call fillExperienceForm for first entry with data:",
      experienceData[0]
    );
    try {
      await fillExperienceForm(
        existingForms[0] as HTMLElement,
        experienceData[0]
      );
      console.log(` Experience entry 1 processing complete.`);
    } catch (error) {
      console.error(" Error filling first experience form:", error);
    }
    formsToFillCount--;
  } else {
    console.log(
      " DEBUG: No existing visible forms found. Will need to add all forms."
    );
    console.log(
      "DEBUG: Existing forms details:",
      Array.from(existingForms).map((f) => ({
        tagName: f.tagName,
        dataTest: f.getAttribute("data-test"),
        visible: domHelpers.isVisible(f as HTMLElement),
        className: f.className,
      }))
    );
  }

  for (let i = 0; i < formsToFillCount; i++) {
    const experience =
      experienceData[experienceData.length - formsToFillCount + i];
    console.log(
      `--- Processing experience entry ${i + 2}/${experienceData.length} ---`
    );

    const initialFormCount = document.querySelectorAll(formSelector).length;

    const addButton = section.querySelector(
      'oc-button[data-test="add-experience"]'
    ) as HTMLElement;
    if (!addButton) {
      console.warn(" Add Experience button not found. Cannot add new entries.");
      break;
    }
    console.log('Clicking "+ Add Experience" button...');
    addButton.click();

    console.log(" DEBUG: Waiting for new form to appear...");
    const newForm = await waitForNewForm(
      formSelector,
      initialFormCount,
      "Experience"
    );

    if (newForm) {
      console.log("Found new experience form to fill:", newForm);
      console.log(
        " DEBUG: About to call fillExperienceForm with data:",
        experience
      );
      try {
        await fillExperienceForm(newForm, experience);
        console.log(` Experience entry ${i + 2} processing complete.`);
      } catch (error) {
        console.error(` Error filling experience entry ${i + 2}:`, error);
      }
    } else {
      console.error(
        " Timed out waiting for new experience form to appear after clicking Add."
      );
      console.log(
        "🔍 DEBUG: Current form count:",
        document.querySelectorAll(formSelector).length,
        "Expected:",
        initialFormCount + 1
      );
      break;
    }
  }

  console.log(" Experience section processing finished.");
}

async function fillEducation(educationData: any[]) {
  console.log(" Filling Education section...");
  if (!educationData || educationData.length === 0) {
    console.warn(" No education data provided. Skipping section.");
    return;
  }
  console.log(`Found ${educationData.length} education entries to fill.`);

  const section = await domHelpers.waitForElement('div[data-test="education"]');
  if (!section) {
    console.error(" Education section container not found.");
    return;
  }
  console.log(" Found education section container.");

  const formSelector = "oc-education-edit-form";

  let existingForms = document.querySelectorAll(formSelector);
  console.log(` Found ${existingForms.length} existing education forms.`);

  let formsToFillCount = educationData.length;

  if (
    existingForms.length > 0 &&
    domHelpers.isVisible(existingForms[0] as HTMLElement)
  ) {
    console.log(
      " An education form is already visible. Filling the first entry."
    );
    try {
      await fillEducationForm(
        existingForms[0] as HTMLElement,
        educationData[0]
      );
      console.log(`Education entry 1 processing complete.`);
    } catch (error) {
      console.error(" Error filling first education form:", error);
    }
    formsToFillCount--;
  } else {
    console.log(
      "No visible education form found. Will add all entries from scratch."
    );
  }

  for (let i = 0; i < formsToFillCount; i++) {
    const education =
      educationData[educationData.length - formsToFillCount + i];
    const entryNumber = educationData.length - formsToFillCount + i + 1;
    console.log(
      `--- Processing education entry ${entryNumber}/${educationData.length} ---`
    );

    const initialFormCount = document.querySelectorAll(formSelector).length;
    const addButton = section.querySelector(
      'oc-button[data-test="add-education"]'
    ) as HTMLElement;

    if (!addButton) {
      console.error('Add Education" button not found. Cannot add new entries.');
      break;
    }

    console.log(' Clicking "+ Add Education" button...');
    addButton.click();

    const newForm = await waitForNewForm(
      formSelector,
      initialFormCount,
      "Education"
    );

    if (newForm) {
      console.log(`✅ New education form appeared for entry ${entryNumber}.`);
      try {
        await fillEducationForm(newForm, education);
        console.log(`✅ Education entry ${entryNumber} processing complete.`);
      } catch (error) {
        console.error(` Error filling education entry ${entryNumber}:`, error);
      }
    } else {
      console.error(
        ` Timed out waiting for new education form to appear for entry ${entryNumber}.`
      );
      break;
    }
  }

  console.log("Education section processing finished.");
}

function initializePreliminaryQuestions() {
  console.log(
    "Initializing SmartRecruiters preliminary questions auto-detection..."
  );

  let preliminaryQuestionsFilled = false;

  const observer = new MutationObserver(async (mutations) => {
    if (preliminaryQuestionsFilled) {
      observer.disconnect();
      return;
    }

    let shouldCheck = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (
              element.querySelector("sr-screening-questions-form") ||
              element.querySelector('[data-test="screening-questions"]') ||
              element.textContent?.toLowerCase().includes("preliminary")
            ) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
    }

    if (shouldCheck) {
      console.log(
        " Mutation observer detected potential preliminary questions. Waiting a moment before checking..."
      );
      await domHelpers.delay(2000);
      if (await detectPreliminaryQuestionsPage()) {
        console.log(
          "Preliminary Questions page confirmed by observer. Attempting to fill."
        );
        await fillPreliminaryQuestions();
        preliminaryQuestionsFilled = true;
        observer.disconnect();
      }
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
  });

  console.log(" Mutation observer started for preliminary questions detection");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePreliminaryQuestions);
} else {
  initializePreliminaryQuestions();
}

export default async function fillSmartRecruitersForm(userData: any) {
  console.log("Received userData:", JSON.stringify(userData, null, 2));

  if (!userData) {
    console.error("SmartRecruiters: No userData provided");
    return;
  }

  console.log("🔍 Raw userData structure:", {
    hasData: !!userData.data,
    hasWorkHistory: !!userData.workHistory,
    hasExperience: !!userData.experience,
    hasEducation: !!userData.education,
    keys: Object.keys(userData),
    fullStructure: userData,
  });

  let experience = [];
  let education = [];
  let details = {};

  if (userData.data && typeof userData.data === "object") {
    console.log("Found nested data structure");
    const formData = userData.data;

    details = formData.details || formData;
    console.log("Found details");

    if (Array.isArray(formData.workExperiences)) {
      experience = formData.workExperiences.map((job: any) => ({
        jobTitle: job.jobTitle || "",
        companyName: job.companyName || "",
        location: job.location || "",
        startDate: job.startDate || "",
        endDate: job.endDate || "",
        summary: job.description || "",
      }));
      console.log("Found workExperiences:", experience.length, "items");
    }

    if (Array.isArray(formData.educationExperiences)) {
      education = formData.educationExperiences.map((edu: any) => ({
        collegeName: edu.collegeName || edu.schoolName || "",
        courseName: edu.courseName || edu.major || "",
        field: edu.field || edu.major || "",
        educationType: edu.educationType || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || "",
        location: edu.location || "",
        description: edu.description || "",
        current: edu.current || false,
      }));
      console.log(" Found educationExperiences:", education.length, "items");
    }
  } else {
    console.log("Using legacy data structure");
    const formData = userData.data || userData;
    details = formData.details || formData;

    experience =
      formData.workExperiences ||
      formData.workHistory ||
      formData.experience ||
      [];
    education = formData.educationExperiences || formData.education || [];

    education = education.map((edu: any) => ({
      collegeName: edu.collegeName || edu.schoolName || "",
      courseName: edu.courseName || edu.major || "",
      field: edu.field || edu.major || "",
      educationType: edu.educationType || edu.degree || "",
      startDate: edu.startDate || "",
      endDate: edu.endDate || "",
      location: edu.location || "",
      description: edu.description || "",
      current: edu.current || false,
    }));
  }

  console.log("📊 Data validation:", {
    detailsKeys: Object.keys(details),
    experienceSample: experience.slice(0, 1),
    educationSample: education.slice(0, 1),
    experienceValid: experience.length > 0 && experience[0]?.jobTitle,
    educationValid: education.length > 0 && education[0]?.schoolName,
  });

  console.log(" Starting SmartRecruiters Autofill Script...");
  console.log(" Final parsed data:", {
    detailsFound: !!details,
    experienceCount: experience.length,
    educationCount: education.length,
    firstExperience: experience[0] ? experience[0].jobTitle : "none",
    firstEducation: education[0] ? education[0].schoolName : "none",
  });

  try {
    // --- Page 1: Fill all sections ---
    await fillPersonalInfo(details);
    await fillExperience(experience);
    await fillEducation(education);
    await fillYourProfiles(details);
    await fillHiringManagerMessage(details);
    await handlePrivacyPolicyCheckbox();
    console.log(" Page 1 filling complete.");

    const navigated = await clickNextButton();

    if (navigated) {
      console.log("Navigated to Page 2.");
    } else {
      console.warn(
        " Could not navigate to Page 2. Preliminary questions might be on the same page or the button wasn't found."
      );
    }

    // --- Check for Preliminary Questions page ---
    const isPreliminaryQuestionsPage = await detectPreliminaryQuestionsPage();
    if (isPreliminaryQuestionsPage) {
      console.log(" Detected Preliminary Questions page");
      await fillPreliminaryQuestions();
    } else {
      console.log(" No Preliminary Questions page detected");
    }

    console.log(" SmartRecruiters Autofill Script Finished!");
  } catch (error) {
    console.error(" An error occurred during SmartRecruiters autofill:", error);
  }
}

async function handlePrivacyPolicyCheckbox(): Promise<void> {
  console.log("🔍 Looking for privacy policy checkbox...");

  try {
    // Common privacy policy checkbox selectors and text patterns
    const privacyPatterns = [
      "privacy policy",
      "terms and conditions",
      "terms of service",
      "read and understand",
      "agree to the",
      "accept the",
      "consent to",
      "acknowledge the",
    ];

    // Look for checkbox containers with privacy-related text
    const checkboxContainers = document.querySelectorAll(
      'div[class*="checkbox"], div[class*="consent"], div[class*="agreement"]'
    );

    for (const container of checkboxContainers) {
      const containerText = container.textContent?.toLowerCase() || "";

      // Check if this container contains privacy policy text
      const isPrivacyRelated = privacyPatterns.some((pattern) =>
        containerText.includes(pattern.toLowerCase())
      );

      if (isPrivacyRelated) {
        console.log("🎯 Found privacy policy checkbox container:", container);

        // Look for the actual checkbox input
        let checkboxInput: HTMLInputElement | null = null;

        // Try different selectors for the checkbox
        checkboxInput = container.querySelector(
          'input[type="checkbox"]'
        ) as HTMLInputElement;
        if (!checkboxInput) {
          checkboxInput = container.querySelector(
            ".c-spl-checkbox__input"
          ) as HTMLInputElement;
        }
        if (!checkboxInput) {
          checkboxInput = container.querySelector(
            'spl-checkbox input[type="checkbox"]'
          ) as HTMLInputElement;
        }
        if (!checkboxInput) {
          checkboxInput = container.querySelector(
            '[type="checkbox"]'
          ) as HTMLInputElement;
        }

        // Also check for SmartRecruiters custom components
        if (!checkboxInput) {
          const customCheckbox = container.querySelector("spl-checkbox");
          if (customCheckbox && customCheckbox.shadowRoot) {
            checkboxInput = customCheckbox.shadowRoot.querySelector(
              'input[type="checkbox"]'
            ) as HTMLInputElement;
          }
        }

        if (checkboxInput && !checkboxInput.checked) {
          console.log("✅ Clicking privacy policy checkbox...");

          // Try different methods to check the checkbox
          try {
            // Method 1: Direct click
            checkboxInput.click();
            await domHelpers.delay(200);

            // Method 2: If still not checked, try setting checked property
            if (!checkboxInput.checked) {
              checkboxInput.checked = true;
              checkboxInput.dispatchEvent(
                new Event("change", { bubbles: true })
              );
              checkboxInput.dispatchEvent(
                new Event("input", { bubbles: true })
              );
              await domHelpers.delay(100);
            }

            // Method 3: For SmartRecruiters custom components
            if (!checkboxInput.checked) {
              const parentWrapper = checkboxInput.closest(
                ".c-spl-checkbox-wrapper, spl-checkbox"
              );
              if (parentWrapper && parentWrapper instanceof HTMLElement) {
                parentWrapper.click();
                await domHelpers.delay(200);
              }
            }

            console.log("✅ Privacy policy checkbox successfully checked!");
            return; // Found and handled the checkbox
          } catch (clickError) {
            console.error(
              "❌ Error clicking privacy policy checkbox:",
              clickError
            );
          }
        }
      }
    }

    // Fallback: Look for any unchecked checkbox with required attribute
    const requiredCheckboxes = document.querySelectorAll(
      'input[type="checkbox"][required]:not(:checked)'
    );
    for (const checkbox of requiredCheckboxes) {
      const checkboxElement = checkbox as HTMLInputElement;
      const checkboxContainer = checkboxElement.closest("div, label");
      const containerText = checkboxContainer?.textContent?.toLowerCase() || "";

      if (
        privacyPatterns.some((pattern) =>
          containerText.includes(pattern.toLowerCase())
        )
      ) {
        console.log("✅ Found required privacy checkbox via fallback method");
        checkboxElement.click();
        await domHelpers.delay(200);
        console.log("✅ Privacy policy checkbox checked via fallback!");
        return;
      }
    }

    console.log("ℹ️ No privacy policy checkbox found or already checked");
  } catch (error) {
    console.error("❌ Error in handlePrivacyPolicyCheckbox:", error);
  }
}
