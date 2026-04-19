import { useEffect } from "react";

import { tokenCache } from "../../cache";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Slot } from "expo-router";

import { ThemeProvider, ThemedStatusBar } from "../providers/ThemeProvider";
import { initBudgetNotifications } from "../services/budgetNotificationService";
import { initGoalNotifications } from "../services/goalNotificationService";

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

  if (!publishableKey) {
    throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env");
  }

  useEffect(() => {
    void initBudgetNotifications();
    void initGoalNotifications();
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <ThemeProvider>
          <ThemedStatusBar />
          <Slot />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
