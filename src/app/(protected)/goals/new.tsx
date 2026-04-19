import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAtomValue, useSetAtom } from "jotai";
import { router } from "expo-router";

import {
  goalNotificationsEnabledAtom,
  savingsGoalsAtom,
  transactionsAtom,
} from "../../../atoms";
import { colors, radius, space, type } from "../../../constants/theme";
import { getDatabase } from "../../../db/client";
import { insertGoal } from "../../../db/goalsRepo";
import { maybeNotifyGoalMilestones } from "../../../services/goalNotificationService";
import { createLocalId } from "../../../utils/id";

export default function NewGoalScreen() {
  const setGoals = useSetAtom(savingsGoalsAtom);
  const goals = useAtomValue(savingsGoalsAtom);
  const transactions = useAtomValue(transactionsAtom);
  const goalNotificationsEnabled = useAtomValue(goalNotificationsEnabledAtom);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [starting, setStarting] = useState("");
  const [monthly, setMonthly] = useState("");

  const onSave = async () => {
    const t = title.trim();
    const ta = Number(target.replace(/,/g, ""));
    const dl = deadline.trim();
    if (!t || !ta || ta <= 0) {
      Alert.alert("Check fields", "Enter a title and positive target amount.");
      return;
    }
    let deadlineIso: string;
    try {
      const d = new Date(dl);
      if (Number.isNaN(d.getTime())) throw new Error("invalid");
      deadlineIso = d.toISOString();
    } catch {
      Alert.alert(
        "Deadline",
        "Use a valid date (e.g. 2026-12-31 or pick from your system date entry)."
      );
      return;
    }
    const s = starting.trim() ? Number(starting.replace(/,/g, "")) : undefined;
    const m = monthly.trim() ? Number(monthly.replace(/,/g, "")) : undefined;
    const newGoal = {
      id: createLocalId("goal"),
      title: t,
      targetAmount: ta,
      deadline: deadlineIso,
      startingAmount: s && s > 0 ? s : undefined,
      monthlyContributionGoal: m && m > 0 ? m : undefined,
      createdAt: new Date().toISOString(),
      status: "active" as const,
    };

    try {
      const db = await getDatabase();
      await insertGoal(db, newGoal);
      const next = [...goals, newGoal];
      setGoals(next);
      void maybeNotifyGoalMilestones(transactions, next, {
        enabled: goalNotificationsEnabled,
      });
      router.back();
    } catch {
      Alert.alert("Save failed", "Could not store this goal. Please try again.");
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Emergency fund"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Target amount (PKR)</Text>
      <TextInput
        value={target}
        onChangeText={setTarget}
        keyboardType="decimal-pad"
        placeholder="150000"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Deadline</Text>
      <TextInput
        value={deadline}
        onChangeText={setDeadline}
        placeholder="2026-12-31"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.hint}>
        Progress uses your net balance (income − expenses), split across active
        goals by target size.
      </Text>
      <Text style={styles.label}>Starting amount (optional)</Text>
      <TextInput
        value={starting}
        onChangeText={setStarting}
        keyboardType="decimal-pad"
        placeholder="0"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Monthly contribution goal (optional)</Text>
      <TextInput
        value={monthly}
        onChangeText={setMonthly}
        keyboardType="decimal-pad"
        placeholder="8000"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Pressable onPress={onSave} style={styles.save}>
        <Text style={styles.saveText}>Save goal</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.s16, gap: space.s8, paddingBottom: space.s32 },
  label: { ...type.captionBold, marginTop: space.s8 },
  hint: { ...type.caption, color: colors.textSecondary, marginBottom: space.s8 },
  input: {
    ...type.body,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.s16,
  },
  save: {
    marginTop: space.s16,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: space.s16,
    alignItems: "center",
  },
  saveText: { ...type.bodyMedium, color: colors.surface },
});
