import { useMemo } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAppTheme } from "../../providers/ThemeProvider";
import { formatCurrency } from "../../utils/format";

type Variant = "neutral" | "success" | "danger";

type KPIBlockProps = {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  style?: ViewStyle;
};

export default function KPIBlock({
  label,
  value,
  icon,
  variant = "neutral",
  style,
}: KPIBlockProps) {
  const { colors, type, space, radius } = useAppTheme();

  const variantColor = useMemo(
    () =>
      ({
        neutral: colors.textSecondary,
        success: colors.success,
        danger: colors.danger,
      }) as Record<Variant, string>,
    [colors]
  );

  const tint = variantColor[variant];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          flex: 1,
          minWidth: "28%",
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.s16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        iconCircle: {
          width: 32,
          height: 32,
          borderRadius: radius.pill,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: space.s8,
        },
        label: {
          ...type.caption,
          textTransform: "uppercase",
          letterSpacing: 0.4,
          marginBottom: space.s8,
        },
        value: {
          ...type.titleSmall,
          fontSize: 15,
        },
      }),
    [colors, type, space, radius]
  );

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.iconCircle, { backgroundColor: `${tint}14` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.value, { color: tint }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatCurrency(value)}
      </Text>
    </View>
  );
}
