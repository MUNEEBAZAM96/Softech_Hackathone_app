import type {
  CopilotApiRequest,
  CopilotApiResponse,
  CopilotContextSnapshot,
} from "../types";

const DEFAULT_TIMEOUT_MS = 45_000;

function getCopilotBaseUrl(): string {
  const url =
    typeof process.env.EXPO_PUBLIC_COPILOT_API_URL === "string"
      ? process.env.EXPO_PUBLIC_COPILOT_API_URL.trim()
      : "";
  return url.length > 0 ? url.replace(/\/$/, "") : "http://localhost:3001";
}

export type SendCopilotMessageArgs = {
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  context: CopilotContextSnapshot;
  signal?: AbortSignal;
};

/**
 * Calls the backend proxy `POST /api/copilot`. Never sends API keys from the client.
 */
export async function sendCopilotMessage({
  message,
  history,
  context,
  signal,
}: SendCopilotMessageArgs): Promise<string> {
  const base = getCopilotBaseUrl();
  const url = `${base}/api/copilot`;
  const body: CopilotApiRequest = {
    message: message.trim(),
    history: history.slice(-20),
    context,
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) controller.abort();
    else
      signal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      throw new Error("Copilot returned invalid JSON.");
    }

    if (!res.ok) {
      const err =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : `Request failed (${res.status})`;
      throw new Error(err);
    }

    const parsed = data as Partial<CopilotApiResponse>;
    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) {
      throw new Error("Copilot returned an empty reply.");
    }
    return parsed.reply.trim();
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Request timed out. Check that the copilot server is running.");
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}
