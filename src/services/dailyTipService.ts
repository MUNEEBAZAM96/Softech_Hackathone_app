import type { FinancialSummary, DailyTipContext, SavingsGoalAnalytics } from "../types";
import type { MonthOverMonthResult } from "./transactionService";

const DEFAULT_TIMEOUT_MS = 45_000;

/** Shown when the API fails or returns empty text (matches legacy static copy). */
export const DAILY_TIP_FALLBACK =
  "Review subscriptions monthly—unused services quietly drain your budget. Small cuts compound into real savings.";

/** Short hint under the card when fetch fails (body still shows {@link DAILY_TIP_FALLBACK}). */
export function getTipFetchUserMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Couldn't load an AI tip — showing an offline suggestion below.";
  }
  const m = error.message;
  if (
    /web page instead of JSON/i.test(m) ||
    /wrong URL/i.test(m) ||
    /EXPO_PUBLIC_COPILOT_API_URL/i.test(m)
  ) {
    return "AI tips need the BudgetIQ proxy: run `npm run server`, set EXPO_PUBLIC_COPILOT_API_URL to http://<your-PC-LAN-IP>:3001 (not localhost on a phone).";
  }
  if (/timed out|Empty response|Can't reach|reachable/i.test(m)) {
    return "Can't reach the tip server — showing an offline tip below.";
  }
  if (/network request failed/i.test(m)) {
    return "Network error — on a real device use http://<your-computer-LAN-IP>:3001 in EXPO_PUBLIC_COPILOT_API_URL (not localhost).";
  }
  if (/invalid data|Expected JSON/i.test(m)) {
    return "Tip server returned unexpected data — check the proxy URL in EXPO_PUBLIC_COPILOT_API_URL.";
  }
  return m.length > 180 ? `${m.slice(0, 177)}…` : m;
}

function getCopilotBaseUrl(): string {
  const url =
    typeof process.env.EXPO_PUBLIC_COPILOT_API_URL === "string"
      ? process.env.EXPO_PUBLIC_COPILOT_API_URL.trim()
      : "";
  return url.length > 0 ? url.replace(/\/$/, "") : "http://localhost:3001";
}

export type BuildDailyTipContextInput = {
  monthKey: string;
  summary: FinancialSummary;
  mom: MonthOverMonthResult;
  /** Already sliced / sorted top expense categories on the dashboard. */
  topCategoryRows: Array<{
    categoryId: string;
    total: number;
    percent: number;
  }>;
  getCategoryName: (categoryId: string) => string;
  budgetAlertsCount: number;
  primaryGoalAnalytics: SavingsGoalAnalytics | null;
  variationSeed: number;
};

export function buildDailyTipContext(
  input: BuildDailyTipContextInput
): DailyTipContext {
  const topCategories = input.topCategoryRows.map((row) => ({
    name: input.getCategoryName(row.categoryId),
    amount: row.total,
    percentOfExpense: row.percent,
  }));

  const primaryGoal =
    input.primaryGoalAnalytics === null
      ? null
      : {
          title: input.primaryGoalAnalytics.title,
          progressPct: Math.round(input.primaryGoalAnalytics.progressPct * 10) / 10,
          pace: input.primaryGoalAnalytics.pace,
          savedAmount: Math.round(input.primaryGoalAnalytics.savedAmount),
          targetAmount: Math.round(input.primaryGoalAnalytics.targetAmount),
          daysLeft: input.primaryGoalAnalytics.daysLeft,
        };

  return {
    currency: "PKR",
    monthKey: input.monthKey,
    balance: Math.round(input.summary.balance),
    income: Math.round(input.summary.income),
    expense: Math.round(input.summary.expense),
    monthOverMonth: {
      currentMonthNet: Math.round(input.mom.currentMonthNet),
      previousMonthNet: Math.round(input.mom.previousMonthNet),
      percentChangeVsPrevious:
        input.mom.percentChangeVsPrevious === null
          ? null
          : Math.round(input.mom.percentChangeVsPrevious * 10) / 10,
    },
    topCategories,
    budgetAlertsCount: input.budgetAlertsCount,
    primaryGoal,
    variationSeed: input.variationSeed,
    generatedAt: new Date().toISOString(),
  };
}

type FetchDailyTipOptions = {
  signal?: AbortSignal;
};

/** Parse JSON from fetch body; surface clear hints when the proxy URL is wrong or returns HTML. */
function parseDailyTipResponseBody(
  raw: string,
  res: Response,
  requestUrl: string
): unknown {
  const text = raw.replace(/^\uFEFF/, "").trim();
  if (!text) {
    throw new Error(
      "Tip server returned an empty response. Start the proxy with `npm run server` and set EXPO_PUBLIC_COPILOT_API_URL to that host (use your LAN IP on a physical device, not localhost)."
    );
  }

  const lower = text.slice(0, 64).toLowerCase();
  if (text.startsWith("<") || lower.includes("<!doctype") || lower.includes("<html")) {
    throw new Error(
      "Tip server returned a web page instead of JSON — EXPO_PUBLIC_COPILOT_API_URL is probably wrong (e.g. Metro :8081, or localhost from a phone). Use http://<your-computer-LAN-IP>:3001 with `npm run server` running."
    );
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    const ct = res.headers.get("content-type") ?? "";
    const hint = ct.includes("json")
      ? "Response was not valid JSON."
      : `Expected JSON but got ${ct || "unknown content-type"}.`;
    throw new Error(
      `${hint} URL used: ${requestUrl}. Fix EXPO_PUBLIC_COPILOT_API_URL or restart the copilot proxy.`
    );
  }
}

/**
 * Calls `POST /api/daily-tip`. No secrets on the client.
 */
export async function fetchDailyTip(
  context: DailyTipContext,
  options?: FetchDailyTipOptions
): Promise<string> {
  const base = getCopilotBaseUrl();
  const url = `${base}/api/daily-tip`;
  let payload: string;
  try {
    payload = JSON.stringify({ context, seed: context.variationSeed });
  } catch {
    throw new Error("Could not build tip request. Try again after refreshing.");
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const signal = options?.signal;
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
      body: payload,
      signal: controller.signal,
    });

    const rawText = await res.text();
    const data = parseDailyTipResponseBody(rawText, res, url);

    if (!res.ok) {
      const err =
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : `Request failed (${res.status}).`;
      throw new Error(err);
    }

    const tip =
      typeof data === "object" &&
      data !== null &&
      "tip" in data &&
      typeof (data as { tip: unknown }).tip === "string"
        ? (data as { tip: string }).tip.trim()
        : "";
    if (!tip) {
      throw new Error("Tip server returned an empty tip.");
    }
    return tip;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error(
        "Tip request timed out. Check that the copilot server is running (`npm run server`) and EXPO_PUBLIC_COPILOT_API_URL is reachable from this device."
      );
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}
