// utils/getUniqueSkills.ts

interface Experience {
  id: string;
  skills?: string[];
  // Add other properties as needed
}

interface ExperienceData {
  workExperiences?: Experience[];
  educationExperiences?: Experience[];
  projectExperiences?: Experience[];
}

export const getUniqueSkills = (experienceData: ExperienceData | null): string[] => {
  if (!experienceData) return [];

  const allSkills: string[] = [];

  // Helper function to collect skills
  const collectSkills = (experiences: Experience[] | undefined) => {
    experiences?.forEach(exp => {
      exp.skills?.forEach(skill => {
        if (skill.trim()) {
          allSkills.push(skill.toLowerCase());
        }
      });
    });
  };

  // Collect skills from all experience types
  collectSkills(experienceData.workExperiences);
  collectSkills(experienceData.educationExperiences);
  collectSkills(experienceData.projectExperiences);

  // Remove duplicates and return sorted array
  return [...new Set(allSkills)]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};

// Usage example:
// const allSkills: string[] = getUniqueSkills(experienceData);