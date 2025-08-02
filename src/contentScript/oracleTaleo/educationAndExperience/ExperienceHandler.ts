export function fillExperienceAndEducation(workExperiences: any[]) {
  if (!workExperiences || workExperiences.length === 0) {
    console.warn("[ExperienceAndEducation] No work experience data found.");
    return;
  }

  // --- Fill Work Experience 1 ---
  const experience1 = workExperiences[0];
  if (!experience1 || !experience1.companyName) {
    console.warn("[ExperienceAndEducation] Company name is missing for Work Experience 1.");
    return;
  }

  // Company Name
  const companyField1 = document.querySelector<HTMLInputElement>(
    "input[id$='-dv_cs_experience_Employer']"
  );
  if (companyField1) {
    companyField1.value = experience1.companyName;
    companyField1.dispatchEvent(new Event("input", { bubbles: true }));
    companyField1.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // May we contact this company?
  const mayContactValue1 = (experience1.mayContact || "No").toLowerCase();
  const contactCompanySelect1 = document.querySelector<HTMLSelectElement>(
    "select[id$='UDFExperience_LBL_CONTACT_COMPANY']"
  );
  if (contactCompanySelect1) {
    const option1 = Array.from(contactCompanySelect1.options).find(opt =>
      opt.textContent?.trim().toLowerCase() === mayContactValue1
    );
    if (option1) {
      contactCompanySelect1.value = option1.value;
      contactCompanySelect1.dispatchEvent(new Event("input", { bubbles: true }));
      contactCompanySelect1.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // Were you (Person Type)
  const personTypeValue1 = (experience1.personType || "an employee").toLowerCase();
  const personTypeSelect1 = document.querySelector<HTMLSelectElement>(
    "select[id$='UDFExperience_LBL_PERSON_TYPE']"
  );
  if (personTypeSelect1) {
    const option1 = Array.from(personTypeSelect1.options).find(opt =>
      opt.textContent?.trim().toLowerCase() === personTypeValue1
    );
    if (option1) {
      personTypeSelect1.value = option1.value;
      personTypeSelect1.dispatchEvent(new Event("input", { bubbles: true }));
      personTypeSelect1.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // Start Date
  let startMonth1 = "", startYear1 = "";
  if (experience1.startDate) {
    const [year, month] = experience1.startDate.split("-");
    startYear1 = year;
    const monthNames = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec"
    ];
    startMonth1 = monthNames[parseInt(month, 10) - 1];
  }
  const monthSelect1 = document.querySelector<HTMLSelectElement>(
    "select[id$='BeginDate.month']"
  );
  if (monthSelect1 && startMonth1) {
    const monthOption1 = Array.from(monthSelect1.options).find(opt =>
      opt.textContent?.trim().toLowerCase() === startMonth1
    );
    if (monthOption1) {
      monthSelect1.value = monthOption1.value;
      monthSelect1.dispatchEvent(new Event("input", { bubbles: true }));
      monthSelect1.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  const yearSelect1 = document.querySelector<HTMLSelectElement>(
    "select[id$='BeginDate.year']"
  );
  if (yearSelect1 && startYear1) {
    const yearOption1 = Array.from(yearSelect1.options).find(opt =>
      opt.textContent?.trim() === startYear1
    );
    if (yearOption1) {
      yearSelect1.value = yearOption1.value;
      yearSelect1.dispatchEvent(new Event("input", { bubbles: true }));
      yearSelect1.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // End Date
  let endMonth1 = "", endYear1 = "";
  if (experience1.endDate) {
    const [year, month] = experience1.endDate.split("-");
    endYear1 = year;
    const monthNames = [
      "jan", "feb", "mar", "apr", "may", "jun",
      "jul", "aug", "sep", "oct", "nov", "dec"
    ];
    endMonth1 = monthNames[parseInt(month, 10) - 1];
  }
  const endMonthSelect1 = document.querySelector<HTMLSelectElement>(
    "select[id$='EndDate.month']"
  );
  if (endMonthSelect1 && endMonth1) {
    const monthOption1 = Array.from(endMonthSelect1.options).find(opt =>
      opt.textContent?.trim().toLowerCase() === endMonth1
    );
    if (monthOption1) {
      endMonthSelect1.value = monthOption1.value;
      endMonthSelect1.dispatchEvent(new Event("input", { bubbles: true }));
      endMonthSelect1.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  const endYearSelect1 = document.querySelector<HTMLSelectElement>(
    "select[id$='EndDate.year']"
  );
  if (endYearSelect1 && endYear1) {
    const yearOption1 = Array.from(endYearSelect1.options).find(opt =>
      opt.textContent?.trim() === endYear1
    );
    if (yearOption1) {
      endYearSelect1.value = yearOption1.value;
      endYearSelect1.dispatchEvent(new Event("input", { bubbles: true }));
      endYearSelect1.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // --- Handle Work Experience 2 ---
  if (workExperiences.length > 1) {
    // Check if "Work Experience 2" is already present
    const workExp2Title = document.querySelector(
      "span#et-ef-content-ftf-gp-j_id_id16pc9-page_0-we-wei-1\\:testTitle, span#et-ef-content-ftf-gp-j_id_id16pc9-page_0-we-wei-1\\:testTitle.title"
    );
    if (workExp2Title) {
      // Autofill fields for Work Experience 2
      const experience2 = workExperiences[1];

      // Company Name
      const companyField2 = document.querySelector<HTMLInputElement>(
        "input[id$='-we-wei-1-frm-dv_cs_experience_Employer']"
      );
      if (companyField2 && experience2.companyName) {
        companyField2.value = experience2.companyName;
        companyField2.dispatchEvent(new Event("input", { bubbles: true }));
        companyField2.dispatchEvent(new Event("change", { bubbles: true }));
      }

      // May we contact this company?
      const mayContactValue2 = (experience2.mayContact || "No").toLowerCase();
      const contactCompanySelect2 = document.querySelector<HTMLSelectElement>(
        "select[id$='-we-wei-1-frm-dv_cs_experience_UDFExperience_LBL_CONTACT_COMPANY']"
      );
      if (contactCompanySelect2) {
        const option2 = Array.from(contactCompanySelect2.options).find(opt =>
          opt.textContent?.trim().toLowerCase() === mayContactValue2
        );
        if (option2) {
          contactCompanySelect2.value = option2.value;
          contactCompanySelect2.dispatchEvent(new Event("input", { bubbles: true }));
          contactCompanySelect2.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      // Were you (Person Type)
      const personTypeValue2 = (experience2.personType || "an employee").toLowerCase();
      const personTypeSelect2 = document.querySelector<HTMLSelectElement>(
        "select[id$='-we-wei-1-frm-dv_cs_experience_UDFExperience_LBL_PERSON_TYPE']"
      );
      if (personTypeSelect2) {
        const option2 = Array.from(personTypeSelect2.options).find(opt =>
          opt.textContent?.trim().toLowerCase() === personTypeValue2
        );
        if (option2) {
          personTypeSelect2.value = option2.value;
          personTypeSelect2.dispatchEvent(new Event("input", { bubbles: true }));
          personTypeSelect2.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      // Start Date
      let startMonth2 = "", startYear2 = "";
      if (experience2.startDate) {
        const [year, month] = experience2.startDate.split("-");
        startYear2 = year;
        const monthNames = [
          "jan", "feb", "mar", "apr", "may", "jun",
          "jul", "aug", "sep", "oct", "nov", "dec"
        ];
        startMonth2 = monthNames[parseInt(month, 10) - 1];
      }
      const monthSelect2 = document.querySelector<HTMLSelectElement>(
        "select[id$='-we-wei-1-frm-dv_cs_experience_BeginDate.month']"
      );
      if (monthSelect2 && startMonth2) {
        const monthOption2 = Array.from(monthSelect2.options).find(opt =>
          opt.textContent?.trim().toLowerCase() === startMonth2
        );
        if (monthOption2) {
          monthSelect2.value = monthOption2.value;
          monthSelect2.dispatchEvent(new Event("input", { bubbles: true }));
          monthSelect2.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      const yearSelect2 = document.querySelector<HTMLSelectElement>(
        "select[id$='-we-wei-1-frm-dv_cs_experience_BeginDate.year']"
      );
      if (yearSelect2 && startYear2) {
        const yearOption2 = Array.from(yearSelect2.options).find(opt =>
          opt.textContent?.trim() === startYear2
        );
        if (yearOption2) {
          yearSelect2.value = yearOption2.value;
          yearSelect2.dispatchEvent(new Event("input", { bubbles: true }));
          yearSelect2.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }

      // End Date
      let endMonth2 = "", endYear2 = "";
      if (experience2.endDate) {
        const [year, month] = experience2.endDate.split("-");
        endYear2 = year;
        const monthNames = [
          "jan", "feb", "mar", "apr", "may", "jun",
          "jul", "aug", "sep", "oct", "nov", "dec"
        ];
        endMonth2 = monthNames[parseInt(month, 10) - 1];
      }
      const endMonthSelect2 = document.querySelector<HTMLSelectElement>(
        "select[id$='-we-wei-1-frm-dv_cs_experience_EndDate.month']"
      );
      if (endMonthSelect2 && endMonth2) {
        const monthOption2 = Array.from(endMonthSelect2.options).find(opt =>
          opt.textContent?.trim().toLowerCase() === endMonth2
        );
        if (monthOption2) {
          endMonthSelect2.value = monthOption2.value;
          endMonthSelect2.dispatchEvent(new Event("input", { bubbles: true }));
          endMonthSelect2.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      const endYearSelect2 = document.querySelector<HTMLSelectElement>(
        "select[id$='-we-wei-1-frm-dv_cs_experience_EndDate.year']"
      );
      if (endYearSelect2 && endYear2) {
        const yearOption2 = Array.from(endYearSelect2.options).find(opt =>
          opt.textContent?.trim() === endYear2
        );
        if (yearOption2) {
          endYearSelect2.value = yearOption2.value;
          endYearSelect2.dispatchEvent(new Event("input", { bubbles: true }));
          endYearSelect2.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    } else {
      // If not present, click "Add Work Experience" and fill after form appears
      const addWorkExpBtn = document.querySelector<HTMLSpanElement>(
        "span#et-ef-content-ftf-gp-j_id_id16pc9-page_0-we-lblAddWorkExperience"
      );
      if (addWorkExpBtn) {
        addWorkExpBtn.click();
        setTimeout(() => {
          fillExperienceAndEducation(workExperiences); // Recursively call to fill the new form
        }, 1200);
      }
    }
  }
}