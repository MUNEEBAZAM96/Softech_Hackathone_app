import { StyleSheet, View } from "react-native";

import { useAppTheme } from "../../providers/ThemeProvider";

type Props = {
  progress: number;
  /** 0–1 or 0–100 */
  max?: 1 | 100;
  color: string;
  trackColor?: string;
  height?: number;
};

export default function ProgressBarThin({
  progress,
  max = 100,
  color,
  trackColor,
  height = 8,
}: Props) {
  const { colors, radius } = useAppTheme();
  const track = trackColor ?? colors.surfaceAlt;
  const p = max === 1 ? progress * 100 : progress;
  const pct = Math.min(100, Math.max(0, p));
  return (
    <View style={[styles.track, { height, backgroundColor: track }]}>
      <View
        style={[styles.fill, { width: `${pct}%`, backgroundColor: color }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 999,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
