import { useMemo, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G } from "react-native-svg";

import type { GoalPaceKind } from "../../types";
import { useAppTheme } from "../../providers/ThemeProvider";

const RING_SIZE = 88;
const STROKE = 6;
const R = (RING_SIZE - STROKE) / 2;
const CX = RING_SIZE / 2;
const CY = RING_SIZE / 2;
const CIRC = 2 * Math.PI * R;

function paceLabel(pace: GoalPaceKind): string {
  switch (pace) {
    case "ahead":
      return "Ahead";
    case "on_track":
      return "On track";
    case "behind":
      return "Behind";
    case "completed":
      return "Done";
    default:
      return "";
  }
}

export type GoalsTrackCardProps = {
  /** When null, show empty-state ring. */
  progressPct: number | null;
  /** Footer line: goal title fragment + pace — no % here. */
  footerLine: string;
  onPress: () => void;
  accessibilityLabel: string;
};

export default function GoalsTrackCard({
  progressPct,
  footerLine,
  onPress,
  accessibilityLabel,
}: GoalsTrackCardProps) {
  const { colors, resolvedMode, type, space, radius, shadow } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const pct =
    progressPct === null ? 0 : Math.max(0, Math.min(100, Math.round(progressPct)));
  const dashOffset = CIRC * (1 - pct / 100);

  const gradientColors = useMemo(
    () =>
      resolvedMode === "dark"
        ? ([`${colors.primary}28`, `${colors.surface}F5`, `${colors.surface}`] as const)
        : ([`${colors.primary}14`, `${colors.surface}FB`, colors.surface] as const),
    [colors.primary, colors.surface, resolvedMode]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        press: { flex: 1, minWidth: 0 },
        gradient: {
          borderRadius: radius.lg,
          padding: space.s16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `${colors.primary}28`,
          overflow: "hidden",
          minHeight: 200,
          ...shadow.card,
        },
        inner: { gap: space.s8, alignItems: "center" },
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
          color: colors.primary,
        },
        chevron: { marginLeft: "auto" as const },
        ringWrap: {
          width: RING_SIZE,
          height: RING_SIZE,
          alignItems: "center",
          justifyContent: "center",
        },
        pctCenter: {
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        },
        pctText: {
          ...type.title,
          fontSize: 22,
          fontWeight: "700",
          color: colors.text,
        },
        pctSuffix: {
          fontSize: 13,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        footer: {
          ...type.caption,
          color: colors.textSecondary,
          textAlign: "center",
          alignSelf: "stretch",
        },
      }),
    [colors, radius, shadow, space, type]
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

  const trackStroke = colors.border;
  const progressStroke = colors.primary;

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
        <LinearGradient colors={[...gradientColors]} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.inner}>
            <View style={styles.headerRow}>
              <Ionicons name="flag-outline" size={16} color={colors.primary} />
              <Text style={styles.label}>Goals</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textMuted}
                style={styles.chevron}
              />
            </View>

            <View style={styles.ringWrap}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <G transform={`rotate(-90 ${CX} ${CY})`}>
                  <Circle
                    cx={CX}
                    cy={CY}
                    r={R}
                    stroke={trackStroke}
                    strokeWidth={STROKE}
                    fill="none"
                  />
                  <Circle
                    cx={CX}
                    cy={CY}
                    r={R}
                    stroke={progressStroke}
                    strokeWidth={STROKE}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                  />
                </G>
              </Svg>
              <View style={styles.pctCenter} pointerEvents="none">
                <Text style={styles.pctText}>
                  {progressPct === null ? "—" : `${pct}`}
                </Text>
                {progressPct !== null ? (
                  <Text style={styles.pctSuffix}>%</Text>
                ) : null}
              </View>
            </View>

            <Text style={styles.footer} numberOfLines={2}>
              {footerLine}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export { paceLabel };
