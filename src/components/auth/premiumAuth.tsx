import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { useAppTheme } from "../../providers/ThemeProvider";

type PremiumFieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  /** Autofill / browser hints (email, password, etc.). */
  autoComplete?: TextInputProps["autoComplete"];
  errorMessage?: string;
  /** Red border without duplicating message (e.g. password row on failed login). */
  borderError?: boolean;
  showSuccess?: boolean;
  onClearError?: () => void;
  /** Show a trailing “Paste” control; pair with `onPaste` for clipboard read in the screen. */
  allowPaste?: boolean;
  onPaste?: () => void | Promise<void>;
};

/** Icon + input row with stable height; border reflects focus / error / success. */
export function PremiumAuthField({
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  errorMessage,
  borderError,
  showSuccess,
  onClearError,
  allowPaste,
  onPaste,
}: PremiumFieldProps) {
  const { colors, radius, space, type } = useAppTheme();
  const [focused, setFocused] = React.useState(false);

  const borderColor =
    errorMessage || borderError
      ? colors.danger
      : showSuccess && value.length > 0
        ? colors.success
        : focused
          ? colors.primary
          : colors.border;

  const glow =
    focused && !errorMessage
      ? {
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
          elevation: 3,
        }
      : {};

  const rowWeb =
    Platform.OS === "web"
      ? ({ alignSelf: "stretch" as const, width: "100%" as const, minWidth: 0 as const } as const)
      : null;

  return (
    <View style={{ marginBottom: space.s16 }}>
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            minHeight: 52,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor,
            paddingLeft: space.s8,
            paddingRight: space.s16,
            ...glow,
          },
          rowWeb,
        ]}
      >
        <View pointerEvents="none" style={{ width: 40, alignItems: "center" }}>
          <Ionicons
            name={icon}
            size={20}
            color={
              errorMessage || borderError
                ? colors.danger
                : showSuccess && value.length > 0
                  ? colors.success
                  : focused
                    ? colors.primary
                    : colors.textMuted
            }
          />
        </View>
        <TextInput
          style={[
            type.body,
            {
              flex: 1,
              paddingVertical: 14,
              color: colors.text,
              minHeight: 48,
              ...(Platform.OS === "web"
                ? {
                    minWidth: 0,
                    flexGrow: 1,
                    flexShrink: 1,
                    outlineStyle: "none" as const,
                  }
                : null),
            },
          ]}
          value={value}
          onChangeText={(t) => {
            onClearError?.();
            onChangeText(t);
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {allowPaste && onPaste ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Paste from clipboard"
            hitSlop={8}
            onPress={() => {
              void Promise.resolve(onPaste()).catch(() => {
                /* clipboard read failed or denied */
              });
            }}
            style={{ flexShrink: 0, marginLeft: space.s8, paddingVertical: 4 }}
          >
            <Text
              style={[
                type.captionBold,
                { color: colors.primary, fontSize: 13 },
              ]}
            >
              Paste
            </Text>
          </Pressable>
        ) : null}
        {showSuccess && value.length > 0 && !errorMessage ? (
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        ) : null}
      </View>
      {errorMessage ? (
        <Text
          style={[
            type.caption,
            { color: colors.danger, marginTop: 6, marginLeft: space.s8 },
          ]}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

type AuthFormCardProps = {
  children: React.ReactNode;
};

export function AuthFormCard({ children }: AuthFormCardProps) {
  const { colors, radius, shadow, space } = useAppTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(12)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: space.s24,
        ...shadow.card,
        ...(Platform.OS === "web"
          ? {
              alignSelf: "stretch",
              width: "100%",
              minWidth: 0,
              zIndex: 1,
              position: "relative" as const,
            }
          : null),
      }}
    >
      {children}
    </Animated.View>
  );
}

type AuthPrimaryButtonProps = {
  label: string;
  loadingLabel: string;
  loading: boolean;
  onPress: () => void;
  disabled?: boolean;
};

