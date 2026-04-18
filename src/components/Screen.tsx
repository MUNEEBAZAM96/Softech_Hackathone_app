import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, space } from "../constants/theme";

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
  withSafeArea?: boolean;
};

export default function Screen({
  children,
  padded = true,
  style,
  withSafeArea = false,
}: ScreenProps) {
  const Container = withSafeArea ? SafeAreaView : View;
  return (
    <Container style={[styles.container, padded && styles.padded, style]}>
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: space.s16,
  },
});
