import type {
  Category,
  ReceiptDraft,
  ReceiptParseRequest,
  ReceiptParseResponse,
} from "../types";

const DEFAULT_TIMEOUT_MS = 55_000;

function getCopilotBaseUrl(): string {
  const url =
    typeof process.env.EXPO_PUBLIC_COPILOT_API_URL === "string"
      ? process.env.EXPO_PUBLIC_COPILOT_API_URL.trim()
      : "";
  return url.length > 0 ? url.replace(/\/$/, "") : "http://localhost:3001";
}

export async function parseReceiptImage(
  body: ReceiptParseRequest,
  signal?: AbortSignal
): Promise<ReceiptParseResponse> {
  const base = getCopilotBaseUrl();
  const url = `${base}/api/receipt-parse`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
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
      data = JSON.parse(text);
    } catch {
      return {
        ok: false,
        code: "SERVER_ERROR",
        message: "Server returned invalid response. Please try again.",
      };
    }

    if (!res.ok) {
      const fallback = `Receipt parsing failed (${res.status})`;
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof (data as { message: unknown }).message === "string"
          ? (data as { message: string }).message
          : fallback;
      const code =
        typeof data === "object" &&
        data !== null &&
        "code" in data &&
        typeof (data as { code: unknown }).code === "string"
          ? ((data as { code: string }).code as ReceiptParseResponse extends {
              ok: false;
              code: infer C;
            }
              ? C
              : never)
          : "SERVER_ERROR";
      return { ok: false, code, message };
    }

    const parsed = data as ReceiptParseResponse;
    if (typeof parsed !== "object" || parsed == null || !("ok" in parsed)) {
      return {
        ok: false,
        code: "SERVER_ERROR",
        message: "Server returned malformed receipt data.",
      };
    }
    return parsed;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return {
        ok: false,
        code: "SERVER_ERROR",
        message: "Parsing timed out. Please check network and try again.",
      };
    }
    return {
      ok: false,
      code: "SERVER_ERROR",
      message: "Could not connect to the scan service. Please try again.",
    };
  } finally {
    clearTimeout(t);
  }
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function mapSuggestedCategory(
  draft: ReceiptDraft,
  categories: Category[]
): Category | null {
  const suggested = draft.suggestedCategoryName?.trim();
  if (!suggested) return null;
  const normalized = normalizeName(suggested);
  const sameKind = categories.filter((c) => c.kind === draft.kind);

  const exact = sameKind.find((c) => normalizeName(c.name) === normalized);
  if (exact) return exact;

  const fuzzy = sameKind.find((c) => {
    const n = normalizeName(c.name);
    return n.includes(normalized) || normalized.includes(n);
  });
  return fuzzy ?? null;
}
