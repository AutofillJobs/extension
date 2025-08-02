export function fillEducation(educationExperiences: any[]) {
  if (!educationExperiences || educationExperiences.length === 0) {
    console.warn("[EducationHandler] No education data found.");
    return;
  }

  const education = educationExperiences[0];
  if (!education) {
    console.warn("[EducationHandler] No data for first education entry.");
    return;
  }

  // Institution
  const institutionField = document.querySelector<HTMLInputElement>(
    "input[id$='-frm-dv_cs_education_Institution']"
  );
  if (institutionField && education.collegeName) {
    institutionField.value = education.collegeName;
    institutionField.dispatchEvent(new Event("input", { bubbles: true }));
    institutionField.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // City
  const cityField = document.querySelector<HTMLInputElement>(
    "input[id$='-frm-dv_cs_education_OtherInstitutionCity']"
  );
  if (cityField && education.location) {
    cityField.value = education.location;
    cityField.dispatchEvent(new Event("input", { bubbles: true }));
    cityField.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // Type of Degree/Diploma
  const degreeTypeValue = (education.degreeType || "Bachelor's Level Degree").toLowerCase();
  const degreeTypeSelect = document.querySelector<HTMLSelectElement>(
    "select[id$='-frm-dv_cs_education_UDFEducation_Type_32_of_32_Degree_47_Diploma']"
  );
  if (degreeTypeSelect) {
    const option = Array.from(degreeTypeSelect.options).find(opt =>
      opt.textContent?.trim().toLowerCase() === degreeTypeValue
    );
    if (option) {
      degreeTypeSelect.value = option.value;
      degreeTypeSelect.dispatchEvent(new Event("input", { bubbles: true }));
      degreeTypeSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // Major/Area of Specialization (from courseName)
  const specializationValue = (education.courseName || "").toLowerCase();
  const specializationSelect = document.querySelector<HTMLSelectElement>(
    "select[id$='-frm-dv_cs_education_UDFEducation_LBL_MAJOR_AREAOFSPECIALIZATION']"
  );
  if (specializationSelect && specializationValue) {
    const option = Array.from(specializationSelect.options).find(opt =>
      opt.textContent?.trim().toLowerCase() === specializationValue
    );
    if (option) {
      specializationSelect.value = option.value;
      specializationSelect.dispatchEvent(new Event("input", { bubbles: true }));
      specializationSelect.dispatchEvent(new Event("change", { bubbles: true }));
      console.log(`[EducationHandler] Set Major/Area of Specialization: ${specializationValue}`);
    } else {
      console.warn(`[EducationHandler] Specialization '${specializationValue}' not found in dropdown.`);
    }
  } else if (!specializationSelect) {
    console.warn("[EducationHandler] Major/Area of Specialization select not found.");
  }

// Country (and State/Province)
const countryValue = (education.country || "United States").toLowerCase();
const countrySelect = document.querySelector<HTMLSelectElement>(
  "select[id$='-frm-dv_cs_education_OtherInstitutionLocation-0']"
);

if (countrySelect) {
  const countryOption = Array.from(countrySelect.options).find(opt =>
    opt.textContent?.trim().toLowerCase() === countryValue
  );
  if (countryOption && countrySelect.value !== countryOption.value) {
    countrySelect.value = countryOption.value;
    countrySelect.dispatchEvent(new Event("input", { bubbles: true }));
    countrySelect.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[EducationHandler] Set Country: ${countryValue}`);
  }

  // Wait for the State/Province dropdown to be enabled and have options
  let tries = 0;
  const maxTries = 20;
  const stateValue = (education.state || "California").toLowerCase();
  const interval = setInterval(() => {
    tries++;
    const stateSelect = document.querySelector<HTMLSelectElement>(
      "select[id$='-frm-dv_cs_education_OtherInstitutionLocation-1']"
    );
    if (
      stateSelect &&
      !stateSelect.disabled &&
      stateSelect.options.length > 1
    ) {
      const stateOption = Array.from(stateSelect.options).find(opt =>
        opt.textContent?.trim().toLowerCase() === stateValue
      );
      if (stateOption && stateSelect.value !== stateOption.value) {
        stateSelect.value = stateOption.value;
        stateSelect.dispatchEvent(new Event("input", { bubbles: true }));
        stateSelect.dispatchEvent(new Event("change", { bubbles: true }));
        console.log(`[EducationHandler] Set State/Province: ${stateValue}`);
      }
      clearInterval(interval);
    } else if (tries >= maxTries) {
      clearInterval(interval);
      console.warn("[EducationHandler] State/Province select not enabled or not loaded in time.");
    }

    // City/Nearest Geographic Region
const cityValue = (education.city || "Berkeley").toLowerCase();
let cityTries = 0;
const maxCityTries = 20;

const cityInterval = setInterval(() => {
  cityTries++;
  const citySelect = document.querySelector<HTMLSelectElement>(
    "select[id$='-frm-dv_cs_education_OtherInstitutionLocation-2']"
  );
  if (
    citySelect &&
    !citySelect.disabled &&
    citySelect.options.length > 1
  ) {
    const cityOption = Array.from(citySelect.options).find(opt =>
      opt.textContent?.trim().toLowerCase() === cityValue
    );
    if (cityOption && citySelect.value !== cityOption.value) {
      citySelect.value = cityOption.value;
      citySelect.dispatchEvent(new Event("input", { bubbles: true }));
      citySelect.dispatchEvent(new Event("change", { bubbles: true }));
      console.log(`[EducationHandler] Set City/Nearest Geographic Region: ${cityValue}`);
    } else if (!cityOption) {
      console.warn(`[EducationHandler] City/Nearest Geographic Region '${cityValue}' not found in dropdown.`);
    }
    clearInterval(cityInterval);
  } else if (cityTries >= maxCityTries) {
    clearInterval(cityInterval);
    console.warn("[EducationHandler] City/Nearest Geographic Region select not enabled or not loaded in time.");
  }
}, 400); // Poll every 400ms
  }, 400); // Poll every 400ms
}
  // Start Date (Month and Year)
let startMonth = "";
let startYear = "";
if (education.startDate) {
  const [year, month] = education.startDate.split("-");
  startYear = year;
  const monthNames = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec"
  ];
  startMonth = monthNames[parseInt(month, 10) - 1];
}

const startMonthSelect = document.querySelector<HTMLSelectElement>(
  "select[id$='-frm-dv_cs_education_startDate.month']"
);
if (startMonthSelect && startMonth) {
  const monthOption = Array.from(startMonthSelect.options).find(opt =>
    opt.textContent?.trim().toLowerCase() === startMonth
  );
  if (monthOption) {
    startMonthSelect.value = monthOption.value;
    startMonthSelect.dispatchEvent(new Event("input", { bubbles: true }));
    startMonthSelect.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[EducationHandler] Set Start Month: ${startMonth}`);
  } else {
    console.warn(`[EducationHandler] Start Month '${startMonth}' not found in dropdown.`);
  }
} else if (!startMonthSelect) {
  console.warn("[EducationHandler] Start month select not found.");
}

const startYearSelect = document.querySelector<HTMLSelectElement>(
  "select[id$='-frm-dv_cs_education_startDate.year']"
);
if (startYearSelect && startYear) {
  const yearOption = Array.from(startYearSelect.options).find(opt =>
    opt.textContent?.trim() === startYear
  );
  if (yearOption) {
    startYearSelect.value = yearOption.value;
    startYearSelect.dispatchEvent(new Event("input", { bubbles: true }));
    startYearSelect.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[EducationHandler] Set Start Year: ${startYear}`);
  } else {
    console.warn(`[EducationHandler] Start Year '${startYear}' not found in dropdown.`);
  }
} else if (!startYearSelect) {
  console.warn("[EducationHandler] Start year select not found.");
}

// Graduation Date (Month and Year) from endDate
let gradMonth = "";
let gradYear = "";
if (education.endDate) {
  const [year, month] = education.endDate.split("-");
  gradYear = year;
  const monthNames = [
    "jan", "feb", "mar", "apr", "may", "jun",
    "jul", "aug", "sep", "oct", "nov", "dec"
  ];
  gradMonth = monthNames[parseInt(month, 10) - 1];
}

const gradMonthSelect = document.querySelector<HTMLSelectElement>(
  "select[id$='-frm-dv_cs_education_graduationDate.month']"
);
if (gradMonthSelect && gradMonth) {
  const monthOption = Array.from(gradMonthSelect.options).find(opt =>
    opt.textContent?.trim().toLowerCase() === gradMonth
  );
  if (monthOption) {
    gradMonthSelect.value = monthOption.value;
    gradMonthSelect.dispatchEvent(new Event("input", { bubbles: true }));
    gradMonthSelect.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[EducationHandler] Set Graduation Month: ${gradMonth}`);
  } else {
    console.warn(`[EducationHandler] Graduation Month '${gradMonth}' not found in dropdown.`);
  }
} else if (!gradMonthSelect) {
  console.warn("[EducationHandler] Graduation month select not found.");
}

const gradYearSelect = document.querySelector<HTMLSelectElement>(
  "select[id$='-frm-dv_cs_education_graduationDate.year']"
);
if (gradYearSelect && gradYear) {
  const yearOption = Array.from(gradYearSelect.options).find(opt =>
    opt.textContent?.trim() === gradYear
  );
  if (yearOption) {
    gradYearSelect.value = yearOption.value;
    gradYearSelect.dispatchEvent(new Event("input", { bubbles: true }));
    gradYearSelect.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[EducationHandler] Set Graduation Year: ${gradYear}`);
  } else {
    console.warn(`[EducationHandler] Graduation Year '${gradYear}' not found in dropdown.`);
  }
} else if (!gradYearSelect) {
  console.warn("[EducationHandler] Graduation year select not found.");
}

// Academic Status (Current Enrollment Status)
const academicStatusValue = (education.academicStatus || "Graduated").toLowerCase();
const academicStatusSelect = document.querySelector<HTMLSelectElement>(
  "select[id$='-frm-dv_cs_education_UDFEducation_LBL_ACADEMIC_STATUS']"
);

if (academicStatusSelect) {
  const option = Array.from(academicStatusSelect.options).find(opt =>
    opt.textContent?.trim().toLowerCase() === academicStatusValue
  );
  if (option) {
    academicStatusSelect.value = option.value;
    academicStatusSelect.dispatchEvent(new Event("input", { bubbles: true }));
    academicStatusSelect.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[EducationHandler] Set Academic Status: ${academicStatusValue}`);
  } else {
    console.warn(`[EducationHandler] Academic Status '${academicStatusValue}' not found in dropdown.`);
  }
} else {
  console.warn("[EducationHandler] Academic Status select not found.");
}

// Try to click Remove Certification button first
const removeCertificationBtn = document.querySelector<HTMLSpanElement>(
  "span#et-ef-content-ftf-gp-j_id_id16pc9-page_2-careerSectionCertificationForm-certificationFragmentIter-0-lblRemoveCertification"
);

if (removeCertificationBtn) {
  removeCertificationBtn.click();
  console.log("[CertificationHandler] Clicked Remove Certification for Certification 1.");
} else {
  // If Remove Certification button is not found, click Save and Continue
  const saveContinueBtn = document.querySelector<HTMLInputElement>(
    "input#et-ef-content-ftf-saveContinueCmdBottom"
  );
  if (saveContinueBtn) {
    saveContinueBtn.click();
    console.log("[CertificationHandler] Remove Certification not found. Clicked Save and Continue.");
  } else {
    console.warn("[CertificationHandler] Save and Continue button not found.");
  }
}
}