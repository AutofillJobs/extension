// Wrap the entire script in a function for import/use elsewhere
function createWorkdayFormFiller(userData:any) {
  // All variables and functions from the original script go here
  console.log("Workday Form Filler created");
  let currentGlobalStepHint: number = 1;
  let isFormFillingInProgress: boolean = false;

  const step3Keywords: string[] = ["Application Questions", "Voluntary Disclosures", "Voluntary Self-Identification"];
  const step4Keywords: string[] = ["Review", "Review Application", "Submit Application", "Confirm and Submit"];
  const step2Keyword: string = "My Experience";
  const addButtonSelector: string = 'button[data-automation-id="add-button"]';
  const step2JobTitleSelector: string = 'input[id$="--jobTitle"][name="jobTitle"]';

  async function waitForElement(selector: string, timeout: number = 3000): Promise<HTMLElement | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) return element;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return null;
  }

  const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  async function findSingleElement(selector: string, timeout: number = 3000): Promise<HTMLElement | null> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const allDocs = getAllIframeDocuments();
      for (const doc of allDocs) {
        try {
          const element = doc.querySelector(selector) as HTMLElement;
          if (element) {
            return element;
          }
        } catch (e) {}
      }
      await sleep(100);
    }
    return null;
  }

  function getAllIframeDocuments(): Document[] {
    const docs: Document[] = [document];
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) docs.push(doc);
      } catch (e) {
        console.warn(`[Form Filler] getAllIframeDocuments: Cannot access iframe content. Approx src: ${iframe.src ? iframe.src.substring(0, 100) : 'N/A'}. Error: ${(e as Error).message}`);
      }
    });
    return docs;
  }

  async function fillInput(element: HTMLInputElement | HTMLTextAreaElement, value: string, context: string | null = null): Promise<boolean> {
    try {
      console.log(`[Form Filler] fillInput: Starting for element (ID: ${element.id}, Name: ${element.name}), Value: "${value}", Context: ${context}`);
      element.scrollIntoView({ block: 'center' });
      await sleep(250);

      element.focus();
      await sleep(150);
      element.click();
      await sleep(150);

      console.log('[Form Filler] fillInput: Attempting to clear existing value.');
      const originalValue = element.value;

      if (context === "STEP2" && originalValue !== '' && originalValue !== undefined) {
        console.log(`[Form Filler] fillInput (STEP2 Context): Executing SELECT-ALL & BACKSPACE pre-clearing for (ID: ${element.id}, Name: ${element.name}). Original: "${originalValue}"`);
        element.focus(); await sleep(100);
        element.click(); await sleep(100);

        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', code: 'ControlLeft', ctrlKey: true, bubbles: true, composed: true })); await sleep(30);
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true, composed: true })); await sleep(30);
        if (typeof element.select === 'function') { try { element.select(); } catch (e) {} }
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true, composed: true })); await sleep(30);
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', code: 'ControlLeft', ctrlKey: false, bubbles: true, composed: true })); await sleep(80);

        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', code: 'Backspace', keyCode: 8, bubbles: true, composed: true }));
        element.value = '';
        element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, composed: true, inputType: 'deleteContentBackward' }));
        element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'deleteContentBackward' }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', code: 'Backspace', keyCode: 8, bubbles: true, composed: true }));
        element.dispatchEvent(new InputEvent('change', { bubbles: true, composed: true }));
        await sleep(150);

        if (element.value !== '') {
          element.value = '';
          try { element.setAttribute('value', ''); } catch (e) {}
          element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, composed: true, inputType: 'deleteContentBackward' }));
          element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'deleteContentBackward' }));
          element.dispatchEvent(new InputEvent('change', { bubbles: true, composed: true }));
          await sleep(100);
        }

        try {
          element.blur(); await sleep(100);
          element.focus(); await sleep(100);
        } catch (e) {}
      }

      if (element.value !== '') {
        element.value = '';
        element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, composed: true, inputType: 'deleteContentBackward' }));
        element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'deleteContentBackward' }));
        element.dispatchEvent(new InputEvent('change', { bubbles: true, composed: true }));
        await sleep(100);
      }

      if (element.value !== '') {
        console.warn('[Form Filler] fillInput: Value still not empty after direct clear. Attempting Ctrl+A -> Delete.');
        element.focus(); await sleep(50);
        element.click(); await sleep(50);
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Control', code: 'ControlLeft', ctrlKey: true, bubbles: true, composed: true })); await sleep(30);
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true, composed: true })); await sleep(30);
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true, composed: true })); await sleep(30);
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Control', code: 'ControlLeft', ctrlKey: false, bubbles: true, composed: true })); await sleep(80);
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', code: 'Delete', keyCode: 46, bubbles: true, composed: true }));
        element.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, composed: true, inputType: 'deleteContentForward' }));
        element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'deleteContentForward' }));
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Delete', code: 'Delete', keyCode: 46, bubbles: true, composed: true }));
        element.dispatchEvent(new InputEvent('change', { bubbles: true, composed: true }));
        await sleep(100);
        element.value = '';
        element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'deleteContentBackward' }));
        element.dispatchEvent(new InputEvent('change', { bubbles: true, composed: true }));
        await sleep(50);
      }

      if (element.value !== '') {
        console.error(`[Form Filler] fillInput: FAILED TO CLEAR field (ID: ${element.id}, Name: ${element.name}) after all attempts. Current value: "${element.value}"`);
      }

      console.log(`[Form Filler] fillInput: Field cleared. Pausing before setting new value for (ID: ${element.id}, Name: ${element.name}).`);
      await sleep(300);

      console.log(`[Form Filler] fillInput: Re-focusing for (ID: ${element.id}, Name: ${element.name}) before setting value.`);
      element.focus();
      await sleep(100);

      const isFirstNameField: boolean = element.id && element.id.includes('firstName');
      const isPhoneNumberField: boolean = element.id && element.id.includes('phoneNumber');

      if (context === "STEP2" || ((isFirstNameField || isPhoneNumberField) && context !== "STEP2")) {
        const logPrefix: string = context === "STEP2" ? "STEP2 Context" : `Non-STEP2 Field (${element.id})`;
        console.log(`[Form Filler] fillInput (${logPrefix}): Using character-by-character typing for value: "${value}"`);
        element.value = '';
        try { element.setAttribute('value', ''); } catch (e) {}

        for (const char of value) {
          element.dispatchEvent(new KeyboardEvent('keydown', { key: char, code: `Key${char.toUpperCase()}`, bubbles: true, composed: true }));
          await sleep(30);
          element.value += char;
          element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
          await sleep(30);
          element.dispatchEvent(new KeyboardEvent('keyup', { key: char, code: `Key${char.toUpperCase()}`, bubbles: true, composed: true }));
          await sleep(50 + Math.random() * 40);
        }
        console.log(`[Form Filler] fillInput (${logPrefix}): Character-by-character typing completed. Current element value: "${element.value}"`);

        console.log(`[Form Filler] fillInput (${logPrefix}): Forcefully setting .value and attribute to "${value}" post char-typing.`);
        element.value = value;
        try {
          element.setAttribute('value', value);
        } catch (attrSetError) {
          console.warn(`[Form Filler] fillInput (${logPrefix}): Could entrances not set 'value' attribute post char-typing: ${(attrSetError as Error).message}`);
        }

        console.log(`[Form Filler] fillInput (${logPrefix}): Performing final event sequence post char-typing.`);
        element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
        await sleep(100);

        element.value = value;
        element.dispatchEvent(new InputEvent('change', { bubbles: true, composed: true }));
        await sleep(100);

        element.blur();
        await sleep(250);

        console.log(`[Form Filler] fillInput (${logPrefix}): Simulating Tab key press.`);
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, composed: true }));
        await sleep(50);
        element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, composed: true }));
        await sleep(100);
      } else {
        console.log(`[Form Filler] fillInput (Standard Context - ID: ${element.id}): Setting value directly for: "${value}"`);
        element.value = value;
      }

      console.log(`[Form Filler] fillInput: Dispatching final general events for ${element.id}`);
      element.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText' }));
      element.dispatchEvent(new InputEvent('change', { bubbles: true, composed: true }));
      await sleep(100);

      const finalValueProp: string = element.value;
      const finalValueAttr: string | null = element.getAttribute('value');
      console.log(`[Form Filler] fillInput: VERIFICATION for (ID: ${element.id}, Name: ${element.name}) - Desired: "${value}", Actual .value: "${finalValueProp}", Actual getAttribute('value'): "${finalValueAttr}"`);

      if (finalValueProp !== value || (context === "STEP2" && finalValueAttr !== value && finalValueAttr !== null)) {
        console.warn(`[Form Filler] fillInput: VERIFICATION FAILED. Element value ("${finalValueProp}" / attr "${finalValueAttr}") does not match desired value ("${value}").`);
        if (context === "STEP2" && finalValueProp === value && finalValueAttr !== value) {
          console.log(`[Form Filler] fillInput (STEP2 Context): Property .value is correct, but attribute is not. Attempting to set attribute again.`);
          try {
            element.setAttribute('value', value);
            await sleep(50);
            const reCheckAttr = element.getAttribute('value');
            console.log(`[Form Filler] fillInput (STEP2 Context): Re-checked attribute value: "${reCheckAttr}"`);
            if (reCheckAttr !== value) {
              console.error(`[Form Filler] fillInput (STEP2 Context): FAILED to correct attribute value even after re-attempt.`);
            }
          } catch (finalAttrError) {
            console.error(`[Form Filler] fillInput (STEP2 Context): Error setting attribute in final attempt: ${(finalAttrError as Error).message}`);
          }
        }
      }

      console.log(`[Form Filler] fillInput: Simulating key events for (ID: ${element.id}, Name: ${element.name})`);
      if (value.length > 0) {
        const lastChar: string = value.slice(-1);
        const keyEventOptions: KeyboardEventInit = { key: lastChar, code: `Key${lastChar.toUpperCase()}`, bubbles: true, composed: true };
        element.dispatchEvent(new KeyboardEvent('keydown', keyEventOptions));
        await sleep(50);
        element.dispatchEvent(new KeyboardEvent('keyup', keyEventOptions));
      } else {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true, composed: true }));
        await sleep(50);
        element.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', code: 'Space', bubbles: true, composed: true }));
      }
      await sleep(150);

      console.log(`[Form Filler] fillInput: Blurring element (ID: ${element.id}, Name: ${element.name})`);
      element.blur();
      await sleep(300);

      console.log(`[Form Filler] fillInput: Successfully processed (ID: ${element.id}, Name: ${element.name}) with value "${value}" (Current actual value: "${element.value}")`);
      return true;
    } catch (error) {
      console.error(`[Form Filler] fillInput: CRITICAL ERROR for element (ID: ${element.id}, Name: ${element.name}): ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async function handleRadio(element: HTMLElement, value: string): Promise<boolean> {
    try {
      const radioGroup: HTMLElement | null = element.closest('[role="radiogroup"]') || element.parentElement || element;
      if (!radioGroup) {
        return false;
      }

      const options = radioGroup.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
      for (const option of options) {
        const optionVal: string = option.value.toLowerCase();
        if ((value.toLowerCase() === 'yes' && optionVal === 'true') ||
          (value.toLowerCase() === 'no' && optionVal === 'false')) {
          option.click();
          await sleep(200);
          return true;
        }
      }

      const labels = radioGroup.querySelectorAll('label') as NodeListOf<HTMLLabelElement>;
      for (const label of labels) {
        const inputId: string | null = label.getAttribute('for');
        const inputElement: HTMLElement | null = inputId ? (radioGroup.querySelector(`#${inputId}`) as HTMLElement | null) : (label.previousElementSibling as HTMLElement | null);

        if (label.textContent?.trim().toLowerCase() === value.toLowerCase()) {
          const clickable: HTMLElement = inputElement && inputElement.matches('input[type="radio"]') ? inputElement : label;
          clickable.click();
          await sleep(200);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`Error in radio selection: ${(error as Error).message}`);
      return false;
    }
  }

  async function handleDropdown(element: HTMLElement, value: string): Promise<boolean> {
    try {
      element.scrollIntoView({ block: 'center' });
      await sleep(100);
      element.focus();
      await sleep(100);
      element.click();
      await sleep(1000);

      let optionClicked: boolean = false;

      if (element.tagName === 'INPUT') {
        (element as HTMLInputElement).value = value;
        element.dispatchEvent(new InputEvent('input', { bubbles: true }));
        element.dispatchEvent(new InputEvent('change', { bubbles: true }));
        await sleep(700);
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        await sleep(700);
      }

      const optionSelectors: string[] = [
        `[data-automation-id="promptOption"][data-automation-label="${value}"]`,
        `[role="option"][title="${value}"]`,
        `[data-automation-label*="${value}"]`,
        `[title*="${value}"]`,
        '[role="option"]',
        'li'
      ];

      const valueLower: string = value.toLowerCase();
      let clickTarget: HTMLElement;
      outerOptionLoop:
      for (const doc of getAllIframeDocuments()) {
        for (const selector of optionSelectors) {
          const options = doc.querySelectorAll(selector) as NodeListOf<HTMLElement>;
          for (const option of options) {
            const optionText: string = option.textContent ? option.textContent.trim().toLowerCase() : "";
            if (element.id === 'personalInfoPerson--gender' && value.toLowerCase() === 'male') {
              console.log(`[Form Filler DEBUG Gender] Checking option: Text="${option.textContent ? option.textContent.trim() : 'N/A'}", OuterHTML: ${option.outerHTML.substring(0, 200)}`);
            }
            if (optionText === valueLower || (selector.includes('*') && optionText.includes(valueLower)) || (selector === '[role="option"]' && optionText.includes(valueLower)) || (selector === 'li' && optionText.includes(valueLower))) {
              if (element.id === 'personalInfoPerson--gender' && value.toLowerCase() === 'male') {
                console.log(`[Form Filler DEBUG Gender] MATCHED option: Text="${option.textContent ? option.textContent.trim() : 'N/A'}", Using selector "${selector}"`);
              }
              try {
                option.scrollIntoView({ block: 'center' });
                await sleep(300);

                let clickTarget: HTMLElement = option as HTMLElement;
                if (option.tagName === 'LI' && option.firstElementChild && option.firstElementChild.tagName === 'DIV') {
                  clickTarget = option.firstElementChild as HTMLElement;
                }

                try {
                  (clickTarget as HTMLElement).focus();
                  await sleep(50);
                } catch (focusError) {
                  try { (option as HTMLElement).focus(); await sleep(50); } catch (parentFocusError) {}
                }

                (clickTarget as HTMLElement).dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
                await sleep(50);
                (clickTarget as HTMLElement).dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window }));
                await sleep(50);
                (clickTarget as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));

                await sleep(700);
                optionClicked = true;
                break outerOptionLoop;
              } catch (e) {
                if (clickTarget !== option) {
                  try {
                    (option as HTMLElement).click();
                    await sleep(700);
                    optionClicked = true;
                    break outerOptionLoop;
                  } catch (e2) {}
                }
              }
            }
          }
        }
      }

      if (!optionClicked) {
        if (element.tagName === 'INPUT' && (element as HTMLInputElement).value.toLowerCase().includes(valueLower)) {
          optionClicked = true;
        }
      }

      try {
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true, view: window }));
        await sleep(150);

        if (element.tagName === 'INPUT') {
          element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', code: 'Tab', keyCode: 9, bubbles: true, cancelable: true, view: window }));
          await sleep(150);
        }

        element.blur();
        await sleep(150);

        if (element.tagName === 'INPUT' && document.activeElement === element) {
          document.body.focus();
          await sleep(100);
        }
      } catch (e) {}

      if (optionClicked) {
        return true;
      }

      if (element.tagName !== 'INPUT') {
        (element as HTMLInputElement).value = value;
        element.dispatchEvent(new InputEvent('input', { bubbles: true }));
        element.dispatchEvent(new InputEvent('change', { bubbles: true }));
        await sleep(200);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error in dropdown: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async function handleSource(element: HTMLInputElement): Promise<boolean> {
    try {
      element.scrollIntoView({ block: 'center' });
      await sleep(300);

      element.focus();
      await sleep(100);
      element.click();
      await sleep(300);
      element.value = '';
      element.dispatchEvent(new InputEvent('input', { bubbles: true }));
      element.dispatchEvent(new InputEvent('change', { bubbles: true }));
      await sleep(500);

      element.focus();
      element.click();
      await sleep(500);

      element.value = 'Website';
      element.dispatchEvent(new InputEvent('input', { bubbles: true }));
      element.dispatchEvent(new InputEvent('change', { bubbles: true }));
      await sleep(1000);

      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
      await sleep(1500);

      let websiteSelected: boolean = false;
      const websiteOptionSelectors: string[] = [
        '[data-automation-id="promptOption"][data-automation-label="Website"]',
        '[role="option"][title="Website"]',
        '[data-automation-label="Website"]'
      ];

      outerWebsiteLoop:
      for (const doc of getAllIframeDocuments()) {
        for (const selector of websiteOptionSelectors) {
          const options = doc.querySelectorAll(selector) as NodeListOf<HTMLElement>;
          for (const option of options) {
            if (option.textContent && option.textContent.trim().toLowerCase() === 'website') {
              option.scrollIntoView({ block: 'center' });
              await sleep(300);
              option.click();
              websiteSelected = true;
              await sleep(3000);
              break outerWebsiteLoop;
            }
          }
        }
      }

      if (!websiteSelected) {
        console.warn('Could not find or click the "Website" option. Aborting source selection.');
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
        return false;
      }

      let nvidiaDivSelected: boolean = false;
      await sleep(1500);

      const nvidiaDivSelectors: string[] = [
        '#promptOption-e2518f80-ae59-4e6c-bad8-fc503a2fe676',
        'div[data-automation-id="promptOption"][data-automation-label="NVIDIA.COM"]',
        'div[role="option"]'
      ];

      outerNvidiaLoop:
      for (const doc of getAllIframeDocuments()) {
        for (const selector of nvidiaDivSelectors) {
          const nvidiaOptions = doc.querySelectorAll(selector) as NodeListOf<HTMLElement>;
          for (const nvidiaOption of nvidiaOptions) {
            if (nvidiaOption.textContent && nvidiaOption.textContent.trim().toUpperCase() === 'NVIDIA.COM') {
              nvidiaOption.scrollIntoView({ block: 'center' });
              await sleep(300);

              nvidiaOption.focus();
              await sleep(100);
              nvidiaOption.click();
              await sleep(100);
              nvidiaOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
              nvidiaOption.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, composed: true }));
              nvidiaOption.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
              await sleep(200);

              nvidiaDivSelected = true;
              await sleep(1000);
              break outerNvidiaLoop;
            }
          }
        }
      }

      if (!nvidiaDivSelected) {
        console.warn('Could NOT select "NVIDIA.COM" div option after all attempts.');
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error in handleSource: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async function handleCheckbox(element: HTMLInputElement, shouldBeChecked: boolean): Promise<boolean> {
    try {
      element.scrollIntoView({ block: 'center' });
      await sleep(100);
      if (element.checked !== shouldBeChecked) {
        element.click();
        await sleep(200);
        if (element.checked !== shouldBeChecked) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error(`Error handling checkbox ${element.id || element.name}: ${(error as Error).message}`, (error as Error).stack);
      return false;
    }
  }

  async function waitForForm(): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < 20000) {
      const allDocs = getAllIframeDocuments();
      for (const doc of allDocs) {
        const generalFormReady = doc.querySelector('[data-automation-id*="formField"]') || doc.querySelector('h1') || doc.querySelector('h2');
        if (generalFormReady) {
          console.log('[Form Filler] waitForForm: Form seems ready (general conditions met).');
          return true;
        }
      }
      await sleep(500);
    }
    console.warn('[Form Filler] waitForForm: Form not ready after timeout (general conditions not met).');
    return false;
  }

  async function detectStepByHeading(keywords: string[], requiredFieldSelector: string | null = null): Promise<boolean> {
    console.log(`[Form Filler] detectStepByHeading: Checking for headers with keywords: "${keywords.join(', ')}"`);
    const allDocs = getAllIframeDocuments();
    for (const doc of allDocs) {
      const headers = doc.querySelectorAll('h2') as NodeListOf<HTMLHeadingElement>;
      for (const header of headers) {
        if (header.textContent && keywords.some(keyword => header.textContent.trim().includes(keyword))) {
          console.log(`[Form Filler] detectStepByHeading: Found matching H2: "${header.textContent.trim()}"`);
          if (requiredFieldSelector) {
            console.log(`[Form Filler] detectStepByHeading: Checking for required field: "${requiredFieldSelector}"`);
            if (await findSingleElement(requiredFieldSelector, 500)) {
              console.log(`[Form Filler] detectStepByHeading: Required field "${requiredFieldSelector}" also found.`);
              return true;
            } else {
              console.warn(`[Form Filler] detectStepByHeading: Matching H2 found, but required field "${requiredFieldSelector}" NOT found.`);
              continue;
            }
          }
          return true;
        }
      }
    }
    console.log(`[Form Filler] detectStepByHeading: No matching H2 found for keywords: "${keywords.join(', ')}"`);
    return false;
  }

  async function pollForNextStep(expectedStepName: string, keywords: string[], timeout: number = 10000): Promise<boolean> {
    console.log(`[Form Filler] pollForNextStep: Waiting for "${expectedStepName}" to load. Keywords: "${keywords.join(', ')}"`);
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (await detectStepByHeading(keywords)) {
        console.log(`[Form Filler] pollForNextStep: Successfully detected "${expectedStepName}".`);
        await sleep(1000);
        return true;
      }
      await sleep(500);
    }
    console.warn(`[Form Filler] pollForNextStep: Timed out waiting for "${expectedStepName}".`);
    return false;
  }

  interface Field {
    type: string;
    selector: string;
    value?: string;
    check?: boolean;
  }

  async function processFields(fields: Field[], stepName: string): Promise<boolean> {
    console.log(`[Form Filler] processFields: Starting for step: ${stepName}`);
    for (const field of fields) {
      let element: HTMLElement | null;
      let currentSelector: string = field.selector;

      if (field.type === 'source') {
        currentSelector = 'input#source--source';
        console.log(`[Form Filler] processFields: Attempting to find source field with OVERRIDDEN selector "${currentSelector}" (extended timeout 7s).`);
        element = await findSingleElement(currentSelector, 7000);
      } else {
        console.log(`[Form Filler] processFields: Attempting to find field "${currentSelector}".`);
        element = await findSingleElement(currentSelector);
      }

      if (!element) {
        if (field.type === 'source') {
          console.warn(`[Form Filler] processFields: DEBUG PATH ACTIVATED - Source element "${currentSelector}" for step ${stepName} not found. Skipping ONLY this source field. VERIFY THIS LOG!`);
          continue;
        } else {
          console.warn(`[Form Filler] processFields: Element not found for selector "${currentSelector}" in step ${stepName} (Type: ${field.type}).`);
          console.log(`[Form Filler] processFields: Skipping non-critical/optional field "${currentSelector}".`);
          continue;
        }
      }

      console.log(`[Form Filler] processFields: Processing field type "${field.type}" for selector "${currentSelector}" in step ${stepName}`);
      let success: boolean = false;
      switch (field.type) {
        case 'text':
        case 'textarea':
          success = await fillInput(element as HTMLInputElement | HTMLTextAreaElement, field.value!, stepName);
          break;
        case 'radio':
          success = await handleRadio(element, field.value!);
          break;
        case 'dropdown':
          success = await handleDropdown(element, field.value!);
          break;
        case 'checkbox':
          success = await handleCheckbox(element as HTMLInputElement, field.check!);
          break;
        case 'source':
          success = await handleSource(element as HTMLInputElement);
          break;
        default:
          console.warn(`[Form Filler] processFields: Unknown field type "${field.type}" for selector "${field.selector}" in step ${stepName}.`);
          success = false;
      }

      if (!success) {
        console.error(`[Form Filler] processFields: Failed to process field (Type: ${field.type}, Selector: "${field.selector}", Value: "${field.value || field.check}") in step ${stepName}.`);
        if (field.type === 'source') {
          console.warn(`[Form Filler] processFields: DEBUGGING - handleSource for selector "${currentSelector}" failed. Will allow step to continue if other fields passed.`);
        } else {
          return false;
        }
      }
      await sleep(300);
    }
    console.log(`[Form Filler] processFields: Successfully processed all fields for step: ${stepName}`);
    return true;
  }

  async function clickSaveAndContinue(): Promise<boolean> {
    console.log('[Form Filler] clickSaveAndContinue: Attempting to find and click Save/Continue/Next button.');
    const buttonSelectors: string[] = [
      'button[data-automation-id="pageFooterNextButton"]',
      'button[data-automation-id*="SaveAndContinue"]i',
      'button[data-automation-id*="Next"]i',
      'button[data-automation-id*="Submit"]i',
      'button[data-automation-id*="Continue"]i',
      'button[aria-label*="Save and Continue"]i',
      'button[aria-label*="Next"]i',
      'button[aria-label*="Submit"]i',
      'button[aria-label*="Continue"]i',
      'button.css-wz5u7z[data-automation-id="pageFooterNextButton"]'
    ];

    const buttonTexts: string[] = ["Save and Continue", "Next", "Submit", "Continue"];

    const allDocs = getAllIframeDocuments();

    for (const doc of allDocs) {
      for (const selector of buttonSelectors) {
        try {
          const button = doc.querySelector(selector) as HTMLButtonElement;
          if (button && button.offsetParent !== null) {
            console.log(`[Form Filler] clickSaveAndContinue: Found button with selector "${selector}". Text: "${button.textContent ? button.textContent.trim() : 'N/A'}"`);
            button.scrollIntoView({ block: 'center' });
            await sleep(200);
            button.focus();
            await sleep(100);
            console.log('[Form Filler] clickSaveAndContinue: Clicking button...');
            button.click();
            await sleep(1500);
            return true;
          }
        } catch (e) {
          console.warn(`[Form Filler] clickSaveAndContinue: Error with selector "${selector}" in a document: ${(e as Error).message}`);
        }
      }

      const buttons = doc.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
      for (const button of buttons) {
        if (button.offsetParent !== null) {
          const buttonText: string = button.textContent ? button.textContent.trim().toLowerCase() : "";
          for (const text of buttonTexts) {
            if (buttonText.includes(text.toLowerCase())) {
              console.log(`[Form Filler] clickSaveAndContinue: Found button by text content: "${button.textContent.trim()}" (matched "${text}")`);
              button.scrollIntoView({ block: 'center' });
              await sleep(200);
              button.focus();
              await sleep(100);
              console.log('[Form Filler] clickSaveAndContinue: Clicking button found by text...');
              button.click();
              await sleep(1500);
              return true;
            }
          }
        }
      }
    }

    console.error('[Form Filler] clickSaveAndContinue: Could NOT find or click a Save/Continue/Next/Submit button after trying all selectors and text checks.');
    return false;
  }

  const step1Fields: Field[] = [
    {
      type: 'source',
      selector: 'input#source--source',
      value: 'Website'
    },
    {
      type: 'radio',
      selector: 'div[name="candidateIsPreviousWorker"]',
      value: 'no'
    },
    {
      type: 'dropdown',
      selector: 'button#country--country',
      value: userData.details.country
    },
    {
      type: 'text',
      selector: '#name--legalName--firstName',
      value: userData.details.firstName
    },
    {
      type: 'text',
      selector: '#name--legalName--middleName',
      value: userData.details.middleName
    },
    {
      type: 'text',
      selector: '#name--legalName--lastName',
      value: userData.details.lastName
    },
    {
      type: 'text',
      selector: '#address--addressLine1',
      value: userData.details.address1
    },
    {
      type: 'text',
      selector: '#address--city',
      value: userData.details.city
    },
    {
      type: 'text',
      selector: '#address--postalCode',
      value: userData.details.zip
    },
    {
      type: 'dropdown',
      selector: '#address--countryRegion',
      value: userData.details.state
    },
    {
      type: 'dropdown',
      selector: '#phoneNumber--phoneType',
      value: userData.details.phoneDeviceType
    },
    {
      type: 'dropdown',
      selector: '#phoneNumber--countryPhoneCode',
      value: userData.details.phoneCode
    },
    {
      type: 'text',
      selector: '#phoneNumber--phoneNumber',
      value: userData.details.phoneNumber.replace(userData.details.phoneCode, "")
    }
  ];

  // For dynamic work experience selectors
  const jobTitleIdSuffixes = [143, 196, 211, 230, 253]; // Extend as needed

  // Helper to parse date string to {month, year}
  function parseMonthYear(dateStr: string | undefined): { month: string, year: string } {
    if (!dateStr) return { month: '', year: '' };
    // Accepts 'DD-MM-YYYY', 'YYYY-MM-DD', 'MM-YYYY', 'YYYY-MM', etc.
    let d = dateStr.trim();
    let day = '', month = '', year = '';
    if (/^\d{2}-\d{2}-\d{4}$/.test(d)) { // DD-MM-YYYY
      [day, month, year] = d.split('-');
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(d)) { // YYYY-MM-DD
      [year, month, day] = d.split('-');
    } else if (/^\d{2}-\d{4}$/.test(d)) { // MM-YYYY
      [month, year] = d.split('-');
    } else if (/^\d{4}-\d{2}$/.test(d)) { // YYYY-MM
      [year, month] = d.split('-');
    }
    return { month, year };
  }

  const workExperience = userData?.workExperiences?.[0];
  let step2Fields: Field[] = [];
  
  // Handle case where there's no work experience
  if (workExperience) {
    const start = parseMonthYear(workExperience?.startDate);
    const end = parseMonthYear(workExperience?.endDate);
    const startMonth = workExperience?.startMonth || start?.month;
    const startYear = workExperience?.startYear || start?.year;
    const endMonth = workExperience?.endMonth || end?.month;
    const endYear = workExperience?.endYear || end?.year;
  
    step2Fields = [
      {
        type: 'text',
        selector: 'input[id$="--jobTitle"][name="jobTitle"]',
        value: workExperience.jobTitle || null
      },
      {
        type: 'text',
        selector: 'input[id$="--companyName"][name="companyName"]',
        value: workExperience.companyName || null
      },
      {
        type: 'text',
        selector: 'input[id$="--location"][name="location"]',
        value: workExperience.location || null
      },
      {
        type: 'checkbox',
        selector: 'input[id$="--currentlyWorkHere"][name="currentlyWorkHere"]',
        check: workExperience.stillWorking || false
      },
      {
        type: 'text',
        selector: 'input[data-automation-id="dateSectionMonth-input"][id^="workExperience-"][id*="--startDate-"]',
        value: startMonth || null
      },
      {
        type: 'text',
        selector: 'input[data-automation-id="dateSectionYear-input"][id^="workExperience-"][id*="--startDate-"]',
        value: startYear || null
      },
      {
        type: 'text',
        selector: 'input[data-automation-id="dateSectionMonth-input"][id^="workExperience-"][id*="--endDate-"]',
        value: endMonth || null
      },
      {
        type: 'text',
        selector: 'input[data-automation-id="dateSectionYear-input"][id^="workExperience-"][id*="--endDate-"]',
        value: endYear || null
      },
      {
        type: 'date_placeholder',
        selector: '#NEEDS_TO_DATE_INPUT_SELECTOR',
        value: '12/2022' // Optional: Make dynamic or null
      },
      {
        type: 'textarea',
        selector: 'textarea[id$="--roleDescription"]',
        value: workExperience.description || null
      }
    ];
  }
  





  // // Dynamically generate step2Fields for each work experience
  // const step2Fields: Field[] = (userData.workExperience || []).slice(0, jobTitleIdSuffixes.length).flatMap((exp: any, idx: number) => {
  //   const id = jobTitleIdSuffixes[idx];
  //   // Parse start and end dates
  //   const start = parseMonthYear(exp.startDate);
  //   const end = parseMonthYear(exp.endDate);
  //   const startMonth = exp.startMonth || start.month;
  //   const startYear = exp.startYear || start.year;
  //   const endMonth = exp.endMonth || end.month;
  //   const endYear = exp.endYear || end.year;
  //   return [
  //     {
  //       type: 'text',
  //       selector: `input#workExperience-${id}--jobTitle[name="jobTitle"]`,
  //       value: exp.jobTitle || ''
  //     },
  //     {
  //       type: 'text',
  //       selector: `input#workExperience-${id}--companyName[name="companyName"]`,
  //       value: exp.companyName || ''
  //     },
  //     {
  //       type: 'text',
  //       selector: `input#workExperience-${id}--location[name="location"]`,
  //       value: exp.location || ''
  //     },
  //     {
  //       type: 'checkbox',
  //       selector: `input#workExperience-${id}--currentlyWorkHere[name="currentlyWorkHere"]`,
  //       check: !!exp.stillWorking
  //     },
  //     {
  //       type: 'text',
  //       selector: `input#workExperience-${id}--startDate-month[data-automation-id="dateSectionMonth-input"]`,
  //       value: startMonth || ''
  //     },
  //     {
  //       type: 'text',
  //       selector: `input#workExperience-${id}--startDate-year[data-automation-id="dateSectionYear-input"]`,
  //       value: startYear || ''
  //     },
  //     {
  //       type: 'text',
  //       selector: `input#workExperience-${id}--endDate-month[data-automation-id="dateSectionMonth-input"]`,
  //       value: endMonth || ''
  //     },
  //     {
  //       type: 'text',
  //       selector: `input#workExperience-${id}--endDate-year[data-automation-id="dateSectionYear-input"]`,
  //       value: endYear || ''
  //     },
  //     {
  //       type: 'textarea',
  //       selector: `textarea#workExperience-${id}--roleDescription[name="roleDescription"]`,
  //       value: exp.description || ''
  //     }
  //   ];
  // });

  const step3Fields: Field[] = [
    {
      type: 'dropdown',
      selector: 'button#personalInfoPerson--gender',
      value:  userData.details.gender
    },
    {
      type: 'checkbox',
      selector: '#termsAndConditions--acceptTermsAndAgreements',
      check: true
    }
  ];

  async function fillApplicationForm(): Promise<void> {
    if (isFormFillingInProgress) {
      console.log('[Form Filler] fillApplicationForm: Already in progress. Skipping new run.');
      return;
    }
    isFormFillingInProgress = true;
    try {
      console.log('[Form Filler] Starting form fill process...');

      const formReady: boolean = await waitForForm();
      if (!formReady) {
        console.warn('[Form Filler] Form not ready. Aborting.');
        return;
      }

      let maxTries: number = 4;
      let currentTry: number = 0;

      while (currentTry < maxTries) {
        currentTry++;
        console.log(`[Form Filler] fillApplicationForm: Main loop attempt #${currentTry}/${maxTries}. Current Hint: ${currentGlobalStepHint}`);

        let currentStep: string = "UNKNOWN";
        console.log(`[Form Filler] fillApplicationForm: Starting step detection. Current global hint: ${currentGlobalStepHint}`);

        if (currentGlobalStepHint === 3) {
          console.log('[Form Filler] fillApplicationForm: Hint is 3, checking for STEP3 first.');
          if (await detectStepByHeading(step3Keywords)) {
            currentStep = "STEP3";
          }
        } else if (currentGlobalStepHint === 2) {
          console.log('[Form Filler] fillApplicationForm: Hint is 2, checking for STEP2_PAGE first.');
          if (await detectStepByHeading([step2Keyword], step2JobTitleSelector)) {
            currentStep = "STEP2_PAGE";
          } else {
            const addButton = await findSingleElement(addButtonSelector, 500);
            if (addButton) {
              console.log('[Form Filler] fillApplicationForm: Add button found while hint was 2. Setting currentStep to STEP2_ADD_BUTTON_VISIBLE.');
              currentStep = "STEP2_ADD_BUTTON_VISIBLE";
            }
          }
        }

        if (currentStep === "UNKNOWN") {
          console.log('[Form Filler] fillApplicationForm: Broader step detection as hint-based check was inconclusive or hint was 1.');
          if (await detectStepByHeading(step3Keywords)) {
            currentStep = "STEP3";
          } else if (await detectStepByHeading(step4Keywords)) {
            currentStep = "STEP4_REVIEW";
          } else if (await detectStepByHeading([step2Keyword], step2JobTitleSelector)) {
            currentStep = "STEP2_PAGE";
          } else {
            const addButton = await findSingleElement(addButtonSelector, 1000);
            if (addButton) {
              console.log('[Form Filler] fillApplicationForm: Add button found in broader check. Setting currentStep to STEP2_ADD_BUTTON_VISIBLE.');
              currentStep = "STEP2_ADD_BUTTON_VISIBLE";
            } else {
              if (currentGlobalStepHint === 1) {
                console.log('[Form Filler] fillApplicationForm: No specific step indicators found, and hint is 1. Defaulting to STEP1.');
                currentStep = "STEP1";
              } else {
                console.warn(`[Form Filler] fillApplicationForm: No specific step indicators found, but hint is ${currentGlobalStepHint} (not 1). Setting to UNKNOWN_POST_HINT.`);
                currentStep = "UNKNOWN_POST_HINT";
              }
            }
          }
        }
        console.log(`[Form Filler] fillApplicationForm: Loop attempt #${currentTry}, Detected current step as: ${currentStep}`);

        let stepProcessedAndAdvanced: boolean = false;

        if (currentStep === "STEP1") {
          console.log('[Form Filler] Processing Step 1: My Information');
          let sourceElementVisible: boolean = false;
          let sourceWaitAttempts: number = 0;
          const maxSourceWaitAttempts: number = 14;
          console.log(`[Form Filler] fillApplicationForm STEP1: Starting specific wait for selector 'input#source--source'.`);
          while (!sourceElementVisible && sourceWaitAttempts < maxSourceWaitAttempts) {
            sourceWaitAttempts++;
            const sourceEl = await findSingleElement('input#source--source', 450);
            if (sourceEl) {
              console.log(`[Form Filler] fillApplicationForm STEP1: Found 'input#source--source' after ${sourceWaitAttempts} attempts.`);
              sourceElementVisible = true;
            } else {
              console.log(`[Form Filler] fillApplicationForm STEP1: 'input#source--source' not found on attempt ${sourceWaitAttempts}/${maxSourceWaitAttempts}. Waiting 500ms.`);
              await sleep(500);
            }
          }
          if (!sourceElementVisible) {
            console.warn(`[Form Filler] fillApplicationForm STEP1: TIMED OUT waiting for 'input#source--source' after ${maxSourceWaitAttempts} attempts. Proceeding to processFields, source field might fail or be skipped.`);
          }

          if (await processFields(step1Fields, "STEP1")) {
            if (await clickSaveAndContinue()) {
              console.log('[Form Filler] Step 1 Save & Continue clicked. Updating global hint to 2.');
              currentGlobalStepHint = 2;
              if (await pollForNextStep("Step 2 (My Experience)", [step2Keyword])) {
                stepProcessedAndAdvanced = true;
              } else { break; }
            } else { break; }
          } else { break; }
        } else if (currentStep === "STEP2_ADD_BUTTON_VISIBLE" || currentStep === "STEP2_PAGE") {
          console.log('[Form Filler] Processing Step 2: My Experience');
          let step2SetupSuccess: boolean = true;
          const addButtonElement = await findSingleElement(addButtonSelector);

          if (currentStep === "STEP2_ADD_BUTTON_VISIBLE" && addButtonElement) {
            console.log('[Form Filler] Clicking "Add" button for work experience.');
            addButtonElement.scrollIntoView({ block: 'center' });
            await sleep(200);
            addButtonElement.click();
            await sleep(2500);
            if (!await detectStepByHeading([step2Keyword], step2JobTitleSelector)) {
              console.error('[Form Filler] ERROR: Clicked "Add" button, but did not land on expected My Experience page with fields.');
              step2SetupSuccess = false;
            }
          } else if (currentStep === "STEP2_PAGE" && !await detectStepByHeading([step2Keyword], step2JobTitleSelector)) {
            console.error('[Form Filler] ERROR: Expected to be on My Experience page (fields visible) for STEP2_PAGE, but not detected.');
            step2SetupSuccess = false;
          }

          if (step2SetupSuccess && await processFields(step2Fields, "STEP2")) {
            if (await clickSaveAndContinue()) {
              console.log('[Form Filler] Step 2 Save & Continue clicked. Updating global hint to 3.');
              currentGlobalStepHint = 3;
              if (await pollForNextStep("Step 3 (Application Questions/Voluntary Disclosures)", step3Keywords)) {
                stepProcessedAndAdvanced = true;
              } else { break; }
            } else { break; }
          } else if (!step2SetupSuccess) {
            console.error('[Form Filler] Step 2 setup (add/page verify) failed. Stopping.');
            break;
          } else {
            break;
          }
        } else if (currentStep === "STEP3") {
          console.log('[Form Filler] Processing Step 3: Application Questions / Voluntary Disclosures');
          if (await processFields(step3Fields, "STEP3")) {
            if (await clickSaveAndContinue()) {
              console.log('[Form Filler] Step 3 Save & Continue/Submit clicked. Updating global hint to 4.');
              currentGlobalStepHint = 4;
              if (await pollForNextStep("Step 4 (Review)", step4Keywords)) {
                stepProcessedAndAdvanced = true;
              } else {
                console.log('[Form Filler] Did not detect Step 4 (Review) after Step 3. Assuming process is complete or on final submit page.');
                stepProcessedAndAdvanced = true;
              }
            } else { break; }
          } else { break; }
        } else if (currentStep === "STEP4_REVIEW") {
          console.log('[Form Filler] Processing Step 4: Review and Submit');
          if (await clickSaveAndContinue()) {
            console.log('[Form Filler] Step 4 Submit clicked. Application should be submitted. Updating global hint to 5 (COMPLETED).');
            currentGlobalStepHint = 5;
            stepProcessedAndAdvanced = true;
            console.log('[Form Filler] All application steps processed and submitted!');
          } else {
            console.error('[Form Filler] Failed to click Submit on Step 4.');
            break;
          }
        } else if (currentStep === "UNKNOWN_POST_HINT") {
          console.warn(`[Form Filler] Current step is UNKNOWN_POST_HINT (Global Hint: ${currentGlobalStepHint}). Will retry or wait for MutationObserver.`);
          await sleep(3000);
          stepProcessedAndAdvanced = true;
        } else {
          console.warn(`[Form Filler] Loop attempt #${currentTry}: Unhandled currentStep: "${currentStep}". Stopping main loop.`);
          break;
        }

        if (currentGlobalStepHint >= 5) {
          console.log('[Form Filler] Global hint indicates all steps processed including final submission. Exiting main loop.');
          break;
        }
        if (!stepProcessedAndAdvanced && currentStep !== "UNKNOWN_POST_HINT") {
          console.warn(`[Form Filler] Loop attempt #${currentTry}: Step ${currentStep} was not successfully processed and advanced. Stopping main loop.`);
          break;
        }
        if (currentTry >= maxTries && currentGlobalStepHint < 5) {
          console.warn('[Form Filler] Reached max tries in main loop, but not all steps completed (including submission). Exiting.');
          break;
        }
        await sleep(1000);
      }

      console.log('[Form Filler] Form fill process potentially complete or max tries reached.');
    } catch (error) {
      console.error(`[Form Filler] CRITICAL Error in main fillApplicationForm: ${(error as Error).message}`, (error as Error).stack);
    } finally {
      isFormFillingInProgress = false;
      console.log('[Form Filler] fillApplicationForm: Processing finished. Re-entrancy guard released.');
    }
  }

  const initFormFiller = async (): Promise<void> => {
    try {
      console.log('[Form Filler] Initializing form filler...');
      if (document.readyState === 'loading') {
        console.log('[Form Filler] Document is loading, waiting for DOMContentLoaded...');
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      } else {
        console.log('[Form Filler] Document already loaded or interactive.');
      }

      await sleep(1000);

      await fillApplicationForm();

      const observer = new MutationObserver(async (mutations, obs) => {
        let significantChangeDetected: boolean = false;
        const stepKeywordsForObserver: string[] = [step2Keyword, ...step3Keywords, ...step4Keywords];

        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const elementNode = node as HTMLElement;
                if (elementNode.matches('div[data-automation-id="workdayApplicationPage"]') || (elementNode.querySelector && elementNode.querySelector('div[data-automation-id="workdayApplicationPage"]'))) {
                  console.log('[Form Filler] MutationObserver: Detected new workdayApplicationPage container.');
                  significantChangeDetected = true;
                  break;
                }
                if (elementNode.tagName === 'H1') {
                  console.log(`[Form Filler] MutationObserver: Detected new H1: ${elementNode.textContent ? elementNode.textContent.trim() : ''}`);
                  significantChangeDetected = true;
                  break;
                }
                if (elementNode.tagName === 'H2' && elementNode.textContent && stepKeywordsForObserver.some(kw => elementNode.textContent.trim().includes(kw))) {
                  console.log(`[Form Filler] MutationObserver: Detected new H2 matching a step keyword: ${elementNode.textContent.trim()}`);
                  significantChangeDetected = true;
                  break;
                }
                if (!significantChangeDetected && (elementNode.matches('div[role="main"], section[role="main"]') || (elementNode.querySelector && elementNode.querySelector('div[role="main"], section[role="main"]')))) {
                  console.log('[Form Filler] MutationObserver: Detected new main role container.');
                  significantChangeDetected = true;
                  break;
                }
              }
            }
          }
          if (significantChangeDetected) break;
        }

        if (significantChangeDetected) {
          console.log('[Form Filler] MutationObserver: Significant change detected, re-running form filler after a delay.');
          obs.disconnect();
          await sleep(2000);
          await fillApplicationForm();

          const targetNode = document.body;
          if (targetNode) {
            console.log('[Form Filler] MutationObserver: Re-attaching observer to document.body.');
            observer.observe(targetNode, { childList: true, subtree: true });
          } else {
            console.warn('[Form Filler] MutationObserver: Could not find document.body to re-attach observer.');
          }
        }
      });

      const mainDocumentBody = document.body;
      if (mainDocumentBody) {
        observer.observe(mainDocumentBody, { childList: true, subtree: true });
        console.log('[Form Filler] Mutation observer set up on main document body.');
      } else {
        console.warn('[Form Filler] Could not set up MutationObserver: document.body not found at init.');
      }
    } catch (error) {
      console.error(`[Form Filler] Critical error during initialization: ${(error as Error).message}`, (error as Error).stack);
      if ((error as Error).stack) {
        console.error((error as Error).stack);
      }
    }
  };

  // At the end, return the main entry points you want to expose
  return {
    fillApplicationForm,
    initFormFiller,
    // add more if you want to expose more functions
  };
}

export default createWorkdayFormFiller;
