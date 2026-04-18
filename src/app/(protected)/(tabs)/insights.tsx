import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useAtomValue } from "jotai";

import { transactionsAtom } from "../../../atoms";
import { colors, radius, spacing, typography } from "../../../constants/theme";
import { generateInsights } from "../../../services/insightsService";
import { summarize } from "../../../services/transactionService";
import { getCategoryById } from "../../../constants/categories";
import { formatCurrency } from "../../../utils/format";
import InsightCard from "../../../components/InsightCard";

export default function InsightsScreen() {
  const transactions = useAtomValue(transactionsAtom);
  const insights = useMemo(() => generateInsights(transactions), [transactions]);
  const summary = useMemo(() => summarize(transactions), [transactions]);

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

      <View style={{ gap: spacing.md }}>
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </View>

      <Text style={[typography.h3, { marginTop: spacing.lg }]}>
        Category Breakdown
      </Text>

      <View style={styles.breakdown}>
        {summary.byCategory.length === 0 ? (
          <Text style={typography.bodyMuted}>
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
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  hero: { marginBottom: spacing.sm },
  heroTitle: { ...typography.h2 },
  heroSubtitle: { ...typography.bodyMuted, marginTop: spacing.xs },
  breakdown: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  breakdownItem: { gap: spacing.xs },
  breakdownHeader: { flexDirection: "row", justifyContent: "space-between" },
  breakdownName: { ...typography.body, fontWeight: "600" },
  breakdownAmount: { ...typography.body, fontWeight: "600" },
  progressBg: {
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFg: { height: "100%", borderRadius: radius.pill },
});
