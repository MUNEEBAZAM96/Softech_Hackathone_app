import { useMemo } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";

import { useAppTheme } from "../../../providers/ThemeProvider";
import type { ThemeMode } from "../../../types";

type MenuItem = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  danger?: boolean;
};

const THEME_OPTIONS: { id: ThemeMode; label: string; hint: string }[] = [
  { id: "light", label: "Light", hint: "Always use light appearance" },
  { id: "dark", label: "Dark", hint: "Always use dark appearance" },
  { id: "system", label: "System", hint: "Match device settings" },
];

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { colors, type, space, radius, mode, setMode, resolvedMode } =
    useAppTheme();
  const insets = useSafeAreaInsets();

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const name = user?.fullName || user?.username || email || "BudgetIQ User";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scroll: {
          flex: 1,
          backgroundColor: colors.background,
        },
        scrollContent: {
          padding: space.s16,
          gap: space.s16,
        },
        header: {
          alignItems: "center",
          backgroundColor: colors.surface,
          padding: space.s24,
          borderRadius: radius.lg,
          gap: space.s8,
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
        name: { ...type.titleSmall, fontSize: 18 },
        email: { ...type.body, color: colors.textMuted },
        sectionLabel: {
          ...type.captionBold,
          color: colors.textSecondary,
          marginBottom: space.s8,
          marginLeft: space.s8,
        },
        themeCard: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
        },
        themeRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space.s16,
          paddingVertical: space.s16,
          gap: space.s16,
        },
        themeRowDivider: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        themeRowBody: { flex: 1 },
        themeRowLabel: { ...type.bodyMedium },
        themeRowHint: { ...type.caption, color: colors.textMuted, marginTop: 2 },
        menu: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          overflow: "hidden",
        },
        menuItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s16,
          paddingHorizontal: space.s16,
          paddingVertical: space.s16,
        },
        menuDivider: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        menuLabel: { ...type.body, flex: 1, fontWeight: "500" },
        signOut: {
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: space.s8,
          paddingVertical: space.s16,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
        },
        signOutText: { color: colors.danger, fontWeight: "600", fontSize: 15 },
        activeBadge: {
          ...type.captionBold,
          color: colors.primary,
        },
      }),
    [colors, type, space, radius]
  );

  const scrollBottomPadding = insets.bottom + 96;

  const confirmSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const items: MenuItem[] = [
    {
      id: "goals",
      label: "Savings Goals",
      icon: "flag-outline",
      onPress: () => router.push("/goals"),
    },
    {
      id: "budgets",
      label: "Budgets & Alerts",
      icon: "notifications-outline",
      onPress: () => router.push("/budgets"),
    },
    { id: "categories", label: "Manage Categories", icon: "pricetags-outline" },
    { id: "export", label: "Export Data", icon: "download-outline" },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: scrollBottomPadding },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        {!!email && <Text style={styles.email}>{email}</Text>}
      </View>

      <View>
        <Text style={styles.sectionLabel}>Theme</Text>
        <View style={styles.themeCard}>
          {THEME_OPTIONS.map((opt, idx) => {
            const selected = mode === opt.id;
            return (
              <Pressable
                key={opt.id}
                onPress={() => setMode(opt.id)}
                style={[
                  styles.themeRow,
                  idx < THEME_OPTIONS.length - 1 && styles.themeRowDivider,
                ]}
              >
                <Ionicons
                  name={
                    opt.id === "light"
                      ? "sunny-outline"
                      : opt.id === "dark"
                        ? "moon-outline"
                        : "phone-portrait-outline"
                  }
                  size={22}
                  color={selected ? colors.primary : colors.textMuted}
                />
                <View style={styles.themeRowBody}>
                  <Text style={styles.themeRowLabel}>{opt.label}</Text>
                  <Text style={styles.themeRowHint}>{opt.hint}</Text>
                </View>
                {selected ? (
                  <Text style={styles.activeBadge}>Active</Text>
                ) : (
                  <Ionicons
                    name="ellipse-outline"
                    size={20}
                    color={colors.border}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        <Text style={[type.caption, { color: colors.textMuted, marginTop: space.s8, marginLeft: space.s8 }]}>
          Currently using {resolvedMode === "dark" ? "dark" : "light"} appearance
          {mode === "system" ? " (from system)" : ""}.
        </Text>
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
    </ScrollView>
  );
}
