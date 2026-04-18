import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { colors, radius, spacing, typography } from "../constants/theme";
import { getCategoryById } from "../constants/categories";
import { formatCurrency, formatDate } from "../utils/format";
import type { Transaction } from "../types";

type Props = {
  transaction: Transaction;
};

export default function TransactionListItem({ transaction }: Props) {
  const category = getCategoryById(transaction.categoryId);
  const isIncome = transaction.kind === "income";
  const amountColor = isIncome ? colors.income : colors.expense;
  const amountPrefix = isIncome ? "+" : "-";

  return (
    <Link href={`/transaction/${transaction.id}`} asChild>
      <Pressable style={styles.row}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: `${category?.color ?? colors.primary}1A` },
          ]}
        >
          <Ionicons
            name={(category?.icon as keyof typeof Ionicons.glyphMap) ?? "pricetag-outline"}
            size={20}
            color={category?.color ?? colors.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {category?.name ?? "Uncategorized"}
          </Text>
          {!!transaction.note && (
            <Text style={styles.note} numberOfLines={1}>
              {transaction.note}
            </Text>
          )}
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        </View>

        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}
          {formatCurrency(transaction.amount).replace("-", "")}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.body,
    fontWeight: "600",
  },
  note: {
    ...typography.caption,
    marginTop: 2,
  },
  date: {
    ...typography.caption,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
  },
});
