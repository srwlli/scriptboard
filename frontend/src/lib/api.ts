/**
 * API client helper for Scriptboard frontend.
 * Wraps all HTTP calls with base URL from NEXT_PUBLIC_BACKEND_URL.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || "GET";
    
    // Only set Content-Type for requests that have a body
    const headers: HeadersInit = {
      ...options.headers,
    };
    
    // Only add Content-Type for POST, PUT, PATCH requests
    if (["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      headers["Content-Type"] = "application/json";
    }
    
    let response: Response;
    try {
      // For GET requests, ensure no body is sent
      const fetchOptions: RequestInit = {
        method,
        headers,
      };
      
      // Only include body for non-GET requests
      if (method.toUpperCase() !== "GET" && options.body) {
        fetchOptions.body = options.body;
      }
      
      // Include other options (like credentials, cache, etc.) but exclude body for GET
      const { body, ...otherOptions } = options;
      if (method.toUpperCase() !== "GET") {
        Object.assign(fetchOptions, otherOptions);
      } else {
        // For GET, only copy safe options
        if (otherOptions.credentials) fetchOptions.credentials = otherOptions.credentials;
        if (otherOptions.cache) fetchOptions.cache = otherOptions.cache;
        if (otherOptions.mode) fetchOptions.mode = otherOptions.mode;
      }
      
      response = await fetch(url, fetchOptions);
    } catch (error) {
      // Network error (e.g., backend not running, CORS issue)
      const networkError = error instanceof Error ? error.message : "Network error";
      throw new Error(`Failed to connect to backend: ${networkError}`);
    }

    if (!response.ok) {
      let errorData: any;
      let errorMessage: string;
      
      // Log the request details for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error(`API Error: ${method} ${url} - Status: ${response.status}`);
      }
      
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await response.json();
        } else {
          // Not JSON, try to read as text
          const text = await response.text();
          errorData = text || null;
        }
      } catch (parseError) {
        // Failed to parse response
        errorData = null;
      }
      
      // Handle various error response formats
      try {
        if (errorData?.error?.message) {
          errorMessage = String(errorData.error.message);
        } else if (errorData?.error && typeof errorData.error === "string") {
          errorMessage = errorData.error;
        } else if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData?.message) {
          errorMessage = String(errorData.message);
        } else if (errorData?.detail) {
          // FastAPI often returns {detail: "message"}
          errorMessage = String(errorData.detail);
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
      } catch {
        // Fallback if anything goes wrong parsing the error
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      // Ensure errorMessage is never empty or undefined
      if (!errorMessage || errorMessage.trim() === "") {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      // Add more context for 405 errors
      if (response.status === 405) {
        errorMessage = `${errorMessage} (Endpoint: ${method} ${endpoint})`;
      }
      
      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch (parseError) {
      throw new Error("Invalid JSON response from server");
    }
  }

  // Health and Session
  async health() {
    return this.request<{ status: string }>("/health");
  }

  async getSession() {
    return this.request<{ has_prompt: boolean; prompt_source?: string; attachment_count: number; response_count: number; total_chars: number }>("/session");
  }

  // Prompt endpoints
  async setPrompt(text: string) {
    return this.request("/prompt", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  async clearPrompt() {
    return this.request("/prompt", { method: "DELETE" });
  }

  async getPreloadedPrompts() {
    return this.request<{ prompts: Array<{ key: string; label: string; preview: string }> }>("/prompts");
  }

  async addPreloadedPrompt(label: string, text: string) {
    return this.request<{ status: string; key: string }>("/prompts", {
      method: "POST",
      body: JSON.stringify({ label, text }),
    });
  }

  async usePreloadedPrompt(key: string) {
    return this.request("/prompt/preloaded", {
      method: "POST",
      body: JSON.stringify({ key }),
    });
  }

  // Attachment endpoints
  async addAttachmentText(text: string, suggestedName?: string) {
    return this.request("/attachments/text", {
      method: "POST",
      body: JSON.stringify({ text, suggested_name: suggestedName }),
    });
  }

  async listAttachments() {
    return this.request("/attachments");
  }

  async clearAttachments() {
    return this.request("/attachments", { method: "DELETE" });
  }

  async importFolder(path: string) {
    return this.request<{ status: string; imported: number; skipped: number; files: string[] }>("/attachments/folder", {
      method: "POST",
      body: JSON.stringify({ path }),
    });
  }

  // Response endpoints
  async addResponse(text: string) {
    return this.request("/responses", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  }

  async getResponsesSummary() {
    return this.request<{ count: number; char_count: number; responses: Array<{ id: string; source: string; char_count: number }> }>("/responses/summary");
  }

  async getResponses() {
    return this.request<{ responses: Array<{ id: string; source: string; content: string; char_count: number }> }>("/responses");
  }

  async clearResponses() {
    return this.request("/responses", { method: "DELETE" });
  }

  // Preview and export
  async getPreview() {
    return this.request<{ preview: string }>("/preview");
  }

  async getPreviewFull() {
    return this.request<{ preview: string }>("/preview/full");
  }

  async exportJson() {
    return this.request("/export/json");
  }

  async exportLlmFriendly() {
    return this.request<{ text: string }>("/export/llm", {
      method: "GET",
    });
  }

  async exportLlmFriendlyPrompt() {
    // Explicitly use GET method without any body
    return this.request<{ text: string }>("/export/llm/prompt", {
      method: "GET",
      body: undefined, // Ensure no body is sent
    });
  }

  async exportLlmFriendlyAttachments() {
    return this.request<{ text: string }>("/export/llm/attachments", {
      method: "GET",
    });
  }

  async exportLlmFriendlyResponses() {
    return this.request<{ text: string }>("/export/llm/responses", {
      method: "GET",
    });
  }

  async exportMarkdown() {
    return this.request<{ markdown: string; filename: string }>("/export/markdown");
  }

  // Search
  async search(query: string, limit = 20, offset = 0) {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return this.request(`/search?${params}`);
  }

  // Tokens
  async getTokens() {
    return this.request("/tokens");
  }

  // Session and autosave
  async saveSession(filename?: string) {
    const params = filename ? `?filename=${encodeURIComponent(filename)}` : "";
    return this.request<{ status: string; filename: string }>(`/sessions/save${params}`, { method: "POST" });
  }

  async loadSession(path: string) {
    return this.request("/sessions/load", {
      method: "POST",
      body: JSON.stringify({ path }),
    });
  }

  async getAutosaveStatus() {
    return this.request("/autosave/status");
  }

  async recoverAutosave() {
    return this.request("/autosave/recover", { method: "POST" });
  }

  // Profiles and config
  async listProfiles() {
    return this.request<{ profiles: Array<{ name: string; has_favorites?: boolean; has_view_settings?: boolean }> }>("/profiles");
  }

  async loadProfile(name: string) {
    return this.request("/profiles/load", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async getConfig() {
    return this.request<{ favorites?: Array<{ label: string; path: string }>; llm_urls?: Array<{ label: string; url: string }>; keymap?: Record<string, string>; [key: string]: any }>("/config");
  }

  // Batch processing (Phase-2)
  async enqueueBatch(prompt: string, models: string[]) {
    return this.request("/batch/enqueue", {
      method: "POST",
      body: JSON.stringify({ prompt, models }),
    });
  }

  async getBatchJobs() {
    return this.request<{ jobs: Array<{ id: string; prompt: string; model: string; status: string; error?: string }> }>("/batch/jobs");
  }

  async cancelBatchJob(jobId: string) {
    return this.request(`/batch/jobs/${jobId}/cancel`, {
      method: "POST",
    });
  }

  // Git integration (Phase-2)
  async getGitStatus() {
    return this.request("/git/status");
  }

  async commitSession(message: string, sessionPath?: string) {
    return this.request("/git/commit", {
      method: "POST",
      body: JSON.stringify({ message, session_path: sessionPath }),
    });
  }

  // Direct LLM API Mode (Phase-2)
  async callLLM(provider: string, model: string, prompt: string) {
    return this.request("/llm/call", {
      method: "POST",
      body: JSON.stringify({ provider, model, prompt }),
    });
  }

  async getLLMProviders() {
    return this.request("/llm/providers");
  }
}

export const api = new ApiClient(API_BASE_URL);

