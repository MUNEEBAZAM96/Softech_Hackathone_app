import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

import {
  budgetAlertPreferencesAtom,
  budgetNotificationsEnabledAtom,
  goalNotificationsEnabledAtom,
} from "../../../atoms";
import { colors, radius, spacing, typography } from "../../../constants/theme";
import { getCategoryById } from "../../../constants/categories";
import { useFinanceData } from "../../../providers/FinanceDataProvider";
import { getDatabase } from "../../../db/client";
import { deleteTransactionById } from "../../../db/transactionsRepo";
import { maybeNotifyBudgetAlerts } from "../../../services/budgetNotificationService";
import { maybeNotifyGoalMilestones } from "../../../services/goalNotificationService";
import { formatCurrency, formatDate } from "../../../utils/format";
import { safeBack } from "../../../utils/navigation";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, budgets, goals, categories, refresh, userId } =
    useFinanceData();
  const budgetPrefs = useAtomValue(budgetAlertPreferencesAtom);
  const budgetNotificationsEnabled = useAtomValue(budgetNotificationsEnabledAtom);
  const goalNotificationsEnabled = useAtomValue(goalNotificationsEnabledAtom);

  const transaction = useMemo(
    () => transactions.find((t) => t.id === id),
    [transactions, id]
  );

  if (!transaction) {
    return (
      <View style={styles.notFound}>
        <Text style={typography.h3}>Transaction not found</Text>
      </View>
    );
  }

  const category = getCategoryById(transaction.categoryId, categories);
  const isIncome = transaction.kind === "income";
  const amountColor = isIncome ? colors.income : colors.expense;

  const confirmDelete = () => {
    Alert.alert(
      "Delete transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!userId) {
              Alert.alert("Session", "Please sign in again.");
              return;
            }
            try {
              const db = await getDatabase();
              await deleteTransactionById(db, transaction.id, userId);
              await refresh();
              const next = transactions.filter((t) => t.id !== transaction.id);
              void maybeNotifyBudgetAlerts(next, budgets, budgetPrefs, {
                enabled: budgetNotificationsEnabled,
              });
              void maybeNotifyGoalMilestones(next, goals, {
                enabled: goalNotificationsEnabled,
              });
              safeBack();
            } catch {
              Alert.alert(
                "Delete failed",
                "Could not remove this transaction. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: "Transaction",
          headerRight: () => (
            <Pressable onPress={confirmDelete} style={{ paddingHorizontal: 4 }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </Pressable>
          ),
        }}
      />

      <View style={styles.hero}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: `${category?.color ?? colors.primary}1A` },
          ]}
        >
          <Ionicons
            name={(category?.icon as keyof typeof Ionicons.glyphMap) ?? "pricetag-outline"}
            size={26}
            color={category?.color ?? colors.primary}
          />
        </View>
        <Text style={styles.categoryText}>{category?.name ?? "Uncategorized"}</Text>
        <Text style={[styles.amount, { color: amountColor }]}>
          {isIncome ? "+" : "-"}
          {formatCurrency(transaction.amount).replace("-", "")}
        </Text>
      </View>

      <View style={styles.card}>
        <Row label="Type" value={isIncome ? "Income" : "Expense"} />
        <Divider />
        <Row label="Date" value={formatDate(transaction.date)} />
        {!!transaction.note && (
          <>
            <Divider />
            <Row label="Note" value={transaction.note} />
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryText: { ...typography.body, fontWeight: "600" },
  amount: { fontSize: 28, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  rowLabel: { ...typography.bodyMuted },
  rowValue: { ...typography.body, fontWeight: "600", maxWidth: "60%", textAlign: "right" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
