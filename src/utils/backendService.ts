// Backend service for syncing user data with Bubble API

interface BackendConfig {
  baseUrl: string;
  apiKey?: string;
}

interface UserDataPayload {
  email: string;
  password: string;
  address: string;
  "number of applications"?: number;
}

interface BubbleResponse {
  response: {
    cursor: number;
    results: Array<{
      _id: string;
      email: string;
      // password: string;
      address: string;
      "Created Date": string;
      "Modified Date": string;
      "Created By": string;
      "number of applications": number;
    }>;
    count: number;
    remaining: number;
  };
}

interface BubbleCreateResponse {
  status: string;
  id: string;
}

interface LinkedInScrapedData {
  fullName: string;
  firstName: string;
  lastName: string;
  source: string;
  city: string;
  state: string;
  gender: string;
  country: string;
  linkedinUrl: string;
  workedPreviously: string;
  degree: string;
  workExperiences: Array<{
    jobTitle: string;
    companyName: string;
    startDate: string;
    endDate: string;
    skills: string[];
    stillWorking: boolean;
    description: string;
    location: string;
    workType: string;
  }>;
  projectExperiences: Array<{
    projectName: string;
    startDate: string;
    endDate: string;
    skills: string[];
    stillWorking: boolean;
    description: string;
    gitUrl: string;
    hostUrl: string;
  }>;
  educationExperiences: Array<{
    courseName: string;
    field: string;
    collegeName: string;
    startDate: string;
    endDate: string;
    skills: string[];
    stillStudying: boolean;
    description: string;
    grade: string;
    location: string;
    educationType: string;
  }>;
  scrapedAt: string;
}

// --- Added by Abhishek to get all user data for autofilling from bubble to extension ---
interface AutofillDataRecord {
  _id: string;
  alt_email: string;
  city: string;
  country: string;
  degree: string;
  disability: boolean;
  ethnicity: string;
  expected_salary: number;
  field: string;
  grossSalary: number;
  notice_period: string;
  prefix: string;
  served_in_military: boolean;
  state: string;
  veteran: boolean;
  visa_sponsorship: boolean;
  work_authorization: boolean;
  worked_previously: boolean;
  zip_code: string;
  "Modified Date": string;
  "Created Date": string;
  "Created By": string;
  Slug: string;
}

interface AutofillDataPayload {
  alt_email?: string;
  city?: string;
  country?: string;
  degree?: string;
  disability?: boolean;
  ethnicity?: string;
  expected_salary?: number;
  field?: string;
  grossSalary?: number;
  notice_period?: string;
  prefix?: string;
  served_in_military?: boolean;
  state?: string;
  veteran?: boolean;
  visa_sponsorship?: boolean;
  work_authorization?: boolean;
  worked_previously?: boolean;
  zip_code?: string;
}

interface BubbleAutofillResponse {
  response: {
    cursor: number;
    results: Array<AutofillDataRecord>;
    count: number;
    remaining: number;
  };
}

interface UserProfileRecord {
  _id: string;
  phone_number: number;
  skills: string;
  summary: string;
  twitter_url: string;
  first_name: string;
  last_name: string;
  email: string;
  linkedin_url: string;
  github_url: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  address: string;
}

interface WorkExperienceRecord {
  _id: string;
  company_name: string;
  job_title: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  still_working: boolean;
  work_type: string;
}

interface EducationExperienceRecord {
  _id: string;
  college_name: string;
  course_name: string;
  field: string;
  grade: string;
  location: string;
  start_date: string;
  end_date: string;
  description: string;
  still_studying: boolean;
  education_type: string;
}

interface ProjectExperienceRecord {
  _id: string;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  github_url: string;
  host_url: string;
  still_working: boolean;
  ai_description: string;
}

interface AllUserData {
  profile: UserProfileRecord;
  work_experience: WorkExperienceRecord[];
  education: EducationExperienceRecord[];
  projects: ProjectExperienceRecord[];
  autofill_data: AutofillDataRecord;
}

interface BubbleAllUserDataResponse {
  response: AllUserData;
}

// --- End of addition by Abhishek ---

class BackendService {
  private config: BackendConfig;

