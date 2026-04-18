import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, shadow, space } from "../../constants/theme";

type AppCardProps = {
  children: ReactNode;
  style?: ViewStyle;
  /** Use default card shadow */
  elevated?: boolean;
};

export default function AppCard({
  children,
  style,
  elevated = true,
}: AppCardProps) {
  return (
    <View style={[styles.base, elevated && shadow.card, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.s16,
  },
});
