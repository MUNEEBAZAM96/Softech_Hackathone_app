import { StyleSheet, Text, View } from "react-native";
import { colors, radius, shadow, space, type } from "../../constants/theme";
import { formatCurrency } from "../../utils/format";
import type { MonthExpenseSummary } from "../../services/calendarSpend";

type Props = {
  summary: MonthExpenseSummary;
  monthLabel: string;
};

export default function CalendarMonthSummaryCard({ summary, monthLabel }: Props) {
  const trend = summary.percentChangeVsPrevious;
  const trendLabel =
    trend === null
      ? "No prior month data"
      : `${trend >= 0 ? "+" : ""}${trend.toFixed(1)}% vs last month`;

  const trendTone =
    trend === null
      ? colors.textMuted
      : trend > 0
        ? colors.danger
        : trend < 0
          ? colors.success
          : colors.textSecondary;

  return (
    <View style={[styles.card, shadow.hero]}>
      <Text style={styles.kicker}>{monthLabel}</Text>
      <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(summary.total)}
      </Text>
      <Text style={styles.sub}>Total spent this month</Text>

      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Avg / day</Text>
          <Text style={styles.statValue}>
            {formatCurrency(summary.avgDailySpend)}
          </Text>
          <Text style={styles.statHint}>÷ {summary.daysInMonth} days</Text>
        </View>
        <View style={styles.vDivider} />
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statValue}>{summary.expenseTransactionCount}</Text>
          <Text style={styles.statHint}>transactions</Text>
        </View>
      </View>

      
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: space.s24,
    gap: space.s8,
  },
  kicker: {
    ...type.caption,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  display: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 38,
    color: "#FFFFFF",
  },
  sub: {
    ...type.body,
    color: "rgba(255,255,255,0.88)",
    marginBottom: space.s8,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: space.s8,
    paddingTop: space.s16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
  },
  stat: {
    flex: 1,
    gap: space.s8,
  },
  vDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: space.s16,
  },
  statLabel: {
    ...type.caption,
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statValue: {
    ...type.titleSmall,
    fontSize: 18,
    color: "#FFFFFF",
  },
  statHint: {
    ...type.caption,
    color: "rgba(255,255,255,0.65)",
  },
  chip: {
    alignSelf: "flex-start",
    marginTop: space.s8,
    paddingHorizontal: space.s16,
    paddingVertical: space.s8,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  chipText: {
    ...type.captionBold,
    fontSize: 11,
  },
});
