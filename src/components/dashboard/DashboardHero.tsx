import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, shadow, space, type } from "../../constants/theme";
import { formatCurrency } from "../../utils/format";
import type { MonthOverMonthResult } from "../../services/transactionService";

type Props = {
  totalBalance: number;
  mom: MonthOverMonthResult;
};

function formatMomLine(mom: MonthOverMonthResult): { text: string; tone: "success" | "danger" | "muted" } {
  const { percentChangeVsPrevious, currentMonthNet, previousMonthNet } = mom;
  if (percentChangeVsPrevious === null) {
    if (previousMonthNet === 0 && currentMonthNet === 0) {
      return { text: "Add transactions to see monthly trends", tone: "muted" };
    }
    return { text: "First month of data — keep logging", tone: "muted" };
  }
  const rounded = Math.abs(percentChangeVsPrevious).toFixed(1);
  const sign = percentChangeVsPrevious >= 0 ? "+" : "−";
  return {
    text: `${sign}${rounded}% vs last month`,
    tone: percentChangeVsPrevious >= 0 ? "success" : "danger",
  };
}

export default function DashboardHero({ totalBalance, mom }: Props) {
  const ctx = formatMomLine(mom);
  const toneColor =
    ctx.tone === "success"
      ? colors.success
      : ctx.tone === "danger"
        ? colors.danger
        : "rgba(255,255,255,0.75)";

  return (
    <View style={[styles.hero, shadow.hero]}>
      <Text style={styles.kicker}>Total balance</Text>
      <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
        {formatCurrency(totalBalance)}
      </Text>

      <View style={styles.contextRow}>
        <Ionicons name="pulse-outline" size={16} color={toneColor} />
        <Text style={[styles.context, { color: toneColor }]}>{ctx.text}</Text>
      </View>

      <Link href="/add" asChild>
        <Pressable style={styles.cta} accessibilityRole="button">
          <Text style={styles.ctaText}>Add transaction</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primary} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: space.s24,
    gap: space.s8,
  },
  kicker: {
    ...type.caption,
    color: "rgba(255,255,255,0.85)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  display: {
    ...type.displayHero,
    marginTop: space.s8,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.s8,
    marginTop: space.s8,
  },
  context: {
    ...type.body,
    flex: 1,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  cta: {
    marginTop: space.s16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.s8,
    backgroundColor: colors.surface,
    paddingVertical: space.s16,
    borderRadius: radius.md,
  },
  ctaText: {
    ...type.bodyMedium,
    color: colors.primary,
  },
});
