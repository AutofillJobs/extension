import { domHelpers } from './smartRecruitContent';

interface Question {
  id: string;
  type: string;
  label: string;
  questionsFields: any[];
}

interface AnswerPattern {
  pattern: RegExp;
  answer: string;
  exclude?: RegExp;
}

/**
 * Detects if the current page is the Preliminary Questions page.
 * @returns {Promise<boolean>} - True if the page is detected, false otherwise.
 */

function isElementVisible(element: Element): boolean {
  if (!element.getBoundingClientRect) return true;
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && 
         rect.height > 0 && 
         style.visibility !== 'hidden' && 
         style.display !== 'none' &&
         style.opacity !== '0';
}

async function handleOcCheckbox(element: HTMLElement, shouldCheck: boolean): Promise<void> {
  console.log('🔍 Handling oc-checkbox component specifically...');
  
  // Check if already processed with correct state
  if (processedCheckboxes.has(element) && 
      element.getAttribute('aria-checked') === String(shouldCheck)) {
    return;
  }
  
  element.setAttribute('checked', String(shouldCheck));
  element.setAttribute('aria-checked', String(shouldCheck));
  (element as any).checked = shouldCheck;
  (element as any).value = shouldCheck;
  
  element.classList.remove('ng-untouched', 'ng-pristine', 'ng-invalid');
  element.classList.add('ng-touched', 'ng-dirty', 'ng-valid');


  const inputs = [
    ...Array.from(element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')),
    ...(element.shadowRoot ? Array.from(element.shadowRoot.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) : [])
  ];

  for (const input of inputs) {
    if (input instanceof HTMLInputElement) {
      input.checked = shouldCheck;
      input.setAttribute('checked', String(shouldCheck));
      input.setAttribute('aria-checked', String(shouldCheck));
    }
    
    const events = [
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, composed: true }),
      new MouseEvent('mouseup', { bubbles: true, cancelable: true, composed: true }),
      new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
      new Event('change', { bubbles: true, composed: true }),
      new CustomEvent('change', { detail: shouldCheck, bubbles: true }),
      new CustomEvent('input', { detail: shouldCheck, bubbles: true }),
      new InputEvent('input', { bubbles: true, composed: true }),
      new CustomEvent('checked-change', { detail: shouldCheck, bubbles: true })
    ];
    
    for (const event of events) {
      input.dispatchEvent(event);
      await domHelpers.delay(50);
    }
  }

  
  try {
    
    const ngContext = (element as any).__ngContext__;
    if (ngContext) {
      const ngModel = ngContext.directives?.find(
        (d: any) => d?.constructor?.name === 'NgModel' || d?.constructor?.name === 'FormControlDirective'
      );
      if (ngModel) {
        ngModel.viewToModelUpdate(shouldCheck);
        ngModel.control?.markAsTouched();
        ngModel.control?.markAsDirty();
        ngModel.control?.setValue(shouldCheck, { emitEvent: true });
      }
    }

    
    const form = element.closest('form');
    if (form) {
      const ngForm = (form as any).ngForm;
      if (ngForm?.form) {
        const formControl = ngForm.form.get(element.id) || 
                          ngForm.form.get(element.getAttribute('name')) ||
                          ngForm.form.get('confirm');
        if (formControl) {
          formControl.setValue(shouldCheck, { emitEvent: true });
          formControl.markAsTouched();
          formControl.markAsDirty();
        }
      }
    }
  } catch (e) {
    console.warn('Failed to update Angular form control:', e);
  }


  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
         (mutation.attributeName === 'checked' || mutation.attributeName === 'aria-checked')) {
        const target = mutation.target as HTMLElement;
        const currentValue = target.getAttribute(mutation.attributeName);
        if (currentValue !== String(shouldCheck)) {
          requestAnimationFrame(() => {
            target.setAttribute(mutation.attributeName!, String(shouldCheck));
          });
        }
      }
    });
  });

  observer.observe(element, { attributes: true, subtree: true });

  setTimeout(() => {
    element.setAttribute('checked', String(shouldCheck));
    element.setAttribute('aria-checked', String(shouldCheck));
    (element as any).checked = shouldCheck;
  }, 500);
}

const processedCheckboxes = new WeakSet<Element>();

