import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { colors, space, type } from "../../constants/theme";

type Props = {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  right?: ReactNode;
};

export default function SectionHeading({
  title,
  actionLabel = "See all",
  actionHref,
  right,
}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {right}
      {actionHref && !right && (
        <Link href={actionHref as any} asChild>
          <Pressable hitSlop={8}>
            <Text style={styles.action}>{actionLabel}</Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.s8,
  },
  title: {
    ...type.titleSmall,
    fontSize: 16,
  },
  action: {
    ...type.caption,
    color: colors.primary,
    fontWeight: "600",
  },
});
