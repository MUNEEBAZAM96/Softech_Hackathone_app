import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { FinanceDataProvider, useFinanceData } from "../../providers/FinanceDataProvider";
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
      <Stack.Screen
        name="scan/review"
        options={{
          title: "Review Receipt",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}

function FinanceLoadingGate() {
  const { colors, type } = useAppTheme();
  const { ready, error, refresh } = useFinanceData();

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: colors.background, padding: 24, gap: 12 },
        ]}
      >
        <Text style={[type.body, { textAlign: "center", color: colors.text }]}>
          {error}
        </Text>
        <Pressable
          onPress={() => {
            void refresh();
          }}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return <ProtectedStack />;
}

export default function ProtectedLayout() {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) {
    return <Redirect href="/signIn" />;
  }
  return (
    <FinanceDataProvider>
      <FinanceLoadingGate />
    </FinanceDataProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
