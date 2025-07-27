export function findElementByText(searchText: string, rootElement: Element): Element | null {
    const lowerSearchText = searchText.toLowerCase();
    const textSegments = (rootElement as HTMLElement).innerText.split("\n");
    const nonEmptyTextSegments = textSegments.filter((segment) => segment.trim() !== "");
    
    const isTextFound = nonEmptyTextSegments.some((segment) =>
      segment.toLowerCase().includes(lowerSearchText)
    );
  
    if (!isTextFound) {
      return null;
    } else if (isTextFound && rootElement.childElementCount < 1) {
      return rootElement;
    } else if (isTextFound && rootElement.childElementCount >= 1) {
      for (const child of Array.from(rootElement.children)) {
        const foundElement = findElementByText(searchText, child);
        if (foundElement) {
          return foundElement;
        }
      }
    }
    return null;
  }
  
  export function findAllButtonsInParent(element: Element, parentTagName: string = "DIV"): NodeListOf<HTMLButtonElement> | null {
    let currentElement: Element | null = element;
    let parentElement: HTMLElement | null = null;
  
    while (currentElement) {
      if (currentElement.parentElement && currentElement.parentElement.tagName === parentTagName.toUpperCase()) {
        parentElement = currentElement.parentElement as HTMLElement;
        break;
      }
      currentElement = currentElement.parentElement;
    }
  
    if (!parentElement) {
      return null;
    }
  
    return parentElement.querySelectorAll<HTMLButtonElement>("button");
  }
  
  export function programmaticallyClickButtons(timesToClick: number, button: HTMLButtonElement, callback?: () => void) {
    if (timesToClick <= 0) {
      if (callback) {
        callback();
      }
      return;
    }
  
    button.click();
    
    setTimeout(() => {
      programmaticallyClickButtons(timesToClick - 1, button, callback);
    }, 1000);
  }