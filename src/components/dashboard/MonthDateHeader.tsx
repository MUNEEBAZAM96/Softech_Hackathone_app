import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { colors, radius, shadow, space, type } from "../../constants/theme";

type Props = {
  visibleMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday: () => void;
};

export default function MonthDateHeader({
  visibleMonth,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
}: Props) {
  const monthTitle = format(visibleMonth, "MMMM yyyy");
  const todayLine = format(new Date(), "EEE, MMM d");

  return (
    <View style={[styles.wrap, shadow.card]}>
      <View style={styles.row}>
        <Pressable
          onPress={onPrevMonth}
          style={({ pressed }) => [styles.navPill, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Text style={styles.todayLine}>Today · {todayLine}</Text>
        </View>

        <Pressable
          onPress={onNextMonth}
          style={({ pressed }) => [styles.navPill, pressed && styles.pressed]}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Pressable
        onPress={onJumpToToday}
        style={({ pressed }) => [styles.todayBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Jump to today"
      >
        <Ionicons name="today-outline" size={16} color={colors.primary} />
        <Text style={styles.todayBtnText}>Today</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.s16,
    gap: space.s16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navPill: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  center: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: space.s8,
  },
  monthTitle: {
    ...type.title,
    fontSize: 18,
  },
  todayLine: {
    ...type.caption,
    marginTop: space.s8,
    color: colors.textSecondary,
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: space.s8,
    paddingVertical: space.s8,
    paddingHorizontal: space.s16,
    borderRadius: radius.pill,
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: `${colors.primary}35`,
  },
  todayBtnText: {
    ...type.captionBold,
    color: colors.primary,
    fontSize: 13,
  },
});
