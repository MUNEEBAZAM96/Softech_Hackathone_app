import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useAtom, useAtomValue } from "jotai";

import {
  budgetAlertPreferencesAtom,
  budgetNotificationsEnabledAtom,
  goalNotificationsEnabledAtom,
  selectedCategoryAtom,
} from "../../../atoms";
import { colors, radius, spacing, typography } from "../../../constants/theme";
import { getDatabase } from "../../../db/client";
import { insertTransaction } from "../../../db/transactionsRepo";
import { useFinanceData } from "../../../providers/FinanceDataProvider";
import { maybeNotifyBudgetAlerts } from "../../../services/budgetNotificationService";
import { maybeNotifyGoalMilestones } from "../../../services/goalNotificationService";
import { createTransactionId } from "../../../services/transactionService";
import type { Transaction, TransactionKind } from "../../../types";

export default function AddTransactionScreen() {
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const { transactions, budgets, goals, categories, refresh } = useFinanceData();
  const budgetPrefs = useAtomValue(budgetAlertPreferencesAtom);
  const budgetNotificationsEnabled = useAtomValue(budgetNotificationsEnabledAtom);
  const goalNotificationsEnabled = useAtomValue(goalNotificationsEnabledAtom);

  const resetForm = () => {
    setAmount("");
    setNote("");
    setSelectedCategory(null);
    setKind("expense");
  };

  const onSave = async () => {
    const availableForKind = categories.filter((c) => c.kind === kind);
    if (availableForKind.length === 0) {
      Alert.alert(
        "No categories yet",
        `Create a ${kind} category first to save a transaction.`
      );
      return;
    }
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount greater than 0.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Missing category", "Please choose a category.");
      return;
    }
    if (selectedCategory.kind !== kind) {
      Alert.alert(
        "Category mismatch",
        `The selected category is an ${selectedCategory.kind} category. Switch tabs or pick a different category.`
      );
      return;
    }

    const newTransaction: Transaction = {
      id: createTransactionId(),
      kind,
      amount: numeric,
      categoryId: selectedCategory.id,
      note: note.trim() || undefined,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    try {
      const db = await getDatabase();
      await insertTransaction(db, newTransaction);
      await refresh();
      const next = [newTransaction, ...transactions];
      void maybeNotifyBudgetAlerts(next, budgets, budgetPrefs, {
        enabled: budgetNotificationsEnabled,
      });
      void maybeNotifyGoalMilestones(next, goals, {
        enabled: goalNotificationsEnabled,
      });
      resetForm();
      router.replace("/");
    } catch {
      Alert.alert(
        "Save failed",
        "Could not store this transaction. Please try again."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.toggleRow}>
          {(["expense", "income"] as const).map((option) => {
            const active = kind === option;
            return (
              <Pressable
                key={option}
                onPress={() => {
                  setKind(option);
                  if (selectedCategory && selectedCategory.kind !== option) {
                    setSelectedCategory(null);
                  }
                }}
                style={[styles.toggle, active && styles.toggleActive]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    active && styles.toggleTextActive,
                  ]}
                >
                  {option === "expense" ? "Expense" : "Income"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Amount</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.currency}>PKR</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <Text style={styles.label}>Category</Text>
        <Link href="/categorySelector" asChild>
          <Pressable style={styles.selector}>
            {selectedCategory ? (
              <View style={styles.selectorContent}>
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: selectedCategory.color },
                  ]}
                />
                <Text style={styles.selectorText}>{selectedCategory.name}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>
                Choose a category
              </Text>
            )}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        </Link>
        {categories.filter((c) => c.kind === kind).length === 0 ? (
          <Text style={styles.emptyHint}>
            No {kind} categories yet. Tap above to create one.
          </Text>
        ) : null}

        <Text style={styles.label}>Note (optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="What was this for?"
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
        />

        <Pressable style={styles.saveButton} onPress={onSave}>
          <Text style={styles.saveButtonText}>Save Transaction</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.sm,
  },
  toggle: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: radius.pill,
  },
  toggleActive: { backgroundColor: colors.surface },
  toggleText: { ...typography.body, fontWeight: "600", color: colors.textMuted },
  toggleTextActive: { color: colors.text },
  label: {
    ...typography.caption,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currency: {
    ...typography.h3,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    padding: 0,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorContent: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  categoryDot: { width: 10, height: 10, borderRadius: 5 },
  selectorText: { ...typography.body, fontWeight: "600" },
  selectorPlaceholder: { ...typography.bodyMuted },
  emptyHint: { ...typography.bodyMuted, marginTop: -4 },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: "top",
    color: colors.text,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
