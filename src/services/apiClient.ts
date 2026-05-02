import { auth } from "../firebase";

export const getValidAuthToken = async (): Promise<string> => {
  if (!auth.currentUser) return '';
  try {
    return await auth.currentUser.getIdToken();
  } catch (err) {
    console.error("[auth] Failed to get Firebase token:", err);
    return '';
  }
};

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

export const apiClient = async (endpoint: string, options: FetchOptions = {}, maxRetries = 2) => {
  const { requireAuth = true, ...customConfig } = options;
  
  const executeRequest = async (attempt: number): Promise<any> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(customConfig.headers as Record<string, string> || {})
    };

    if (requireAuth) {
      try {
        const token = await getValidAuthToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.error(`[apiClient] Failed to get auth token for ${endpoint}:`, err);
      }
    }

    const config: RequestInit = {
      ...customConfig,
      headers,
    };

    try {
      const response = await fetch(endpoint, config);
      
      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Retry on transient errors (5xx, 429) if we have retries left
        if ((response.status >= 500 || response.status === 429) && attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt);
          console.warn(`[apiClient] ⚠️ Attempt ${attempt + 1} failed with status ${response.status}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeRequest(attempt + 1);
        }

        const errorMessage = data?.details ? `${data.error}: ${data.details}` : (data?.error || data?.message || `API Error: ${response.status} ${response.statusText}`);
        throw new ApiError(errorMessage, response.status, data);
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Retry on network errors if we have retries left
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(`[apiClient] ⚠️ Attempt ${attempt + 1} network error. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return executeRequest(attempt + 1);
      }
      
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  };

  return executeRequest(0);
};
