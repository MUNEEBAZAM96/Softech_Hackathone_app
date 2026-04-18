import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import type { SavingsGoalAnalytics } from "../../types";
import type { ThemeColors } from "../../constants/theme";
import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency, formatDate } from "../../utils/format";
import ProgressBarThin from "../ui/ProgressBarThin";

function paceColor(
  colors: ThemeColors,
  pace: SavingsGoalAnalytics["pace"]
): { bar: string; accent: string } {
  if (pace === "completed" || pace === "ahead" || pace === "on_track") {
    return { bar: colors.success, accent: colors.success };
  }
  if (pace === "behind") {
    return { bar: colors.danger, accent: colors.danger };
  }
  return { bar: colors.warning, accent: colors.warning };
}

type Props = {
  analytics: SavingsGoalAnalytics;
};

export default function GoalProgressDashboardCard({ analytics }: Props) {
  const { colors, type, shadow, space, radius } = useAppTheme();
  const { bar, accent } = paceColor(colors, analytics.pace);
  const pctRounded = Math.round(analytics.progressPct);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.s16,
          gap: space.s16,
          ...shadow.card,
        },
        cardPressed: { opacity: 0.92 },
        topRow: {
          flexDirection: "row",
          gap: space.s16,
          alignItems: "center",
        },
        ring: {
          width: 88,
          height: 88,
          borderRadius: 44,
          borderWidth: 6,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceAlt,
        },
        ringPct: {
          ...type.display,
          fontSize: 26,
          lineHeight: 30,
        },
        ringLabel: {
          ...type.caption,
          marginTop: -space.s8 / 2,
        },
        copy: { flex: 1, gap: space.s8 / 2 },
        title: { ...type.titleSmall, fontSize: 16 },
        amountLine: { ...type.bodyMedium, fontSize: 14 },
        meta: { ...type.caption, color: colors.textSecondary },
        coach: { ...type.caption, color: colors.textSecondary },
      }),
    [colors, type, shadow, space, radius]
  );

  return (
    <Pressable
      onPress={() => router.push("/goals")}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.ring}>
          <Text style={[styles.ringPct, { color: accent }]}>{pctRounded}%</Text>
          <Text style={styles.ringLabel}>saved</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            {analytics.title}
          </Text>
          <Text style={styles.amountLine}>
            {formatCurrency(analytics.savedAmount)} of{" "}
            {formatCurrency(analytics.targetAmount)}
          </Text>
          <Text style={styles.meta}>
            {formatCurrency(analytics.remaining)} left · {analytics.daysLeft}{" "}
            days · due {formatDate(analytics.deadline)}
          </Text>
        </View>
      </View>
      <ProgressBarThin progress={analytics.progressPct} color={bar} />
      <Text style={styles.coach}>
        {analytics.pace === "completed"
          ? "Goal complete — consider your next milestone."
          : `To hit your goal, save ${formatCurrency(analytics.requiredPerDay)}/day.`}
      </Text>
    </Pressable>
  );
}
