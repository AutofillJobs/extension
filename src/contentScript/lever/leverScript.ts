interface UserDetails {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  currentLocation?: string;
  city?: string;
  address1?: string;
  currentCompany?: string;
  company?: string;
  linkedIn?: string;
  linkedinUrl?: string;
  github?: string;
  githubUrl?: string;
  expectedCompensation?: string;
  expectedSalary?: string;
  grossSalary?: string;
  noticePeriod?: string;
  gender?: string;
}

function fillLeverForm(userData: any) {
  console.log("🚀 Lever form filler started");
  const details = userData?.data?.details || {};
  const rawDetails = userData?.data?.details || userData?.details || userData as any;


  function setReactValue(input: HTMLInputElement | HTMLSelectElement, value: string) {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    nativeSetter?.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
    console.log(`✅ Filled field with value: "${value}"`);
  }

  function waitAndSet(selectors: string[], value: string, fieldName: string, retries = 100, delay = 200, isRadio = false) {
    let attempt = 0;
    const interval = setInterval(() => {
      for (const sel of selectors) {
        const input = document.querySelector<HTMLInputElement>(sel);
        if (input && input.offsetParent !== null) {
          console.log(`✅ [${fieldName}] Found and ${isRadio ? "clicking" : "filling"}: "${value}"`);
          if (isRadio) input.click();
          else setReactValue(input, value);
          clearInterval(interval);
          return;
        }
      }
      attempt++;
      if (attempt >= retries) {
        console.error(`❌ [${fieldName}] Failed to find after ${retries} attempts`);
        clearInterval(interval);
      }
    }, delay);
  }

  function getFieldValue(primaryField: string, ...fallbackFields: string[]): string | undefined {
    if (userData[primaryField]) return userData[primaryField];
    if (userData?.data && userData.data[primaryField]) return userData.data[primaryField];
    if (details[primaryField as keyof UserDetails]) return details[primaryField as keyof UserDetails] as string;
    if (rawDetails && rawDetails[primaryField]) return rawDetails[primaryField];

    for (const fallback of fallbackFields) {
      if (userData[fallback]) return userData[fallback];
      if (userData?.data && userData.data[fallback]) return userData.data[fallback];
      if (rawDetails && rawDetails[fallback]) return rawDetails[fallback];
    }
    return undefined;
  }

  setTimeout(() => {
    console.log("🎯 Starting field filling process...");

    const nameValue = getFieldValue('fullName', 'firstName', 'name');
    if (nameValue) waitAndSet(["input[name='name']"], nameValue, "Name");

    const emailValue = getFieldValue('email');
    if (emailValue) waitAndSet(["input[name='email']"], emailValue, "Email");

  
    const phoneValue = getFieldValue('phone', 'phoneNumber', 'mobileNumber', 'contactNumber');
    if (phoneValue?.trim()) waitAndSet([
      "input[name='phone']",
      "[data-qa='phone-input']",
      "input[placeholder*='phone' i]",
      "input[placeholder*='mobile' i]"
    ], phoneValue, "Phone");

    let locationValue = getFieldValue('currentLocation', 'city', 'location', 'address1', 'address', 'place');
    if (!locationValue || locationValue === "1") {
      const state = rawDetails.state;
      const country = rawDetails.country;
      if (state && state !== "1") locationValue = state + (country && country !== "1" ? `, ${country}` : "");
      else if (country && country !== "1") locationValue = country;
      else locationValue = undefined;
    }
    if (locationValue?.trim()) waitAndSet([
      "input[name='location']",
      "[data-qa='location-input']",
      "input[class*='location' i]",
      "#location-input",
      ".location-input",
      "input[placeholder*='location' i]",
      "input[placeholder*='city' i]"
    ], locationValue, "Location");

    let companyValue = getFieldValue('currentCompany', 'company', 'organization', 'employer', 'workplace');
    if (!companyValue && (rawDetails.workExperiences?.length || userData?.data?.workExperiences?.length)) {
      const latestJob = (rawDetails.workExperiences || userData?.data?.workExperiences)[0];
      if (latestJob?.companyName?.trim()) companyValue = latestJob.companyName;
    }
    if (companyValue?.trim()) waitAndSet([
      "input[name='org']",
      "[data-qa='org-input']",
      "#currentCompany",
      ".company-input",
      "input[placeholder*='company' i]",
      "input[placeholder*='organization' i]"
    ], companyValue, "Company");

    const linkedinValue = getFieldValue('linkedIn', 'linkedinUrl', 'linkedin_url', 'linkedin');
    if (linkedinValue) waitAndSet(["input[name='urls[LinkedIn]']"], linkedinValue, "LinkedIn");

    const githubValue = getFieldValue('github', 'githubUrl', 'github_url', 'githubProfile');
    if (githubValue) waitAndSet(["input[name='urls[GitHub]']"], githubValue, "GitHub");

    const compensationValue = getFieldValue('expectedCompensation', 'expectedSalary', 'grossSalary', 'salary', 'compensation');
    if (compensationValue) waitAndSet(["input[name='cards[e3fd6642-8f4d-4a86-b7d8-f464a94ef3be][field5]']"], compensationValue, "Expected Compensation");

    const noticePeriodValue = getFieldValue('noticePeriod', 'notice_period', 'noticePeriodDays');
    if (noticePeriodValue) waitAndSet(["input[name='cards[e3fd6642-8f4d-4a86-b7d8-f464a94ef3be][field6]']"], noticePeriodValue, "Notice Period");

    const genderValue = getFieldValue('gender');
    if (genderValue?.toLowerCase() === 'male' || genderValue?.toLowerCase() === 'female') {
      waitAndSet([`input[name='cards[e3fd6642-8f4d-4a86-b7d8-f464a94ef3be][field0]'][value='${genderValue}']`], "", "Gender", 50, 300, true);
    }

    setTimeout(() => {
      waitAndSet(["input[name='urls[Naukri]']"], "https://www.naukri.com/mynaukri/dipesh", "Naukri URL");
      waitAndSet(["input[name='urls[Portfolio]']"], "https://dipesh-portfolio.com", "Portfolio URL");
      waitAndSet(["input[name='urls[Other ]']"], "https://extra-link.com", "Other URL");
      waitAndSet(["input[name='cards[e3fd6642-8f4d-4a86-b7d8-f464a94ef3be][field1]']"], "3", "Experience Field");
      waitAndSet(["input[name='cards[e3fd6642-8f4d-4a86-b7d8-f464a94ef3be][field4]']"], "5L", "Salary Field");
    }, 3000);


    setTimeout(() => {
      const basedInBangalore = document.querySelector<HTMLInputElement>("input[name='cards[e3fd6642-8f4d-4a86-b7d8-f464a94ef3be][field2]'][value='Yes']");
      if (basedInBangalore) basedInBangalore.click();
      const willingToRelocate = document.querySelector<HTMLInputElement>("input[name='cards[e3fd6642-8f4d-4a86-b7d8-f464a94ef3be][field3]'][value='Yes']");
      if (willingToRelocate) willingToRelocate.click();
    }, 5000);

  }, 5000);
}

export default fillLeverForm;
