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
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          error: {
            code: "UNKNOWN_ERROR",
            message: `HTTP ${response.status}: ${response.statusText}`,
          },
        };
      }
      throw new Error(errorData.error.message);
    }

    return response.json();
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

