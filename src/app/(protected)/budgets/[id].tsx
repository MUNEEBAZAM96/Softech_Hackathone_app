import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAtom, useAtomValue } from "jotai";

import {
  budgetAlertPreferencesAtom,
  budgetNotificationsEnabledAtom,
  categoryBudgetsAtom,
  transactionsAtom,
} from "../../../atoms";
import { categories } from "../../../constants/categories";
import { colors, radius, space, type } from "../../../constants/theme";
import {
  clearBudgetNotificationDedupe,
  maybeNotifyBudgetAlerts,
} from "../../../services/budgetNotificationService";

export default function EditBudgetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [budgets, setBudgets] = useAtom(categoryBudgetsAtom);
  const transactions = useAtomValue(transactionsAtom);
  const budgetPrefs = useAtomValue(budgetAlertPreferencesAtom);
  const notificationsEnabled = useAtomValue(budgetNotificationsEnabledAtom);
  const row = useMemo(() => budgets.find((b) => b.id === id), [budgets, id]);

  const [categoryId, setCategoryId] = useState(row?.categoryId ?? "");
  const [monthKey, setMonthKey] = useState(row?.monthKey ?? "");
  const [limit, setLimit] = useState(
    row ? String(row.limitAmount) : ""
  );

  const expenseCats = categories.filter((c) => c.kind === "expense");

  if (!row) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Budget not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const save = () => {
    const lim = Number(limit.replace(/,/g, ""));
    if (!categoryId || !lim || lim <= 0) {
      Alert.alert("Check fields", "Pick a category and a positive limit.");
      return;
    }
    const key = monthKey.trim();
    if (!/^\d{4}-\d{2}$/.test(key)) {
      Alert.alert("Month", "Use YYYY-MM.");
      return;
    }
    const dup = budgets.some(
      (b) =>
        b.id !== row.id &&
        b.categoryId === categoryId &&
        b.monthKey === key
    );
    if (dup) {
      Alert.alert("Duplicate", "Another budget already uses that category and month.");
      return;
    }
    setBudgets((prev) => {
      const next = prev.map((b) =>
        b.id === row.id
          ? { ...b, categoryId, monthKey: key, limitAmount: lim }
          : b
      );
      void (async () => {
        await clearBudgetNotificationDedupe({
          monthKey: row.monthKey,
          categoryId: row.categoryId,
        });
        await clearBudgetNotificationDedupe({
          monthKey: key,
          categoryId,
        });
        await maybeNotifyBudgetAlerts(transactions, next, budgetPrefs, {
          enabled: notificationsEnabled,
        });
      })();
      return next;
    });
    router.back();
  };

  const remove = () => {
    Alert.alert("Delete budget", "Remove this cap?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setBudgets((prev) => prev.filter((b) => b.id !== row.id));
          void clearBudgetNotificationDedupe({
            monthKey: row.monthKey,
            categoryId: row.categoryId,
          });
          router.back();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Category</Text>
      <View style={styles.chips}>
        {expenseCats.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => setCategoryId(c.id)}
            style={[
              styles.chip,
              categoryId === c.id && {
                borderColor: colors.primary,
                backgroundColor: colors.overlay,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                categoryId === c.id && { color: colors.primary, fontWeight: "600" },
              ]}
            >
              {c.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Month (YYYY-MM)</Text>
      <TextInput
        value={monthKey}
        onChangeText={setMonthKey}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Limit (PKR)</Text>
      <TextInput
        value={limit}
        onChangeText={setLimit}
        keyboardType="decimal-pad"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Pressable onPress={save} style={styles.save}>
        <Text style={styles.saveText}>Save changes</Text>
      </Pressable>
      <Pressable onPress={remove} style={styles.danger}>
        <Text style={styles.dangerText}>Delete budget</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.s16, gap: space.s8, paddingBottom: space.s32 },
  label: { ...type.captionBold, marginTop: space.s8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.s8 },
  chip: {
    paddingVertical: space.s8,
    paddingHorizontal: space.s16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { ...type.caption, color: colors.text },
  input: {
    ...type.body,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.s16,
  },
  save: {
    marginTop: space.s16,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.s16,
    alignItems: "center",
  },
  saveText: { ...type.bodyMedium, color: colors.surface },
  danger: {
    marginTop: space.s8,
    paddingVertical: space.s16,
    alignItems: "center",
  },
  dangerText: { ...type.bodyMedium, color: colors.danger },
  missing: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: space.s8,
    padding: space.s16,
  },
  missingText: { ...type.body, color: colors.textSecondary },
  link: { ...type.bodyMedium, color: colors.primary },
});
