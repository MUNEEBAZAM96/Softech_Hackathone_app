import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../providers/ThemeProvider";

const DEFAULT_TIP =
  "Review subscriptions monthly—unused services quietly drain your budget. Small cuts compound into real savings.";

type Props = {
  message?: string;
};

export default function AITipOfTheDay({ message = DEFAULT_TIP }: Props) {
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
      },
      body: {
        ...type.body,
        color: colors.textSecondary,
      },
    });
  }, [colors, type, resolvedMode, space, radius]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        </View>
        <Text style={styles.title}>AI Tip of the Day</Text>
      </View>
      <Text style={styles.body}>{message}</Text>
    </View>
  );
}
