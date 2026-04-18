import { Pressable, StyleSheet, Text, View } from "react-native";
import { format, isSameMonth, isToday } from "date-fns";
import { colors, radius, space, type } from "../../constants/theme";
import {
  getCalendarGridDays,
  maxDailyExpenseInVisibleMonth,
} from "../../services/calendarSpend";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

type Props = {
  visibleMonth: Date;
  dailyExpenseTotals: Map<string, number>;
  selectedDayKey: string;
  onSelectDay: (dayKey: string) => void;
};

export default function SpendingCalendar({
  visibleMonth,
  dailyExpenseTotals,
  selectedDayKey,
  onSelectDay,
}: Props) {
  const days = getCalendarGridDays(visibleMonth);
  const maxInMonth = maxDailyExpenseInVisibleMonth(
    dailyExpenseTotals,
    visibleMonth
  );
  const maxForDot = maxInMonth > 0 ? maxInMonth : 1;

  const rows: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.weekday}>
            {d}
          </Text>
        ))}
      </View>
      {rows.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((dayDate) => {
            const dayKey = format(dayDate, "yyyy-MM-dd");
            const inMonth = isSameMonth(dayDate, visibleMonth);
            const today = isToday(dayDate);
            const expense = dailyExpenseTotals.get(dayKey) ?? 0;
            const selected = selectedDayKey === dayKey;
            const heat = expense > 0 ? 0.35 + (0.65 * expense) / maxForDot : 0;

            return (
              <Pressable
                key={dayKey}
                onPress={() => inMonth && onSelectDay(dayKey)}
                disabled={!inMonth}
                style={[
                  styles.cell,
                  today && styles.cellToday,
                  selected && styles.cellSelected,
                  !inMonth && styles.cellMuted,
                ]}
                accessibilityRole="button"
                accessibilityState={{ disabled: !inMonth }}
                accessibilityLabel={`${format(dayDate, "MMMM d")}${
                  expense > 0 ? `, ${expense} spent` : ""
                }`}
              >
                <Text
                  style={[
                    styles.dayNum,
                    !inMonth && styles.dayNumMuted,
                    today && styles.dayNumToday,
                  ]}
                >
                  {format(dayDate, "d")}
                </Text>
                {expense > 0 && inMonth && (
                  <View
                    style={[
                      styles.dot,
                      {
                        opacity: heat,
                        backgroundColor: colors.danger,
                      },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.s8,
  },
  weekdayRow: {
    flexDirection: "row",
    marginBottom: space.s8,
  },
  weekday: {
    flex: 1,
    textAlign: "center",
    ...type.caption,
    fontWeight: "600",
    color: colors.textMuted,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cell: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingVertical: space.s8,
  },
  cellMuted: {
    opacity: 0.35,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  cellSelected: {
    backgroundColor: `${colors.primary}18`,
  },
  dayNum: {
    ...type.bodyMedium,
    fontSize: 14,
  },
  dayNumMuted: {
    color: colors.textMuted,
  },
  dayNumToday: {
    color: colors.primary,
    fontWeight: "700",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
});
