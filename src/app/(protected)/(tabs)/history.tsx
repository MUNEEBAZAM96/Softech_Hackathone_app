import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, typography } from "../../../constants/theme";
import { useFinanceData } from "../../../providers/FinanceDataProvider";
import { sortByDateDesc } from "../../../services/transactionService";
import TransactionListItem from "../../../components/TransactionListItem";
import type { TransactionKind } from "../../../types";

type Filter = "all" | TransactionKind;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "income", label: "Income" },
  { id: "expense", label: "Expense" },
];

export default function HistoryScreen() {
  const { transactions } = useFinanceData();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const sorted = sortByDateDesc(transactions);
    if (filter === "all") return sorted;
    return sorted.filter((t) => t.kind === filter);
  }, [transactions, filter]);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TransactionListItem transaction={item} />}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button to log your first one.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { ...typography.body, fontWeight: "600", color: colors.textMuted },
  filterTextActive: { color: "#FFFFFF" },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  empty: {
    marginTop: spacing.xxl,
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.h3 },
  emptyText: { ...typography.bodyMuted },
});
