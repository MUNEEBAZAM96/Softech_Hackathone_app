import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, space, type } from "../constants/theme";
import { formatCurrency } from "../utils/format";

type StatCardProps = {
  label: string;
  amount: number;
  icon: keyof typeof Ionicons.glyphMap;
  tint?: string;
  style?: ViewStyle;
};

export default function StatCard({
  label,
  amount,
  icon,
  tint = colors.primary,
  style,
}: StatCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: `${tint}1A` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.amount}>{formatCurrency(amount)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.s16,
    gap: space.s8,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.s8,
  },
  label: {
    ...type.caption,
  },
  amount: {
    ...type.titleSmall,
  },
});