async function fillAllCheckboxes(): Promise<void> {
  console.log('🔍 Finding and filling all checkboxes on the page...');
  

  const checkboxSelectors = [
    'spl-checkbox[data-spl-field]',
    'sr-question-field-checkbox spl-checkbox',
    'sr-question-field-checkbox input[type="checkbox"]',
    'spl-checkbox[name^="question_"]',
    'input[type="checkbox"][name*="privacy"]',
    'input[type="checkbox"][name*="consent"]',
    'input[type="checkbox"][aria-label*="privacy"]',
    'input[type="checkbox"][aria-label*="consent"]',
    
    'label:has(input[type="checkbox"])',
   
    '[data-test="consent-box"]',
    '.c-spl-checkbox__input',
    '[data-spl-field]',
    
    'oc-checkbox',
    'spl-checkbox',
    
    '[role="checkbox"]',
   
    'input[type="checkbox"]',
    
    '.c-spl-checkbox-wrapper',
    'sr-question-field-checkbox',
  
    '[data-test*="checkbox"]',
    
    '.checkbox',
    '*[class*="checkbox" i]'
  ].join(',');

  
  const checkboxElements = Array.from(document.querySelectorAll(checkboxSelectors));
  console.log(`Found ${checkboxElements.length} potential checkbox elements`);

  checkboxElements.forEach((el, index) => {
    console.log(`Checkbox ${index + 1}:`, {
      tagName: el.tagName,
      name: el.getAttribute('name'),
      type: el instanceof HTMLInputElement ? el.type : 'custom',
      isChecked: el instanceof HTMLInputElement ? el.checked : el.hasAttribute('checked'),
      text: el.querySelector('[slot="label-content"]')?.textContent?.trim() || 
            el.closest('label')?.textContent?.trim() ||
            'No label text found'
    });
  });


  const visibleCheckboxes = checkboxElements.filter(el => {
    if (!isElementVisible(el)) return false;
    const isAlreadyChecked = el instanceof HTMLInputElement ? 
      el.checked : 
      el.hasAttribute('checked') || el.getAttribute('aria-checked') === 'true';
    return !isAlreadyChecked;
  });

  console.log(`Found ${visibleCheckboxes.length} visible unchecked checkboxes`);


  for (const element of checkboxElements) {
    try {
     
      if (processedCheckboxes.has(element)) {
        const isChecked = element instanceof HTMLInputElement ? 
          element.checked : 
          (element.hasAttribute('checked') || element.getAttribute('aria-checked') === 'true');
        
        if (isChecked) {
          console.log('⏭️ Skipping already processed and checked checkbox:', {
            tagName: element.tagName,
            name: element.getAttribute('name'),
            text: element.querySelector('[slot="label-content"]')?.textContent?.trim()
          });
          continue;
        } else {
          console.log('🔄 Retrying previously processed but unchecked checkbox');
          processedCheckboxes.delete(element);
        }
      }

      
      if (!isElementVisible(element)) {
        console.log('⏭️ Skipping invisible checkbox');
        continue;
      }

    
      processedCheckboxes.add(element);
      
      const isPrivacyCheckbox = 
        
        element.matches('input[type="checkbox"][name*="privacy"], input[type="checkbox"][name*="consent"]') ||
        element.getAttribute('aria-label')?.toLowerCase().includes('privacy') ||
        element.getAttribute('aria-label')?.toLowerCase().includes('consent') ||
        
        element.closest('label')?.textContent?.toLowerCase().includes('privacy policy') ||
        
        (element.tagName === 'SPL-CHECKBOX' && (
          element.querySelector('[slot="label-content"]')?.textContent?.toLowerCase().includes('privacy policy') ||
          element.querySelector('[slot="label-content"]')?.textContent?.toLowerCase().includes('consent') ||
          element.getAttribute('name')?.includes('question_') 
        ));

      if (isPrivacyCheckbox) {
        console.log('🔒 Found privacy consent checkbox:', element);
        
        if (element.tagName === 'SPL-CHECKBOX') {
          console.log('📝 Handling SPL-CHECKBOX privacy consent...');
          element.setAttribute('checked', 'true');
          element.setAttribute('aria-checked', 'true');
          (element as any).checked = true;
          
         
          element.classList.remove('ng-untouched', 'ng-pristine', 'ng-invalid');
          element.classList.add('ng-touched', 'ng-dirty', 'ng-valid');
          
          
          const innerInput = element.querySelector('input[type="checkbox"]');
          if (innerInput) {
            (innerInput as HTMLInputElement).checked = true;
            innerInput.setAttribute('checked', 'true');
          }
          
          
          const events = ['mousedown', 'mouseup', 'click', 'change', 'input'];
          for (const eventType of events) {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
          }
          
          const formEl = element.closest('form');
          if (formEl) {
            const ngForm = (formEl as any).ngForm;
            if (ngForm?.form) {
              const controlName = element.getAttribute('name');
              if (controlName) {
                const control = ngForm.form.get(controlName);
                if (control) {
                  control.setValue(true);
                  control.markAsTouched();
                  control.markAsDirty();
                }
              }
            }
          }
          
          await domHelpers.delay(100);
          continue; 
        }
      }
      
      if (element instanceof HTMLInputElement) {
     
        if (!element.checked) { 
          element.checked = true;
          element.dispatchEvent(new Event('change', { bubbles: true }));
          await domHelpers.delay(100);
        }
      } else if (element.tagName === 'OC-CHECKBOX') {
        
        const currentState = element.getAttribute('aria-checked') === 'true';
        if (!currentState) { 
          await handleOcCheckbox(element as HTMLElement, true);
          await domHelpers.delay(100);
        }
      } else if (element.tagName === 'SPL-CHECKBOX' || element.closest('sr-question-field-checkbox')) {
        
        console.log('🔍 Handling SmartRecruit question checkbox...');
        
        const splCheckbox = element.tagName === 'SPL-CHECKBOX' ? element : element.querySelector('spl-checkbox');
        if (splCheckbox) {
         
          splCheckbox.setAttribute('checked', 'true');
          splCheckbox.setAttribute('aria-checked', 'true');
          (splCheckbox as any).checked = true;
          
          
          splCheckbox.classList.remove('ng-untouched', 'ng-pristine', 'ng-invalid');
          splCheckbox.classList.add('ng-touched', 'ng-dirty', 'ng-valid');
          
          
          const innerInput = splCheckbox.querySelector('input[type="checkbox"]');
          if (innerInput) {
            (innerInput as HTMLInputElement).checked = true;
            innerInput.setAttribute('checked', 'true');
            
            
            const events = [
              new MouseEvent('mousedown', { bubbles: true, composed: true }),
              new MouseEvent('mouseup', { bubbles: true, composed: true }),
              new MouseEvent('click', { bubbles: true, composed: true }),
              new Event('change', { bubbles: true, composed: true }),
              new InputEvent('input', { bubbles: true, composed: true })
            ];
            
            for (const event of events) {
              innerInput.dispatchEvent(event);
              await domHelpers.delay(50);
            }
          }
          
        
          const form = splCheckbox.closest('form');
          if (form) {
            const ngForm = (form as any).ngForm;
            if (ngForm?.form) {
              const controlName = splCheckbox.getAttribute('name');
              if (controlName) {
                const control = ngForm.form.get(controlName);
                if (control) {
                  control.setValue(true, { emitEvent: true });
                  control.markAsTouched();
                  control.markAsDirty();
                }
              }
            }
          }
          
          await domHelpers.delay(100);
        }
      } else {
        
        const inputs = [
          
          ...(element.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')),
          
          ...(element instanceof HTMLElement && element.shadowRoot ? 
              Array.from(element.shadowRoot.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) : 
              [])
        ];

        for (const input of inputs) {
          if (input instanceof HTMLInputElement) {
            input.checked = true;
            input.setAttribute('checked', 'true');
            input.setAttribute('aria-checked', 'true');
            
            const events = [
              new MouseEvent('click', { bubbles: true, composed: true }),
              new Event('change', { bubbles: true }),
              new InputEvent('input', { bubbles: true })
            ];
            
            events.forEach(event => input.dispatchEvent(event));
          }
        }

        if (element instanceof HTMLElement) {
          element.setAttribute('checked', 'true');
          element.setAttribute('aria-checked', 'true');
          element.classList.remove('ng-pristine', 'ng-invalid', 'ng-untouched');
          element.classList.add('ng-dirty', 'ng-valid', 'ng-touched');
        }
      }
    } catch (error) {
      console.warn('Failed to process checkbox:', error);
    }
  }
}

export async function detectPreliminaryQuestionsPage(): Promise<boolean> {
  console.log('🔍 Attempting to detect Preliminary Questions page...');

  // Strategy 1: Wait for the specific form element
  const formElement = await domHelpers.waitForElement('sr-screening-questions-form', 7000); // Increased timeout
  if (formElement) {
    console.log('✅ Preliminary Questions page detected by form element (after wait)');
    return true;
  }

  // Strategy 2: Check for heading text content
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  for (const heading of Array.from(headings)) {
    const text = heading.textContent?.toLowerCase();
    if (text && (text.includes('preliminary questions') || text.includes('screening questions'))) {
      console.log(`✅ Preliminary Questions page detected by heading: ${heading.textContent}`);
      return true;
    }
  }

  // Strategy 3: Broad text search in the document body
  const bodyText = document.body.textContent?.toLowerCase();
  if (bodyText && (bodyText.includes('preliminary questions') || bodyText.includes('screening questions'))) {
    console.log('✅ Preliminary Questions page detected by broad text search in body');
    return true;
  }
  
  console.log('ℹ️ Not on Preliminary Questions page after all detection strategies.');
  return false;
}

interface AnswerPattern {
  pattern: RegExp;
  answer: string;
  exclude?: RegExp;
}

function getAnswer(fieldLabel: string, questionLabel: string): string {
  // Normalize the input
  const fieldText = fieldLabel.toLowerCase().trim();
  const questionText = questionLabel.toLowerCase().trim();
  const combinedText = `${fieldText} ${questionText}`;

  // Priority handling for language-related fields
  if (combinedText.includes('language')) {
    console.log('🔤 Detected language-related question');
    if (combinedText.includes('level')) {
      console.log('🔤 Detected language level field');
      return 'Beginner';
    }
    console.log('🔤 Detected language name field');
    return 'English';
  }

  const answerPatterns: Array<{ pattern: RegExp; answer: string; exclude?: RegExp }> = [
    // Consent and Agreement patterns (for checkboxes and radio buttons)
    { pattern: /consent|agree|accept|gdpr|data.?protection/i, answer: '1' },
    { pattern: /declare|certify|confirm|acknowledge|attest/i, answer: '1' },
    { pattern: /privacy.?policy|terms.?(of)?.?service|terms.?(of)?.?use/i, answer: '1' },
    { pattern: /understand|read.?and.?agree|review.?and.?agree/i, answer: '1' },
    { pattern: /visa.?sponsor|need.?sponsor|require.?sponsor/i, answer: '0' },
    { pattern: /work.?permit|work.?authorization|legally.?eligible|right.?to.?work/i, answer: '1' },
    { pattern: /felony|misdemeanor|criminal|convicted/i, answer: '0' },
    // Strong negatives (prefer no/false for these)
    { pattern: /disability|medical.?condition|accommodation/i, answer: '0' },
    { pattern: /illegal.?drugs|controlled.?substances/i, answer: '0' },
    
    // Experience patterns
    { pattern: /years?|experience/i, answer: '5' },
    { pattern: /salary|compensation|pay|income|wage|ctc/i, answer: '75000' },
    { pattern: /annual.*current.*ctc.*inr/i, answer: '800000' },
    { pattern: /current.*ctc.*inr/i, answer: '800000' },
    { pattern: /annual.*expected.*ctc.*inr/i, answer: '1000000' },
    { pattern: /expected.*ctc.*inr/i, answer: '1000000' },
    { pattern: /available|start|join|notice|date/i, answer: 'Immediately' },
    { pattern: /contact|phone|mobile|telephone/i, answer: '(555) 123-4567' },
    { pattern: /mail|email|e-mail/i, answer: 'professional.candidate@email.com' },
    { pattern: /degree|education|study|college|university|qualification/i, answer: 'Bachelor\'s Degree' },
    { pattern: /highest.*education.*qualification/i, answer: 'Bachelor\'s Degree' },
    { pattern: /notice.*period|current.*employer.*notice/i, answer: '30 days' },
    { pattern: /nielsen.*worked|worked.*nielsen/i, answer: '0' },
    { pattern: /address|location|city|country|state|zip|postal/i, answer: '789 Professional Ave, New York, NY 10001' },
    { pattern: /benefits|insurance|medical|dental|vision/i, answer: '1' },
    { pattern: /name|full name|first|last/i, answer: 'John Smith', exclude: /language/i },
    { pattern: /describe|explain|elaborate|details?|comments?|additional/i, answer: 'I am highly motivated and have extensive experience in this field.' },
    { pattern: /certification|certify|license|permit/i, answer: 'AWS Certified Solutions Architect, Certified Scrum Master' },
    { pattern: /website|portfolio|linkedin|social/i, answer: 'linkedin.com/in/professional-candidate' },
    { pattern: /travel|relocation|relocate|move/i, answer: '1' },
    { pattern: /hours?|schedule|shift|overtime/i, answer: 'Full-time' },
    { pattern: /visa|sponsor|work permit|authorization/i, answer: 'Yes' },
    { pattern: /remote|work from home|telecommute/i, answer: 'Yes' },
    { pattern: /disability|accommodation|medical condition/i, answer: 'No' },
    { pattern: /veteran|military|armed forces/i, answer: 'No' },
    { pattern: /criminal|background|conviction/i, answer: 'No' },
    { pattern: /security clearance|government clearance/i, answer: 'No' },
    { pattern: /references|reference check/i, answer: 'Available upon request' },
    { pattern: /\b(are|can|do|does|will|would|have|has|had)\b/i, answer: 'Yes' }
  ];

  // Try each pattern against the combined text
  for (const pattern of answerPatterns) {
    if (pattern.pattern.test(combinedText) && (!pattern.exclude || !pattern.exclude.test(combinedText))) {
      console.log(`✅ Matched pattern: ${pattern.pattern} -> ${pattern.answer}`);
      return pattern.answer;
    }
  }

    // Try each pattern
  for (const pattern of answerPatterns) {
    if (pattern.pattern.test(combinedText) && (!pattern.exclude || !pattern.exclude.test(combinedText))) {
      console.log(`✅ Matched pattern: ${pattern.pattern.source} -> ${pattern.answer}`);
      return pattern.answer;
    }
  }

  // If no pattern matched, default to Yes
  console.log(`ℹ️ No specific pattern match found for: "${combinedText}", defaulting to Yes`);
  return 'Yes';
}

export const fillPreliminaryQuestions = async (): Promise<void> => {
  console.log("🚀 Starting to fill preliminary questions...");
  const form = document.querySelector('sr-screening-questions-form');
  if (!form) {
    console.warn('⚠️ Screening questions form not found.');
    return;
  }

  const definitionAttr = form.getAttribute('definition');
  if (!definitionAttr) {
    console.warn('⚠️ Screening questions form has no definition attribute.');
    return;
  }

  try {
    const definition = JSON.parse(definitionAttr);
    const questions: Question[] = definition.questions;
    
    console.log("📝 Processing all non-checkbox fields first...");

    // Helper function to find input elements in containers
    const findInputInContainer = (root: HTMLElement | ShadowRoot): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] => {
      const inputs: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = [];
      const processedShadowRoots = new Set<ShadowRoot>();

      const addInputsRecursively = (element: Element | Document | ShadowRoot) => {
        if (element instanceof ShadowRoot) {
          if (processedShadowRoots.has(element)) return;
          processedShadowRoots.add(element);
        }

        // Find all input types including SmartRecruit specific elements
        const selector = [
  // Standard form inputs
  'input[type="text"]', 'input[type="number"]', 'input[type="email"]',
  'input[type="tel"]', 'input[type="password"]', 'input[type="radio"]',
  'input[type="checkbox"]', 'input:not([type])', 'textarea', 'select',
  // Role-based elements
  '[role="textbox"]', '[role="radio"]', '[role="checkbox"]',
  // SmartRecruit custom elements
  'sr-screening-questions-form input[type="checkbox"]',
  'sr-screening-questions-form input[type="radio"]',
  // SPL components
  'spl-checkbox', 'oc-checkbox', 'spl-radio',
  // SPL component inputs
  '.c-spl-checkbox__input', '.c-spl-radio__input',
  '.c-spl-checkbox-wrapper input', '.c-spl-radio-wrapper input',
  // Data attributes
  '[data-test="consent-box"]', '[data-test*="checkbox"]',
  '[labeldatatest="consent-text"]',
  // Nested inputs
  'spl-checkbox input', 'spl-radio input',
  // Other inputs
  'input[type="radio"][name]', 'input[type="checkbox"][name]'
].join(',');
        const elements = element.querySelectorAll(selector);

        elements.forEach(el => {
          if (el instanceof HTMLInputElement) {
            // For radio and checkbox, ensure we only add if it's a valid choice
            if ((el.type === 'radio' || el.type === 'checkbox')) {
              // Check for custom components (SmartRecruit specific)
              const isCustomComponent = el.closest('spl-checkbox, spl-radio, oc-checkbox, sr-screening-questions-form');
              
              // Special handling for screening form consent checkbox
              if (el.closest('sr-screening-questions-form') && el.type === 'checkbox') {
                const form = el.closest('sr-screening-questions-form');
                if (form && form.getAttribute('definition')) {
                  try {
                    const def = JSON.parse(form.getAttribute('definition') || '{}');
                    if (def.questions?.some((q: Question) => q.type === 'checkbox' && q.questionsFields?.[0]?.name === 'confirm')) {
                      inputs.push(el);
                    }
                  } catch (e) {
                    console.warn('Failed to parse form definition:', e);
                  }
                }
              } else if (isCustomComponent || el.name) {
                inputs.push(el);
              }
            } else {
              inputs.push(el);
            }
          } else if (el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
            inputs.push(el);
          } else if (el.hasAttribute('role') && 
                    ['textbox', 'radio', 'checkbox'].includes(el.getAttribute('role') || '') || 
                    el.hasAttribute('contenteditable')) {
            inputs.push(el as unknown as HTMLInputElement);
          }
        });

        // Recursively search in shadow DOMs with improved handling
        const walkShadowRoots = (node: Node) => {
          if (node instanceof Element) {
            if (node.shadowRoot) {
              addInputsRecursively(node.shadowRoot);
            }
            // Handle slots for web components
            if (node instanceof HTMLSlotElement) {
              const assigned = node.assignedElements();
              assigned.forEach((el: Element) => walkShadowRoots(el));
            }
          }
          node.childNodes.forEach(walkShadowRoots);
        };

        walkShadowRoots(element);
      };

      addInputsRecursively(root);
      return inputs;
    };

    // Function to fill a specific field within a question
    /**
     * Enhanced input filling with proper event handling and validation
     */
    async function fillInputField(inputElement: HTMLInputElement | HTMLTextAreaElement, answer: string): Promise<boolean> {
      try {
        // Ensure element is visible and focusable
        inputElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        await domHelpers.delay(100);
        
        // Focus the element first
        inputElement.focus();
        await domHelpers.delay(50);
        
        // Clear existing value
        inputElement.value = '';
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
        await domHelpers.delay(50);
        
        // Set new value
        inputElement.value = answer;
        
        // Dispatch proper sequence of events for form validation
        const events = [
          new Event('input', { bubbles: true, composed: true }),
          new Event('change', { bubbles: true, composed: true }),
          new Event('blur', { bubbles: true, composed: true }),
          new Event('keyup', { bubbles: true, composed: true }),
          new Event('keydown', { bubbles: true, composed: true }),
          new Event('focusout', { bubbles: true, composed: true })
        ];
        
        for (const event of events) {
          inputElement.dispatchEvent(event);
          await domHelpers.delay(50);
        }
        
        // Try to update Angular's form control if available
        try {
          const ngContext = (inputElement as any).__ngContext__;
          if (ngContext) {
            const ngModel = ngContext.directives?.find(
              (d: any) => d?.constructor?.name === 'NgModel' || d?.constructor?.name === 'FormControlDirective'
            );
            if (ngModel) {
              ngModel.viewToModelUpdate(answer);
              ngModel.control?.markAsTouched();
              ngModel.control?.markAsDirty();
              ngModel.control?.setValue(answer, { emitEvent: true });
              console.log('✅ Updated Angular form control for input.');
            }
          }
        } catch (e) {
          console.warn('Failed to update Angular form control for input:', e);
        }

        // Verify the value was set
        const success = inputElement.value === answer;
        if (success) {
          console.log(`✅ Successfully filled input with: "${answer}"`);
        } else {
          console.warn(`⚠️ Value verification failed. Expected: "${answer}", Got: "${inputElement.value}"`);
        }
        
        return success;
      } catch (error) {
        console.error('Error filling input field:', error);
        return false;
      }
    }

    /**
     * Enhanced dropdown handling with better option detection
     */
    async function handleDropdownInput(inputElement: HTMLInputElement | HTMLElement, answer: string): Promise<boolean> {
      try {
        // Focus and click to open dropdown
        inputElement.scrollIntoView({ behavior: 'auto', block: 'center' });
        await domHelpers.delay(100);
        inputElement.focus();
        inputElement.click();
        await domHelpers.delay(300);
        
        // Wait for dropdown to appear
        const dropdownSelectors = [
          '.dropdown-menu', '.suggestions', '.autocomplete-items',
          '[role="listbox"]', '[role="menu"]', '.c-spl-dropdown__menu',
          '.c-spl-select__menu', '.ng-dropdown-panel-items'
        ];
        
        let dropdown: Element | null = null;
        for (const selector of dropdownSelectors) {
          dropdown = document.querySelector(selector);
          if (dropdown) break;
        }
        
        if (dropdown) {
          console.log('🔍 Dropdown found, searching for matching option...');
          
          const options = dropdown.querySelectorAll('li, [role="option"], div.option, div[class*="option"], span[class*="option"]');
          let targetOption: Element | null = null;
          
          // Try exact match first
          for (const option of options) {
            const optionText = option.textContent?.trim().toLowerCase() || '';
            if (optionText === answer.toLowerCase()) {
              targetOption = option;
              break;
            }
          }
          
          // Try partial match if no exact match
          if (!targetOption) {
            for (const option of options) {
              const optionText = option.textContent?.trim().toLowerCase() || '';
              if (optionText.includes(answer.toLowerCase()) || answer.toLowerCase().includes(optionText)) {
                targetOption = option;
                break;
              }
            }
          }
          
          if (targetOption) {
            (targetOption as HTMLElement).click();
            await domHelpers.delay(200);
            console.log(`✅ Selected dropdown option: "${targetOption.textContent?.trim()}"`);
            return true;
          } else {
            console.warn(`⚠️ No matching option found for: "${answer}"`);
          }
        }
        
        // If no dropdown or no matching option, it means this was not a dropdown or we couldn't interact with it.
        // In this case, we should explicitly return false to allow fallback to direct input filling.
        console.log('ℹ️ handleDropdownInput did not find or fill a dropdown. Returning false for fallback.');
        return false;
      } catch (error) {
        console.error('Error handling dropdown input:', error);
        return false;
      }
    }

    async function fillField(
      questionContainer: HTMLElement,
      fieldLabel: string,
      answer: string,
      fieldType: string,
      fieldName: string,
      questionLabel: string
    ): Promise<boolean> {
      console.log(`🚀 Starting to fill field: "${fieldLabel}" with answer: "${answer}" (type: ${fieldType}, name: ${fieldName})`);

      let inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement | null = null;

      // Strategy 1: Try to find by specific question ID
      if (fieldName && fieldName.includes('question_')) {
        console.log('🔍 Trying to find input by specific ID:', fieldName);
        inputElement = questionContainer.querySelector(`#${fieldName}.c-spl-input`) ||
                      document.querySelector(`#${fieldName}.c-spl-input`);
        if (inputElement) {
          console.log('✅ Found input by specific ID');
        }
      }

      // Strategy 2: Search by data-test attribute if input not found
      if (!inputElement) {
        function cssEscape(str: string): string {
          return str.replace(/([\0-\x1F\x7F-\x9F\u00A0-\uFFFF\"\'\[\]\(\)\{\}\:\;\,\=\!\?\>\<\~\`\@\#\$\%\^\&\*\|\+\-\/\\])/g, '\\$1');
        }
        const safeFieldName = cssEscape(fieldName);
        const safeFieldLabel = cssEscape(fieldLabel);
        try {
          inputElement = questionContainer.querySelector(`[data-test*="${safeFieldName}" i], [data-test*="${safeFieldLabel}" i]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement;
        } catch (e) {
          console.warn('Could not use data-test selector due to invalid characters, falling back.', e);
          inputElement = null;
        }
      }
      
      if (!inputElement) {
        // Strategy 2: Search by label text and then find an associated input
        const labelElement = Array.from(questionContainer.querySelectorAll('label, .input-label, .field-label')).find(
          el => el.textContent?.toLowerCase().includes(fieldLabel.toLowerCase())
        );
        if (labelElement) {
          const inputId = labelElement.getAttribute('for');
          if (inputId) {
            inputElement = questionContainer.querySelector(`#${inputId}`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement;
          }
          if (!inputElement) {
            inputElement = labelElement.nextElementSibling as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement;
            if (!inputElement || (!['INPUT', 'SELECT', 'TEXTAREA'].includes(inputElement.tagName) && !(inputElement.hasAttribute('role') && inputElement.getAttribute('role') === 'textbox' || inputElement.hasAttribute('contenteditable')))) {
              inputElement = labelElement.parentElement?.querySelector('input, textarea, select, [role="textbox"], [contenteditable="true"]') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLElement;
            }
          }
        }
      }

      // Strategy 3: Broader search within the container for the field name/label
      if (!inputElement) {
        const allInputsInContainer = findInputInContainer(questionContainer);
        console.log('🔍 Inputs found in container:', allInputsInContainer);

        // NEW: If no standard input found, search for custom SmartRecruit checkbox/radio components
        if (!inputElement) {
          const customComponent = questionContainer.querySelector('spl-checkbox, oc-checkbox, spl-radio') as HTMLElement | null;
          if (customComponent) {
            console.log('🟩 Found custom SmartRecruit component as fallback:', customComponent.tagName);
            inputElement = customComponent;
          }
        }
        
        // If this is a "Value" field, we need to be more careful about finding the right input
        if (fieldLabel.toLowerCase() === 'value') {
          // First try to match the input with the question container
          const potentialInputs = Array.from(allInputsInContainer).filter(input => {
            // Skip inputs that are already used for language fields
            if (input.id?.toLowerCase().includes('lang') || 
                input.id?.toLowerCase().includes('level') ||
                input.getAttribute('placeholder')?.toLowerCase().includes('level')) {
              return false;
            }

            // Check parent elements for question text
            let currentElement: Element | null = input;
            let searchDepth = 0;
            const maxDepth = 4; // Search up to 4 levels up
            
            while (currentElement && searchDepth < maxDepth) {
              const elementText = currentElement.textContent?.toLowerCase() || '';
              if (elementText.includes(questionLabel.toLowerCase())) {
                return true;
              }
              currentElement = currentElement.parentElement;
              searchDepth++;
            }
            return false;
          });

          // Take the first matching input that's not a language-related field
          const potentialInput = potentialInputs[0];
          if (potentialInput) {
            inputElement = potentialInput;
          }

          // If still not found, try matching by attributes and question content
          if (!inputElement) {
            const questionWords = questionLabel.toLowerCase()
              .split(/\s+/)
              .filter(word => word.length > 3 && !['what', 'when', 'where', 'how', 'your'].includes(word));
              
            const potentialInputs = Array.from(allInputsInContainer)
              .filter(input => {
                // Skip language-related fields
                if (input.id?.toLowerCase().includes('lang') || 
                    input.id?.toLowerCase().includes('level') ||
                    input.getAttribute('placeholder')?.toLowerCase().includes('level')) {
                  return false;
                }

                // Get all relevant attributes
                const attributes = {
                  id: input.id?.toLowerCase() || '',
                  name: input.name?.toLowerCase() || '',
                  testId: input.getAttribute('data-test')?.toLowerCase() || '',
                  ariaLabel: input.getAttribute('aria-label')?.toLowerCase() || '',
                  placeholder: input.getAttribute('placeholder')?.toLowerCase() || '',
                  label: input.getAttribute('label')?.toLowerCase() || ''
                };

                // Score the input based on how many question words match
                const matchCount = questionWords.filter(word => 
                  Object.values(attributes).some(attr => attr.includes(word))
                ).length;

                return matchCount > 0;
              })
              .sort((a, b) => {
                // Prefer inputs that aren't already filled
                const aValue = (a as HTMLInputElement).value || '';
                const bValue = (b as HTMLInputElement).value || '';
                if (!aValue && bValue) return -1;
                if (aValue && !bValue) return 1;
                return 0;
              });

            if (potentialInputs.length > 0) {
              inputElement = potentialInputs[0];
            }
          }
        }
        
        // If still not found or not a "Value" field, try regular matching
        if (!inputElement) {
          inputElement = allInputsInContainer.find(input => {
            const id = input.id?.toLowerCase();
            const name = input.name?.toLowerCase();
            const testId = input.getAttribute('data-test')?.toLowerCase();
            const ariaLabel = input.getAttribute('aria-label')?.toLowerCase();
            const placeholder = input.getAttribute('placeholder')?.toLowerCase();

            return (id && (id.includes(fieldName.toLowerCase()) || id.includes(fieldLabel.toLowerCase()))) ||
                   (name && (name.includes(fieldName.toLowerCase()) || id.includes(fieldLabel.toLowerCase()))) ||
                   (testId && (testId.includes(fieldName.toLowerCase()) || testId.includes(fieldLabel.toLowerCase()))) ||
                   (ariaLabel && (ariaLabel.includes(fieldName.toLowerCase()) || ariaLabel.includes(fieldLabel.toLowerCase()))) ||
                   (placeholder && (placeholder.includes(fieldName.toLowerCase()) || placeholder.includes(fieldLabel.toLowerCase())));
          }) || null;
        }
      }

      // Strategy 4: Thorough global search with enhanced matching
      if (!inputElement) {
        const allInputsGlobal = findInputInContainer(document.body);
        console.log('🔍 Inputs found globally:', allInputsGlobal);

        const findByAttributes = (input: Element): boolean => {
          const attributes = {
            id: input.id?.toLowerCase() || '',
            name: input.getAttribute('name')?.toLowerCase() || '',
            label: input.getAttribute('label')?.toLowerCase() || '',
            ariaLabel: input.getAttribute('aria-label')?.toLowerCase() || '',
            placeholder: input.getAttribute('placeholder')?.toLowerCase() || '',
            dataTest: input.getAttribute('data-test')?.toLowerCase() || '',
            type: (input as HTMLInputElement).type?.toLowerCase() || '',
            role: input.getAttribute('role')?.toLowerCase() || ''
          };

          // Get text from parent labels
          const parentLabels = Array.from(input.parentElement?.querySelectorAll('label') || []);
          const labelTexts = parentLabels.map(label => label.textContent?.toLowerCase().trim() || '');

          // Get text from nearby elements
          const nearbyTexts = [];
          let element = input.parentElement;
          for (let i = 0; i < 3 && element; i++) {
            nearbyTexts.push(element.textContent?.toLowerCase().trim() || '');
            element = element.parentElement;
          }

          // Special handling for language fields
          if (questionLabel.toLowerCase().includes('language')) {
            if (fieldLabel.toLowerCase().includes('level')) {
              // For language level fields
              return (
                attributes.id.includes('level') ||
                attributes.name.includes('level') ||
                labelTexts.some(text => text.includes('level')) ||
                nearbyTexts.some(text => text.includes('level') && text.includes('language'))
              );
            } else {
              // For language name fields
              return (
                (attributes.id.includes('lang') && !attributes.id.includes('level')) ||
                (attributes.name.includes('lang') && !attributes.name.includes('level')) ||
                labelTexts.some(text => text.includes('language') && !text.includes('level')) ||
                nearbyTexts.some(text => text.includes('language') && !text.includes('level'))
              );
            }
          }

          // Extract meaningful words from question and field labels
          const questionWords = questionLabel.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3 && !['what', 'when', 'where', 'how', 'your', 'this', 'that'].includes(word));
          
          const fieldWords = fieldLabel.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3);

          // Check if any attribute contains our target words
          const attributeMatches = Object.values(attributes).some(attr =>
            [...questionWords, ...fieldWords].some(word => attr.includes(word))
          );

          // Check if any label text contains our target words
          const labelMatches = labelTexts.some(text =>
            [...questionWords, ...fieldWords].some(word => text.includes(word))
          );

          // Check if any nearby text contains our target words
          const nearbyMatches = nearbyTexts.some(text =>
            [...questionWords, ...fieldWords].some(word => text.includes(word))
          );

          return attributeMatches || labelMatches || nearbyMatches;
        };

        // Filter and sort inputs by relevance
        const matchingInputs = allInputsGlobal
          .filter(findByAttributes)
          .sort((a, b) => {
            // Prefer visible elements
            const aVisible = isElementVisible(a);
            const bVisible = isElementVisible(b);
            if (aVisible && !bVisible) return -1;
            if (!aVisible && bVisible) return 1;

            // Prefer empty inputs
            const aValue = (a as HTMLInputElement).value || '';
            const bValue = (b as HTMLInputElement).value || '';
            if (!aValue && bValue) return -1;
            if (aValue && !bValue) return 1;

            return 0;
          });

        if (matchingInputs.length > 0) {
          inputElement = matchingInputs[0];
          console.log('✅ Found matching input:', inputElement);
        } else {
          console.log('🔍 Looking for field that matches:', questionLabel);

        const findGlobalInput = (input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean => {
          const id = input.id?.toLowerCase() || '';
          const placeholder = input.getAttribute('placeholder')?.toLowerCase() || '';
          const dataTest = input.getAttribute('data-test')?.toLowerCase() || '';
          const name = input.name?.toLowerCase() || '';
          const value = (input as HTMLInputElement).value?.toLowerCase() || '';
          
          // Skip if input is already filled (unless it's a language field)
          if (value && !id.includes('lang') && !id.includes('level')) {
            return false;
          }

          // Special case for language level
          if (questionLabel.toLowerCase().includes('language') && fieldLabel.toLowerCase().includes('level')) {
            return id.includes('level') || placeholder.includes('level');
          }

          // Special case for language input
          if (questionLabel.toLowerCase().includes('language') && fieldLabel.toLowerCase() === 'value') {
            return id.includes('lang') && !id.includes('level');
          }

          // For "Value" fields, match based on the question text
          if (fieldLabel.toLowerCase() === 'value') {
            // Extract meaningful words from the question
            const questionWords = questionLabel.toLowerCase()
              .split(/\s+/)
              .filter(word => word.length > 3 && !['what', 'when', 'where', 'how', 'your', 'this', 'that'].includes(word));

            // Check input's attributes
            for (const word of questionWords) {
              if (id.includes(word) || name.includes(word) || dataTest.includes(word) || placeholder.includes(word)) {
                return true;
              }
            }

            // Check parent elements for question text
            let parent = input.parentElement;
            let depth = 0;
            const maxDepth = 3;
            while (parent && depth < maxDepth) {
              const parentText = parent.textContent?.toLowerCase() || '';
              if (questionWords.some(word => parentText.includes(word))) {
                return true;
              }
              parent = parent.parentElement;
              depth++;
            }
          }
          return false;
        };

        // Use the custom finder function
        const matchingInput = allInputsGlobal.find(findGlobalInput);
        if (matchingInput) {
          inputElement = matchingInput;
          console.log(`✅ Found matching input for "${fieldLabel}":`, inputElement);
        }
          }
      }

      if (!inputElement) {
        console.warn(`⚠️ Could not find specific input element for field: "${fieldLabel}"`);
        return false;
      }

      console.log(`🎯 Found input element for field "${fieldLabel}":`, inputElement);
      console.log(`🔘 Input type: ${inputElement instanceof HTMLInputElement ? inputElement.type : 'unknown'}, tag: ${inputElement.tagName}`);

      // Override field type if we detected a checkbox element regardless of JSON definition
      let actualFieldType = fieldType;
      if (inputElement.tagName === 'OC-CHECKBOX' || inputElement.tagName === 'SPL-CHECKBOX' || 
          (inputElement instanceof HTMLInputElement && inputElement.type === 'checkbox')) {
        actualFieldType = 'checkbox';
        console.log(`🔄 Overriding field type from "${fieldType}" to "checkbox" based on element type`);
      }

      // Use auto scroll behavior to prevent continuous scrolling
      inputElement.scrollIntoView({ behavior: "auto", block: "center" });
      await domHelpers.delay(100);
      inputElement.focus();
      await domHelpers.delay(50);

      try {
            let elementFilled = false;
            switch (actualFieldType) {
                case 'radio':
                case 'checkbox': {
                    const shouldCheck = ['yes', 'true', '1', 'checked', 'enable', 'agree', 'accept'].includes(answer.toLowerCase());
                    let filled = false;
                    // Handle native input
                    if (inputElement instanceof HTMLInputElement && (inputElement.type === 'radio' || inputElement.type === 'checkbox')) {
                        // For radio: check value intent
                        if (inputElement.type === 'radio') {
                            const matchesIntent = (inputElement.value === '1' && shouldCheck) ||
                                (inputElement.value === '0' && !shouldCheck) ||
                                (shouldCheck && ['yes', 'true', '1'].includes(inputElement.value.toLowerCase())) ||
                                (!shouldCheck && ['no', 'false', '0'].includes(inputElement.value.toLowerCase()));
                            if (matchesIntent && !inputElement.checked) {
                                inputElement.click();
                                await domHelpers.delay(50);
                                filled = inputElement.checked;
                            }
                        } else {
                            // For checkbox
                            if (inputElement.checked !== shouldCheck) {
                                inputElement.click();
                                await domHelpers.delay(50);
                                filled = inputElement.checked === shouldCheck;
                            } else {
                                filled = true;
                            }
                        }
                        // Custom SmartRecruit component parent?
                        const customComponent = inputElement.closest('spl-checkbox, spl-radio, oc-checkbox');
                        if (customComponent) {
                            console.log('🔘 Clicking custom SmartRecruit component:', customComponent.tagName);
                            (customComponent as HTMLElement).click();
                            await domHelpers.delay(100);

                            // Try shadowRoot input
                            const shadowInput = customComponent.shadowRoot?.querySelector('input');
                            if (shadowInput instanceof HTMLInputElement) {
                                shadowInput.click();
                                await domHelpers.delay(100);
                                filled = shadowInput.checked === shouldCheck || customComponent.getAttribute('aria-checked') === 'true';
                                console.log('[SR] After shadowInput click:', {
                                    checked: shadowInput.checked,
                                    ariaChecked: customComponent.getAttribute('aria-checked')
                                });
                            }

                            // Try clicking common interactive parts inside shadowRoot
                            const interactiveParts = [
                                '[part="control"]', '.checkbox', 'label', '.spl-checkbox__box', '.oc-checkbox__box', '[role="checkbox"]'
                            ];
                            for (const selector of interactiveParts) {
                                const part = customComponent.shadowRoot?.querySelector(selector);
                                if (part && part instanceof HTMLElement) {
                                    // Try pointer event sequence
                                    ['pointerdown', 'pointerup', 'click'].forEach(evtType => {
                                        part.dispatchEvent(new PointerEvent(evtType, { bubbles: true, composed: true }));
                                    });
                                    await domHelpers.delay(120);
                                    filled = customComponent.getAttribute('aria-checked') === 'true';
                                    console.log(`[SR] After pointer event sequence on shadow part ${selector}:`, {
                                        ariaChecked: customComponent.getAttribute('aria-checked')
                                    });
                                    if (filled) break;
                                }
                            }

                            // If still not filled, log shadow DOM structure for debugging
                            if (!filled && customComponent.shadowRoot) {
                                console.log('[SR] Shadow DOM structure:', customComponent.shadowRoot.innerHTML);
                            }


                            // As a last resort, dispatch a synthetic click event
                            if (!filled) {
                                customComponent.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
                                await domHelpers.delay(100);
                                filled = customComponent.getAttribute('aria-checked') === 'true';
                                console.log('[SR] After dispatching synthetic click:', {
                                    ariaChecked: customComponent.getAttribute('aria-checked')
                                });
                            }
                        }

                        elementFilled = filled;
                    } else if (inputElement instanceof HTMLElement && ['spl-radio', 'spl-checkbox', 'oc-checkbox'].includes(inputElement.tagName.toLowerCase())) {
                        // Handle custom component directly
                        console.log('🔘 Handling custom SmartRecruit component:', inputElement.tagName);
                        let filled = false;
                        // 1. Try shadowRoot input
                        const shadowInput = inputElement.shadowRoot?.querySelector('input');
                        if (shadowInput instanceof HTMLInputElement) {
                            shadowInput.click();
                            await domHelpers.delay(100);
                            filled = shadowInput.checked === shouldCheck || inputElement.getAttribute('aria-checked') === 'true';
                            console.log('[SR] After shadowInput click:', {
                                checked: shadowInput.checked,
                                ariaChecked: inputElement.getAttribute('aria-checked')
                            });
                        }
                        // 2. Try clicking the component itself
                        if (!filled) {
                            inputElement.click();
                            await domHelpers.delay(100);
                            filled = inputElement.getAttribute('aria-checked') === 'true';
                            console.log('[SR] After host click:', { ariaChecked: inputElement.getAttribute('aria-checked') });
                        }
                        // 3. For oc-checkbox: try pointer/click events on .oc-checkbox__box
                        if (!filled && inputElement.tagName.toLowerCase() === 'oc-checkbox' && inputElement.shadowRoot) {
                            const ocBox = inputElement.shadowRoot.querySelector('.oc-checkbox__box');
                            if (ocBox instanceof HTMLElement) {
                                ['pointerdown', 'pointerup', 'click'].forEach(evtType => {
                                    ocBox.dispatchEvent(new PointerEvent(evtType, { bubbles: true, composed: true }));
                                });
                                await domHelpers.delay(120);
                                filled = inputElement.getAttribute('aria-checked') === 'true';
                                console.log('[SR] After pointer/click on .oc-checkbox__box:', { ariaChecked: inputElement.getAttribute('aria-checked') });
                            }
                        }
                        // 4. Log shadow DOM if still not filled
                        if (!filled && inputElement.shadowRoot) {
                            console.log('[SR] Shadow DOM structure (oc-checkbox):', inputElement.shadowRoot.innerHTML);
                        }
                        elementFilled = filled;
                    } else {
                        // Fallback: try to find and click any radio/checkbox input inside
                        const allInputs = findInputInContainer(inputElement);
                        for (const input of allInputs) {
                            if (input instanceof HTMLInputElement && (input.type === 'radio' || input.type === 'checkbox')) {
                                const value = input.value.toLowerCase();
                                const matches = (shouldCheck && ['yes', 'true', '1'].includes(value)) || (!shouldCheck && ['no', 'false', '0'].includes(value));
                                if (matches && !input.checked) {
                                    input.click();
                                    await domHelpers.delay(100);
                                    filled = input.checked;
                                    break;
                                }
                            }
                        }
                        elementFilled = filled;
                    }
                    break;
                }

                case 'text':
                case 'currency':
                    if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
                        // Check if the input element has attributes or classes that suggest it's a dropdown
                        const isDropdownLike = inputElement.classList.contains('c-spl-input') &&
                            (inputElement.hasAttribute('role') && inputElement.getAttribute('role') === 'combobox' ||
                                inputElement.getAttribute('aria-haspopup') === 'listbox' ||
                                inputElement.classList.contains('spl-select-input') ||
                                inputElement.classList.contains('ng-autocomplete') ||
                                inputElement.classList.contains('c-spl-select__input')); // Added specific SmartRecruit dropdown input class

                        console.log(`Debug: Input ID: ${inputElement.id}, isDropdownLike: ${isDropdownLike}`);

                        if (isDropdownLike) {
                            console.log('🔍 Detected dropdown-like input, attempting dropdown handling.');
                            elementFilled = await handleDropdownInput(inputElement, answer);
                            if (!elementFilled) {
                                console.log('⚠️ Dropdown handling failed or was not applicable, falling back to direct input filling.');
                            }
                        }

                        // If not a dropdown-like input or dropdown handling failed, try direct input filling
                        if (!elementFilled) {
                            console.log('📝 Attempting direct input filling.');
                            elementFilled = await fillInputField(inputElement, answer);
                        }
                    } else if (inputElement instanceof HTMLElement &&
                        (inputElement.getAttribute('role') === 'textbox' || inputElement.hasAttribute('contenteditable'))) {
                        // Handle contenteditable elements
                        try {
                            inputElement.scrollIntoView({ behavior: 'auto', block: 'center' });
                            await domHelpers.delay(100);

                            inputElement.focus();
                            inputElement.textContent = '';
                            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                            await domHelpers.delay(50);

                            inputElement.textContent = answer;
                            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                            inputElement.dispatchEvent(new Event('blur', { bubbles: true }));

                            elementFilled = true;
                            console.log(`✅ Filled contenteditable element with: "${answer}"`);
                        } catch (e) {
                            console.error('Error filling contenteditable element:', e);
                        }
                    }
                    break;
                case 'select':
                    // Check if this is actually a checkbox element disguised as select
                    if (inputElement.tagName === 'OC-CHECKBOX' || inputElement.tagName === 'SPL-CHECKBOX') {
                        console.log('🔄 Detected checkbox element in select case, redirecting to checkbox handling...');
                        const shouldCheck = ['yes', 'true', '1', 'checked', 'enable', 'agree', 'accept'].includes(answer.toLowerCase());

                        if (inputElement.tagName === 'OC-CHECKBOX') {
                            await handleOcCheckbox(inputElement as HTMLElement, shouldCheck);
                            elementFilled = inputElement.getAttribute('aria-checked') === 'true';
                        } else if (inputElement.tagName === 'SPL-CHECKBOX') {
                            // Handle SPL-CHECKBOX
                            inputElement.setAttribute('checked', String(shouldCheck));
                            inputElement.setAttribute('aria-checked', String(shouldCheck));
                            (inputElement as any).checked = shouldCheck;

                            // Update form control classes
                            inputElement.classList.remove('ng-untouched', 'ng-pristine', 'ng-invalid');
                            inputElement.classList.add('ng-touched', 'ng-dirty', 'ng-valid');

                            // Find and update inner input if exists
                            const innerInput = inputElement.querySelector('input[type="checkbox"]');
                            if (innerInput) {
                                (innerInput as HTMLInputElement).checked = shouldCheck;
                                innerInput.setAttribute('checked', String(shouldCheck));
                            }

                            // Dispatch events
                            const events = ['mousedown', 'mouseup', 'click', 'change', 'input'];
                            for (const eventType of events) {
                                inputElement.dispatchEvent(new Event(eventType, { bubbles: true }));
                            }

                            elementFilled = true;
                        }

                        console.log(`✅ ${shouldCheck ? 'Checked' : 'Unchecked'} custom checkbox element`);
                    } else if (inputElement instanceof HTMLSelectElement) {
                        const select = inputElement as HTMLSelectElement;

                        // Force click to ensure options are loaded
                        select.click();
                        await domHelpers.delay(300);

                        // Get all options and log them for debugging
                        const options = Array.from(select.options);
                        console.log(`📋 Available options for ${fieldLabel}:`, options.map(o => ({ text: o.text, value: o.value })));

                        // Special handling for language level
                        if (questionLabel.toLowerCase().includes('language') && fieldLabel.toLowerCase().includes('level')) {
                            console.log('🔤 Processing language level dropdown');

                            // Try to find Beginner option first
                            let option = options.find(opt =>
                                opt.text.trim().toLowerCase() === 'beginner' ||
                                opt.value === '0' // Often beginner is value 0
                            );

                            // If no Beginner option, take the first valid option
                            if (!option && options.length > 0) {
                                option = options[0];
                            }

                            if (option) {
                                select.value = option.value;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                elementFilled = true;
                                console.log(`✅ Selected language level: "${option.text}" (value: "${option.value}")`);
                            }
                        } else {
                            // Regular select field handling
                            let option = options.find(opt =>
                                opt.text.trim().toLowerCase() === answer.toLowerCase() ||
                                opt.value.trim().toLowerCase() === answer.toLowerCase()
                            );

                            // Try partial match if no exact match
                            if (!option) {
                                option = options.find(opt =>
                                    opt.text.toLowerCase().includes(answer.toLowerCase()) ||
                                    answer.toLowerCase().includes(opt.text.toLowerCase()) ||
                                    opt.value.toLowerCase().includes(answer.toLowerCase())
                                );
                            }

                            if (option) {
                                select.value = option.value;
                                select.dispatchEvent(new Event('change', { bubbles: true }));
                                elementFilled = true;
                                console.log(`✅ Selected option "${option.text}" (value: "${option.value}") for ${fieldLabel}`);
                            } else {
                                console.log(`❌ No matching option found for: ${answer} in select for field: ${fieldLabel}`);
                                console.log('Available options were:', options.map(o => o.text));
                            }
                        }
                    } else if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLElement) {
                        // Custom dropdown handling for all types
                        let elementFilled = false;

                        // Initial interaction for all dropdowns
                        inputElement.click();
                        await domHelpers.delay(200);
                        inputElement.focus();
                        await domHelpers.delay(200);

                        // Set initial value if it's an input
                        if (inputElement instanceof HTMLInputElement) {
                            const value = questionLabel.toLowerCase().includes('language') &&
                                fieldLabel.toLowerCase().includes('level') ? 'Beginner' : answer;
                            inputElement.value = value;
                            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                        }

                        // Special handling for language level - try to force open dropdown
                        if (questionLabel.toLowerCase().includes('language') && fieldLabel.toLowerCase().includes('level')) {
                            inputElement.dispatchEvent(new KeyboardEvent('keydown', {
                                key: 'ArrowDown',
                                code: 'ArrowDown',
                                bubbles: true
                            }));
                            await domHelpers.delay(300);
                        }

                        // Try to find and interact with dropdown menu
                        const dropdownMenu = document.querySelector('.ng-dropdown-panel-items, .sr-dropdown-content, [role="listbox"], [role="menu"]');
                        if (dropdownMenu) {
                            const elements = dropdownMenu.querySelectorAll('li, [role="option"], div.option, div[class*="option"], div[class*="item"], span[class*="option"]');
                            const options = Array.from(elements) as HTMLElement[];
                            console.log('Found dropdown options:', options.map(opt => opt.textContent));

                            let targetOption: HTMLElement | undefined;

                            if (questionLabel.toLowerCase().includes('language') && fieldLabel.toLowerCase().includes('level')) {
                                // For language level, try to find Beginner first
                                targetOption = options.find(opt =>
                                    opt.textContent?.trim().toLowerCase() === 'beginner'
                                );

                                if (!targetOption) {
                                    // Try alternative language levels in order
                                    const levels = ['basic', 'elementary', 'intermediate', 'advanced', 'fluent', 'native'];
                                    for (const level of levels) {
                                        targetOption = options.find(opt =>
                                            opt.textContent?.trim().toLowerCase().includes(level)
                                        );
                                        if (targetOption) break;
                                    }
                                }

                                if (!targetOption && options.length > 0) {
                                    targetOption = options[0]; // Fallback to first option
                                }
                            } else {
                                // For regular dropdowns, try exact match first
                                targetOption = options.find(opt =>
                                    opt.textContent?.trim().toLowerCase() === answer.toLowerCase()
                                );

                                // Try partial match if no exact match
                                if (!targetOption) {
                                    targetOption = options.find(opt => {
                                        const optText = opt.textContent?.trim().toLowerCase() || '';
                                        const answerLower = answer.toLowerCase();
                                        return optText.includes(answerLower) || answerLower.includes(optText);
                                    });
                                }
                            }

                            // Try to select the option
                            if (targetOption) {
                                try {
                                    targetOption.click();
                                    await domHelpers.delay(300);

                                    // Click outside to close the dropdown
                                    document.body.click();
                                    await domHelpers.delay(100);

                                    // Press Escape key to ensure dropdown is closed
                                    document.dispatchEvent(new KeyboardEvent('keydown', {
                                        key: 'Escape',
                                        code: 'Escape',
                                        bubbles: true
                                    }));
                                    await domHelpers.delay(100);

                                    elementFilled = true;
                                    console.log(`✅ Selected dropdown option: ${targetOption.textContent}`);
                                } catch (e) {
                                    console.log('⚠️ Click failed on dropdown option, using alternative method');
                                    if (inputElement instanceof HTMLInputElement && targetOption.textContent) {
                                        inputElement.value = targetOption.textContent.trim();
                                        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                                        inputElement.dispatchEvent(new Event('change', { bubbles: true }));

                                        // Also try to close dropdown in alternative method
                                        document.body.click();
                                        document.dispatchEvent(new KeyboardEvent('keydown', {
                                            key: 'Escape',
                                            code: 'Escape',
                                            bubbles: true
                                        }));
                                        elementFilled = true;
                                    }
                                }
                            } else {
                                console.log(`❌ No matching option found for: ${answer}`);
                            }
                        } else {
                            console.log('❌ Could not find dropdown menu');
                        }

                        if (elementFilled) {
                            return true;
                        }
                    }
                    break;
                case 'checkbox':
                    const shouldCheck = ['yes', 'true', '1', 'checked', 'enable'].includes(answer.toLowerCase());
                    if (inputElement instanceof HTMLInputElement) {
                        inputElement.checked = shouldCheck;
                        inputElement.dispatchEvent(new Event('click', { bubbles: true }));
                        inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`✅ ${shouldCheck ? 'Checked' : 'Unchecked'} checkbox`);
                        return true;
                    }
                    break;
                default:
                    // Enhanced handling for all other input types
                    if (inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement) {
                        // Check if this might be a dropdown input
                        const isDropdownLike = inputElement.classList.contains('c-spl-input') &&
                            (inputElement.hasAttribute('role') && inputElement.getAttribute('role') === 'combobox' ||
                                inputElement.getAttribute('aria-haspopup') === 'listbox' ||
                                inputElement.classList.contains('spl-select-input') ||
                                inputElement.classList.contains('ng-autocomplete') ||
                                inputElement.classList.contains('c-spl-select__input')); // Added specific SmartRecruit dropdown input class

                        console.log(`Debug: Input ID: ${inputElement.id}, isDropdownLike: ${isDropdownLike}`);

                        if (isDropdownLike) {
                            console.log('🔍 Detected dropdown-like input, attempting dropdown handling.');
                            elementFilled = await handleDropdownInput(inputElement, answer);
                            if (!elementFilled) {
                                console.log('⚠️ Dropdown handling failed or was not applicable, falling back to direct input filling.');
                            }
                        }

                        // If dropdown handling failed or not applicable, use direct filling
                        if (!elementFilled) {
                            console.log('📝 Attempting direct input filling.');
                            elementFilled = await fillInputField(inputElement, answer);
                        }
                    } else if (inputElement instanceof HTMLSelectElement) {
                        // Handle select elements
                        try {
                            inputElement.focus();
                            await domHelpers.delay(100);

                            const options = Array.from(inputElement.options);
                            let targetOption = options.find(opt =>
                                opt.text.trim().toLowerCase() === answer.toLowerCase() ||
                                opt.value.toLowerCase() === answer.toLowerCase()
                            );

                            // Try partial match if exact match not found
                            if (!targetOption) {
                                targetOption = options.find(opt =>
                                    opt.text.toLowerCase().includes(answer.toLowerCase()) ||
                                    answer.toLowerCase().includes(opt.text.toLowerCase())
                                );
                            }

                            if (targetOption) {
                                inputElement.value = targetOption.value;
                                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                                inputElement.dispatchEvent(new Event('blur', { bubbles: true }));
                                elementFilled = true;
                                console.log(`✅ Selected option: "${targetOption.text}"`);
                            } else {
                                console.warn(`⚠️ No matching option found for: "${answer}"`);
                            }
                        } catch (e) {
                            console.error('Error handling select element:', e);
                        }
                    }
                    break;
            }

            if (elementFilled) {
                console.log(`✅ Filled field "${fieldLabel}" with value: ${answer}`);
                return true;
            } else {
                console.warn(`❌ Could not fill field "${fieldLabel}" with answer: ${answer}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error processing field element "${fieldLabel}":`, error);
            return false;
        }
    }

    async function fillWithRetry(
      questionContainer: HTMLElement,
      fieldLabel: string,
      answer: string,
      fieldType: string,
      fieldName: string,
      questionLabel: string,
      maxRetries = 3,
      initialDelay = 200
    ): Promise<boolean> {
      let retries = 0;
      let delay = initialDelay;
      
      while (retries < maxRetries) {
        const success = await fillField(questionContainer, fieldLabel, answer, fieldType, fieldName, questionLabel);
        if (success) return true;
        
        retries++;
        delay *= 2; // Exponential backoff
        console.log(`⚠️ Retry ${retries}/${maxRetries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return false;
    }

    // First, log all questions for debugging
    console.log('📝 Questions to process:', questions.map(q => ({
      label: q.label,
      fields: q.questionsFields.map(f => ({ label: f.label, type: f.type, name: f.name }))
    })));

    for (const question of questions) {
      console.log(`\n🔍 Processing question: "${question.label}"`);
      
      // Try to find the question container
      let questionContainer = findQuestionContainer(question.label);
      
      // Special handling for salary expectations
      if (!questionContainer && question.label.toLowerCase().includes('salary')) {
        questionContainer = document.querySelector('[data-qa="salary-input"]') ||
                          document.querySelector('[aria-label*="salary"]') ||
                          document.querySelector('[name*="salary"]');
      }
      
      // Special handling for join date
      if (!questionContainer && question.label.toLowerCase().includes('join')) {
        questionContainer = document.querySelector('[data-qa="availability-input"]') ||
                          document.querySelector('[aria-label*="join"]') ||
                          document.querySelector('[name*="join"]');
      }
      
      // If not found, try searching with just the first few words
      if (!questionContainer) {
        const firstFewWords = question.label.split(/\s+/).slice(0, 3).join(' ');
        console.log(`⚠️ Trying with first few words: "${firstFewWords}"`);
        questionContainer = findQuestionContainer(firstFewWords);
      }

      // If still not found, try the form element itself
      if (!questionContainer) {
        questionContainer = document.querySelector('sr-screening-questions-form');
        if (questionContainer) {
          console.log('⚠️ Falling back to form element as container');
        }
      }

      if (!questionContainer) {
        console.warn(`❌ Could not find container for question: "${question.label}"`);
        continue;
      }

      console.log(`✅ Found container for question: "${question.label}"`);

      // Process each field in the question (except checkboxes)
      for (const field of question.questionsFields) {
        // Skip checkbox fields for now
        if (field.type.toLowerCase() === 'checkbox') {
          console.log(`⏭️ Skipping checkbox field "${field.label}" for now...`);
          continue;
        }

        console.log(`\n📝 Processing field: "${field.label}" (type: ${field.type})`);
        
        // Get the answer for this field
        const answer = getAnswer(field.label, question.label);
        if (answer === null) {
          console.warn(`❓ No answer rule for field: "${field.label}" in question: "${question.label}"`);
          continue;
        }

        console.log(`✨ Got answer: "${answer}" for field: "${field.label}"`);

        // Try to fill the field
        const filled = await fillWithRetry(questionContainer, field.label, answer, field.type, field.name, question.label);
        if (!filled) {
          console.warn(`❌ Could not fill field: "${field.label}" in question: "${question.label}"`);
        } else {
          console.log(`✅ Filled "${field.label}" with "${answer}"`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay between fields
      }
      await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay between questions
    }

    // Now that all other fields are filled, process checkboxes
    console.log("\n🔍 Now processing all checkboxes...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Give time for any field-related updates to settle
    await fillAllCheckboxes();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for checkbox updates to complete

    console.log("✅ Preliminary questions and checkboxes filled.");
  } catch (error) {
    console.error('❌ Error parsing screening questions definition or filling form:', error);
  }
};

/**
 * Helper function to find the container element for a given question label.
 * Uses multiple search strategies to locate questions.
 * @param {string} questionText - The text of the question to search for.
 * @returns {HTMLElement|null} - The container element for the question, or null if not found.
 */
function findQuestionContainer(questionText: string): HTMLElement | null {
  console.log(`🔍 Searching for question container with text: "${questionText}"`);
  
  const searchText = questionText.toLowerCase().trim();
  
  // Strategy 1: Try to find the exact question in a data-test attribute
  const form = document.querySelector('sr-screening-questions-form');
  if (form) {
    const directMatch = Array.from(form.querySelectorAll('[data-test], [data-testid]')).find(el => 
      el.textContent?.toLowerCase().trim() === searchText
    );
    if (directMatch) {
      const container = directMatch.closest('[class*="question"], [class*="form-group"], [class*="field-group"]');
      if (container) {
        console.log('✅ Found container via direct data-test match:', container);
        return container as HTMLElement;
      }
    }
  }

  // Strategy 2: Look for the question label in SmartRecruit's typical structure
  const possibleSelectors = [
    'label',
    '.question-label',
    '.field-label',
    'h3',
    'h4',
    'h5',
    'p',
    '.question-title',
    '.question-text',
    '[data-testid*="question"]',
    '[data-test*="question"]',
    '.sr-question',
    '.screening-question',
    '.form-question',
    '.question-wrapper',
    '.field-wrapper',
    'legend',
    '.input-label',
    '.form-group',
    '.field-group'
  ];
  
  // Strategy 2: Search within the screening form specifically
  const screeningForm = document.querySelector('sr-screening-questions-form');
  if (screeningForm) {
    // Look for text within the screening form
    const searchInElement = (element: HTMLElement): HTMLElement | null => {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            return node.textContent?.toLowerCase().includes(searchText) ? 
              NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      let node;
      while (node = walker.nextNode()) {
        const parentElement = node.parentElement;
        if (parentElement) {
          return parentElement.closest('.question-container, .field-container, .form-group, .input-group, [class*="question"]') || parentElement;
        }
      }
      return null;
    };
    
    const found = searchInElement(screeningForm as HTMLElement);
    if (found) {
      console.log(`✅ Found container via screening form search:`, found);
      return found;
    }
  }
  
  // Strategy 3: Comprehensive search in all containers
  for (const selector of possibleSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (element.textContent?.toLowerCase().includes(searchText)) {
        const container = element.closest('.question-container, .field-container, .form-group, .input-group, [class*="question"], [class*="field"]') as HTMLElement | null;
        if (container) {
          console.log(`✅ Found container via selector: ${selector}`, container);
          return container;
        } else {
          const parentElement = element.parentElement;
          if (parentElement) {
            return parentElement as HTMLElement;
          }
        }
      }
    }
  }

  // Strategy 4: Broad text search with fuzzy matching
  const allElements = document.querySelectorAll('*');
  for (const element of allElements) {
    const text = element.textContent?.toLowerCase() || '';
    // Allow partial matches and handle variations
    if (text.includes(searchText) || searchText.includes(text) || 
        text.replace(/[^a-z0-9]/g, '').includes(searchText.replace(/[^a-z0-9]/g, ''))) {
      const container = element.closest('[class*="question"], [class*="field"], [class*="input"], [data-testid]') as HTMLElement | null;
      if (container) {
        console.log(`✅ Found container via fuzzy search:`, container);
        return container;
      } else {
        const parentElement = element.parentElement;
        if (parentElement) {
          const closestParent = parentElement.closest('[class*="question"], [class*="field"]');
          if (closestParent) {
            return closestParent as HTMLElement;
          } else {
            return parentElement as HTMLElement;
          }
        }
      }
    }
  }

  // Strategy 5: Search in shadow DOM
  const searchShadowDOM = (root: Document | ShadowRoot): HTMLElement | null => {
    const elements = root.querySelectorAll('*');
    for (const element of elements) {
      if (element.textContent?.toLowerCase().includes(searchText)) {
        const closestElement = element.closest('[class*="question"], [class*="field"]');
        if (closestElement) {
          return closestElement as HTMLElement;
        } else {
          const parentElement = element.parentElement;
          if (parentElement) {
            return parentElement as HTMLElement;
          }
        }
      }
      if (element.shadowRoot) {
        const found = searchShadowDOM(element.shadowRoot);
        if (found) return found;
      }
    }
    return null;
  };
  
  const shadowResult = searchShadowDOM(document);
  if (shadowResult) {
    console.log(`✅ Found container via shadow DOM search:`, shadowResult);
    return shadowResult;
  }
  
  console.log(`❌ No container found for question: ${questionText}`);
  return null;
}
