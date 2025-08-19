export interface FormData {
    data: {
      details?: Record<string, string>;
      workExperiences?: any[];
      projectExperiences?: any[];
      educationExperiences?: any[];
      applicationQuestions?: Record<string, string>;
    };
    applicationQuestions?: Record<string, string>;
  }