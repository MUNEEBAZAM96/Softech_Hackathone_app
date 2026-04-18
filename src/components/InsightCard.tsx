import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, space, type } from "../constants/theme";
import type { Insight } from "../types";

type Props = {
  insight: Insight;
};

const sentimentMap: Record<
  Insight["sentiment"],
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  positive: { icon: "sparkles-outline", color: colors.success },
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
      <View style={styles.body}>
        <Text style={styles.title}>{insight.title}</Text>
        <Text style={styles.description}>{insight.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
