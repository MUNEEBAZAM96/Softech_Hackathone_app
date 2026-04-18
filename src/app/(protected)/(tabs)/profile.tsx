import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";

import { colors, radius, spacing, typography } from "../../../constants/theme";

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = user?.fullName || user?.username || email || "BudgetIQ User";

  const confirmSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const items: MenuItem[] = [
    { id: "goals", label: "Savings Goals", icon: "flag-outline" },
    { id: "budgets", label: "Budgets & Alerts", icon: "notifications-outline" },
    { id: "categories", label: "Manage Categories", icon: "pricetags-outline" },
    { id: "export", label: "Export Data", icon: "download-outline" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        {!!email && <Text style={styles.email}>{email}</Text>}
      </View>

      <View style={styles.menu}>
        {items.map((item, idx) => (
          <Pressable
            key={item.id}
            onPress={() =>
              item.onPress ?? Alert.alert(item.label, "Coming soon.")
            }
            style={[
              styles.menuItem,
              idx !== items.length - 1 && styles.menuDivider,
            ]}
          >
            <Ionicons name={item.icon} size={20} color={colors.primary} />
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={confirmSignOut} style={styles.signOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  name: { ...typography.h3 },
  email: { ...typography.bodyMuted },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  menuDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuLabel: { ...typography.body, flex: 1, fontWeight: "500" },
  signOut: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  signOutText: { color: colors.danger, fontWeight: "600", fontSize: 15 },
});
