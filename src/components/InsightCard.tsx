import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../providers/ThemeProvider";
import type { Insight } from "../types";

type Props = {
  insight: Insight;
};

export default function InsightCard({ insight }: Props) {
  const { colors, type, space, radius } = useAppTheme();

  const sentimentMap = useMemo(
    () =>
      ({
        positive: { icon: "sparkles-outline" as const, color: colors.success },
        neutral: { icon: "bulb-outline" as const, color: colors.primary },
        warning: {
          icon: "alert-circle-outline" as const,
          color: colors.warning,
        },
      }) as const,
    [colors]
  );

  const { icon, color } = sentimentMap[insight.sentiment];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          flexDirection: "row",
          gap: space.s16,
          backgroundColor: colors.surface,
          padding: space.s16,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
        },
        iconWrap: {
          width: 36,
          height: 36,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
        },
        body: {
          flex: 1,
        },
        title: {
          ...type.bodyMedium,
          marginBottom: space.s8,
        },
        description: {
          ...type.body,
          color: colors.textMuted,
          lineHeight: 20,
        },
      }),
    [colors, type, space, radius]
  );

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.description}>{insight.description}</Text>
      </View>
    </View>
  );
}
