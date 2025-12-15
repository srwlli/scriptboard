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
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
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
    return this.request<{ favorites?: Array<{ label: string; path: string }>; llm_urls?: Array<{ label: string; url: string }>; keymap?: Record<string, string>;[key: string]: any }>("/config");
  }

  async addFavorite(label: string, path: string) {
    return this.request<{ status: string }>("/favorites", {
      method: "POST",
      body: JSON.stringify({ label, path }),
    });
  }

  async removeFavorite(index: number) {
    return this.request<{ status: string }>(`/favorites/${index}`, {
      method: "DELETE",
    });
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

  // Macro / Key Logger endpoints (Key-Logger feature)
  async startRecording() {
    return this.request<{ status: string }>("/macros/record/start", {
      method: "POST",
    });
  }

  async stopRecording() {
    return this.request<{ status: string; events?: Array<{ type: string; ts_delta_ms: number; key?: string; clipboard_text?: string; delay_ms?: number; window_title?: string }> }>("/macros/record/stop", {
      method: "POST",
    });
  }

  async saveMacro(name: string, events: Array<{ type: string; ts_delta_ms: number; key?: string; clipboard_text?: string; delay_ms?: number; window_title?: string }>) {
    return this.request<{ id: string; name: string; path: string; created_at: string }>("/macros/save", {
      method: "POST",
      body: JSON.stringify({ name, events }),
    });
  }
  // SSE stream URL for live event streaming during recording
  getRecordingStreamUrl(): string {
    return `${this.baseUrl}/macros/record/stream`;
  }

  // System Process Monitor endpoints
  async getSystemStats() {
    return this.request<SystemStats>("/system/stats");
  }

  async getProcesses(params?: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
    filter_name?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.page_size) searchParams.set("page_size", params.page_size.toString());
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    if (params?.filter_name) searchParams.set("filter_name", params.filter_name);

    const query = searchParams.toString();
    return this.request<ProcessListResponse>(`/system/processes${query ? `?${query}` : ""}`);
  }

  async getAppProcesses() {
    return this.request<ProcessListResponse>("/system/processes/app");
  }

  async killProcess(pid: number, force?: boolean) {
    return this.request<KillProcessResponse>("/system/processes/kill", {
      method: "POST",
      body: JSON.stringify({ pid, force }),
    });
  }

  async getProtectedProcesses() {
    return this.request<{ protected: string[] }>("/system/protected-processes");
  }

  async getDetailedProcesses(params?: {
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: string;
    filter_name?: string;
    filter_category?: string;
    include_system?: boolean;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.page_size) searchParams.set("page_size", params.page_size.toString());
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    if (params?.filter_name) searchParams.set("filter_name", params.filter_name);
    if (params?.filter_category) searchParams.set("filter_category", params.filter_category);
    if (params?.include_system !== undefined) searchParams.set("include_system", params.include_system.toString());

    const query = searchParams.toString();
    return this.request<DetailedProcessListResponse>(`/system/processes/detailed${query ? `?${query}` : ""}`);
  }

  // =========================================================================
  // FileManager endpoints
  // =========================================================================

  async filemanOrganize(params: OrganizeParams): Promise<PreviewResponse> {
    return this.request<PreviewResponse>("/fileman/organize", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async filemanRename(params: RenameParams): Promise<PreviewResponse> {
    return this.request<PreviewResponse>("/fileman/rename", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async filemanClean(params: CleanParams): Promise<PreviewResponse> {
    return this.request<PreviewResponse>("/fileman/clean", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async filemanIndex(params: IndexParams): Promise<IndexResponse> {
    return this.request<IndexResponse>("/fileman/index", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async filemanDupes(params: DupesParams): Promise<DupesResponse> {
    return this.request<DupesResponse>("/fileman/dupes", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async filemanGetHistory(): Promise<ActionHistoryResponse> {
    return this.request<ActionHistoryResponse>("/fileman/history");
  }

  async filemanUndo(batchIndex?: number, apply: boolean = false): Promise<PreviewResponse> {
    return this.request<PreviewResponse>("/fileman/undo", {
      method: "POST",
      body: JSON.stringify({ batch_index: batchIndex, apply }),
    });
  }

  async filemanClearHistory(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/fileman/history", {
      method: "DELETE",
    });
  }

  // SSE stream URLs for FileManager
  getFilemanIndexStreamUrl(params: IndexParams): string {
    const searchParams = new URLSearchParams();
    searchParams.set("path", params.path);
    if (params.include_hash) searchParams.set("include_hash", "true");
    if (params.hash_algo) searchParams.set("hash_algo", params.hash_algo);
    if (params.recursive !== undefined) searchParams.set("recursive", String(params.recursive));
    if (params.exclude?.length) searchParams.set("exclude", params.exclude.join(","));
    return `${this.baseUrl}/fileman/index/stream?${searchParams}`;
  }

  getFilemanDupesStreamUrl(params: DupesStreamParams): string {
    const searchParams = new URLSearchParams();
    searchParams.set("path", params.path);
    if (params.hash_algo) searchParams.set("hash_algo", params.hash_algo);
    if (params.recursive !== undefined) searchParams.set("recursive", String(params.recursive));
    if (params.exclude?.length) searchParams.set("exclude", params.exclude.join(","));
    return `${this.baseUrl}/fileman/dupes/stream?${searchParams}`;
  }
}

// =========================================================================
// FileManager interfaces
// =========================================================================

export interface FileAction {
  op: string;
  src: string;
  dst?: string;
  meta?: Record<string, unknown>;
}

export interface PreviewResponse {
  actions: FileAction[];
  files_scanned: number;
  total_size_bytes: number;
  message?: string;
}

export interface OrganizeParams {
  path: string;
  by?: "ext" | "date" | "month";
  dest?: string;
  recursive?: boolean;
  exclude?: string[];
  include?: string[];
  remove_empty?: boolean;
  apply?: boolean;
}

export interface RenameParams {
  path: string;
  pattern?: string;
  replace?: string;
  prefix?: string;
  suffix?: string;
  lower?: boolean;
  upper?: boolean;
  sanitize?: boolean;
  enumerate_files?: boolean;
  start?: number;
  step?: number;
  width?: number;
  ext_filter?: string;
  recursive?: boolean;
  exclude?: string[];
  apply?: boolean;
}

export interface CleanParams {
  path: string;
  older_than_days?: number;
  larger_than_mb?: number;
  archive_dir?: string;
  use_trash?: boolean;
  delete_permanently?: boolean;
  remove_empty?: boolean;
  recursive?: boolean;
  exclude?: string[];
  apply?: boolean;
}

export interface IndexParams {
  path: string;
  include_hash?: boolean;
  hash_algo?: string;
  recursive?: boolean;
  exclude?: string[];
}

export interface IndexResponse {
  files: Array<{
    path: string;
    name: string;
    size_bytes: number;
    mtime_epoch: number;
    [key: string]: unknown; // hash field
  }>;
  total_files: number;
  total_size_bytes: number;
}

export interface DupesParams {
  path: string;
  hash_algo?: string;
  action?: "list" | "trash" | "delete" | "archive";
  archive_dir?: string;
  recursive?: boolean;
  exclude?: string[];
  apply?: boolean;
}

export interface DupesStreamParams {
  path: string;
  hash_algo?: string;
  recursive?: boolean;
  exclude?: string[];
}

export interface DupeGroup {
  hash: string;
  hash_algo: string;
  size_bytes: number;
  count: number;
  keep: string;
  duplicates: string[];
  wasted_bytes?: number;
  actions?: Array<Record<string, unknown>>;
}

export interface DupesResponse {
  groups: DupeGroup[];
  total_groups: number;
  total_duplicates: number;
  total_wasted_bytes: number;
}

export interface ActionHistoryBatch {
  index: number;
  actions: FileAction[];
  count: number;
}

export interface ActionHistoryResponse {
  batches: ActionHistoryBatch[];
  total_batches: number;
}

// System Monitor interfaces
export interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  memory_used_gb: number;
  memory_total_gb: number;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  memory_mb: number;
  status: string;
  is_protected: boolean;
}

export interface ProcessListResponse {
  processes: ProcessInfo[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface KillProcessResponse {
  success: boolean;
  pid: number;
  message: string;
}

// System Monitor v2 - Detailed Process interfaces
export type ProcessCategory =
  | "browser"
  | "dev"
  | "system"
  | "app"
  | "media"
  | "communication"
  | "security"
  | "other";

export interface DetailedProcessInfo {
  // Basic info
  pid: number;
  name: string;
  cpu_percent: number;
  memory_percent: number;
  memory_mb: number;
  status: string;
  is_protected: boolean;

  // Category and description
  category: ProcessCategory;
  description: string;
  icon: string;

  // Extended details
  path: string | null;
  cmdline: string | null;
  parent_pid: number | null;
  children_count: number;
  threads: number;
  handles: number;
  start_time: string | null;
  uptime_seconds: number;

  // History (last 60 samples)
  cpu_history: number[];
  memory_history: number[];

  // Flags
  is_new: boolean; // Started within last 5 minutes
}

export interface DetailedProcessListResponse {
  processes: DetailedProcessInfo[];
  total_count: number;
  page: number;
  page_size: number;
  categories: Record<string, number>;
}

export const api = new ApiClient(API_BASE_URL);