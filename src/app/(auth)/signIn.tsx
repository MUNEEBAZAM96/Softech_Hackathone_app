import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import {
  Text,
  TextInput,
  View,
  Platform,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { colors, radius, spacing, typography } from "../../constants/theme";

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const attempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        Alert.alert("Sign in incomplete", "Please complete the next step.");
      }
    } catch (err: any) {
      Alert.alert("Sign in failed", err?.errors?.[0]?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, emailAddress, password]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>BudgetIQ AI</Text>
          <Text style={styles.tagline}>Your smart finance companion</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue tracking your money
          </Text>

          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={emailAddress}
            placeholder="Email address"
            placeholderTextColor={colors.textMuted}
            onChangeText={setEmailAddress}
          />
          <TextInput
            style={styles.input}
            value={password}
            placeholder="Password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            onChangeText={setPassword}
          />

          <Pressable
            style={[styles.primaryButton, loading && { opacity: 0.7 }]}
            onPress={onSignInPress}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Signing in..." : "Sign In"}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Link href="/signUp" asChild>
              <Pressable>
                <Text style={styles.footerLink}> Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, paddingHorizontal: spacing.xl },
  header: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  brand: {
    ...typography.h1,
    color: colors.primary,
  },
  tagline: {
    ...typography.bodyMuted,
    marginTop: spacing.xs,
  },
  form: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  footerText: { ...typography.bodyMuted },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: "600" },
});
