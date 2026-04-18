import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, typography } from "../constants/theme";
import type { Insight } from "../types";

type Props = {
  insight: Insight;
};

const sentimentMap: Record<
  Insight["sentiment"],
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  positive: { icon: "sparkles-outline", color: colors.income },
  neutral: { icon: "bulb-outline", color: colors.primary },
  warning: { icon: "alert-circle-outline", color: colors.warning },
};

export default function InsightCard({ insight }: Props) {
  const { icon, color } = sentimentMap[insight.sentiment];
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.description}>{insight.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.body,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.bodyMuted,
    lineHeight: 20,
  },
});
