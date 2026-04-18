import { Stack, Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

import { useAppTheme } from "../../providers/ThemeProvider";

function AuthStack() {
  const { colors } = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="signIn" />
      <Stack.Screen name="signUp" />
    </Stack>
  );
}

export default function AuthLayout() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return <AuthStack />;
}
