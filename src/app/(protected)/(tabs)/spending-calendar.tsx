import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { useAtomValue } from "jotai";

import { transactionsAtom } from "../../../atoms";
import { colors, space, type } from "../../../constants/theme";
import {
  addMonths,
  buildDailyExpenseTotals,
  getMonthExpenseSummary,
  subMonths,
} from "../../../services/calendarSpend";

import CalendarMonthSummaryCard from "../../../components/dashboard/CalendarMonthSummaryCard";
import MonthDateHeader from "../../../components/dashboard/MonthDateHeader";
import SpendingCalendar from "../../../components/dashboard/SpendingCalendar";
import SelectedDayPanel from "../../../components/dashboard/SelectedDayPanel";
import AppCard from "../../../components/ui/AppCard";

// Tab screen (hidden from tab bar via href: null) — stable route: /spending-calendar
export default function SpendingCalendarScreen() {
  const transactions = useAtomValue(transactionsAtom);

  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDayKey, setSelectedDayKey] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );

  const dailyExpenseTotals = useMemo(
    () => buildDailyExpenseTotals(transactions),
    [transactions]
  );

  const monthSummary = useMemo(
    () => getMonthExpenseSummary(transactions, visibleMonth),
    [transactions, visibleMonth]
  );

  const monthLabel = format(visibleMonth, "MMMM yyyy");

  useEffect(() => {
    const selected = parseISO(`${selectedDayKey}T12:00:00`);
    if (!isSameMonth(selected, visibleMonth)) {
      const today = new Date();
      if (isSameMonth(today, visibleMonth)) {
        setSelectedDayKey(format(today, "yyyy-MM-dd"));
      } else {
        setSelectedDayKey(format(startOfMonth(visibleMonth), "yyyy-MM-dd"));
      }
    }
  }, [visibleMonth, selectedDayKey]);

  const jumpToToday = () => {
    const now = new Date();
    setVisibleMonth(startOfMonth(now));
    setSelectedDayKey(format(now, "yyyy-MM-dd"));
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <CalendarMonthSummaryCard summary={monthSummary} monthLabel={monthLabel} />

      <MonthDateHeader
        visibleMonth={visibleMonth}
        onPrevMonth={() => setVisibleMonth((m) => subMonths(m, 1))}
        onNextMonth={() => setVisibleMonth((m) => addMonths(m, 1))}
        onJumpToToday={jumpToToday}
      />

      <AppCard>
        <Text style={styles.cardEyebrow}>Spending</Text>
        <SpendingCalendar
          visibleMonth={visibleMonth}
          dailyExpenseTotals={dailyExpenseTotals}
          selectedDayKey={selectedDayKey}
          onSelectDay={setSelectedDayKey}
        />
        <View style={styles.divider} />
        <Text style={styles.cardEyebrow}>Day detail</Text>
        <SelectedDayPanel
          dayKey={selectedDayKey}
          transactions={transactions}
          dailyExpenseTotals={dailyExpenseTotals}
        />
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.s16,
    paddingTop: space.s16,
    paddingBottom: space.s32,
    gap: space.s24,
  },
  cardEyebrow: {
    ...type.captionBold,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: colors.textMuted,
    marginBottom: space.s8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.s16,
  },
});
