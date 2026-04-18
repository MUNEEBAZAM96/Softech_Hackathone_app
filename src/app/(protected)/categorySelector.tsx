import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSetAtom } from "jotai";

import { selectedCategoryAtom } from "../../atoms";
import { categories } from "../../constants/categories";
import { colors, radius, spacing, typography } from "../../constants/theme";
import type { Category, TransactionKind } from "../../types";

const KINDS: { id: TransactionKind; label: string }[] = [
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
];

export default function CategorySelectorScreen() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<TransactionKind>("expense");
  const setSelected = useSetAtom(selectedCategoryAtom);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.kind === kind &&
        (!term || c.name.toLowerCase().includes(term))
    );
  }, [search, kind]);

  const onSelect = (category: Category) => {
    setSelected(category);
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          placeholder="Search categories"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
        {!!search && (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textMuted}
            onPress={() => setSearch("")}
          />
        )}
      </View>

      <View style={styles.kindRow}>
        {KINDS.map((k) => {
          const active = kind === k.id;
          return (
            <Pressable
              key={k.id}
              onPress={() => setKind(k.id)}
              style={[styles.kindPill, active && styles.kindPillActive]}
            >
              <Text
                style={[styles.kindText, active && styles.kindTextActive]}
              >
                {k.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => onSelect(item)} style={styles.row}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${item.color}1A` },
              ]}
            >
              <Ionicons
                name={item.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={item.color}
              />
            </View>
            <Text style={styles.rowText}>{item.name}</Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  kindRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  kindPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kindPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  kindText: { ...typography.body, fontWeight: "600", color: colors.textMuted },
  kindTextActive: { color: "#FFFFFF" },
  listContent: { paddingBottom: spacing.xxl },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { ...typography.body, fontWeight: "600", flex: 1 },
});
