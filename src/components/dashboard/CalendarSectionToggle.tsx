import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { colors, radius, shadow, space, type } from "../../constants/theme";
import { formatCurrency } from "../../utils/format";

type Props = {
  expanded: boolean;
  onToggle: () => void;
  visibleMonth: Date;
  monthExpenseTotal: number;
};

export default function CalendarSectionToggle({
  expanded,
  onToggle,
  visibleMonth,
  monthExpenseTotal,
}: Props) {
  const monthLabel = format(visibleMonth, "MMMM yyyy");

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={
        expanded
          ? "Hide spending calendar"
          : "Show spending calendar"
      }
      accessibilityState={{ expanded }}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="calendar-outline" size={22} color={colors.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>
          {expanded ? "Hide calendar" : "Spending calendar"}
        </Text>
        <Text style={styles.sub}>
          {monthLabel} · {formatCurrency(monthExpenseTotal)} spent
        </Text>
      </View>
      <Ionicons
        name={expanded ? "chevron-up" : "chevron-down"}
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.s16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.s16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
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
});
