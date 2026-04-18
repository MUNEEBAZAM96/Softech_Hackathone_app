import { ReactNode } from "react";
import { View, ViewStyle } from "react-native";

import { useAppTheme } from "../../providers/ThemeProvider";

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
  const { colors, shadow, radius, space } = useAppTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.s16,
        },
        elevated && shadow.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
