import { 
  mapDetailRegex, 
  selectInputRegex, 
  radioInputRegex, 
  dateInputRegex 
} from './regexPatterns';

export function fillDetails(userDetails: any, regexMap: any) {
  if (!userDetails || !regexMap) {
    console.error("Invalid parameters provided to fillDetails");
    return;
  }

  const inputElements = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea");
  const selectFields = document.querySelectorAll<HTMLSelectElement>("select");
  console.log("Fields found:", inputElements.length + selectFields.length);
  
  const filledFields: any = {};
  const fieldMappings: any = {};

  function getTextLines(element: Element): string[] {
    let lines: string[] = [];
    let currentLine = "";

    function traverse(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        currentLine += node.textContent?.trim() || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (["DIV", "P", "LABEL", "H1", "H2", "H3", "H4", "H5", "H6"].includes((node as Element).tagName)) {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = "";
          }
          Array.from(node.childNodes).forEach(traverse);
        } else {
          Array.from(node.childNodes).forEach(traverse);
        }
      }
    }

    traverse(element);

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  const fillInputField = (userDetails: any, regexMap: any) => {
    inputElements.forEach((input, index) => {
      let matchFound = false;
      let matchedKey = null;

      if (input.value) {
        return;
      }

      for (let key in regexMap) {
        if (matchFound) break;

        const attributesToCheck = ["name", "id", "class", "title", "placeholder"];
        attributesToCheck.some((attr) => {
          const value = input.getAttribute(attr);
          if (value && regexMap[key].test(value)) {
            matchFound = true;
            matchedKey = key;
            return true;
          }
          return false;
        });

        if (!matchFound && input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label && regexMap[key].test(label.textContent || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      if (!matchFound) {
        let parentElement = input.parentElement;
        while (!matchFound && parentElement) {
          const lines = getTextLines(parentElement);
          if (lines.length > 2) break;

          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              matchFound = true;
              matchedKey = key;
              break;
            }
          }

          parentElement = parentElement.parentElement;
        }
      }

      if (matchFound && matchedKey && userDetails[matchedKey]) {
        input.value = userDetails[matchedKey];
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        filledFields[matchedKey] = userDetails[matchedKey];
        fieldMappings[matchedKey] = { index: index };
        delete userDetails[matchedKey];
      }
    });
  };

  fillInputField(userDetails, regexMap);

  const isEmptyObject = (obj: any) => {
    return Object.keys(obj).length === 0;
  };
  
  if (!isEmptyObject(fieldMappings)) {
    localStorage.setItem('fieldMappings', JSON.stringify(fieldMappings));
    console.log('Field mappings saved to localStorage:', fieldMappings);
  }

  const fillSelectField = (userDetails: any, regexMap: any) => {
    const selectElements = document.querySelectorAll<HTMLSelectElement>('select, [role="option"], [role="listbox"], [role="generic"]');
    
    selectElements.forEach((select) => {
      let matchFound = false;
      let matchedKey = null;

      for (let key in regexMap) {
        if (matchFound) break;

        const attributesToCheck = ["name", "id", "class", "title", "placeholder"];
        attributesToCheck.some((attr) => {
          const value = select.getAttribute(attr);
          if (value && regexMap[key].test(value)) {
            matchFound = true;
            matchedKey = key;
            return true;
          }
          return false;
        });

        if (!matchFound && select.id) {
          const label = document.querySelector(`label[for="${select.id}"]`);
          if (label && regexMap[key].test(label.textContent || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      if (!matchFound) {
        let parentElement = select.parentElement;
        while (!matchFound && parentElement) {
          const lines = getTextLines(parentElement);
          if (lines.length > 2) break;

          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              matchFound = true;
              matchedKey = key;
              break;
            }
          }

          parentElement = parentElement.parentElement;
        }
      }

      if (matchFound && matchedKey && userDetails[matchedKey]) {
        const selectValue = userDetails[matchedKey];
        Array.from(select.options).forEach((option) => {
          if (option.text === selectValue || option.value === selectValue) {
            select.value = option.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            select.dispatchEvent(new Event("input", { bubbles: true }));
            filledFields[matchedKey] = userDetails[matchedKey];
          }
        });
      }
    });
  };
  
  fillSelectField(userDetails, selectInputRegex);

  const fillRadioButton = (userDetails: any, regexMap: any) => {
    const radioButtons = document.querySelectorAll<HTMLInputElement>("input[type='radio']");

    radioButtons.forEach((radio) => {
      let matchFound = false;
      let matchedKey = null;
      const radioValue = radio.value || "";

      for (let key in regexMap) {
        if (regexMap[key].test(radioValue.toLowerCase())) {
          matchedKey = key;
          matchFound = true;
          break;
        }
      }

      if (matchFound && matchedKey && userDetails[matchedKey]) {
        if (userDetails[matchedKey].toLowerCase() === radioValue.toLowerCase()) {
          radio.checked = true;
          radio.dispatchEvent(new Event("change", { bubbles: true }));
          filledFields[matchedKey] = userDetails[matchedKey];
        }
      }
    });
  };

  fillRadioButton(userDetails, radioInputRegex);

  const fillDateField = (userDetails: any, regexMap: any) => {
    const dateInputs = document.querySelectorAll<HTMLInputElement>("input[type='date']");

    dateInputs.forEach((input) => {
      let matchFound = false;
      let matchedKey = null;

      for (let key in regexMap) {
        if (matchFound) break;

        const attributesToCheck = ["name", "id", "class", "title", "placeholder"];
        attributesToCheck.some((attr) => {
          const value = input.getAttribute(attr);
          if (value && regexMap[key].test(value)) {
            matchFound = true;
            matchedKey = key;
            return true;
          }
          return false;
        });

        if (!matchFound && input.id) {
          const label = document.querySelector(`label[for="${input.id}"]`);
          if (label && regexMap[key].test(label.textContent?.trim() || "")) {
            matchFound = true;
            matchedKey = key;
          }
        }
      }

      if (!matchFound) {
        let parentElement = input.parentElement;
        while (!matchFound && parentElement) {
          const lines = getTextLines(parentElement);
          if (lines.length > 2) break;

          for (let key in regexMap) {
            const lineMatch = lines.find((line) => regexMap[key].test(line));
            if (lineMatch) {
              matchFound = true;
              matchedKey = key;
              break;
            }
          }

          parentElement = parentElement.parentElement;
        }
      }

      if (matchFound && matchedKey && userDetails[matchedKey]) {
        input.value = userDetails[matchedKey];
        input.dispatchEvent(new Event("change", { bubbles: true }));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        filledFields[matchedKey] = userDetails[matchedKey];
      }
    });
  };

  fillDateField(userDetails, dateInputRegex);
  
  console.log("All filled fields:", filledFields);

  if (Object.keys(filledFields).length > 0) {
    chrome.runtime.sendMessage({ action: 'filledFields', data: filledFields });
  }
}