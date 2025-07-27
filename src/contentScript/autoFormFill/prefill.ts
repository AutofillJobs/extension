export function prefill() {
    const inputFields = document.querySelectorAll<HTMLInputElement>("input");
  
    inputFields.forEach((input) => {
      if (!input.classList.contains('css-77hcv')) {
        input.value = "";
      }
    });
  
    document
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((checkbox) => {
        checkbox.checked = true;
      });
  
    document.querySelectorAll("select").forEach((select) => {
      select.selectedIndex = 0;
    });
  
    document.querySelectorAll("form").forEach((form) => {
      form.reset();
    });
  
    // Note: checkInputFields is called from initializeFormFiller to avoid circular dependency
  }