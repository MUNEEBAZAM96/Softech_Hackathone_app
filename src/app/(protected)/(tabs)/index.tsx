import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAtomValue } from "jotai";
import { startOfMonth } from "date-fns";
import { router } from "expo-router";

import {
  budgetAlertPreferencesAtom,
  categoryBudgetsAtom,
  dismissedBudgetAlertIdsAtom,
  savingsGoalsAtom,
  transactionsAtom,
} from "../../../atoms";
import BudgetAlertsDashboardCard from "../../../components/budget/BudgetAlertsDashboardCard";
import GoalProgressDashboardCard from "../../../components/goals/GoalProgressDashboardCard";
import AppCard from "../../../components/ui/AppCard";
import { getCategoryById } from "../../../constants/categories";
import {
  filterDashboardBudgetAlerts,
  formatMonthKey,
  getBudgetAlertsForMonth,
} from "../../../services/budgetAlertService";
import {
  getPrimaryGoalForDashboard,
  getSavingsGoalAnalytics,
} from "../../../services/savingsGoalService";
import {
  getMonthOverMonthNet,
  sortByDateDesc,
  summarize,
} from "../../../services/transactionService";
import {
  sumExpensesInCalendarMonth,
} from "../../../services/calendarSpend";
import { generateInsights } from "../../../services/insightsService";
import { useAppTheme } from "../../../providers/ThemeProvider";

import DashboardHero from "../../../components/dashboard/DashboardHero";
import CalendarSectionToggle from "../../../components/dashboard/CalendarSectionToggle";
import KPIBlock from "../../../components/dashboard/KPIBlock";
import SectionHeading from "../../../components/dashboard/SectionHeading";
import CategoryProgressRow from "../../../components/dashboard/CategoryProgressRow";
import AITipOfTheDay from "../../../components/dashboard/AITipOfTheDay";
import InsightCard from "../../../components/InsightCard";
import TransactionListItem from "../../../components/TransactionListItem";

export default function DashboardScreen() {
  const { colors, type, space } = useAppTheme();
  const transactions = useAtomValue(transactionsAtom);
  const goals = useAtomValue(savingsGoalsAtom);
  const budgets = useAtomValue(categoryBudgetsAtom);
  const budgetPrefs = useAtomValue(budgetAlertPreferencesAtom);
  const dismissedAlerts = useAtomValue(dismissedBudgetAlertIdsAtom);

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
      }),
    [colors, type, space]
  );

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

  const visibleMonth = startOfMonth(new Date());
  const monthExpenseTotal = useMemo(
    () => sumExpensesInCalendarMonth(transactions, visibleMonth),
    [transactions]
  );

  const alertCtx = useMemo(
    () => ({
      getCategoryName: (id: string) =>
        getCategoryById(id)?.name ?? "Category",
    }),
    []
  );

  const monthKey = formatMonthKey(new Date());
  const dashboardBudgetAlerts = useMemo(() => {
    const raw = getBudgetAlertsForMonth(
      transactions,
      budgets,
      budgetPrefs,
      alertCtx,
      monthKey
    );
    return filterDashboardBudgetAlerts(raw, { includeEarly: false }).filter(
      (a) => !dismissedAlerts[a.id]
    );
  }, [
    transactions,
    budgets,
    budgetPrefs,
    alertCtx,
    monthKey,
    dismissedAlerts,
  ]);

  const primaryGoal = useMemo(
    () => getPrimaryGoalForDashboard(goals),
    [goals]
  );
  const goalAnalytics = useMemo(() => {
    if (!primaryGoal) return null;
    return getSavingsGoalAnalytics(transactions, primaryGoal, goals);
  }, [transactions, goals, primaryGoal]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <DashboardHero totalBalance={summary.balance} mom={mom} />
      <CalendarSectionToggle
        onPress={() => router.push("/spending-calendar")}
        visibleMonth={visibleMonth}
        monthExpenseTotal={monthExpenseTotal}
      />

      <View style={styles.section}>
        <SectionHeading title="Goal progress" actionHref="/goals" />
        {goalAnalytics ? (
          <GoalProgressDashboardCard analytics={goalAnalytics} />
        ) : (
          <Pressable onPress={() => router.push("/goals")}>
            <AppCard>
              <Text style={styles.muted}>
                No savings goal yet — tap to create one and track pace.
              </Text>
            </AppCard>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeading title="Budget alerts" actionHref="/budgets" />
        <BudgetAlertsDashboardCard alerts={dashboardBudgetAlerts} />
      </View>

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
            <Text style={styles.muted}>
              No expenses yet — add one to see breakdown.
            </Text>
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
