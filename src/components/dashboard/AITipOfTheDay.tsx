import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { DAILY_TIP_FALLBACK } from "../../services/dailyTipService";
import { useAppTheme } from "../../providers/ThemeProvider";

export const DEFAULT_AI_TIP = DAILY_TIP_FALLBACK;

type Props = {
  message?: string;
  loading?: boolean;
  /** Shown under the body when the API fails (tip still falls back). */
  errorMessage?: string | null;
  onRequestNewTip?: () => void;
};

export default function AITipOfTheDay({
  message = DEFAULT_AI_TIP,
  loading = false,
  errorMessage = null,
  onRequestNewTip,
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
    });
  }, [colors, type, resolvedMode, space, radius]);

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
