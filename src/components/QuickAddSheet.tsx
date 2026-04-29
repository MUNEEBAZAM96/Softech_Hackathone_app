/**
 * QuickAddSheet — premium bottom sheet shown when user taps the Add FAB.
 *
 * Actions:
 *  • Scan Receipt  – TODO: wire expo-image-picker + OpenRouter vision OCR
 *  • Voice Add     – TODO: wire expo-speech-recognition + parser
 *  • Manual Entry  – navigates to existing /add screen
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSetAtom } from "jotai";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  receiptScanDraftAtom,
  receiptScanImageUriAtom,
  selectedCategoryAtom,
} from "../atoms";
import { useAppTheme } from "../providers/ThemeProvider";
import {
  pickAndPrepareReceiptImage,
  type ReceiptImageSource,
} from "../services/receiptImagePickerService";
import { mapSuggestedCategory, parseReceiptImage } from "../services/receiptScanService";
import { useFinanceData } from "../providers/FinanceDataProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuickAddSheetProps = {
  visible: boolean;
  onClose: () => void;
};

type ActionDef = {
  id: "scan" | "voice" | "manual";
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  /** accent hex used for icon glow and gradient */
  accentLight: string;
  accentDark: string;
  primary?: boolean;
};

const ACTIONS: ActionDef[] = [
  {
    id: "scan",
    icon: "camera",
    label: "Scan",
    sublabel: "Receipt / Bill",
    accentLight: "#0EA5E9",
    accentDark: "#38BDF8",
  },
  {
    id: "manual",
    icon: "create",
    label: "Manual",
    sublabel: "Fill in form",
    accentLight: "#4F46E5",
    accentDark: "#818CF8",
    primary: true,
  },
  {
    id: "voice",
    icon: "mic",
    label: "Voice",
    sublabel: "Speak to add",
    accentLight: "#7C3AED",
    accentDark: "#A78BFA",
  },
];

const SHEET_HEIGHT = 340;
const STAGGER_MS = 55;
const SPRING_CONFIG = { friction: 9, tension: 80, useNativeDriver: true };
const ENTER_MS = 380;
const EXIT_MS = 260;

// ─── Action Button ────────────────────────────────────────────────────────────

type ActionButtonProps = {
  action: ActionDef;
  delayMs: number;
  accent: string;
  onPress: (id: ActionDef["id"]) => void;
  colors: ReturnType<typeof useAppTheme>["colors"];
  type: ReturnType<typeof useAppTheme>["type"];
  shadow: ReturnType<typeof useAppTheme>["shadow"];
  space: ReturnType<typeof useAppTheme>["space"];
  radius: ReturnType<typeof useAppTheme>["radius"];
  resolvedMode: "light" | "dark";
};

