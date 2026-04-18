import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSetAtom } from "jotai";

import { dismissedBudgetAlertIdsAtom } from "../../atoms";
import type { BudgetAlertItem } from "../../types";
import type { ThemeColors } from "../../constants/theme";
import { useAppTheme } from "../../providers/ThemeProvider";

function alertTone(
  colors: ThemeColors,
  level: BudgetAlertItem["level"]
): { fg: string; icon: keyof typeof Ionicons.glyphMap } {
  if (level === "exceeded") {
    return { fg: colors.danger, icon: "alert-circle" };
  }
  if (level === "warning") {
    return { fg: colors.warning, icon: "warning-outline" };
  }
  if (level === "early") {
    return { fg: colors.warning, icon: "pulse-outline" };
  }
  return { fg: colors.textMuted, icon: "checkmark-circle-outline" };
}

type Props = {
  alerts: BudgetAlertItem[];
};

export default function BudgetAlertsDashboardCard({ alerts }: Props) {
  const { colors, type, shadow, space, radius } = useAppTheme();
  const setDismissed = useSetAtom(dismissedBudgetAlertIdsAtom);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.s16,
          gap: space.s16,
          ...shadow.card,
        },
        headerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        header: { ...type.titleSmall, fontSize: 16 },
        link: { ...type.caption, color: colors.primary, fontWeight: "600" },
        list: { gap: space.s16 },
        row: {
          flexDirection: "row",
          gap: space.s8,
          alignItems: "flex-start",
        },
        dismiss: { ...type.caption, color: colors.textMuted, fontWeight: "600" },
        textCol: { flex: 1, gap: space.s8 / 2 },
        msg: { ...type.body, color: colors.text },
        forecast: { ...type.caption, color: colors.textSecondary },
        empty: { ...type.body, color: colors.textMuted },
      }),
    [colors, type, shadow, space, radius]
  );

  return (
    <Pressable
      onPress={() => router.push("/budgets")}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.header}>Budget signals</Text>
        <Text style={styles.link}>Manage</Text>
      </View>
      {alerts.length === 0 ? (
        <Text style={styles.empty}>
          No warnings this month — your category budgets look calm.
        </Text>
      ) : (
        <View style={styles.list}>
          {alerts.map((a) => {
            const tone = alertTone(colors, a.level);
            return (
              <View key={a.id} style={styles.row}>
                <Ionicons name={tone.icon} size={20} color={tone.fg} />
                <View style={styles.textCol}>
                  <Text style={styles.msg}>{a.message}</Text>
                  {!!a.forecastMessage && (
                    <Text style={styles.forecast}>{a.forecastMessage}</Text>
                  )}
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    setDismissed((prev) => ({ ...prev, [a.id]: true }))
                  }
                >
                  <Text style={styles.dismiss}>Hide</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </Pressable>
  );
}
