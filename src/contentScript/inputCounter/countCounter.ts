import { backendService } from '../../utils/backendService';

export interface PageLoadOptions {
  maxWaitTime?: number;
  stabilityChecks?: number;
  checkInterval?: number;
}

export async function waitForPageToBeReady(options: PageLoadOptions = {}): Promise<void> {
  const {
    maxWaitTime = 10000,
    stabilityChecks = 3,
    checkInterval = 500
  } = options;

  return new Promise((resolve) => {
    const startTime = Date.now();
    let lastElementCount = 0;
    let stableCount = 0;

    const checkStability = () => {
      if (Date.now() - startTime > maxWaitTime) {
        console.warn('Maximum wait time reached, proceeding anyway');
        resolve();
        return;
      }

      const currentElements = document.querySelectorAll('input, textarea, select, [role="textbox"], [contenteditable="true"]');
      const currentCount = currentElements.length;

      if (currentCount > 0 && currentCount === lastElementCount) {
        stableCount++;
      } else {
        stableCount = 0;
        lastElementCount = currentCount;
      }

      if (stableCount >= stabilityChecks) {
        console.log('Page content stabilized');
        resolve();
      } else {
        setTimeout(checkStability, checkInterval);
      }
    };

    checkStability();

    const observer = new MutationObserver(() => {
      checkStability();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    Promise.resolve().then(() => {
      observer.disconnect();
    });
  });
}

interface UserData {
  data?: {
    details?: {
      email?: string;
      emailAlternative?: string;
    };
  };
}

async function updateCount(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['interactiveElements', 'formData'], async (result) => {
      try {
        if (chrome.runtime.lastError) {
          console.error('Error getting data:', chrome.runtime.lastError);
          resolve();
          return;
        }

        const formData = result.formData;
        if (!formData) {
          console.log('No formData found');
          resolve();
          return;
        }

        const data: UserData = typeof formData === 'string' ? JSON.parse(formData) : formData;
        const primaryEmail = data?.data?.details?.email;
        
        if (primaryEmail) {
          alert(`User email: ${primaryEmail}`);
          const result = await backendService.findUserByEmail(primaryEmail);
          alert(result.user);
  console.log('User check result:', result);
        }
        resolve();
      } catch (error) {
        console.error('Error processing data:', error);
        resolve();
      }
    });
  });
}

export async function saveInteractiveElements(input: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['interactiveElements'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting count:', chrome.runtime.lastError);
        resolve();
        return;
      }

      const previousCount = typeof result.interactiveElements === 'number' 
        ? result.interactiveElements 
        : 0;
      const updatedCount = previousCount + input;

      chrome.storage.local.set({ interactiveElements: updatedCount }, async () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving count:', chrome.runtime.lastError);
        } else {
          console.log(`✅ Updated count: ${previousCount} + ${input} = ${updatedCount}`);
          if (updatedCount > 20) {
            await updateCount();
          }
        }
        resolve();
      });
    });
  });
}
export function countVisibleUsableInputs(): HTMLElement[] {
  const inputSelectors = [
    'input:not([type="hidden"])',
    'textarea',
    'select',
    '[role="textbox"]',
    '[contenteditable="true"]',
    '[role="combobox"] input',
    '[role="search"] input',
    '.mat-input-element',
    '.MuiInputBase-input',
    '.ant-input',
    '.el-input__inner',
    '[data-testid="input"]',
    'input.v-text-field__slot',
    'input.q-input'
  ];

  function isVisibleUsable(element: Element | null): boolean {
    if (!element) return false;
    const htmlElement = element as HTMLElement;
    if (htmlElement.hidden) return false;
    if (htmlElement.getAttribute('aria-hidden') === 'true') return false;
    const style = window.getComputedStyle(htmlElement);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    if (htmlElement.offsetWidth <= 0 && htmlElement.offsetHeight <= 0) return false;

    let parent = htmlElement.parentElement;
    while (parent) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none') return false;
      parent = parent.parentElement;
    }

    return true;
  }

  function findAllElements(selectors: string[], root: Document | ShadowRoot = document): Element[] {
    let results: Element[] = [];
    selectors.forEach(selector => {
      try {
        results.push(...Array.from(root.querySelectorAll(selector)));
      } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
      }
    });

    Array.from(root.querySelectorAll('*')).forEach(element => {
      if (element.shadowRoot) {
        results.push(...findAllElements(selectors, element.shadowRoot));
      }
    });

    if (root instanceof Document) {
      Array.from(root.querySelectorAll('iframe')).forEach(iframe => {
        try {
          if (iframe.contentDocument) {
            results.push(...findAllElements(selectors, iframe.contentDocument));
          }
        } catch (e) {
          console.log('Skipped cross-origin iframe:', iframe.src);
        }
      });
    }

    return results;
  }

  const allElements = findAllElements(inputSelectors);
  const usableElements = allElements.filter(isVisibleUsable) as HTMLElement[];

  usableElements.forEach((element, index) => {
    element.style.border = '2px solid #4CAF50';
    element.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.3)';
    element.dataset.inputDetected = 'true';
    console.log(`Found input #${index + 1}:`, element);
  });

  console.log(`✅ Found ${usableElements.length} usable input fields`);
  return usableElements;
}
