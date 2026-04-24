import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useAtomValue } from "jotai";

import { budgetAlertPreferencesAtom } from "../../../atoms";
import { getCategoryById } from "../../../constants/categories";
import { useFinanceData } from "../../../providers/FinanceDataProvider";
import { colors, radius, shadow, space, type } from "../../../constants/theme";
import {
  buildBudgetAlertItem,
  formatMonthKey,
  type BudgetAlertContext,
} from "../../../services/budgetAlertService";
import { formatCurrency } from "../../../utils/format";

export default function BudgetsIndexScreen() {
  const { budgets, transactions, categories } = useFinanceData();
  const prefs = useAtomValue(budgetAlertPreferencesAtom);
  const ctx: BudgetAlertContext = useMemo(
    () => ({
      getCategoryName: (id) => getCategoryById(id, categories)?.name ?? "Category",
    }),
    [categories]
  );
  const now = useMemo(() => new Date(), []);

  const rows = useMemo(() => {
    return [...budgets]
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
      .map((b) => ({
        budget: b,
        alert: buildBudgetAlertItem(transactions, b, prefs, ctx, now),
      }));
  }, [budgets, transactions, prefs, now, ctx]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.toolbar}>
        <Text style={styles.lead}>
          Set monthly limits per category. We compare spend in that calendar month.
        </Text>
        <Link href="/budgets/new" asChild>
          <Pressable style={styles.addBtn}>
            <Ionicons name="add" size={22} color={colors.surface} />
            <Text style={styles.addLabel}>New budget</Text>
          </Pressable>
        </Link>
      </View>

      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name="notifications-outline"
            size={40}
            color={colors.textMuted}
          />
          <Text style={styles.emptyTitle}>No budgets yet</Text>
          <Text style={styles.emptyBody}>
            Add a cap for a category and month — we&apos;ll warn before you
            overshoot.
          </Text>
          <Pressable
            onPress={() => router.push("/budgets/new")}
            style={styles.emptyCta}
          >
            <Text style={styles.emptyCtaText}>Create a budget</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {rows.map(({ budget, alert }) => {
            const name = getCategoryById(budget.categoryId, categories)?.name ?? "Category";
            const tone =
              alert.level === "exceeded"
                ? colors.danger
                : alert.level === "warning" || alert.level === "early"
                  ? colors.warning
                  : colors.success;
            return (
              <Pressable
                key={budget.id}
                onPress={() => router.push(`/budgets/${budget.id}`)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { opacity: 0.95 },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{name}</Text>
                  <Text style={[styles.badge, { color: tone }]}>
                    {alert.level}
                  </Text>
                </View>
                <Text style={styles.sub}>
                  {budget.monthKey} · limit {formatCurrency(budget.limitAmount)}{" "}
                  · spent {formatCurrency(alert.spent)}
                </Text>
                <Text style={styles.msg}>{alert.message}</Text>
                {!!alert.forecastMessage && (
                  <Text style={styles.forecast}>{alert.forecastMessage}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      <Text style={styles.footer}>
        Current month key: {formatMonthKey(now)}
      </Text>
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
  badge: { ...type.captionBold, textTransform: "capitalize" },
  sub: { ...type.caption, color: colors.textSecondary },
  msg: { ...type.body, color: colors.text },
  forecast: { ...type.caption, color: colors.textSecondary },
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
  footer: { ...type.caption, color: colors.textMuted, textAlign: "center" },
});
