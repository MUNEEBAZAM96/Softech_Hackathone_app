import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

import { useAppTheme } from "../../providers/ThemeProvider";

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

  if (!isSignedIn) {
    return <Redirect href="/signIn" />;
  }

  return <ProtectedStack />;
}
