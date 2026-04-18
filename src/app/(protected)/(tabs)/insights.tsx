import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAtomValue } from "jotai";

import {
  budgetAlertPreferencesAtom,
  categoryBudgetsAtom,
  savingsGoalsAtom,
  transactionsAtom,
} from "../../../atoms";
import { colors, radius, space, type } from "../../../constants/theme";
import { generateInsights } from "../../../services/insightsService";
import { getFinancialCoaching } from "../../../services/coachingService";
import { summarize } from "../../../services/transactionService";
import { getCategoryById } from "../../../constants/categories";
import { formatCurrency } from "../../../utils/format";
import InsightCard from "../../../components/InsightCard";

export default function InsightsScreen() {
  const transactions = useAtomValue(transactionsAtom);
  const goals = useAtomValue(savingsGoalsAtom);
  const budgets = useAtomValue(categoryBudgetsAtom);
  const budgetPrefs = useAtomValue(budgetAlertPreferencesAtom);
  const insights = useMemo(() => generateInsights(transactions), [transactions]);
  const summary = useMemo(() => summarize(transactions), [transactions]);
  const coaching = useMemo(
    () => getFinancialCoaching(transactions, goals, budgets, budgetPrefs),
    [transactions, goals, budgets, budgetPrefs]
  );

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>AI Insights</Text>
        <Text style={styles.heroSubtitle}>
          Personalized financial guidance based on your recent activity.
        </Text>
      </View>

      <View style={styles.coachCard}>
        <Text style={styles.coachTitle}>Financial coaching</Text>
        {coaching.goalLine ? (
          <Text style={styles.coachLine}>{coaching.goalLine}</Text>
        ) : (
          <Text style={styles.coachMuted}>
            Add a savings goal on the dashboard to see pace coaching here.
          </Text>
        )}
        {coaching.budgetLine ? (
          <Text style={styles.coachLine}>{coaching.budgetLine}</Text>
        ) : (
          <Text style={styles.coachMuted}>
            Set a monthly category budget to unlock spend warnings.
          </Text>
        )}
        <Text style={styles.coachAction}>{coaching.suggestion}</Text>
      </View>

      <View style={{ gap: space.s16 }}>
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </View>

      <Text style={[type.titleSmall, { marginTop: space.s16 }]}>
        Category Breakdown
      </Text>

      <View style={styles.breakdown}>
        {summary.byCategory.length === 0 ? (
          <Text style={styles.bodyMuted}>
            Log a few expenses to see your breakdown.
          </Text>
        ) : (
          summary.byCategory.map((row) => {
            const category = getCategoryById(row.categoryId);
            return (
              <View key={row.categoryId} style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownName}>{category?.name}</Text>
                  <Text style={styles.breakdownAmount}>
                    {formatCurrency(row.total)}
                  </Text>
                </View>
                <View style={styles.progressBg}>
                  <View
                    style={[
                      styles.progressFg,
                      {
                        width: `${row.percent}%`,
                        backgroundColor: category?.color ?? colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bodyMuted: { ...type.body, color: colors.textMuted },
  content: {
    padding: space.s16,
    gap: space.s16,
    paddingBottom: space.s32,
  },
  hero: { marginBottom: space.s8 },
  heroTitle: { ...type.title },
  heroSubtitle: { ...type.body, color: colors.textSecondary, marginTop: space.s8 },
  coachCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.s16,
    gap: space.s8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coachTitle: { ...type.titleSmall, fontSize: 16 },
  coachLine: { ...type.body, color: colors.text },
  coachMuted: { ...type.caption, color: colors.textMuted },
  coachAction: { ...type.bodyMedium, color: colors.primary, marginTop: space.s8 },
  breakdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.s16,
    gap: space.s16,
  },
  breakdownItem: { gap: space.s8 },
  breakdownHeader: { flexDirection: "row", justifyContent: "space-between" },
  breakdownName: { ...type.body, fontWeight: "600" },
  breakdownAmount: { ...type.body, fontWeight: "600" },
  progressBg: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFg: { height: "100%", borderRadius: radius.pill },
});
