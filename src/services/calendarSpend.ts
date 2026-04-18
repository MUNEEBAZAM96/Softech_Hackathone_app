import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export type MonthExpenseSummary = {
  total: number;
  expenseTransactionCount: number;
  /** Calendar days in month (28–31) — used for avg daily denominator */
  daysInMonth: number;
  avgDailySpend: number;
  prevMonthTotal: number;
  /** null if not comparable */
  percentChangeVsPrevious: number | null;
};
import type { Transaction } from "../types";

export { addMonths, subMonths, isSameMonth };

/** Local calendar day key (YYYY-MM-DD), consistent with `format` in local timezone. */
export function getLocalDayKey(isoDate: string): string {
  return format(parseISO(isoDate), "yyyy-MM-dd");
}

/** Sum of expenses per local day (all time; look up by key). */
export function buildDailyExpenseTotals(
  transactions: Transaction[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind !== "expense") continue;
    const key = getLocalDayKey(t.date);
    map.set(key, (map.get(key) ?? 0) + t.amount);
  }
  return map;
}

/** All transactions that fall on the given local day. */
export function getTransactionsOnLocalDay(
  transactions: Transaction[],
  dayKey: string
): Transaction[] {
  return transactions.filter((t) => getLocalDayKey(t.date) === dayKey);
}

/** Total expenses only for that local day. */
export function getExpenseTotalForDayKey(
  dailyTotals: Map<string, number>,
  dayKey: string
): number {
  return dailyTotals.get(dayKey) ?? 0;
}

/**
 * Days to render in the grid: from Sunday-start week containing month start
 * through Sunday-start week containing month end.
 */
export function getCalendarGridDays(visibleMonth: Date): Date[] {
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/** Total expense transactions in the given calendar month (local dates). */
export function sumExpensesInCalendarMonth(
  transactions: Transaction[],
  monthAnchor: Date
): number {
  const start = startOfMonth(monthAnchor);
  const end = endOfMonth(monthAnchor);
  let sum = 0;
  for (const t of transactions) {
    if (t.kind !== "expense") continue;
    const d = parseISO(t.date);
    if (d >= start && d <= end) sum += t.amount;
  }
  return sum;
}

/** Premium summary row: totals, counts, avg/day (÷ days in month), vs previous month %. */
export function getMonthExpenseSummary(
  transactions: Transaction[],
  monthAnchor: Date
): MonthExpenseSummary {
  const start = startOfMonth(monthAnchor);
  const end = endOfMonth(monthAnchor);
  const daysInMonth = eachDayOfInterval({ start, end }).length;

  const prevMonth = subMonths(monthAnchor, 1);
  const prevStart = startOfMonth(prevMonth);
  const prevEnd = endOfMonth(prevMonth);

  let total = 0;
  let expenseTransactionCount = 0;
  for (const t of transactions) {
    if (t.kind !== "expense") continue;
    const d = parseISO(t.date);
    if (d >= start && d <= end) {
      total += t.amount;
      expenseTransactionCount += 1;
    }
  }

  let prevMonthTotal = 0;
  for (const t of transactions) {
    if (t.kind !== "expense") continue;
    const d = parseISO(t.date);
    if (d >= prevStart && d <= prevEnd) prevMonthTotal += t.amount;
  }

  let percentChangeVsPrevious: number | null = null;
  if (prevMonthTotal > 0) {
    percentChangeVsPrevious = ((total - prevMonthTotal) / prevMonthTotal) * 100;
  }

  return {
    total,
    expenseTransactionCount,
    daysInMonth,
    avgDailySpend: daysInMonth > 0 ? total / daysInMonth : 0,
    prevMonthTotal,
    percentChangeVsPrevious,
  };
}

export function maxDailyExpenseInVisibleMonth(
  dailyTotals: Map<string, number>,
  visibleMonth: Date
): number {
  const start = startOfMonth(visibleMonth);
  const end = endOfMonth(visibleMonth);
  let max = 0;
  for (const d of eachDayOfInterval({ start, end })) {
    const key = format(d, "yyyy-MM-dd");
    max = Math.max(max, dailyTotals.get(key) ?? 0);
  }
  return max;
}
