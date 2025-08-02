import { getUserData } from "../../utils/storageHandler";
import fillPersonalInfo from "./personalInfo";
import { fillExperienceAndEducation } from "./educationAndExperience/ExperienceHandler";
import { fillEducation } from "./educationAndExperience/educationHandler";
import { promptUserToUploadResume } from "./fileHandler"; // <-- Import your function

function getCurrentStep(): string | null {
  const focused = document.querySelector(
    ".datatrain-focus .datatrain-wagon span[id*='dtPageNameOff'], " +
    ".datatrain-focus .datatrain-wagon span[id*='dtPageName']"
  );
  return focused ? focused.textContent?.trim() || null : null;
}

function handlePageChange(userData: any) {
  const currentStep = getCurrentStep();
  if (!currentStep) return;

  // Attachments step (prompt user to upload resume)
  if (currentStep === "Attachments") {
    promptUserToUploadResume();
    return;
  }

  // Resume/CV Upload step (skip logic)
  if (currentStep === "Resume/CV Upload") {
    const skipResumeRadio = document.querySelector<HTMLInputElement>(
      "input[id$='ResumeParsingBlock-UploadResumeBlock-resumeSkipRadio_1']"
    );
    const saveContinueBtn = document.querySelector<HTMLInputElement>(
      "input[id$='-saveContinueCmd']"
    );
    if (skipResumeRadio && saveContinueBtn) {
      skipResumeRadio.checked = true;
      skipResumeRadio.click();
      setTimeout(() => saveContinueBtn.click(), 800);
    }
    return;
  }

  if (currentStep === "Personal Information") {
    fillPersonalInfo(userData?.data?.details || {});
    return;
  }

  if (currentStep === "Experience and Education") {
    fillExperienceAndEducation(userData?.data?.workExperiences || []);
    fillEducation(userData?.data?.educationExperiences || []);
    return;
  }
}

export default function fillTaleoForm() {
  getUserData((userData) => {
    if (!userData) {
      console.warn("[TaleoBaseScript] No user data found in storage");
      return;
    }
    handlePageChange(userData);
    const observer = new MutationObserver(() => handlePageChange(userData));
    observer.observe(document.body, { childList: true, subtree: true });
  });
}