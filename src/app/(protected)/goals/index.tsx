import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAtomValue } from "jotai";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { savingsGoalsAtom, transactionsAtom } from "../../../atoms";
import { colors, radius, shadow, space, type } from "../../../constants/theme";
import {
  getAllSavingsGoalAnalytics,
} from "../../../services/savingsGoalService";
import { formatCurrency, formatDate } from "../../../utils/format";
import ProgressBarThin from "../../../components/ui/ProgressBarThin";

export default function GoalsIndexScreen() {
  const goals = useAtomValue(savingsGoalsAtom);
  const transactions = useAtomValue(transactionsAtom);
  const rows = useMemo(
    () => getAllSavingsGoalAnalytics(transactions, goals),
    [transactions, goals]
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.toolbar}>
        <Text style={styles.lead}>
          Track targets with net-based progress from your income and spending.
        </Text>
        <Link href="/goals/new" asChild>
          <Pressable style={styles.addBtn}>
            <Ionicons name="add" size={22} color={colors.surface} />
            <Text style={styles.addLabel}>New goal</Text>
          </Pressable>
        </Link>
      </View>

      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="flag-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No savings goals yet</Text>
          <Text style={styles.emptyBody}>
            Add a goal with a target and deadline — we&apos;ll show pace and how
            much to save per day.
          </Text>
          <Pressable
            onPress={() => router.push("/goals/new")}
            style={styles.emptyCta}
          >
            <Text style={styles.emptyCtaText}>Create a goal</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map((r) => {
            const paceColor =
              r.pace === "behind"
                ? colors.danger
                : r.pace === "completed" || r.pace === "ahead" || r.pace === "on_track"
                  ? colors.success
                  : colors.warning;
            return (
              <Pressable
                key={r.goalId}
                onPress={() => router.push(`/goals/${r.goalId}`)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{r.title}</Text>
                  <Text style={[styles.paceBadge, { color: paceColor }]}>
                    {r.pace.replace(/_/g, " ")}
                  </Text>
                </View>
                <Text style={styles.sub}>
                  {formatCurrency(r.savedAmount)} of {formatCurrency(r.targetAmount)}{" "}
                  · due {formatDate(r.deadline)}
                </Text>
                <ProgressBarThin progress={r.progressPct} color={paceColor} />
                <Text style={styles.meta}>
                  {formatCurrency(r.remaining)} left · {r.daysLeft} days · need{" "}
                  {formatCurrency(r.requiredPerDay)}/day
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: space.s16,
    paddingBottom: space.s32,
    gap: space.s16,
  },
  toolbar: { gap: space.s16 },
  lead: { ...type.body, color: colors.textSecondary },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.s8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.s16,
  },
  addLabel: { ...type.bodyMedium, color: colors.surface },
  list: { gap: space.s16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.s16,
    gap: space.s8,
    ...shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { ...type.titleSmall, flex: 1 },
  paceBadge: { ...type.captionBold, textTransform: "capitalize" },
  sub: { ...type.caption, color: colors.textSecondary },
  meta: { ...type.caption, color: colors.textMuted },
  empty: {
    alignItems: "center",
    padding: space.s24,
    gap: space.s8,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  emptyTitle: { ...type.titleSmall },
  emptyBody: {
    ...type.body,
    textAlign: "center",
    color: colors.textSecondary,
  },
  emptyCta: {
    marginTop: space.s8,
    paddingVertical: space.s8,
    paddingHorizontal: space.s16,
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.pill,
  },
  emptyCtaText: { ...type.bodyMedium, color: colors.surface },
});
