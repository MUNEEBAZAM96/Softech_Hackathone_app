import { useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../providers/ThemeProvider";

export type BudgetTrackCardProps = {
  alertCount: number;
  warningOrEarlyCount: number;
  exceededCount: number;
  onPress: () => void;
  accessibilityLabel: string;
};

export default function BudgetTrackCard({
  alertCount,
  warningOrEarlyCount,
  exceededCount,
  onPress,
  accessibilityLabel,
}: BudgetTrackCardProps) {
  const { colors, resolvedMode, type, space, radius, shadow } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const hasAlerts = alertCount > 0;
  /** Accent-leaning when healthy; warmer wash when attention needed. */
  const gradientColors = useMemo(() => {
    if (hasAlerts) {
      return resolvedMode === "dark"
        ? ([`${colors.warning}22`, `${colors.surface}F2`, colors.surface] as const)
        : ([`${colors.warning}18`, `${colors.surface}FC`, colors.surface] as const);
    }
    return resolvedMode === "dark"
      ? ([`${colors.accent}24`, `${colors.surface}F5`, colors.surface] as const)
      : ([`${colors.accent}12`, `${colors.success}08`, colors.surface] as const);
  }, [colors.accent, colors.success, colors.surface, colors.warning, hasAlerts, resolvedMode]);

  const borderTint = hasAlerts ? `${colors.warning}35` : `${colors.accent}30`;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: { flex: 1, minWidth: 0 },
        gradient: {
          borderRadius: radius.lg,
          padding: space.s16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: borderTint,
          overflow: "hidden",
          minHeight: 200,
          ...shadow.card,
        },
        inner: { flex: 1, gap: space.s8, alignItems: "center" },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s8,
          alignSelf: "stretch",
        },
        label: {
          ...type.captionBold,
          fontSize: 12,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: hasAlerts ? colors.warning : colors.accent,
        },
        chevron: { marginLeft: "auto" as const },
        hero: {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: space.s8,
        },
        heroWord: {
          ...type.display,
          fontSize: 22,
          fontWeight: "800",
          color: colors.success,
        },
        heroNum: {
          ...type.display,
          fontSize: 40,
          fontWeight: "800",
          color: hasAlerts ? colors.warning : colors.text,
        },
        heroLabel: {
          ...type.caption,
          color: colors.textSecondary,
          marginTop: 4,
        },
        sub: {
          ...type.caption,
          color: colors.textMuted,
          textAlign: "center",
        },
        chipRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: space.s8,
          justifyContent: "center",
          alignSelf: "stretch",
        },
        chip: {
          paddingVertical: 4,
          paddingHorizontal: space.s8,
          borderRadius: radius.pill,
          borderWidth: 1,
        },
        chipText: {
          ...type.caption,
          fontSize: 11,
          fontWeight: "600",
        },
      }),
    [borderTint, colors, hasAlerts, radius, shadow, space, type]
  );

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const showWarningChip = warningOrEarlyCount > 0;
  const showExceededChip = exceededCount > 0;

  return (
    <Animated.View style={[{ flex: 1, minWidth: 0, transform: [{ scale }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.press}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <LinearGradient
          colors={[...gradientColors]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.inner}>
            <View style={styles.headerRow}>
              <Ionicons
                name="pie-chart-outline"
                size={16}
                color={hasAlerts ? colors.warning : colors.accent}
              />
              <Text style={styles.label}>Budgets</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
                style={styles.chevron}
              />
            </View>

            <View style={styles.hero}>
              {!hasAlerts ? (
                <>
                  <Text style={styles.heroWord}>All clear</Text>
                  <Text style={styles.heroLabel}>No alerts this month</Text>
                </>
              ) : (
                <>
                  <Text style={styles.heroNum}>{alertCount}</Text>
                  <Text style={styles.heroLabel}>Active alerts</Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    Review categories on Budgets
                  </Text>
                </>
              )}
            </View>

            {hasAlerts && (showWarningChip || showExceededChip) ? (
              <View style={styles.chipRow}>
                {showWarningChip ? (
                  <View
                    style={[
                      styles.chip,
                      {
                        borderColor: `${colors.warning}55`,
                        backgroundColor: `${colors.warning}12`,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.warning }]}>
                      Watch · {warningOrEarlyCount}
                    </Text>
                  </View>
                ) : null}
                {showExceededChip ? (
                  <View
                    style={[
                      styles.chip,
                      {
                        borderColor: `${colors.danger}55`,
                        backgroundColor: `${colors.danger}12`,
                      },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.danger }]}>
                      Over · {exceededCount}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
