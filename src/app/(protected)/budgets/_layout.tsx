import { Stack } from "expo-router";

import { colors } from "../../../constants/theme";

export default function BudgetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { color: colors.text, fontWeight: "700" },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Budgets & alerts" }} />
      <Stack.Screen name="new" options={{ title: "New budget" }} />
      <Stack.Screen name="[id]" options={{ title: "Edit budget" }} />
    </Stack>
  );
}
