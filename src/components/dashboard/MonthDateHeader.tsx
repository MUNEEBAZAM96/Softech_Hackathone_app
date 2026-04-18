import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { colors, radius, space, type } from "../../constants/theme";

type Props = {
  visibleMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export default function MonthDateHeader({
  visibleMonth,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const monthTitle = format(visibleMonth, "MMMM yyyy");
  const todayLine = format(new Date(), "EEE, MMM d");

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={onPrevMonth}
          style={styles.chevron}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Text style={styles.todayLine}>Today · {todayLine}</Text>
        </View>

        <Pressable
          onPress={onNextMonth}
          style={styles.chevron}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: space.s8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chevron: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
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
});
