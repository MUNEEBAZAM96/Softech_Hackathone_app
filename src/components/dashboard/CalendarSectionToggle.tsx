import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";

type Props = {
  onPress: () => void;
  visibleMonth: Date;
  monthExpenseTotal: number;
};

export default function CalendarSectionToggle({
  onPress,
  visibleMonth,
  monthExpenseTotal,
}: Props) {
  const { colors, type, shadow, space, radius } = useAppTheme();
  const monthLabel = format(visibleMonth, "MMMM yyyy");

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s16,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.s16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        pressed: {
          opacity: 0.92,
        },
        iconWrap: {
          width: 44,
          height: 44,
          borderRadius: radius.md,
          backgroundColor: `${colors.primary}14`,
          alignItems: "center",
          justifyContent: "center",
        },
        textCol: {
          flex: 1,
          gap: space.s8,
        },
        title: {
          ...type.bodyMedium,
          fontSize: 16,
        },
        sub: {
          ...type.caption,
          color: colors.textSecondary,
        },
      }),
    [colors, type, space, radius]
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        shadow.card,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Open spending calendar"
    >
      <View style={styles.iconWrap}>
        <Ionicons name="calendar-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Spending calendar</Text>
        <Text style={styles.sub}>
          {monthLabel} · {formatCurrency(monthExpenseTotal)} spent
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
    </Pressable>
  );
}
