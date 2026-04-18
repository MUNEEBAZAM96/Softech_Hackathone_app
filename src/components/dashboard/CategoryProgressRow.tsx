import { StyleSheet, Text, View } from "react-native";
import { colors, radius, space, type } from "../../constants/theme";
import { formatCurrency } from "../../utils/format";

type Props = {
  name: string;
  amount: number;
  /** 0–100 share of total expenses */
  percentOfTotal: number;
  barColor: string;
};

export default function CategoryProgressRow({
  name,
  amount,
  percentOfTotal,
  barColor,
}: Props) {
  const widthPct = Math.min(100, Math.max(4, percentOfTotal));
  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${widthPct}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: space.s8,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: space.s16,
  },
  name: {
    ...type.bodyMedium,
    flex: 1,
  },
  amount: {
    ...type.captionBold,
    color: colors.text,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
  },
});
