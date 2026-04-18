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

  const rows: (typeof days)[] = [];
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
                  !inMonth && styles.cellMuted,
                  inMonth && selected && styles.cellSelected,
                  inMonth && today && !selected && styles.cellToday,
                  inMonth && today && selected && styles.cellTodaySelected,
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
                    inMonth && selected && styles.dayNumSelected,
                    inMonth && today && !selected && styles.dayNumToday,
                  ]}
                >
                  {format(dayDate, "d")}
                </Text>
                {expense > 0 && inMonth && (
                  <View style={styles.track}>
                    <View
                      style={[
                        styles.trackFill,
                        {
                          width: `${Math.max(12, heat * 100)}%`,
                          opacity: 0.35 + heat * 0.6,
                        },
                      ]}
                    />
                  </View>
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
    gap: space.s16,
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
    gap: space.s8,
  },
  cell: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    paddingVertical: space.s8,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: colors.surfaceAlt,
  },
  cellMuted: {
    opacity: 0.35,
    backgroundColor: "transparent",
  },
  cellToday: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}0D`,
  },
  cellSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}22`,
  },
  cellTodaySelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}30`,
    borderWidth: 2,
  },
  dayNum: {
    ...type.bodyMedium,
    fontSize: 14,
    color: colors.text,
  },
  dayNumMuted: {
    color: colors.textMuted,
    fontWeight: "400",
  },
  dayNumToday: {
    color: colors.primary,
    fontWeight: "700",
  },
  dayNumSelected: {
    color: colors.primary,
    fontWeight: "800",
  },
  track: {
    height: 3,
    width: "100%",
    maxWidth: 28,
    marginTop: space.s8,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
});
