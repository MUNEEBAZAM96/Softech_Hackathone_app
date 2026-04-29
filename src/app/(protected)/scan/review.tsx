import { useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAtom } from "jotai";

import {
  receiptScanDraftAtom,
  receiptScanImageUriAtom,
  selectedCategoryAtom,
} from "../../../atoms";
import { useAppTheme } from "../../../providers/ThemeProvider";
import { useFinanceData } from "../../../providers/FinanceDataProvider";
import { getDatabase } from "../../../db/client";
import { insertTransaction } from "../../../db/transactionsRepo";
import {
  pickAndPrepareReceiptImage,
  type ReceiptImageSource,
} from "../../../services/receiptImagePickerService";
import {
  mapSuggestedCategory,
  parseReceiptImage,
} from "../../../services/receiptScanService";
import { createTransactionId } from "../../../services/transactionService";
import { safeBack } from "../../../utils/navigation";
import type { ReceiptDraft, TransactionKind } from "../../../types";

function confidenceLabel(c: number): "High" | "Medium" | "Low" {
  if (c >= 0.78) return "High";
  if (c >= 0.45) return "Medium";
  return "Low";
}

function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toIsoFromInput(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function ScanReviewScreen() {
  const { colors, radius, space, type } = useAppTheme();
  const { categories, refresh, userId, user } = useFinanceData();
  const [draft, setDraft] = useAtom(receiptScanDraftAtom);
  const [imageUri, setImageUri] = useAtom(receiptScanImageUriAtom);
  const [selectedCategory, setSelectedCategory] = useAtom(selectedCategoryAtom);
  const [loading, setLoading] = useState(false);
  const [kind, setKind] = useState<TransactionKind>(draft?.kind ?? "expense");
  const [amount, setAmount] = useState(
    draft?.amount != null ? String(draft.amount) : ""
  );
  const [note, setNote] = useState(draft?.note ?? "");
  const [dateInput, setDateInput] = useState(toDateInput(draft?.dateIso ?? null));

  useEffect(() => {
    if (!draft) return;
    const mapped = mapSuggestedCategory(draft, categories);
    if (mapped) setSelectedCategory(mapped);
  }, [draft, categories, setSelectedCategory]);

  useEffect(() => {
    if (selectedCategory && selectedCategory.kind !== kind) {
      setSelectedCategory(null);
    }
  }, [kind, selectedCategory, setSelectedCategory]);

  const confidence = draft?.confidence ?? 0;
  const confidenceText = confidenceLabel(confidence);
  const confidenceColor =
    confidenceText === "High"
      ? colors.success
      : confidenceText === "Medium"
        ? colors.warning
        : colors.danger;

  const canSave = useMemo(() => {
    const numeric = Number(amount);
    return (
      !!selectedCategory &&
      selectedCategory.kind === kind &&
      Number.isFinite(numeric) &&
      numeric > 0 &&
      toIsoFromInput(dateInput) != null
    );
  }, [amount, dateInput, kind, selectedCategory]);

  const requestScan = async (source: ReceiptImageSource) => {
    setLoading(true);
    try {
      const imageResult = await pickAndPrepareReceiptImage(source);
      if (!imageResult.ok) {
        if (imageResult.reason !== "cancelled") {
          Alert.alert("Scan", imageResult.message);
        }
        return;
      }
      const parseResult = await parseReceiptImage({
        imageBase64: imageResult.image.imageBase64,
        mimeType: imageResult.image.mimeType,
        currency: user?.currency,
        categories: categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind })),
      });
      if (!parseResult.ok) {
        Alert.alert("Could not parse receipt", parseResult.message);
        return;
      }
      const nextDraft = parseResult.draft;
      setImageUri(imageResult.image.uri);
      setDraft(nextDraft);
      setKind(nextDraft.kind);
      setAmount(nextDraft.amount != null ? String(nextDraft.amount) : "");
      setNote(nextDraft.note ?? "");
      setDateInput(toDateInput(nextDraft.dateIso));
      const mapped = mapSuggestedCategory(nextDraft, categories);
      setSelectedCategory(mapped);
    } finally {
      setLoading(false);
    }
  };

  const chooseAnotherImage = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Scan Receipt",
          options: ["Cancel", "Take Photo", "Choose from Gallery"],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) void requestScan("camera");
          if (index === 2) void requestScan("gallery");
        }
      );
      return;
    }
    Alert.alert("Scan Receipt", "Choose how to capture your receipt", [
      { text: "Take Photo", onPress: () => void requestScan("camera") },
      { text: "Choose from Gallery", onPress: () => void requestScan("gallery") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const onSave = async () => {
    if (!userId) {
      Alert.alert("Session", "Please sign in again to save.");
      return;
    }
    const numeric = Number(amount);
    if (!numeric || numeric <= 0) {
      Alert.alert("Amount", "Enter a valid amount greater than 0.");
      return;
    }
    if (!selectedCategory) {
      Alert.alert("Category", "Please choose a category before saving.");
      return;
    }
    if (selectedCategory.kind !== kind) {
      Alert.alert("Category mismatch", "Selected category does not match type.");
      return;
    }
    const dateIso = toIsoFromInput(dateInput);
    if (!dateIso) {
      Alert.alert("Date", "Enter a valid date like YYYY-MM-DD.");
      return;
    }

    try {
      setLoading(true);
      const tx = {
        id: createTransactionId(),
        kind,
        amount: numeric,
        categoryId: selectedCategory.id,
        note: note.trim() || undefined,
        date: dateIso,
        createdAt: new Date().toISOString(),
      };
      const db = await getDatabase();
      await insertTransaction(db, tx, userId);
      await refresh();
      setDraft(null);
      setImageUri(null);
      setSelectedCategory(null);
      Alert.alert("Saved", "Transaction added successfully.");
      router.replace("/");
    } catch {
      Alert.alert("Save failed", "Could not save parsed transaction.");
    } finally {
      setLoading(false);
    }
  };

  if (!draft) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
          padding: space.s24,
          gap: space.s16,
        }}
      >
        <Text style={[type.title, { textAlign: "center" }]}>No receipt draft found</Text>
        <Text style={[type.body, { textAlign: "center", color: colors.textSecondary }]}>
          Scan a receipt first from Quick Add.
        </Text>
        <Pressable
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: space.s24,
            paddingVertical: space.s16,
            borderRadius: radius.md,
          }}
          onPress={() => safeBack("/")}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: space.s16,
        gap: space.s16,
        paddingBottom: space.s32,
      }}
      keyboardShouldPersistTaps="handled"
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: "100%",
            height: 180,
            borderRadius: radius.lg,
            backgroundColor: colors.surfaceAlt,
          }}
          resizeMode="cover"
        />
      ) : null}

      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: space.s8 }}>
        <View
          style={{
            paddingHorizontal: space.s16,
            paddingVertical: 8,
            borderRadius: radius.pill,
            backgroundColor: `${confidenceColor}20`,
            borderWidth: 1,
            borderColor: `${confidenceColor}55`,
          }}
        >
          <Text style={[type.captionBold, { color: confidenceColor }]}>
            Confidence: {confidenceText}
          </Text>
        </View>
        <Pressable
          onPress={chooseAnotherImage}
          accessibilityRole="button"
          accessibilityLabel="Choose another receipt image"
          style={{
            paddingHorizontal: space.s16,
            paddingVertical: 8,
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Text style={[type.captionBold, { color: colors.text }]}>Retake / Choose</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: space.s8 }}>
        {(["expense", "income"] as const).map((k) => {
          const active = kind === k;
          return (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              style={{
                flex: 1,
                borderRadius: radius.pill,
                alignItems: "center",
                paddingVertical: 10,
                backgroundColor: active ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.border,
              }}
            >
              <Text style={{ color: active ? "#fff" : colors.text, fontWeight: "700" }}>
                {k === "expense" ? "Expense" : "Income"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 6 }}>
        <Text style={type.captionBold}>Amount</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          style={{
            ...type.body,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: space.s16,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={type.captionBold}>Category</Text>
        <Pressable
          onPress={() => router.push("/categorySelector")}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: space.s16,
          }}
        >
          <Text style={type.body}>
            {selectedCategory ? selectedCategory.name : "Choose a category"}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        <Text style={type.captionBold}>Date</Text>
        <TextInput
          value={dateInput}
          onChangeText={setDateInput}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textMuted}
          style={{
            ...type.body,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: space.s16,
          }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={type.captionBold}>Note</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Merchant or short note"
          placeholderTextColor={colors.textMuted}
          style={{
            ...type.body,
            minHeight: 90,
            textAlignVertical: "top",
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.md,
            padding: space.s16,
          }}
          multiline
        />
      </View>

      <Pressable
        onPress={onSave}
        disabled={!canSave || loading}
        style={{
          marginTop: space.s8,
          borderRadius: radius.md,
          backgroundColor: canSave && !loading ? colors.primary : colors.border,
          paddingVertical: space.s16,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>
          {loading ? "Saving..." : "Save Transaction"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.navigate("/(protected)/(tabs)/add")}
        style={{ alignItems: "center", paddingVertical: 8 }}
      >
        <Text style={[type.captionBold, { color: colors.textSecondary }]}>
          Switch to manual entry
        </Text>
      </Pressable>
    </ScrollView>
  );
}
