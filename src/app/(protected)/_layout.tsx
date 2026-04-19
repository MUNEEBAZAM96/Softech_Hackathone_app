import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAtomValue, useSetAtom } from "jotai";

import {
  categoryBudgetsAtom,
  financeHydratedAtom,
  savingsGoalsAtom,
  transactionsAtom,
} from "../../atoms";
import { useAppTheme } from "../../providers/ThemeProvider";
import { initializeFinanceData } from "../../db/bootstrap";

function ProtectedStack() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="categorySelector"
        options={{
          presentation: "modal",
          title: "Select Category",
        }}
      />
      <Stack.Screen
        name="transaction/[id]"
        options={{
          title: "Transaction",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

export default function ProtectedLayout() {
  const { isSignedIn } = useAuth();
  const { colors } = useAppTheme();
  const hydrated = useAtomValue(financeHydratedAtom);
  const setHydrated = useSetAtom(financeHydratedAtom);
  const setTransactions = useSetAtom(transactionsAtom);
  const setGoals = useSetAtom(savingsGoalsAtom);
  const setBudgets = useSetAtom(categoryBudgetsAtom);

  useEffect(() => {
    if (!isSignedIn || hydrated) return;
    let active = true;
    const run = async () => {
      try {
        const snapshot = await initializeFinanceData();
        if (!active) return;
        setTransactions(snapshot.transactions);
        setGoals(snapshot.goals);
        setBudgets(snapshot.budgets);
      } finally {
        if (active) {
          setHydrated(true);
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, [
    hydrated,
    isSignedIn,
    setBudgets,
    setGoals,
    setHydrated,
    setTransactions,
  ]);

  if (!isSignedIn) {
    return <Redirect href="/signIn" />;
  }

  if (!hydrated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <ProtectedStack />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