function ActionButton({
  action,
  delayMs,
  accent,
  onPress,
  colors,
  type,
  shadow,
  space,
  radius,
  resolvedMode,
}: ActionButtonProps) {
  const enterAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.spring(enterAnim, {
        toValue: 1,
        friction: 7,
        tension: 90,
        useNativeDriver: true,
      }).start();
    }, delayMs);
    return () => clearTimeout(timer);
  }, [enterAnim, delayMs]);

  const translateY = enterAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });
  const opacity = enterAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.6, 1],
  });

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.88,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 4,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress(action.id);
  };

  const circleSize = 72;
  const iconSize = 28;
  const isPrimary = action.primary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          alignItems: "center",
          flex: 1,
        },
        circleOuter: {
          width: circleSize + 8,
          height: circleSize + 8,
          borderRadius: (circleSize + 8) / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: `${accent}18`,
          borderWidth: isPrimary ? 1.5 : 1,
          borderColor: `${accent}40`,
          marginBottom: space.s8,
        },
        circle: {
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          ...(isPrimary ? shadow.fab : shadow.card),
          shadowColor: accent,
        },
        label: {
          ...(type.bodyMedium as object),
          fontSize: 14,
          color: colors.text,
          marginBottom: 3,
        },
        sublabel: {
          ...(type.caption as object),
          fontSize: 11,
          color: colors.textMuted,
          textAlign: "center",
        },
      }),
    [accent, colors, isPrimary, shadow, space, type]
  );

  const gradientColors: readonly [string, string, string] = isPrimary
    ? [
        resolvedMode === "dark" ? "#4F46E5" : "#6366F1",
        resolvedMode === "dark" ? "#7C3AED" : "#8B5CF6",
        resolvedMode === "dark" ? "#5B21B6" : "#7C3AED",
      ]
    : ([
        resolvedMode === "dark"
          ? `${accent}3A`
          : `${accent}25`,
        resolvedMode === "dark"
          ? `${accent}55`
          : `${accent}38`,
        resolvedMode === "dark"
          ? `${accent}3A`
          : `${accent}25`,
      ] as [string, string, string]);

  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }, { scale: pressScale }], opacity }]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${action.label}: ${action.sublabel}`}
        android_ripple={{ color: `${accent}44`, borderless: true, radius: (circleSize + 8) / 2 }}
      >
        <View style={styles.circleOuter}>
          <View style={styles.circle}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons
              name={action.icon}
              size={iconSize}
              color={isPrimary ? "#FFFFFF" : accent}
            />
          </View>
        </View>
        <Text style={styles.label}>{action.label}</Text>
        <Text style={styles.sublabel}>{action.sublabel}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ─── QuickAddSheet ────────────────────────────────────────────────────────────

export default function QuickAddSheet({ visible, onClose }: QuickAddSheetProps) {
  const { colors, type, shadow, space, radius, resolvedMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { categories, user } = useFinanceData();
  const setReceiptDraft = useSetAtom(receiptScanDraftAtom);
  const setReceiptImageUri = useSetAtom(receiptScanImageUriAtom);
  const setSelectedCategory = useSetAtom(selectedCategoryAtom);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const [mounted, setMounted] = useState(false);

  // Entrance
  useEffect(() => {
    if (visible) {
      setMounted(true);
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: ENTER_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(sheetAnim, {
          toValue: 0,
          ...SPRING_CONFIG,
        }),
      ]).start();
    }
  }, [visible, backdropAnim, sheetAnim]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetAnim, {
        toValue: SHEET_HEIGHT,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      onClose();
    });
  }, [backdropAnim, sheetAnim, onClose]);

  // ── Action handlers ──────────────────────────────────────────────────────

  const runScanFromSource = useCallback(
    async (source: ReceiptImageSource) => {
      const picked = await pickAndPrepareReceiptImage(source);
      if (!picked.ok) {
        if (picked.reason !== "cancelled") {
          Alert.alert("Scan", picked.message);
        }
        return;
      }

      const parsed = await parseReceiptImage({
        imageBase64: picked.image.imageBase64,
        mimeType: picked.image.mimeType,
        currency: user?.currency,
        categories: categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })),
      });

      if (!parsed.ok) {
        Alert.alert("Could not parse receipt", parsed.message);
        return;
      }

      setReceiptDraft(parsed.draft);
      setReceiptImageUri(picked.image.uri);
      const mapped = mapSuggestedCategory(parsed.draft, categories);
      setSelectedCategory(mapped);
      router.push("/scan/review");
    },
    [
      categories,
      setReceiptDraft,
      setReceiptImageUri,
      setSelectedCategory,
      user?.currency,
    ]
  );

  const handleScan = useCallback(() => {
    dismiss();
    setTimeout(() => {
      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: "Scan Receipt",
            message: "Choose how to capture your receipt",
            options: ["Cancel", "Take Photo", "Choose from Gallery"],
            cancelButtonIndex: 0,
          },
          (index) => {
            if (index === 1) void runScanFromSource("camera");
            if (index === 2) void runScanFromSource("gallery");
          }
        );
      } else {
        Alert.alert("Scan Receipt", "Choose how to capture your receipt", [
          { text: "Take Photo", onPress: () => void runScanFromSource("camera") },
          { text: "Choose from Gallery", onPress: () => void runScanFromSource("gallery") },
          { text: "Cancel", style: "cancel" },
        ]);
      }
    }, EXIT_MS + 60);
  }, [dismiss, runScanFromSource]);

  const handleVoice = useCallback(() => {
    dismiss();
    // TODO: wire expo-speech-recognition here
    // import * as SpeechRecognition from 'expo-speech-recognition';
    // await SpeechRecognition.requestPermissionsAsync();
    // start listening, then parse transcript with:
    //   POST /api/parse-voice  body: { text: "spent 1200 on fuel today" }
    //   returns { amount, categoryId, note, date }
    // then pre-fill / auto-save the Add Transaction form
    setTimeout(() => {
      Alert.alert(
        "Voice Add",
        'Voice transaction entry coming soon!\n\nYou\'ll be able to say "Spent 1200 on fuel" and it will be added automatically.',
        [{ text: "Got it" }]
      );
    }, EXIT_MS + 60);
  }, [dismiss]);

  const handleManual = useCallback(() => {
    dismiss();
    setTimeout(() => {
      router.navigate("/(protected)/(tabs)/add");
    }, EXIT_MS);
  }, [dismiss]);

  const handleAction = useCallback(
    (id: ActionDef["id"]) => {
      if (id === "scan") handleScan();
      else if (id === "voice") handleVoice();
      else handleManual();
    },
    [handleScan, handleVoice, handleManual]
  );

  // ── Derived accent per resolved mode ────────────────────────────────────

  const accentFor = useCallback(
    (action: ActionDef) =>
      resolvedMode === "dark" ? action.accentDark : action.accentLight,
    [resolvedMode]
  );

  // ── Sheet surface color ──────────────────────────────────────────────────

  const sheetBg = resolvedMode === "dark" ? colors.surfaceElevated : colors.surface;
  const handleColor =
    resolvedMode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.14)";

  const sheetStyle = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor:
            resolvedMode === "dark"
              ? "rgba(0,0,0,0.72)"
              : "rgba(15,23,42,0.52)",
        },
        sheet: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: sheetBg,
          paddingBottom: Math.max(insets.bottom, space.s16),
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: resolvedMode === "dark" ? 0.4 : 0.12,
          shadowRadius: 20,
          elevation: 20,
        },
        gradientAccent: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        },
        handle: {
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: handleColor,
          alignSelf: "center",
          marginTop: 12,
          marginBottom: 4,
        },
        header: {
          paddingHorizontal: space.s24,
          paddingTop: space.s8,
          paddingBottom: space.s16,
        },
        closeRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: space.s8,
        },
        title: {
          ...(type.title as object),
          fontSize: 20,
          letterSpacing: -0.3,
          color: colors.text,
        },
        closeBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor:
            resolvedMode === "dark"
              ? "rgba(255,255,255,0.09)"
              : "rgba(15,23,42,0.06)",
          alignItems: "center",
          justifyContent: "center",
        },
        subtitle: {
          ...(type.caption as object),
          color: colors.textMuted,
          lineHeight: 18,
        },
        actions: {
          flexDirection: "row",
          justifyContent: "center",
          paddingHorizontal: space.s16,
          paddingTop: space.s8,
          paddingBottom: space.s16,
          gap: 0,
        },
      }),
    [colors, handleColor, insets.bottom, resolvedMode, sheetBg, space, type]
  );

  if (!mounted && !visible) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View
        style={[sheetStyle.backdrop, { opacity: backdropAnim }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Close quick add"
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          sheetStyle.sheet,
          { transform: [{ translateY: sheetAnim }] },
        ]}
      >
        {/* Gradient top accent line */}
        <LinearGradient
          colors={
            resolvedMode === "dark"
              ? ["#818CF8", "#7C3AED", "#38BDF8"]
              : ["#6366F1", "#8B5CF6", "#0EA5E9"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={sheetStyle.gradientAccent}
        />

        {/* Handle bar */}
        <View style={sheetStyle.handle} />

        {/* Header */}
        <View style={sheetStyle.header}>
          <View style={sheetStyle.closeRow}>
            <Text style={sheetStyle.title}>Quick Add</Text>
            <Pressable
              onPress={dismiss}
              style={sheetStyle.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={sheetStyle.subtitle}>
            Choose how you want to add your transaction
          </Text>
        </View>

        {/* Action buttons */}
        <View style={sheetStyle.actions}>
          {ACTIONS.map((action, i) => (
            <ActionButton
              key={action.id}
              action={action}
              delayMs={i * STAGGER_MS}
              accent={accentFor(action)}
              onPress={handleAction}
              colors={colors}
              type={type}
              shadow={shadow}
              space={space}
              radius={radius}
              resolvedMode={resolvedMode}
            />
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}
