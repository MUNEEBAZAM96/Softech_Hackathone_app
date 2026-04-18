import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { format, isSameMonth, parseISO, startOfMonth } from "date-fns";
import { useAtomValue } from "jotai";

import { transactionsAtom } from "../../../atoms";
import { colors, space } from "../../../constants/theme";
import {
  addMonths,
  buildDailyExpenseTotals,
  subMonths,
} from "../../../services/calendarSpend";

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <MonthDateHeader
        visibleMonth={visibleMonth}
        onPrevMonth={() => setVisibleMonth((m) => subMonths(m, 1))}
        onNextMonth={() => setVisibleMonth((m) => addMonths(m, 1))}
      />
      <AppCard>
        <SpendingCalendar
          visibleMonth={visibleMonth}
          dailyExpenseTotals={dailyExpenseTotals}
          selectedDayKey={selectedDayKey}
          onSelectDay={setSelectedDayKey}
        />
        <View style={styles.divider} />
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
    gap: space.s16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.s16,
  },
});
