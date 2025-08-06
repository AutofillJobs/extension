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

    // checkStability();

    // const observer = new MutationObserver(() => {
    //   checkStability();
    // });

    // observer.observe(document.body, {
    //   childList: true,
    //   subtree: true,
    //   attributes: true,
    //   characterData: true
    // });

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

export async function saveInteractiveElements(input: number): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['interactiveElements', 'formData'], async (result) => {
      try {
        if (chrome.runtime.lastError) {
          console.log('Error accessing local storage: ' + chrome.runtime.lastError.message);
          resolve();
          return;
        }

        // Get current local count or initialize to 0
        let localCount = typeof result.interactiveElements === 'number' ? result.interactiveElements : 0;
        const updatedCount = localCount + input;
        
        // Get user data from local storage
        const formData = result.formData;
        const data: UserData = typeof formData === 'string' ? JSON.parse(formData) : formData;
        const primaryEmail = data?.data?.details?.email;
        const username = data?.data?.details?.name || 
                        data?.data?.details?.firstName + ' ' + data?.data?.details?.lastName;
        console.log(`Primary email: ${primaryEmail}, Username: ${username}`);
        // Check if we have enough user data to proceed
        if (!primaryEmail) {
          console.log('User email missing in local storage. Cannot proceed.');
          resolve();
          return;
        }

        // Check if user exists in cloud
        let userExist = await backendService.findUserByEmail(primaryEmail);
        console.log('User number of application:', userExist.user['number of applications']);
        if (!userExist.success) {
          console.log('Error checking user existence: ' + userExist.error);
          resolve();
          return;
        }

        // If user doesn't exist, create them
        if (userExist.success && !userExist.user) {
          if (!username) {
            console.log('User name missing. Cannot create user.');
            resolve();
            return;
          }

          const newUserPayload: UserDataPayload = {
            email: primaryEmail,
            password: 'default123',
            address: data?.data?.details?.address1 || data?.data?.details?.address2 || "No address"
          };

          const createResult = await backendService.createUser(newUserPayload);
          if (!createResult.success) {
            console.log('Failed to create user: ' + createResult.error);
            resolve();
            return;
          }
          
          // Refresh user data after creation
          userExist = await backendService.findUserByEmail(primaryEmail);
        }

        // At this point, user should exist
        if (userExist.success && userExist.user) {
          const userId = userExist.user._id;
          let cloudAppCount = userExist.user["number of applications"] || 0;
          // Update local storage with new count
          await chrome.storage.local.set({ interactiveElements: updatedCount });
          console.log(`Local count updated: ${localCount} + ${input} = ${updatedCount}`);

          // Check if we've reached threshold for cloud update
          if (updatedCount >= 20) {
            // Calculate total new count (current cloud + updatedCount)
            const newAppCount = cloudAppCount + updatedCount;
            
            // Show warning if exceeding 100, but still update
            if (newAppCount > 100) {
              console.log('Warning: Application count exceeds 100 (Total: ' + newAppCount + ')');
            }

            const updateResult = await backendService.patchUser(userId, {
              "number of applications": newAppCount
            });

            if (updateResult.success) {
              console.log(`🎉 Cloud updated: ${cloudAppCount} → ${newAppCount}`);
              // Reset local count after successful cloud update
              await chrome.storage.local.set({ interactiveElements: 0 });
            } else {
              console.log('Failed to update cloud count: ' + updateResult.error);
            }
          }
        } else {
          console.log('Unexpected error: User not found after creation attempt');
        }
        
        resolve();
      } catch (error) {
        console.log('Unexpected error in saveInteractiveElements: ' + (error instanceof Error ? error.message : String(error)));
        resolve();
      }
    });
  });
}

// export async function saveInteractiveElements(input: number): Promise<void> {
//   return new Promise((resolve) => {
//     chrome.storage.local.get(['interactiveElements', 'formData'], async (result) => {
//       try {
//         if (chrome.runtime.lastError) {
//           alert('Error accessing local storage:', chrome.runtime.lastError);
//           resolve();
//           return;
//         }

//         const previousCount = typeof result.interactiveElements === 'number' ? result.interactiveElements : 0;
//         const updatedCount = previousCount + input;

//         await chrome.storage.local.set({ interactiveElements: updatedCount }, async () => {
//           alert(`✅ Updated count: ${previousCount} + ${input} = ${updatedCount}`);

//           if (updatedCount >= 20) {
//             const formData = result.formData;
//             const data: UserData = typeof formData === 'string' ? JSON.parse(formData) : formData;
//             const primaryEmail = data?.data?.details?.email;
//             const username = data?.data?.details?.name;

//             if (!primaryEmail) {
//               console.warn('No email found. Skipping user update.');
//               resolve();
//               return;
//             }

//             let userExist = await backendService.findUserByEmail(primaryEmail);
//             alert(JSON.stringify(userExist.user));
//             if (userExist.success && !userExist.user) {
//               // ✅ User does not exist — try to create
//               if (!username) {
//                 console.warn('User name missing. Cannot create user.');
//                 resolve();
//                 return;
//               }

//               const newUserPayload: UserDataPayload = {
//                 email: primaryEmail,
//                 password: 'default123',
//                 address: data?.data?.details?.address1 || "No address"
//               };