  constructor(config: BackendConfig) {
    this.config = config;
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add API key if provided
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Search for user by email
   */
  async findUserByEmail(
    email: string
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const constraints = JSON.stringify([
        {
          key: "email",
          constraint_type: "equals",
          value: email,
        },
      ]);

      const response = await fetch(
        `${this.config.baseUrl}/obj/userinfo?constraints=${encodeURIComponent(
          constraints
        )}`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BubbleResponse = await response.json();

      if (data.response.results.length > 0) {
        return {
          success: true,
          user: data.response.results[0],
        };
      }

      return {
        success: true,
        user: null,
      };
    } catch (error) {
      console.error("Error finding user by email:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Create new user
   */
  async createUser(
    userData: UserDataPayload
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/obj/userinfo`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }

      const data: BubbleCreateResponse = await response.json();

      return {
        success: true,
        id: data.id,
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update existing user using PUT (replace all fields)
   */
  async updateUser(
    userId: string,
    userData: UserDataPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/obj/userChromeExtensionInfo/${userId}`,
        {
          method: "PUT",
          headers: this.getHeaders(),
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating user:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update specific fields using PATCH
   */
  async patchUser(
    userId: string,
    userData: Partial<UserDataPayload>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/obj/userChromeExtensionInfo/${userId}`,
        {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(userData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `HTTP ${response.status}: ${errorData.message || response.statusText}`
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error patching user:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Fetches ALL user data (Profile, Work, Education, Projects, Autofill) added by Abhishek
   * by calling the 'get_all_user_data' API Workflow.
   */
  async fetchAllUserData(): Promise<{
    success: boolean;
    data?: AllUserData;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/wf/get_all_user_data?ts=${Date.now()}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          credentials: "include",
          cache: "no-store",
          mode: "cors",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json: BubbleAllUserDataResponse = await response.json();
      return {
        success: true,
        data: json.response,
      };
    } catch (error) {
      console.error("Error fetching all user data:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Sync user data to Bubble API
   * Checks if user exists, then creates or updates accordingly
   */
  async syncUserData(
    userData: any
  ): Promise<{ success: boolean; error?: string; response?: any }> {
    try {
      // Extract only the required fields
      const payload: UserDataPayload = {
        email: userData.email || "",
        password: userData.password || "",
        address: userData.address || userData.country || "",
      };

      // Validate required fields
      // if (!payload.email || !payload.password || !payload.address) {
      if (!payload.email || !payload.address) {
        console.warn("Missing required fields for sync:", {
          email: !!payload.email,
          address: !!payload.address,
        });
        return {
          success: false,
          error:
            "Missing required fields: email, password, and address are required",
        };
      }

      console.log("Syncing user data to Bubble API:", {
        email: payload.email,
        address: payload.address,
      });

      // First, check if user exists
      const findResult = await this.findUserByEmail(payload.email);

      if (!findResult.success) {
        return {
          success: false,
          error: findResult.error || "Failed to check if user exists",
        };
      }

      let result;

      if (findResult.user) {
        // User exists, update using PUT
        console.log("User exists, updating...", findResult.user._id);
        result = await this.updateUser(findResult.user._id, payload);

        if (result.success) {
          return {
            success: true,
            response: {
              action: "updated",
              userId: findResult.user._id,
              message: "User updated successfully",
            },
          };
        }
      } else {
        // User doesn't exist, create new
        console.log("User does not exist, creating...");
        result = await this.createUser(payload);

        if (result.success) {
          return {
            success: true,
            response: {
              action: "created",
              userId: result.id,
              message: "User created successfully",
            },
          };
        }
      }

      return {
        success: false,
        error: result.error || "Failed to sync user data",
      };
    } catch (error) {
      console.error("Error syncing user data to Bubble API:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Test backend connectivity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/obj/userChromeExtensionInfo`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Bubble API connection test failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  /**
   * Get all users (for testing/debugging)
   */
  async getAllUsers(): Promise<{
    success: boolean;
    users?: any[];
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/obj/userChromeExtensionInfo`,
        {
          method: "GET",
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: BubbleResponse = await response.json();

      return {
        success: true,
        users: data.response.results,
      };
    } catch (error) {
      console.error("Error getting all users:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}

// Import configuration
import { getConfig } from "./config";


// Create and export the service instance with dynamic configuration
let backendServiceInstance: BackendService | null = null;

export async function getBackendService(): Promise<BackendService> {
  if (!backendServiceInstance) {
    const config = await getConfig();
    backendServiceInstance = new BackendService({
      baseUrl: config.backend.baseUrl,
      apiKey: config.backend.apiKey,
    });
  }
  return backendServiceInstance;
}

// For backward compatibility, export a default instance
export const backendService = new BackendService({
  baseUrl: "https://applygoat.com/version-test/api/1.1",
  apiKey: "e02abfdc4f4c029b6ebecf5cd18a8c97",
});

/**
 * Scrape LinkedIn profile data
 */

export async function scrapeLinkedInProfile(
  profileUrl: string,
  port: number = 5001
): Promise<{ success: boolean; data?: LinkedInScrapedData; error?: string }> {
  try {
    if (!profileUrl || !profileUrl.includes('linkedin.com')) {
      console.log("Invalid LinkedIn URL validation failed");
      return {
        success: false,
        error: 'Invalid LinkedIn URL provided'
      };
    }

    console.log("Making fetch request to:", `http://localhost:${port}/scrape`);
    const response = await fetch(`http://localhost:${port}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileUrl }),
    });
    console.log("Fetch response received:", response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `HTTP ${response.status}: ${errorData.error || response.statusText}`
      );
    }

    const data: LinkedInScrapedData = await response.json();

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error scraping LinkedIn profile:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error occurred while scraping',
    };
  }
}

// Export the class for testing or custom configurations
export { BackendService, type BackendConfig, type UserDataPayload, type LinkedInScrapedData };
