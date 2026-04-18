import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAtomValue } from "jotai";

import { transactionsAtom } from "../../../atoms";
import { colors, space, type } from "../../../constants/theme";
import { getCategoryById } from "../../../constants/categories";
import {
  getMonthOverMonthNet,
  sortByDateDesc,
  summarize,
} from "../../../services/transactionService";
import { generateInsights } from "../../../services/insightsService";

import DashboardHero from "../../../components/dashboard/DashboardHero";
import KPIBlock from "../../../components/dashboard/KPIBlock";
import SectionHeading from "../../../components/dashboard/SectionHeading";
import AppCard from "../../../components/ui/AppCard";
import CategoryProgressRow from "../../../components/dashboard/CategoryProgressRow";
import AITipOfTheDay from "../../../components/dashboard/AITipOfTheDay";
import InsightCard from "../../../components/InsightCard";
import TransactionListItem from "../../../components/TransactionListItem";

export default function DashboardScreen() {
  const transactions = useAtomValue(transactionsAtom);

  const summary = useMemo(() => summarize(transactions), [transactions]);
  const mom = useMemo(() => getMonthOverMonthNet(transactions), [transactions]);
  const insights = useMemo(
    () => generateInsights(transactions),
    [transactions]
  );
  const recent = useMemo(
    () => sortByDateDesc(transactions).slice(0, 4),
    [transactions]
  );

  const topCategories = useMemo(
    () => summary.byCategory.slice(0, 5),
    [summary.byCategory]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Overview</Text>
      <Text style={styles.screenSubtitle}>
        Your money at a glance — balance, flow, and focus areas.
      </Text>

      <DashboardHero totalBalance={summary.balance} mom={mom} />

      <View style={styles.section}>
        <SectionHeading title="This period" />
        <View style={styles.kpiRow}>
          <KPIBlock
            label="Balance"
            value={summary.balance}
            icon="wallet-outline"
            variant="neutral"
          />
          <KPIBlock
            label="Income"
            value={summary.income}
            icon="trending-up-outline"
            variant="success"
          />
          <KPIBlock
            label="Expense"
            value={summary.expense}
            icon="trending-down-outline"
            variant="danger"
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeading title="Spending by category" />
        <AppCard>
          {topCategories.length === 0 ? (
            <Text style={styles.muted}>No expenses yet — add one to see breakdown.</Text>
          ) : (
            <View style={styles.categoryStack}>
              {topCategories.map((row) => {
                const category = getCategoryById(row.categoryId);
                return (
                  <CategoryProgressRow
                    key={row.categoryId}
                    name={category?.name ?? "Other"}
                    amount={row.total}
                    percentOfTotal={row.percent}
                    barColor={category?.color ?? colors.primary}
                  />
                );
              })}
            </View>
          )}
        </AppCard>
      </View>

      <View style={styles.section}>
        <AITipOfTheDay />
      </View>

      <View style={styles.section}>
        <SectionHeading title="Smart insight" />
        {insights.slice(0, 1).map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </View>

      <View style={styles.section}>
        <SectionHeading title="Recent activity" actionHref="/history" />
        <View style={styles.listStack}>
          {recent.length === 0 ? (
            <Text style={styles.muted}>No transactions yet.</Text>
          ) : (
            recent.map((t) => (
              <TransactionListItem key={t.id} transaction={t} />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.s16,
    paddingTop: space.s16,
    paddingBottom: 112,
    gap: space.s24,
  },
  screenTitle: {
    ...type.display,
    fontSize: 28,
    lineHeight: 34,
  },
  screenSubtitle: {
    ...type.body,
    color: colors.textSecondary,
    marginTop: -space.s8,
    marginBottom: space.s8,
  },
  section: {
    gap: space.s8,
  },
  kpiRow: {
    flexDirection: "row",
    gap: space.s8,
    flexWrap: "wrap",
  },
  categoryStack: {
    gap: space.s16,
  },
  listStack: {
    gap: space.s8,
  },
  muted: {
    ...type.body,
    color: colors.textMuted,
  },
});