//               const createResult = await backendService.createUser(newUserPayload);
//               if (createResult.success) {
//                 alert(`User created with ID: ${createResult.id}`);
//                 // After creating, re-fetch user data to get ID and update count
//                 userExist = await backendService.findUserByEmail(primaryEmail);
//               } else {
//                 alert(`Failed to create user: ${createResult.error}`);
//                 resolve();
//                 return;
//               }
//             }

//             if (userExist.success && userExist.user) {
//               const userId = userExist.user._id;
//               let cloudAppCount = userExist.user["number of applications"];
//               alert(cloudAppCount)
//               if (cloudAppCount === undefined || cloudAppCount === null) {
//                 cloudAppCount = 0;
//               }

//               if (cloudAppCount >= 100) {
//                 alert('Maximum application field reached: ' + cloudAppCount);
//                 resolve();
//                 return;
//               }

//               let newAppCount = cloudAppCount + updatedCount;

//               if (newAppCount > 100) {
//                 newAppCount = 100;
//               }

//               const updateResult = await backendService.patchUser(userId, {
//                 "number of applications": newAppCount
//               });

//               if (updateResult.success) {
//                 console.log(`🎉 Cloud updated: ${cloudAppCount} → ${newAppCount}`);
//                 // Reset local count
//                 chrome.storage.local.set({ interactiveElements: 0 }, () => {
//                   console.log("✅ Local interactiveElements reset to 0");
//                   resolve();
//                 });
//               } else {
//                 alert(`Failed to update user: ${updateResult.error}`);
//                 resolve();
//               }

//             } else {
//               alert(`Error: ${userExist.error}`);
//               resolve();
//             }
//           } else {
//             resolve(); // Nothing more to do if < 20
//           }
//         });
//       } catch (error) {
//         console.error("Unexpected error in saveInteractiveElements:", error);
//         resolve();
//       }
//     });
//   });
// }


// async function updateCount(): Promise<void> {
//   return new Promise((resolve) => {
//     chrome.storage.local.get(['formData'], async (result) => {
//       try {
//         if (chrome.runtime.lastError) {
//           console.error('Error getting data:', chrome.runtime.lastError);
//           resolve();
//           return;
//         }

//         const formData = result.formData;
//         if (!formData) {
//           console.log('No formData found');
//           resolve();
//           return;
//         }

//         const data: UserData = typeof formData === 'string' ? JSON.parse(formData) : formData;
//         const primaryEmail = data?.data?.details?.email;

//         if (!primaryEmail) {
//           console.log('Email not found in formData');
//           resolve();
//           return;
//         }

//         alert(`User email: ${primaryEmail}`);

//         const userExist = await backendService.findUserByEmail(primaryEmail);

//         if (userExist.success && userExist.user) {
//           // ✅ User exists — update "number of applications"
//           alert(`User with email ${primaryEmail} exists.`);
//           const userId = userExist.user._id;

//           const updateResult = await backendService.patchUser(userId, {
//             "number of applications": 10
//           });

//           if (updateResult.success) {
//             alert(`User with email ${primaryEmail} updated successfully.`);
//           } else {
//             alert(`Failed to update user: ${updateResult.error}`);
//           }

//         } else if (userExist.success && !userExist.user) {
//           // 🚨 User not found — create new user from local storage
//           alert(`User with email ${primaryEmail} does not exist.`);

//           const details = data?.data?.details;
//           if (!details) {
//             alert("No valid user details found in local storage.");
//             resolve();
//             return;
//           }

//           const newUserPayload: UserDataPayload = {
//             email: primaryEmail,
//             password: "default123",
//             address: details.address1 || "No address provided"
//           };

//           const createResult = await backendService.createUser(newUserPayload);

//           if (createResult.success) {
//             alert(`User created successfully with ID: ${createResult.id}`);
//           } else {
//             alert(`Failed to create user: ${createResult.error}`);
//           }

//         } else {
//           //  Backend error
//           alert(`Error: ${userExist.error}`);
//         }

//         resolve();
//       } catch (error) {
//         console.error('Error processing user data:', error);
//         resolve();
//       }
//     });
//   });
// }


// export async function saveInteractiveElements(input: number): Promise<void> {
//   return new Promise((resolve) => {
//     chrome.storage.local.get(['interactiveElements'], (result) => {
//       if (chrome.runtime.lastError) {
//         console.error('Error getting count:', chrome.runtime.lastError);
//         resolve();
//         return;
//       }

//       const previousCount = typeof result.interactiveElements === 'number' 
//         ? result.interactiveElements 
//         : 0;
//       const updatedCount = previousCount + input;

//       chrome.storage.local.set({ interactiveElements: updatedCount }, async () => {
//         if (chrome.runtime.lastError) {
//           console.error('Error saving count:', chrome.runtime.lastError);
//         } else {
//           console.log(`✅ Updated count: ${previousCount} + ${input} = ${updatedCount}`);
//           if (updatedCount > 20) {
//             await updateCount();
//           }
//         }
//         resolve();
//       });
//     });
//   });
// }


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

  // usableElements.forEach((element, index) => {
  //   element.style.border = '2px solid #4CAF50';
  //   element.style.boxShadow = '0 0 0 2px rgba(76, 175, 80, 0.3)';
  //   element.dataset.inputDetected = 'true';
  //   // console.log(`Found input #${index + 1}:`, element);
  // });

  console.log(`✅ Found ${usableElements.length} usable input fields`);
  return usableElements;
}
