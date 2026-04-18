import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import {
  buildDailyTipContext,
  DAILY_TIP_FALLBACK,
  fetchDailyTip,
  getTipFetchUserMessage,
} from "../../../services/dailyTipService";
import { useAppTheme } from "../../../providers/ThemeProvider";

import DashboardHero from "../../../components/dashboard/DashboardHero";
import CalendarSectionToggle from "../../../components/dashboard/CalendarSectionToggle";
import KPIBlock from "../../../components/dashboard/KPIBlock";
import SectionHeading from "../../../components/dashboard/SectionHeading";
import CategoryProgressRow from "../../../components/dashboard/CategoryProgressRow";
import AITipOfTheDay from "../../../components/dashboard/AITipOfTheDay";
import BudgetTrackCard from "../../../components/dashboard/BudgetTrackCard";
import GoalsTrackCard, {
  paceLabel,
} from "../../../components/dashboard/GoalsTrackCard";
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
        trackRow: {
          flexDirection: "row",
          gap: space.s8,
          alignItems: "stretch",
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

  const goalFooterLine = useMemo(() => {
    if (!goalAnalytics) {
      return "Tap to create your first goal";
    }
    const titleShort =
      goalAnalytics.title.length > 24
        ? `${goalAnalytics.title.slice(0, 23)}…`
        : goalAnalytics.title;
    return `${titleShort} · ${paceLabel(goalAnalytics.pace)}`;
  }, [goalAnalytics]);

  const goalsAccessibilityLabel = useMemo(() => {
    if (!goalAnalytics) {
      return "Goals. No goal set yet. Opens goals.";
    }
    const pct = Math.round(goalAnalytics.progressPct);
    return `Goals. ${pct} percent. ${paceLabel(goalAnalytics.pace)}. ${goalAnalytics.title}. Opens goals.`;
  }, [goalAnalytics]);

  const budgetSeverityCounts = useMemo(() => {
    let warningOrEarly = 0;
    let exceeded = 0;
    for (const a of dashboardBudgetAlerts) {
      if (a.level === "exceeded") exceeded += 1;
      else if (a.level === "warning" || a.level === "early") warningOrEarly += 1;
    }
    return { warningOrEarly, exceeded };
  }, [dashboardBudgetAlerts]);

  const budgetsAccessibilityLabel = useMemo(() => {
    const n = dashboardBudgetAlerts.length;
    if (n === 0) {
      return "Budgets. All clear. No active alerts. Opens budgets.";
    }
    return `Budgets. ${n} active alerts. Opens budgets.`;
  }, [dashboardBudgetAlerts.length]);

  const getCategoryName = useCallback(
    (id: string) => getCategoryById(id)?.name ?? "Other",
    []
  );

  const [tipText, setTipText] = useState(DAILY_TIP_FALLBACK);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const initialTipSentRef = useRef(false);

  const loadTip = useCallback(
    async (reason: "initial" | "refresh" | "new") => {
      const variationSeed =
        reason === "new"
          ? Math.floor(Math.random() * 0x7fffffff) ^ Date.now()
          : reason === "refresh"
            ? Date.now() ^ 0x51_37_46_53
            : Date.now() ^ 0x9e37_79b1;
      setTipLoading(true);
      setTipError(null);
      const ctx = buildDailyTipContext({
        monthKey,
        summary,
        mom,
        topCategoryRows: summary.byCategory.slice(0, 5),
        getCategoryName,
        budgetAlertsCount: dashboardBudgetAlerts.length,
        primaryGoalAnalytics: goalAnalytics,
        variationSeed,
      });
      try {
        const tip = await fetchDailyTip(ctx);
        setTipText(tip);
      } catch (e) {
        setTipText(DAILY_TIP_FALLBACK);
        setTipError(getTipFetchUserMessage(e));
      } finally {
        setTipLoading(false);
      }
    },
    [
      monthKey,
      summary,
      mom,
      getCategoryName,
      dashboardBudgetAlerts.length,
      goalAnalytics,
    ]
  );

  useEffect(() => {
    if (initialTipSentRef.current) return;
    initialTipSentRef.current = true;
    void loadTip("initial");
  }, [loadTip]);

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await loadTip("refresh");
    } finally {
      setPullRefreshing(false);
    }
  }, [loadTip]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={pullRefreshing}
          onRefresh={onPullRefresh}
          tintColor={colors.primary}
        />
      }
    >
      <DashboardHero totalBalance={summary.balance} mom={mom} />
      <CalendarSectionToggle
        onPress={() => router.push("/spending-calendar")}
        visibleMonth={visibleMonth}
        monthExpenseTotal={monthExpenseTotal}
      />

     

      <View style={styles.section}>
        <SectionHeading title="At a glance" />
        <View style={styles.trackRow}>
          <GoalsTrackCard
            progressPct={
              goalAnalytics ? goalAnalytics.progressPct : null
            }
            footerLine={goalFooterLine}
            onPress={() => router.push("/goals")}
            accessibilityLabel={goalsAccessibilityLabel}
          />
          <BudgetTrackCard
            alertCount={dashboardBudgetAlerts.length}
            warningOrEarlyCount={budgetSeverityCounts.warningOrEarly}
            exceededCount={budgetSeverityCounts.exceeded}
            onPress={() => router.push("/budgets")}
            accessibilityLabel={budgetsAccessibilityLabel}
          />
        </View>
      </View>

      <View style={styles.section}>
        <AITipOfTheDay
          message={tipText}
          loading={tipLoading}
          errorMessage={tipError}
          onRequestNewTip={() => void loadTip("new")}
        />
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