export function AuthPrimaryButton({
  label,
  loadingLabel,
  loading,
  onPress,
  disabled,
}: AuthPrimaryButtonProps) {
  const { colors, radius, space } = useAppTheme();
  const scale = React.useRef(new Animated.Value(1)).current;

  const runScale = (to: number) => {
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      friction: 6,
      tension: 300,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        borderRadius: radius.md,
        marginTop: space.s8,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        onPressIn={() => runScale(0.985)}
        onPressOut={() => runScale(1)}
        style={{
          minHeight: 52,
          minWidth: 280,
          width: "100%",
          backgroundColor: colors.primary,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: space.s8,
          opacity: disabled || loading ? 0.72 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : null}
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 16,
            fontWeight: "600",
            minWidth: loading ? 120 : undefined,
            textAlign: "center",
          }}
        >
          {loading ? loadingLabel : label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

type AuthOrDividerProps = {
  label?: string;
};

/** Centered “or” label between hairlines; use between SSO and email/password. */
export function AuthOrDivider({ label = "or" }: AuthOrDividerProps) {
  const { colors, space, type } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.s16,
        marginVertical: space.s16,
      }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View
        style={{
          flex: 1,
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
        }}
      />
      <Text style={[type.captionBold, { color: colors.textMuted }]}>
        {label}
      </Text>
      <View
        style={{
          flex: 1,
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
        }}
      />
    </View>
  );
}

type ContinueWithGoogleButtonProps = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Secondary full-width control for Clerk Google SSO; matches premium auth card styling.
 */
export function ContinueWithGoogleButton({
  onPress,
  loading = false,
  disabled = false,
}: ContinueWithGoogleButtonProps) {
  const { colors, radius, space, type } = useAppTheme();
  const busy = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ busy: loading, disabled: busy }}
      onPress={onPress}
      disabled={busy}
      style={{
        minHeight: 52,
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: space.s8,
        paddingHorizontal: space.s16,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: busy ? 0.72 : 1,
        ...(Platform.OS === "web"
          ? { alignSelf: "stretch", minWidth: 0 }
          : null),
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} size="small" />
      ) : (
        <Ionicons name="logo-google" size={22} color="#4285F4" />
      )}
      <Text
        style={[
          type.body,
          {
            fontWeight: "600",
            color: colors.text,
            flexShrink: 1,
            textAlign: "center",
          },
        ]}
        numberOfLines={1}
      >
        {loading ? "Connecting…" : "Continue with Google"}
      </Text>
    </Pressable>
  );
}

type AuthHaloShellProps = {
  haloBg: string;
  haloBorder: string;
  gradTop: string;
  backgroundColor: string;
  children: React.ReactNode;
};

/** Shared gradient + halo ring; center content is children (DotLottie or icon). */
export function AuthHaloShell({
  haloBg,
  haloBorder,
  gradTop,
  backgroundColor,
  children,
}: AuthHaloShellProps) {
  const { radius, shadow, space } = useAppTheme();

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

  return (
    <View
      style={{
        alignItems: "center",
        paddingTop: space.s24,
        paddingBottom: space.s16,
        minHeight: 212,
        justifyContent: "center",
      }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[gradTop, backgroundColor]}
        locations={[0, 1]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 200,
          borderRadius: radius.xl,
        }}
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
              {
                width: 180,
                height: 180,
                borderRadius: 90,
                padding: 15,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                backgroundColor: haloBg,
                borderColor: haloBorder,
                ...shadow.hero,
              },
            ]}
          >
            {children}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

type VerificationDigitsProps = {
  value: string;
  onChangeText: (code: string) => void;
  errorMessage?: string;
};

/** Six boxes + hidden input driving the code (max 6 digits). */
export function VerificationDigitsInput({
  value,
  onChangeText,
  errorMessage,
}: VerificationDigitsProps) {
  const { colors, radius, space, type } = useAppTheme();
  const [focused, setFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  const digits = value.replace(/\D/g, "").slice(0, 6);
  const slots = [0, 1, 2, 3, 4, 5];

  const borderColor = errorMessage
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={{ marginBottom: space.s16 }}>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={{ position: "relative" }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            gap: space.s8,
          }}
        >
          {slots.map((i) => (
            <View
              key={i}
              style={{
                flex: 1,
                minHeight: 48,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor,
                backgroundColor: colors.surfaceAlt,
                alignItems: "center",
                justifyContent: "center",
                ...(focused && i === digits.length && !errorMessage
                  ? {
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                    }
                  : {}),
              }}
            >
              <Text
                style={[
                  type.title,
                  { fontSize: 20, color: colors.text },
                ]}
              >
                {digits[i] ?? ""}
              </Text>
            </View>
          ))}
        </View>
        <TextInput
          ref={inputRef}
          value={digits}
          onChangeText={(t) => onChangeText(t.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            StyleSheet.absoluteFillObject,
            { opacity: 0.02, color: "transparent" },
          ]}
          importantForAutofill="no"
          autoCorrect={false}
          caretHidden
        />
      </Pressable>
      {errorMessage ? (
        <Text
          style={[
            type.caption,
            { color: colors.danger, marginTop: 6, marginLeft: space.s8 },
          ]}
        >
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
