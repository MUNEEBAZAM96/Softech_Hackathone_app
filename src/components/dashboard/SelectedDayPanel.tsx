import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { colors, radius, space, type } from "../../constants/theme";
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
  const shortLabel = format(parseISO(`${dayKey}T12:00:00`), "MMM d, yyyy");
  const expenseTotal = getExpenseTotalForDayKey(dailyExpenseTotals, dayKey);
  const dayTx = sortDayTransactions(getTransactionsOnLocalDay(transactions, dayKey));
  const expenseCount = dayTx.filter((t) => t.kind === "expense").length;
  const incomeCount = dayTx.filter((t) => t.kind === "income").length;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitles}>
            <Text style={styles.dateShort}>{shortLabel}</Text>
            <Text style={styles.dateLong}>{label}</Text>
          </View>
          <View style={styles.spentBlock}>
            <Text style={styles.spentLabel}>Spent</Text>
            <Text style={styles.spentValue}>{formatCurrency(expenseTotal)}</Text>
          </View>
        </View>

        <View style={styles.chips}>
          <View style={styles.chip}>
            <Ionicons name="receipt-outline" size={14} color={colors.primary} />
            <Text style={styles.chipText}>{dayTx.length} total</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="trending-down" size={14} color={colors.danger} />
            <Text style={styles.chipText}>{expenseCount} expenses</Text>
          </View>
          {incomeCount > 0 && (
            <View style={styles.chip}>
              <Ionicons name="trending-up" size={14} color={colors.success} />
              <Text style={styles.chipText}>{incomeCount} income</Text>
            </View>
          )}
        </View>
      </View>

      {dayTx.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="wallet-outline" size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No activity</Text>
          <Text style={styles.emptyText}>
            Nothing logged on this day. Add a transaction from the + tab.
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
  headerCard: {
    gap: space.s16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space.s16,
  },
  headerTitles: {
    flex: 1,
    gap: space.s8,
  },
  dateShort: {
    ...type.titleSmall,
    fontSize: 16,
  },
  dateLong: {
    ...type.caption,
    color: colors.textSecondary,
  },
  spentBlock: {
    alignItems: "flex-end",
  },
  spentLabel: {
    ...type.caption,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  spentValue: {
    ...type.title,
    fontSize: 22,
    color: colors.danger,
    marginTop: space.s8,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.s8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: space.s16,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    ...type.captionBold,
    fontSize: 11,
    color: colors.textSecondary,
  },
  list: {
    gap: space.s8,
  },
  empty: {
    paddingVertical: space.s24,
    alignItems: "center",
    gap: space.s8,
    marginTop: space.s8,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
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
    color: colors.textSecondary,
  },
});
