// personalInfo.ts

// Helper to fill text input
function setInputValue(selector: string, value?: string) {
  const input = document.querySelector<HTMLInputElement>(selector);
  if (input) {
    input.value = value || "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

// Helper to select a dropdown option
function setSelectValue(selector: string, value?: string) {
  const select = document.querySelector<HTMLSelectElement>(selector);
  if (!select) return;
  const targetValue = value || "";
  const matchedOption = Array.from(select.options).find(
    (option) =>
      option.value.toLowerCase() === targetValue.toLowerCase() ||
      option.textContent?.trim().toLowerCase() === targetValue.toLowerCase()
  );
  if (matchedOption) {
    select.value = matchedOption.value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

// Main autofill function
export default function fillPersonalInfo(details: any) {
  // Fill basic fields
  setInputValue("input[id$='cs_candidate_personal_info_FirstName']", details.firstName);
  setInputValue("input[id$='cs_candidate_personal_info_MiddleInitial']", details.middleName);
  setInputValue("input[id$='cs_candidate_personal_info_LastName']", details.lastName);
  setSelectValue("select[id$='cs_candidate_personal_info_PreferredPhone']", details.phoneType || "Cellular Phone");
  setInputValue("input[id$='cs_candidate_personal_info_HomePhone']", details.phoneNumber);
  setInputValue("input[id$='cs_candidate_personal_info_MobilePhone']", details.phoneNumber);
  setInputValue("input[id$='cs_candidate_personal_info_ZipCode']", details.zip);
  setInputValue("input[id$='cs_candidate_personal_info_EmailAddress']", details.email);
  setSelectValue("select[id$='cs_candidate_personal_info_UDFCandidatePersonalInfo_LBL_HIGH_LVL_EDU']", details.highestEducation || "G-Bachelor's Level Degree");

  // --- Detect which section is present ---
if (document.querySelector("select[id$='olfJobField-menuHierarchy_jobfield_selector-0']")) {
  // --- Job Field (Employment Preferences) ---
  const jobFieldName = (details.jobField || "Information Technology").toLowerCase();

  const jobFieldSelect = document.querySelector<HTMLSelectElement>(
    "select[id$='olfJobField-menuHierarchy_jobfield_selector-0']"
  );
  const option = Array.from(jobFieldSelect.options).find(
    (opt) => opt.textContent?.trim().toLowerCase() === jobFieldName
  );
  if (!option) {
    console.warn(`[PersonalInfo] Option '${jobFieldName}' not found in job field dropdown.`);
    return;
  }

  // Check if job field is already in the list
  const jobFieldInList = Array.from(
    document.querySelectorAll("span[id*='-olfJobField-iterate_jobfield-'][id$='-outputText_jobfieldChildrenTitle']")
  ).find(
    (el) => el.textContent?.trim().toLowerCase() === jobFieldName
  );

  const saveContinueBtn = document.querySelector<HTMLInputElement>(
    "input[id='et-ef-content-ftf-saveContinueCmdBottom']"
  );

  if (jobFieldInList) {
    if (saveContinueBtn) {
      saveContinueBtn.click();
      console.log("[PersonalInfo] Job field already present. Save and Continue clicked.");
    } else {
      console.warn("[PersonalInfo] Save and Continue button not found.");
    }
    return;
  }

  // Not present, so select and add
  jobFieldSelect.value = option.value;
  jobFieldSelect.dispatchEvent(new Event("change", { bubbles: true }));

  const addButton = document.querySelector<HTMLInputElement>(
    "input[id$='-olfJobField-commandButton_addJobField']"
  );
  if (!addButton) {
    console.warn("[PersonalInfo] Add to List button not found.");
    return;
  }
  addButton.click();

  // Wait for the field to appear in the list (poll every 500ms, max 10 tries)
  let tries = 0;
  const maxTries = 10;
  const checkInterval = setInterval(() => {
    tries++;
    const jobFieldInListNow = Array.from(
      document.querySelectorAll("span[id*='-olfJobField-iterate_jobfield-'][id$='-outputText_jobfieldChildrenTitle']")
    ).find(
      (el) => el.textContent?.trim().toLowerCase() === jobFieldName
    );

    if (jobFieldInListNow) {
      clearInterval(checkInterval);
      if (saveContinueBtn) {
        saveContinueBtn.click();
        console.log("[PersonalInfo] Job field added and Save and Continue clicked.");
      } else {
        console.warn("[PersonalInfo] Save and Continue button not found.");
      }
    } else if (tries >= maxTries) {
      clearInterval(checkInterval);
      console.warn("[PersonalInfo] Job field did not appear in the list in time.");
    }
  }, 500);

} else if (document.querySelector("select[id$='olfLocation-menuHierarchy_location_selector-0']")) {
  // --- Job Location ---
  const location1 = (details.location1 || "California").toLowerCase();
  const location2 = (details.location2 || "Bay Area").toLowerCase();

  const locationSelect1 = document.querySelector<HTMLSelectElement>(
    "select[id$='olfLocation-menuHierarchy_location_selector-0']"
  );
  const addLocationButton = document.querySelector<HTMLInputElement>(
    "input[id$='olfLocation-niceCommandButton_addLocation']"
  );
  const saveContinueButtonLocation = document.querySelector<HTMLInputElement>(
    "input[id='et-ef-content-ftf-saveContinueCmdBottom']"
  );

  const isLocationInList = () => Array.from(
    document.querySelectorAll("span[id*='iterate_locations-'][id$='-outputText_locationChildrenTitle']")
  ).some((el) => el.textContent?.trim().toLowerCase() === location2);

  if (isLocationInList()) {
    if (saveContinueButtonLocation) {
      saveContinueButtonLocation.click();
      console.log("[PersonalInfo] Location already present. Save and Continue clicked.");
    } else {
      console.warn("[PersonalInfo] Save and Continue button not found.");
    }
  } else if (locationSelect1 && addLocationButton && !addLocationButton.dataset.clicked) {
    const topMatch = Array.from(locationSelect1.options).find(
      (opt) =>
        opt.textContent?.trim().toLowerCase() === location1 ||
        opt.value.toLowerCase().includes(location1)
    );
    if (topMatch) {
      locationSelect1.value = topMatch.value;
      locationSelect1.dispatchEvent(new Event("change", { bubbles: true }));

      setTimeout(() => {
        const subLocationSelect = document.querySelector<HTMLSelectElement>(
          "select[id$='olfLocation-menuHierarchy_location_selector-1']"
        );
        if (subLocationSelect) {
          const subMatch = Array.from(subLocationSelect.options).find(
            (opt) =>
              opt.textContent?.trim().toLowerCase() === location2 ||
              opt.value.toLowerCase().includes(location2)
          );
          if (subMatch) {
            subLocationSelect.value = subMatch.value;
            subLocationSelect.dispatchEvent(new Event("change", { bubbles: true }));
            addLocationButton.dataset.clicked = "true";
            addLocationButton.click();
            setTimeout(() => {
              if (saveContinueButtonLocation) {
                saveContinueButtonLocation.click();
                console.log("[PersonalInfo] Location added and Save and Continue clicked.");
              } else {
                console.warn("[PersonalInfo] Save and Continue button not found.");
              }
            }, 500);
          } else {
            console.warn(`[PersonalInfo] Sub-location '${location2}' not found.`);
          }
        } else {
          console.warn("[PersonalInfo] Sub-location dropdown not found.");
        }
      }, 1500);
    } else {
      console.warn(`[PersonalInfo] Location '${location1}' not found in dropdown.`);
    }
  }

} else if (document.querySelector("select[id$='olfOrganization-menuHierarchy_organization_selector-0']")) {
  // --- Organization ---
  const organization = (details.organization || "CS-Computing Sciences").toLowerCase();
  const orgSelect = document.querySelector<HTMLSelectElement>("select[id$='olfOrganization-menuHierarchy_organization_selector-0']");
  const addOrganizationButton = document.querySelector<HTMLInputElement>("input[id$='olfOrganization-niceCommandButton_addOrganization']");
  const saveContinueButtonOrg = document.querySelector<HTMLInputElement>("input[id='et-ef-content-ftf-saveContinueCmdBottom']");

  const isOrganizationInList = () => Array.from(
    document.querySelectorAll("span[id*='iterate_organization-'][id$='-outputText_organizationChildrenTitle']")
  ).some((el) => el.textContent?.trim().toLowerCase() === organization);

  if (isOrganizationInList()) {
    if (saveContinueButtonOrg) {
      saveContinueButtonOrg.click();
      console.log("[PersonalInfo] Organization already present. Save and Continue clicked.");
    } else {
      console.warn("[PersonalInfo] Save and Continue button not found.");
    }
  } else if (orgSelect && addOrganizationButton && !addOrganizationButton.dataset.clicked) {
    const match = Array.from(orgSelect.options).find(
      (opt) => opt.textContent?.trim().toLowerCase() === organization || opt.value.toLowerCase().includes(organization)
    );
    if (match) {
      orgSelect.value = match.value;
      orgSelect.dispatchEvent(new Event("change", { bubbles: true }));
      addOrganizationButton.dataset.clicked = "true";
      addOrganizationButton.click();
      setTimeout(() => {
        if (isOrganizationInList() && saveContinueButtonOrg) {
          saveContinueButtonOrg.click();
          console.log("[PersonalInfo] Organization added and Save and Continue clicked.");
        }
      }, 500);
    } else {
      console.warn(`[PersonalInfo] Organization '${organization}' not found in dropdown.`);
    }
  }
} else {
  console.log("[PersonalInfo] No known employment preference section found on this page.");
}
}