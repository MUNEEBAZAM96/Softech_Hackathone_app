import * as React from "react";
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
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { colors, radius, spacing, typography } from "../../constants/theme";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({ emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert(
        "Sign up failed",
        err?.errors?.[0]?.message ?? "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        Alert.alert("Verification incomplete", "Please try again.");
      }
    } catch (err: any) {
      Alert.alert(
        "Verification failed",
        err?.errors?.[0]?.message ?? "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.brand}>BudgetIQ AI</Text>
          <Text style={styles.tagline}>Start tracking smarter</Text>
        </View>

        <View style={styles.form}>
          {pendingVerification ? (
            <>
              <Text style={styles.title}>Verify your email</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code we sent to {emailAddress}
              </Text>
              <TextInput
                style={styles.input}
                value={code}
                placeholder="Verification code"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                onChangeText={setCode}
              />
              <Pressable
                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                onPress={onVerifyPress}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Verifying..." : "Verify"}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>
                It takes less than a minute to get started
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
                onPress={onSignUpPress}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Creating..." : "Continue"}
                </Text>
              </Pressable>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account?</Text>
                <Link href="/signIn" asChild>
                  <Pressable>
                    <Text style={styles.footerLink}> Sign in</Text>
                  </Pressable>
                </Link>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1, paddingHorizontal: spacing.xl },
  header: { paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  brand: { ...typography.h1, color: colors.primary },
  tagline: { ...typography.bodyMuted, marginTop: spacing.xs },
  form: { flex: 1, justifyContent: "center" },
  title: { ...typography.h2, marginBottom: spacing.xs },
  subtitle: { ...typography.bodyMuted, marginBottom: spacing.xl },
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
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  footerText: { ...typography.bodyMuted },
  footerLink: { ...typography.body, color: colors.primary, fontWeight: "600" },
});
