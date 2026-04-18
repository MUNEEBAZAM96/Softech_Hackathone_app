import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSetAtom, useAtomValue } from "jotai";
import { router } from "expo-router";

import { categoryBudgetsAtom } from "../../../atoms";
import { categories } from "../../../constants/categories";
import { colors, radius, space, type } from "../../../constants/theme";
import { formatMonthKey } from "../../../services/budgetAlertService";
import { createLocalId } from "../../../utils/id";

export default function NewBudgetScreen() {
  const setBudgets = useSetAtom(categoryBudgetsAtom);
  const existing = useAtomValue(categoryBudgetsAtom);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [monthKey, setMonthKey] = useState(formatMonthKey(new Date()));
  const [limit, setLimit] = useState("");

  const expenseCats = categories.filter((c) => c.kind === "expense");

  const onSave = () => {
    const lim = Number(limit.replace(/,/g, ""));
    if (!categoryId || !lim || lim <= 0) {
      Alert.alert("Check fields", "Pick a category and a positive limit.");
      return;
    }
    const key = monthKey.trim();
    if (!/^\d{4}-\d{2}$/.test(key)) {
      Alert.alert("Month", "Use YYYY-MM (e.g. 2026-04).");
      return;
    }
    const dup = existing.some(
      (b) => b.categoryId === categoryId && b.monthKey === key
    );
    if (dup) {
      Alert.alert("Duplicate", "You already have a budget for that category and month.");
      return;
    }
    setBudgets((prev) => [
      ...prev,
      {
        id: createLocalId("budget"),
        categoryId,
        monthKey: key,
        limitAmount: lim,
        createdAt: new Date().toISOString(),
      },
    ]);
    router.back();
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
              categoryId === c.id && { borderColor: colors.primary, backgroundColor: colors.overlay },
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
        placeholder="2026-04"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
      />
      <Text style={styles.label}>Limit (PKR)</Text>
      <TextInput
        value={limit}
        onChangeText={setLimit}
        keyboardType="decimal-pad"
        placeholder="12000"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Pressable onPress={onSave} style={styles.save}>
        <Text style={styles.saveText}>Save budget</Text>
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
});
