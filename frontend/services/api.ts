// ============================================================
//  DocuAgent AI Engine - Typed API Service Layer
//  Maps exactly to the FastAPI/Pydantic backend contracts
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Type Definitions ────────────────────────────────────────

export interface ArchitectureComponent {
  name: string;
  purpose: string;
}

export interface TechnicalDocumentationSchema {
  project_title: string;
  executive_summary: string;
  components: ArchitectureComponent[];
  documentation_markdown: string;
  mermaid_graph: string;
  pull_request_template: string;
}

export interface DiffUpdateSchema {
  updated_documentation_markdown: string;
  change_summary_bullets: string[];
}

export interface ApiError {
  type: "network" | "server" | "validation";
  message: string;
  status?: number;
}

// ─── Backend Response Wrapper ─────────────────────────────────
interface BackendEnvelope<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// ─── Error Event Bus ─────────────────────────────────────────
export function dispatchApiError(error: ApiError): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("docuagent:api-error", { detail: error })
    );
  }
}

// ─── Core Fetch Wrapper ──────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit
): Promise<T | null> {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    // ✨ NEW PRODUCTION QUOTA GUARD FOR RENDER
    if (response.status === 429) {
      dispatchApiError({
        type: "server",
        message: "Demo Tier Quota Exceeded! The shared free AI capacity is temporarily full. Please wait a minute for the rate window to reset before submitting again.",
        status: 429,
      });
      return null;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "Unknown server error");
      dispatchApiError({
        type: "server",
        message: `Server responded with ${response.status}: ${body}`,
        status: response.status,
      });
      return null;
    }

    const json = await response.json();

    // ── Unwrap the backend's { success, data, error } envelope ──
    if (
      json !== null &&
      typeof json === "object" &&
      "success" in json
    ) {
      const envelope = json as BackendEnvelope<T>;

      if (!envelope.success) {
        dispatchApiError({
          type: "server",
          message:
            envelope.error ??
            "The server pipeline failed. Check your Gemini API key and try again.",
        });
        return null;
      }

      return envelope.data ?? null;
    }

    return json as T;

  } catch (err: unknown) {
    const isNetworkError =
      err instanceof TypeError && err.message.includes("fetch");

    dispatchApiError({
      type: isNetworkError ? "network" : "validation",
      message: isNetworkError
        ? "Cannot reach the backend. Make sure the server is running on port 8000."
        : err instanceof Error
        ? err.message
        : "An unexpected error occurred.",
    });

    return null;
  }
}

// ─── Public API Methods ──────────────────────────────────────

/**
 * POST /api/generate-docs
 * Accepts a GitHub repository URL and returns full structured documentation.
 */
export async function generateDocs(
  repoUrl: string
): Promise<TechnicalDocumentationSchema | null> {
  return apiFetch<TechnicalDocumentationSchema>("/api/generate-docs", {
    method: "POST",
    body: JSON.stringify({ repo_url: repoUrl }),
  });
}

/**
 * POST /api/update-docs-from-diff
 * Accepts current docs + a raw git diff string; returns updated docs and a change summary.
 */
export async function updateDocsFromDiff(
  currentDocs: string,
  rawDiff: string
): Promise<DiffUpdateSchema | null> {
  return apiFetch<DiffUpdateSchema>("/api/update-docs-from-diff", {
    method: "POST",
    body: JSON.stringify({ current_docs: currentDocs, raw_diff: rawDiff }),
  });
}