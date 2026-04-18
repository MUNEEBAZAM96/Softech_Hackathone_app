import type { CopilotQuickAction } from "../types";

export const COPILOT_QUICK_ACTIONS: CopilotQuickAction[] = [
  {
    id: "afford",
    label: "Can I afford X?",
    prompt:
      "I want to know if I can afford a large purchase this month. Consider PKR 50,000 as an example amount. Use only my CONTEXT_JSON: balance, budgets, and goals. Give Verdict / Why / Action.",
  },
  {
    id: "food",
    label: "Reduce Food spend",
    prompt:
      "How can I reduce Food & Dining spending this month? Use my budget row for food (if present) and top categories. Give Verdict / Why / Action.",
  },
  {
    id: "emergency",
    label: "Plan emergency fund",
    prompt:
      "Help me plan my emergency fund using my active savings goals in CONTEXT_JSON. Mention remaining amount, required per day if shown, and pace. Give Verdict / Why / Action.",
  },
];
