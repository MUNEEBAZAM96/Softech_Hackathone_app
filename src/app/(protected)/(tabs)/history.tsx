import {
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { useMemo, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFinanceData } from "../../../providers/FinanceDataProvider";
import { useAppTheme } from "../../../providers/ThemeProvider";
import { sortByDateDesc } from "../../../services/transactionService";
import TransactionListItem from "../../../components/TransactionListItem";
import type { TransactionKind } from "../../../types";
import { formatCurrency } from "../../../utils/format";

type KindFilter = "all" | TransactionKind;
type PeriodFilter = "day" | "week" | "month" | "year" | "all";

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expense" },
];

const PERIOD_FILTERS: { id: PeriodFilter; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
  { id: "all", label: "All time" },
];

function getRangeStart(period: PeriodFilter, now: Date): Date | null {
  if (period === "day") return startOfDay(now);
  if (period === "week") return startOfWeek(now, { weekStartsOn: 1 });
  if (period === "month") return startOfMonth(now);
  if (period === "year") return startOfYear(now);
  return null;
}

function getPeriodPhrase(period: PeriodFilter): string {
  if (period === "day") return "today";
  if (period === "week") return "this week";
  if (period === "month") return "this month";
  if (period === "year") return "this year";
  return "for all time";
}

function getPeriodHeading(period: PeriodFilter): string {
  if (period === "day") return "Today";
  if (period === "week") return "This week";
  if (period === "month") return "This month";
  if (period === "year") return "This year";
  return "All time";
}

export default function HistoryScreen() {
  const { transactions, user } = useFinanceData();
  const { colors, type, space, radius } = useAppTheme();
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("month");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        controlsWrap: {
          paddingHorizontal: space.s16,
          paddingTop: space.s16,
          gap: space.s8,
        },
        filterRow: {
          paddingVertical: 2,
        },
        filterRowContent: {
          gap: space.s8,
          paddingRight: space.s16,
        },
        filterPill: {
          paddingHorizontal: space.s16,
          paddingVertical: 10,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          minHeight: 42,
          justifyContent: "center",
        },
        filterPillActive: {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        filterText: {
          ...type.captionBold,
          color: colors.textMuted,
        },
        filterTextActive: { color: "#FFFFFF" },
        summaryCard: {
          marginTop: space.s8,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: space.s16,
          gap: space.s8,
        },
        summaryTitle: {
          ...type.titleSmall,
          color: colors.textSecondary,
        },
        summaryMainValue: {
          ...type.title,
          color: colors.text,
        },
        summaryMeta: {
          ...type.caption,
          color: colors.textMuted,
        },
        summaryRow: {
          flexDirection: "row",
          gap: space.s8,
        },
        metricPill: {
          flex: 1,
          borderRadius: radius.md,
          paddingVertical: 8,
          paddingHorizontal: space.s8,
          backgroundColor: colors.surfaceAlt,
          borderWidth: 1,
          borderColor: colors.border,
        },
        metricLabel: {
          ...type.caption,
          color: colors.textMuted,
          marginBottom: 2,
        },
        metricValue: {
          ...type.bodyMedium,
          color: colors.text,
        },
        listContent: {
          paddingHorizontal: space.s16,
          paddingBottom: space.s32,
          paddingTop: space.s16,
        },
        separator: { height: space.s8 },
        empty: {
          marginTop: space.s32,
          alignItems: "center",
          gap: space.s8,
        },
        emptyTitle: { ...type.titleSmall, color: colors.text },
        emptyText: { ...type.body, color: colors.textMuted, textAlign: "center" },
      }),
    [colors, radius, space, type]
  );

  const filtered = useMemo(() => {
    const sorted = sortByDateDesc(transactions);
    const now = new Date();
    const rangeStart = getRangeStart(periodFilter, now);
    return sorted.filter((t) => {
      if (kindFilter !== "all" && t.kind !== kindFilter) return false;
      if (!rangeStart) return true;
      const txnDate = parseISO(t.date);
      return isWithinInterval(txnDate, { start: rangeStart, end: now });
    });
  }, [transactions, kindFilter, periodFilter]);

  const summary = useMemo(() => {
    return filtered.reduce(
      (acc, txn) => {
        if (txn.kind === "income") acc.income += txn.amount;
        else acc.expense += txn.amount;
        acc.count += 1;
        return acc;
      },
      { income: 0, expense: 0, count: 0 }
    );
  }, [filtered]);

  const net = summary.income - summary.expense;
  const currency = user?.currency ?? "PKR";
  const emptySubtitle =
    kindFilter === "all"
      ? `No transactions ${getPeriodPhrase(periodFilter)}.`
      : `No ${kindFilter} transactions ${getPeriodPhrase(periodFilter)}.`;

  return (
    <View style={styles.container}>
      <View style={styles.controlsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRowContent}
          style={styles.filterRow}
        >
          {KIND_FILTERS.map((f) => {
            const active = kindFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setKindFilter(f.id)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${f.label}`}
                accessibilityState={{ selected: active }}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRowContent}
          style={styles.filterRow}
        >
          {PERIOD_FILTERS.map((f) => {
            const active = periodFilter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setPeriodFilter(f.id)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${f.label}`}
                accessibilityState={{ selected: active }}
                style={[styles.filterPill, active && styles.filterPillActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{getPeriodHeading(periodFilter)}</Text>
          <Text style={styles.summaryMainValue}>
            {kindFilter === "income" &&
              formatCurrency(summary.income, currency)}
            {kindFilter === "expense" &&
              formatCurrency(summary.expense, currency)}
            {kindFilter === "all" && formatCurrency(net, currency)}
          </Text>
          <Text style={styles.summaryMeta}>
            {summary.count} {summary.count === 1 ? "transaction" : "transactions"}
          </Text>
          {kindFilter === "all" ? (
            <View style={styles.summaryRow}>
              <View style={styles.metricPill}>
                <Text style={styles.metricLabel}>Income</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(summary.income, currency)}
                </Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricLabel}>Expense</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(summary.expense, currency)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TransactionListItem transaction={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyText}>{emptySubtitle}</Text>
          </View>
        }
      />
    </View>
  );
}
