import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { DAILY_TIP_FALLBACK } from "../../services/dailyTipService";
import { useAppTheme } from "../../providers/ThemeProvider";

export const DEFAULT_AI_TIP = DAILY_TIP_FALLBACK;

type Props = {
  message?: string;
  loading?: boolean;
  /** Shown under the body when the API fails (tip still falls back). */
  errorMessage?: string | null;
  onRequestNewTip?: () => void;
  /** When false, renders a locked teaser that links to the paywall. */
  isPro?: boolean;
};

export default function AITipOfTheDay({
  message = DEFAULT_AI_TIP,
  loading = false,
  errorMessage = null,
  onRequestNewTip,
  isPro = true,
}: Props) {
  const { colors, type, resolvedMode, space, radius } = useAppTheme();

  const styles = useMemo(() => {
    const cardBg =
      resolvedMode === "dark" ? colors.surfaceAlt : "#EEF2FF";
    const cardBorder =
      resolvedMode === "dark" ? colors.border : "#C7D2FE";

    return StyleSheet.create({
      card: {
        backgroundColor: cardBg,
        borderRadius: radius.lg,
        padding: space.s16,
        borderWidth: 1,
        borderColor: cardBorder,
      },
      header: {
        flexDirection: "row",
        alignItems: "center",
        gap: space.s8,
        marginBottom: space.s8,
      },
      headerMain: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: space.s8,
        minWidth: 0,
      },
      badge: {
        width: 28,
        height: 28,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
      },
      title: {
        ...type.titleSmall,
        fontSize: 16,
        color: colors.primary,
        flexShrink: 1,
      },
      body: {
        ...type.body,
        color: colors.textSecondary,
      },
      error: {
        ...type.caption,
        color: colors.warning,
        marginTop: space.s8,
      },
      actions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: space.s16,
        gap: space.s8,
      },
      newTip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: space.s8,
        paddingHorizontal: space.s16,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.primary,
        backgroundColor:
          resolvedMode === "dark" ? `${colors.primary}22` : `${colors.primary}12`,
      },
      newTipLabel: {
        ...type.captionBold,
        color: colors.primary,
        fontSize: 13,
      },
      lockedPreview: {
        marginTop: space.s8,
        gap: space.s8,
        position: "relative",
      },
      lockedLine: {
        height: 12,
        borderRadius: radius.pill,
        backgroundColor:
          resolvedMode === "dark"
            ? `${colors.textMuted}33`
            : `${colors.textMuted}26`,
      },
      lockedFade: {
        ...StyleSheet.absoluteFillObject,
      },
      lockedPadlockWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
      },
      lockedPadlock: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor:
          resolvedMode === "dark" ? colors.surface : "#FFFFFF",
        borderWidth: 1,
        borderColor:
          resolvedMode === "dark" ? `${colors.primary}55` : "#C7D2FE",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: resolvedMode === "dark" ? 0.65 : 0.4,
        shadowRadius: 14,
        elevation: 8,
      },
      lockedCaption: {
        ...type.caption,
        color: colors.textMuted,
        marginTop: space.s16,
      },
      lockedActions: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        marginTop: space.s8,
      },
      unlockBtn: {
        borderRadius: radius.pill,
        overflow: "hidden",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: resolvedMode === "dark" ? 0.45 : 0.3,
        shadowRadius: 10,
        elevation: 5,
      },
      unlockBtnInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: space.s8 + 2,
        paddingHorizontal: space.s16,
      },
      unlockLabel: {
        ...type.captionBold,
        color: "#FFFFFF",
        fontSize: 13,
        letterSpacing: 0.3,
      },
    });
  }, [colors, type, resolvedMode, space, radius]);

  if (!isPro) {
    const cardBg = resolvedMode === "dark" ? colors.surfaceAlt : "#EEF2FF";
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <View style={styles.badge}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
            </View>
            <Text style={styles.title} numberOfLines={1}>
              AI Tip of the Day
            </Text>
          </View>
        </View>

        {/* Simulated "hidden advice" lines under a fade + glowing padlock. */}
        <View style={styles.lockedPreview}>
          <View style={[styles.lockedLine, { width: "94%" }]} />
          <View style={[styles.lockedLine, { width: "86%" }]} />
          <View style={[styles.lockedLine, { width: "90%" }]} />
          <View style={[styles.lockedLine, { width: "55%" }]} />
          <LinearGradient
            colors={[`${cardBg}00`, cardBg]}
            style={styles.lockedFade}
            pointerEvents="none"
          />
          <View style={styles.lockedPadlockWrap} pointerEvents="none">
            <View style={styles.lockedPadlock}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={colors.primary}
              />
            </View>
          </View>
        </View>

        <Text style={styles.lockedCaption}>
          Daily AI advice personalized to your spending, budgets and goals.
        </Text>

        <View style={styles.lockedActions}>
          <Pressable
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/paywall");
            }}
            style={({ pressed }) => [
              styles.unlockBtn,
              pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Unlock AI tips with Pro"
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryMuted]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.unlockBtnInner}
            >
              <Ionicons name="flash" size={14} color="#FFFFFF" />
              <Text style={styles.unlockLabel}>Unlock with Pro</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
          <Text style={styles.title} numberOfLines={1}>
            AI Tip of the Day
          </Text>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : null}
        </View>
      </View>
      <Text style={styles.body}>{message}</Text>
      {errorMessage ? (
        <Text style={styles.error} numberOfLines={4}>
          {errorMessage}
        </Text>
      ) : null}
      {onRequestNewTip ? (
        <View style={styles.actions}>
          <Pressable
            onPress={onRequestNewTip}
            disabled={loading}
            style={({ pressed }) => [
              styles.newTip,
              (pressed || loading) && { opacity: 0.65 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Generate a new tip"
          >
            <Ionicons name="refresh" size={16} color={colors.primary} />
            <Text style={styles.newTipLabel}>New tip</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
