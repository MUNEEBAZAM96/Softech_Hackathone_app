import { useMemo, useState } from "react";
import {
  Alert,
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
import { useFinanceData } from "../../providers/FinanceDataProvider";
import { getDatabase } from "../../db/client";
import { insertCategory } from "../../db/categoriesRepo";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { createLocalId } from "../../utils/id";
import type { Category, TransactionKind } from "../../types";

const KINDS: { id: TransactionKind; label: string }[] = [
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
];

export default function CategorySelectorScreen() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<TransactionKind>("expense");
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const setSelected = useSetAtom(selectedCategoryAtom);
  const { categories, refresh } = useFinanceData();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter(
      (c) =>
        c.kind === kind &&
        (!term || c.name.toLowerCase().includes(term))
    );
  }, [search, kind, categories]);

  const onSelect = (category: Category) => {
    setSelected(category);
    router.back();
  };

  const onCreateCategory = async () => {
    const name = newName.trim();
    if (!name) {
      Alert.alert("Name required", "Enter a category name.");
      return;
    }
    const fallbackIcon =
      kind === "expense" ? "pricetag-outline" : "wallet-outline";
    const fallbackColor = kind === "expense" ? "#F97316" : "#10B981";
    const newCategory: Category = {
      id: createLocalId("cat"),
      name,
      kind,
      icon: fallbackIcon,
      color: fallbackColor,
    };
    try {
      const db = await getDatabase();
      await insertCategory(db, newCategory);
      await refresh();
      setSelected(newCategory);
      router.back();
    } catch {
      Alert.alert(
        "Create failed",
        "Could not save this category. Please try again."
      );
    }
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

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>No categories yet</Text>
          <Text style={styles.emptyHint}>
            Create your first {kind} category to continue.
          </Text>
          {!isCreating ? (
            <Pressable
              style={styles.createBtn}
              onPress={() => setIsCreating(true)}
            >
              <Text style={styles.createBtnText}>Create Category</Text>
            </Pressable>
          ) : (
            <View style={styles.createCard}>
              <TextInput
                placeholder="Category name"
                placeholderTextColor={colors.textMuted}
                value={newName}
                onChangeText={setNewName}
                style={styles.createInput}
                autoFocus
              />
              <View style={styles.createActions}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => {
                    setIsCreating(false);
                    setNewName("");
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.createBtn} onPress={onCreateCategory}>
                  <Text style={styles.createBtnText}>Save</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      ) : null}

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
  emptyWrap: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.body, fontWeight: "700" },
  emptyHint: { ...typography.bodyMuted },
  createCard: { gap: spacing.sm },
  createInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.background,
  },
  createActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  createBtnText: { color: "#fff", fontWeight: "700" },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
  },
  cancelBtnText: { color: colors.textMuted, fontWeight: "600" },
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
