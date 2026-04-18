import { StyleSheet, Text, View } from "react-native";
import { format, parseISO } from "date-fns";
import { colors, space, type } from "../../constants/theme";
import { formatCurrency } from "../../utils/format";
import type { Transaction } from "../../types";
import {
  getExpenseTotalForDayKey,
  getTransactionsOnLocalDay,
} from "../../services/calendarSpend";
import TransactionListItem from "../TransactionListItem";

type Props = {
  dayKey: string;
  transactions: Transaction[];
  dailyExpenseTotals: Map<string, number>;
};

function sortDayTransactions(list: Transaction[]): Transaction[] {
  return [...list].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export default function SelectedDayPanel({
  dayKey,
  transactions,
  dailyExpenseTotals,
}: Props) {
  const label = format(parseISO(`${dayKey}T12:00:00`), "EEEE, MMM d, yyyy");
  const expenseTotal = getExpenseTotalForDayKey(dailyExpenseTotals, dayKey);
  const dayTx = sortDayTransactions(getTransactionsOnLocalDay(transactions, dayKey));
  const expenseCount = dayTx.filter((t) => t.kind === "expense").length;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.dateTitle}>{label}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={styles.statExpense}>{formatCurrency(expenseTotal)}</Text>
        </View>
        {expenseCount > 0 && (
          <Text style={styles.count}>
            {expenseCount} expense{expenseCount === 1 ? "" : "s"}
          </Text>
        )}
      </View>

      {dayTx.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No activity</Text>
          <Text style={styles.emptyText}>
            Nothing logged on this day. Add a transaction to see it here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {dayTx.map((t) => (
            <TransactionListItem key={t.id} transaction={t} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.s16,
  },
  header: {
    gap: space.s8,
  },
  dateTitle: {
    ...type.titleSmall,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: space.s8,
  },
  statLabel: {
    ...type.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statExpense: {
    ...type.title,
    fontSize: 18,
    color: colors.danger,
  },
  count: {
    ...type.caption,
    color: colors.textSecondary,
  },
  list: {
    gap: space.s8,
  },
  empty: {
    paddingVertical: space.s24,
    alignItems: "center",
    gap: space.s8,
  },
  emptyTitle: {
    ...type.bodyMedium,
    color: colors.textMuted,
  },
  emptyText: {
    ...type.caption,
    textAlign: "center",
    paddingHorizontal: space.s16,
    lineHeight: 18,
  },
});
