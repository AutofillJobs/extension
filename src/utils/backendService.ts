// Backend service for syncing user data with Bubble API

interface BackendConfig {
  baseUrl: string;
  apiKey?: string;
}

interface UserDataPayload {
  email: string;
  // password: string;
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
        `${this.config.baseUrl}/obj/userinfo/${userId}`,
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
        `${this.config.baseUrl}/obj/userinfo/${userId}`,
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
        // password: userData.password || "",
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
      const response = await fetch(`${this.config.baseUrl}/obj/userinfo`, {
        method: "GET",
        headers: this.getHeaders(),
      });

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
      const response = await fetch(`${this.config.baseUrl}/obj/userinfo`, {
        method: "GET",
        headers: this.getHeaders(),
      });

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

// Export the class for testing or custom configurations
export { BackendService, type BackendConfig, type UserDataPayload };
