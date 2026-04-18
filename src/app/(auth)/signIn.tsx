import { useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "../../providers/ThemeProvider";

/** Remote dotLottie (`.lottie`) — requires a dev build / production app; Expo Go shows the static fallback. */
const DOT_LOTTIE_SIGN_IN_HERO =
  "https://lottie.host/2f2cf46d-855b-4837-8fbf-a4e79e516f02/N6CIMJPDpO.lottie";

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { colors, type, shadow, space, radius, resolvedMode } = useAppTheme();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [lottieFailed, setLottieFailed] = React.useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(12)).current;
  const pulseScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.018,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseScale]);

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

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        flex: { flex: 1, paddingHorizontal: space.s24 },
        heroWrap: {
          alignItems: "center",
          paddingTop: space.s24,
          paddingBottom: space.s16,
          minHeight: 212,
          justifyContent: "center",
        },
        gradientBg: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          borderRadius: radius.xl,
        },
        halo: {
          width: 180,
          height: 180,
          borderRadius: 90,
          padding: 15,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
        },
        lottieBox: {
          width: 150,
          height: 150,
        },
        header: {
          paddingBottom: space.s24,
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
        form: {
          flex: 1,
          justifyContent: "center",
        },
        title: {
          ...type.title,
          marginBottom: space.s8,
        },
        subtitle: {
          ...type.body,
          color: colors.textMuted,
          marginBottom: space.s24,
        },
        input: {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          paddingHorizontal: space.s16,
          paddingVertical: space.s16,
          marginBottom: space.s16,
          borderWidth: 1,
          borderColor: colors.border,
          fontSize: 15,
          color: colors.text,
        },
        primaryButton: {
          backgroundColor: colors.primary,
          borderRadius: radius.md,
          paddingVertical: space.s16,
          alignItems: "center",
          marginTop: space.s8,
        },
        primaryButtonText: {
          color: "#FFFFFF",
          fontSize: 16,
          fontWeight: "600",
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
    [colors, radius, shadow, space, type]
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[gradTop, colors.background]}
            locations={[0, 1]}
            style={styles.gradientBg}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
              <View
                style={[
                  styles.halo,
                  {
                    backgroundColor: haloBg,
                    borderColor: haloBorder,
                    ...shadow.hero,
                  },
                ]}
              >
                {showRemoteDotLottie ? (
                  <DotLottie
                    source={{ uri: DOT_LOTTIE_SIGN_IN_HERO }}
                    loop
                    autoplay
                    speed={0.85}
                    style={styles.lottieBox}
                    onLoadError={() => setLottieFailed(true)}
                  />
                ) : (
                  <Ionicons
                    name="hardware-chip-outline"
                    size={72}
                    color={colors.primary}
                  />
                )}
              </View>
            </Animated.View>
          </Animated.View>
        </View>

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
