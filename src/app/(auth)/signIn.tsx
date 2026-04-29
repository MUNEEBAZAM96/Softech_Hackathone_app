import { useSignIn, useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Clipboard from "expo-clipboard";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { continueWithGoogleFlow } from "../../auth/continueWithGoogle";
import {
  AuthFormCard,
  AuthHaloShell,
  AuthOrDivider,
  AuthPrimaryButton,
  ContinueWithGoogleButton,
  PremiumAuthField,
} from "../../components/auth/premiumAuth";
import { useAppTheme } from "../../providers/ThemeProvider";

const DOT_LOTTIE_SIGN_IN_HERO =
  "https://lottie.host/2f2cf46d-855b-4837-8fbf-a4e79e516f02/N6CIMJPDpO.lottie";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, resolvedMode } = useAppTheme();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState(false);
  const [lottieFailed, setLottieFailed] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;
    setInlineError(null);
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
      const msg = err?.errors?.[0]?.message ?? "Please try again.";
      setInlineError(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, emailAddress, password, router, setActive, signIn]);

  const onContinueWithGoogle = React.useCallback(async () => {
    setInlineError(null);
    setOauthLoading(true);
    try {
      const result = await continueWithGoogleFlow(startSSOFlow, setActive);
      if (result.ok) {
        router.replace("/");
        return;
      }
      if (result.reason === "cancelled") {
        setInlineError("Google sign-in was cancelled.");
        return;
      }
      if (result.reason === "not_ready") {
        setInlineError("Please wait a moment and try again.");
        return;
      }
      setInlineError(
        result.reason === "clerk_error" || result.reason === "no_session"
          ? result.message
          : "Please try again."
      );
    } finally {
      setOauthLoading(false);
    }
  }, [router, setActive, startSSOFlow]);

  const haloBg =
    resolvedMode === "dark"
      ? "rgba(129, 140, 248, 0.14)"
      : "rgba(79, 70, 229, 0.1)";
  const haloBorder =
    resolvedMode === "dark"
      ? "rgba(129, 140, 248, 0.38)"
      : "rgba(79, 70, 229, 0.28)";
  const gradTop =
    resolvedMode === "dark"
      ? "rgba(129, 140, 248, 0.2)"
      : "rgba(79, 70, 229, 0.14)";

  const showRemoteDotLottie = !isExpoGo && !lottieFailed;
  const emailLooksValid = EMAIL_OK.test(emailAddress.trim());

  const pasteEmailFromClipboard = React.useCallback(async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (!t) return;
      setInlineError(null);
      setEmailAddress(t.trim());
    } catch {
      /* clipboard unavailable or denied */
    }
  }, []);

  const pastePasswordFromClipboard = React.useCallback(async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (!t) return;
      setInlineError(null);
      setPassword(t);
    } catch {
      /* clipboard unavailable or denied */
    }
  }, []);

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        keyboardView: { flex: 1 },
        header: {
          paddingBottom: space.s24,
          paddingHorizontal: space.s24,
        },
        brand: {
          ...type.title,
          fontSize: 22,
          color: colors.primary,
        },
        tagline: {
          ...type.body,
          color: colors.textMuted,
          marginTop: space.s8,
        },
        scrollContent: {
          paddingHorizontal: space.s24,
          paddingBottom: insets.bottom + space.s24,
        },
        title: {
          ...type.title,
          marginBottom: space.s8,
        },
        subtitle: {
          ...type.body,
          color: colors.textMuted,
          marginBottom: space.s16,
        },
        footer: {
          flexDirection: "row",
          justifyContent: "center",
          marginTop: space.s24,
        },
        footerText: { ...type.body, color: colors.textMuted },
        footerLink: {
          ...type.body,
          color: colors.primary,
          fontWeight: "600",
        },
      }),
    [colors, insets.bottom, space, type]
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <AuthHaloShell
            haloBg={haloBg}
            haloBorder={haloBorder}
            gradTop={gradTop}
            backgroundColor={colors.background}
          >
            {showRemoteDotLottie ? (
              <View pointerEvents="none" style={{ width: 150, height: 150 }}>
                <DotLottie
                  source={{ uri: DOT_LOTTIE_SIGN_IN_HERO }}
                  loop
                  autoplay
                  speed={0.85}
                  style={{ width: 150, height: 150 }}
                  onLoadError={() => setLottieFailed(true)}
                />
              </View>
            ) : (
              <Ionicons
                name="hardware-chip-outline"
                size={72}
                color={colors.primary}
              />
            )}
          </AuthHaloShell>

          <View style={styles.header}>
            <Text style={styles.brand}>BudgetIQ AI</Text>
            <Text style={styles.tagline}>Your smart finance companion</Text>
          </View>

          <AuthFormCard>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue tracking your money
            </Text>

            <ContinueWithGoogleButton
              onPress={onContinueWithGoogle}
              loading={oauthLoading}
              disabled={!isLoaded || loading}
            />

            <AuthOrDivider />

            <PremiumAuthField
              icon="mail-outline"
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="Email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              allowPaste
              onPaste={pasteEmailFromClipboard}
              showSuccess={emailLooksValid && !inlineError}
              errorMessage={inlineError ?? undefined}
              onClearError={() => setInlineError(null)}
            />
            <PremiumAuthField
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              autoComplete="password"
              allowPaste
              onPaste={pastePasswordFromClipboard}
              showSuccess={password.length >= 8 && !inlineError}
              borderError={!!inlineError}
              onClearError={() => setInlineError(null)}
            />

            <AuthPrimaryButton
              label="Sign In"
              loadingLabel="Signing in…"
              loading={loading}
              onPress={onSignInPress}
              disabled={loading || oauthLoading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Link href="/signUp" asChild>
                <Pressable>
                  <Text style={styles.footerLink}> Sign up</Text>
                </Pressable>
              </Link>
            </View>
          </AuthFormCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
