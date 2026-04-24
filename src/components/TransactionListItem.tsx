import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";

import { useAppTheme } from "../providers/ThemeProvider";
import { useFinanceData } from "../providers/FinanceDataProvider";
import { getCategoryById } from "../constants/categories";
import { formatCurrency, formatDate } from "../utils/format";
import type { Transaction } from "../types";

type Props = {
  transaction: Transaction;
};

export default function TransactionListItem({ transaction }: Props) {
  const { colors, type, space, radius } = useAppTheme();
  const { categories } = useFinanceData();
  const category = getCategoryById(transaction.categoryId, categories);
  const isIncome = transaction.kind === "income";
  const amountColor = isIncome ? colors.success : colors.danger;
  const amountPrefix = isIncome ? "+" : "-";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s16,
          backgroundColor: colors.surface,
          paddingHorizontal: space.s16,
          paddingVertical: space.s16,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        iconWrap: {
          width: 42,
          height: 42,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
        },
        title: {
          ...type.bodyMedium,
        },
        note: {
          ...type.caption,
          marginTop: space.s8,
        },
        date: {
          ...type.caption,
          marginTop: space.s8,
        },
        amount: {
          fontSize: 15,
          fontWeight: "700",
        },
      }),
    [colors, type, space, radius]
  );

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
            name={
              (category?.icon as keyof typeof Ionicons.glyphMap) ??
              "pricetag-outline"
            }
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
