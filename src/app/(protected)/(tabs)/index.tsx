import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useAtomValue } from "jotai";

import { transactionsAtom } from "../../../atoms";
import { colors, radius, spacing, typography } from "../../../constants/theme";
import { getCategoryById } from "../../../constants/categories";
import {
  sortByDateDesc,
  summarize,
} from "../../../services/transactionService";
import { generateInsights } from "../../../services/insightsService";
import { formatCurrency } from "../../../utils/format";

import StatCard from "../../../components/StatCard";
import TransactionListItem from "../../../components/TransactionListItem";
import InsightCard from "../../../components/InsightCard";

export default function DashboardScreen() {
  const transactions = useAtomValue(transactionsAtom);

  const summary = useMemo(() => summarize(transactions), [transactions]);
  const insights = useMemo(() => generateInsights(transactions), [transactions]);
  const recent = useMemo(
    () => sortByDateDesc(transactions).slice(0, 4),
    [transactions]
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{formatCurrency(summary.balance)}</Text>
        <View style={styles.balanceFooter}>
          <View style={styles.balancePill}>
            <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
            <Text style={styles.balancePillText}>
              {formatCurrency(summary.income)}
            </Text>
          </View>
          <View style={[styles.balancePill, { backgroundColor: "#00000030" }]}>
            <Ionicons name="arrow-down" size={14} color="#FFFFFF" />
            <Text style={styles.balancePillText}>
              {formatCurrency(summary.expense)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard
          label="Income"
          amount={summary.income}
          icon="trending-up-outline"
          tint={colors.income}
        />
        <StatCard
          label="Expense"
          amount={summary.expense}
          icon="trending-down-outline"
          tint={colors.expense}
        />
      </View>

      <SectionHeader title="Top Spending" />
      <View style={styles.card}>
        {summary.byCategory.length === 0 ? (
          <Text style={styles.muted}>No expenses yet.</Text>
        ) : (
          summary.byCategory.slice(0, 4).map((row) => {
            const category = getCategoryById(row.categoryId);
            return (
              <View key={row.categoryId} style={styles.categoryRow}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: category?.color ?? colors.primary },
                  ]}
                />
                <Text style={styles.categoryName}>{category?.name}</Text>
                <Text style={styles.categoryPercent}>{row.percent}%</Text>
                <Text style={styles.categoryAmount}>
                  {formatCurrency(row.total)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <SectionHeader title="AI Insight" />
      {insights.slice(0, 1).map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}

      <SectionHeader title="Recent Transactions" actionHref="/history" />
      <View style={{ gap: spacing.sm }}>
        {recent.length === 0 ? (
          <Text style={styles.muted}>No transactions yet.</Text>
        ) : (
          recent.map((t) => (
            <TransactionListItem key={t.id} transaction={t} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function SectionHeader({
  title,
  actionHref,
}: {
  title: string;
  actionHref?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionHref && (
        <Link href={actionHref as any} asChild>
          <Text style={styles.sectionAction}>See all</Text>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  balanceLabel: {
    color: "#E0E7FF",
    fontSize: 13,
    fontWeight: "500",
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "700",
  },
  balanceFooter: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF30",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  balancePillText: { color: "#FFFFFF", fontWeight: "600", fontSize: 12 },
  statsRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  sectionTitle: { ...typography.h3 },
  sectionAction: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    ...typography.body,
    flex: 1,
  },
  categoryPercent: {
    ...typography.caption,
    width: 40,
    textAlign: "right",
  },
  categoryAmount: {
    ...typography.body,
    fontWeight: "600",
    width: 110,
    textAlign: "right",
  },
  muted: { ...typography.bodyMuted },
});
