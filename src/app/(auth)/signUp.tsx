import { Ionicons } from "@expo/vector-icons";
import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Clipboard from "expo-clipboard";
import { Link, useRouter } from "expo-router";
import * as React from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSignUp, useSSO } from "@clerk/clerk-expo";

import { continueWithGoogleFlow } from "../../auth/continueWithGoogle";
import {
  AuthFormCard,
  AuthHaloShell,
  AuthOrDivider,
  AuthPrimaryButton,
  ContinueWithGoogleButton,
  PremiumAuthField,
  VerificationDigitsInput,
} from "../../components/auth/premiumAuth";
import { useAppTheme } from "../../providers/ThemeProvider";

const DOT_LOTTIE_SIGN_UP_HERO =
  "https://lottie.host/2f2cf46d-855b-4837-8fbf-a4e79e516f02/N6CIMJPDpO.lottie";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, type, space, resolvedMode } = useAppTheme();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [oauthLoading, setOauthLoading] = React.useState(false);
  const [lottieFailed, setLottieFailed] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [verifyError, setVerifyError] = React.useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = React.useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(
      () => setResendCooldown((c) => (c <= 1 ? 0 : c - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setFormError(null);
    setLoading(true);
    try {
      await signUp.create({ emailAddress, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      setResendCooldown(30);
      setCode("");
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? "Please try again.";
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;
    setVerifyError(null);
    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        setVerifyError("Please try again.");
      }
    } catch (err: any) {
      const msg = err?.errors?.[0]?.message ?? "Please try again.";
      setVerifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResendPress = async () => {
    if (!isLoaded || resendCooldown > 0 || loading) return;
    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResendCooldown(30);
    } catch (err: any) {
      Alert.alert(
        "Could not resend",
        err?.errors?.[0]?.message ?? "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = () => {
    setPendingVerification(false);
    setCode("");
    setVerifyError(null);
  };

  const onContinueWithGoogle = React.useCallback(async () => {
    setFormError(null);
    setOauthLoading(true);
    try {
      const result = await continueWithGoogleFlow(startSSOFlow, setActive);
      if (result.ok) {
        router.replace("/");
        return;
      }
      if (result.reason === "cancelled") {
        setFormError("Google sign-up was cancelled.");
        return;
      }
      if (result.reason === "not_ready") {
        setFormError("Please wait a moment and try again.");
        return;
      }
      setFormError(
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

  const pwdLen = password.length >= 8;
  const pwdLetter = /[a-zA-Z]/.test(password);
  const pwdNum = /\d/.test(password);

  const pasteEmailFromClipboard = React.useCallback(async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (!t) return;
      setFormError(null);
      setEmailAddress(t.trim());
    } catch {
      /* clipboard unavailable or denied */
    }
  }, []);

  const pastePasswordFromClipboard = React.useCallback(async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (!t) return;
      setFormError(null);
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
        stepHint: {
          ...type.captionBold,
          color: colors.primary,
          marginBottom: space.s8,
        },
        hintRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s8,
          marginBottom: space.s8,
        },
        hintText: {
          ...type.caption,
          color: colors.textSecondary,
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
        resendRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: space.s8,
          marginTop: space.s8,
          marginBottom: space.s8,
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
                  source={{ uri: DOT_LOTTIE_SIGN_UP_HERO }}
                  loop
                  autoplay
                  speed={0.75}
                  style={{ width: 150, height: 150 }}
                  onLoadError={() => setLottieFailed(true)}
                />
              </View>
            ) : (
              <Ionicons
                name="rocket-outline"
                size={72}
                color={colors.primary}
              />
            )}
          </AuthHaloShell>

          <View style={styles.header}>
            <Text style={styles.brand}>BudgetIQ AI</Text>
            <Text style={styles.tagline}>Start tracking smarter</Text>
          </View>

          <AuthFormCard>
            {pendingVerification ? (
              <>
                <Text style={styles.stepHint}>
                  Step 2 of 2 · Verify your email
                </Text>
                <Text style={styles.title}>Check your inbox</Text>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code we sent to {emailAddress}
                </Text>

                <VerificationDigitsInput
                  value={code}
                  onChangeText={(c) => {
                    setVerifyError(null);
                    setCode(c);
                  }}
                  errorMessage={verifyError ?? undefined}
                />

                <AuthPrimaryButton
                  label="Verify"
                  loadingLabel="Verifying…"
                  loading={loading}
                  onPress={onVerifyPress}
                  disabled={code.replace(/\D/g, "").length !== 6 || oauthLoading}
                />

                <View style={styles.resendRow}>
                  <Text style={type.caption}>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Didn't get a code?"}
                  </Text>
                  <Pressable
                    onPress={onResendPress}
                    disabled={resendCooldown > 0 || loading}
                  >
                    <Text
                      style={{
                        ...type.captionBold,
                        color:
                          resendCooldown > 0 || loading
                            ? colors.textMuted
                            : colors.primary,
                      }}
                    >
                      Resend code
                    </Text>
                  </Pressable>
                  <Text style={type.caption}>·</Text>
                  <Pressable onPress={changeEmail} disabled={loading}>
                    <Text
                      style={{
                        ...type.captionBold,
                        color: colors.primary,
                      }}
                    >
                      Change email
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.stepHint}>Step 1 of 2 · Create account</Text>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>
                  It takes less than a minute to get started
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
                  showSuccess={emailLooksValid && !formError}
                  errorMessage={formError ?? undefined}
                  onClearError={() => setFormError(null)}
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
                  showSuccess={
                    pwdLen && pwdLetter && pwdNum && !formError
                  }
                  borderError={!!formError}
                  onClearError={() => setFormError(null)}
                />

                <Text
                  style={[
                    type.captionBold,
                    { color: colors.textSecondary, marginBottom: space.s8 },
                  ]}
                >
                  Password strength
                </Text>
                <View style={styles.hintRow}>
                  <Ionicons
                    name={pwdLen ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={pwdLen ? colors.success : colors.textMuted}
                  />
                  <Text style={styles.hintText}>At least 8 characters</Text>
                </View>
                <View style={styles.hintRow}>
                  <Ionicons
                    name={pwdLetter ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={pwdLetter ? colors.success : colors.textMuted}
                  />
                  <Text style={styles.hintText}>One letter</Text>
                </View>
                <View style={[styles.hintRow, { marginBottom: space.s8 }]}>
                  <Ionicons
                    name={pwdNum ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={pwdNum ? colors.success : colors.textMuted}
                  />
                  <Text style={styles.hintText}>One number</Text>
                </View>

                <AuthPrimaryButton
                  label="Continue"
                  loadingLabel="Creating…"
                  loading={loading}
                  onPress={onSignUpPress}
                  disabled={loading || oauthLoading}
                />

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
          </AuthFormCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
