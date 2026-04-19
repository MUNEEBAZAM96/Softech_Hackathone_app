import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useAtom, useAtomValue } from "jotai";

import {
  goalNotificationsEnabledAtom,
  savingsGoalsAtom,
  transactionsAtom,
} from "../../../atoms";
import { colors, radius, space, type } from "../../../constants/theme";
import { getDatabase } from "../../../db/client";
import { deleteGoalById, updateGoal } from "../../../db/goalsRepo";
import { maybeNotifyGoalMilestones } from "../../../services/goalNotificationService";

export default function EditGoalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [goals, setGoals] = useAtom(savingsGoalsAtom);
  const transactions = useAtomValue(transactionsAtom);
  const goalNotificationsEnabled = useAtomValue(goalNotificationsEnabledAtom);
  const goal = useMemo(() => goals.find((g) => g.id === id), [goals, id]);

  const [title, setTitle] = useState(goal?.title ?? "");
  const [target, setTarget] = useState(
    goal ? String(goal.targetAmount) : ""
  );
  const [deadline, setDeadline] = useState(
    goal ? goal.deadline.slice(0, 10) : ""
  );
  const [starting, setStarting] = useState(
    goal?.startingAmount != null ? String(goal.startingAmount) : ""
  );
  const [monthly, setMonthly] = useState(
    goal?.monthlyContributionGoal != null
      ? String(goal.monthlyContributionGoal)
      : ""
  );

  if (!goal) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Goal not found.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const save = async () => {
    const t = title.trim();
    const ta = Number(target.replace(/,/g, ""));
    if (!t || !ta || ta <= 0) {
      Alert.alert("Check fields", "Enter a title and positive target amount.");
      return;
    }
    let deadlineIso: string;
    try {
      const d = new Date(deadline);
      if (Number.isNaN(d.getTime())) throw new Error("invalid");
      deadlineIso = d.toISOString();
    } catch {
      Alert.alert("Deadline", "Enter a valid date.");
      return;
    }
    const s = starting.trim() ? Number(starting.replace(/,/g, "")) : undefined;
    const m = monthly.trim() ? Number(monthly.replace(/,/g, "")) : undefined;
    const updatedGoal = {
      ...goal,
      title: t,
      targetAmount: ta,
      deadline: deadlineIso,
      startingAmount: s && s > 0 ? s : undefined,
      monthlyContributionGoal: m && m > 0 ? m : undefined,
    };

    try {
      const db = await getDatabase();
      await updateGoal(db, updatedGoal);
      const next = goals.map((g) => (g.id === goal.id ? updatedGoal : g));
      setGoals(next);
      void maybeNotifyGoalMilestones(transactions, next, {
        enabled: goalNotificationsEnabled,
      });
      router.back();
    } catch {
      Alert.alert(
        "Save failed",
        "Could not update this goal. Please try again."
      );
    }
  };

  const remove = () => {
    Alert.alert("Delete goal", "This removes the goal from your list.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const db = await getDatabase();
            await deleteGoalById(db, goal.id);
            const next = goals.filter((g) => g.id !== goal.id);
            setGoals(next);
            void maybeNotifyGoalMilestones(transactions, next, {
              enabled: goalNotificationsEnabled,
            });
            router.back();
          } catch {
            Alert.alert(
              "Delete failed",
              "Could not remove this goal. Please try again."
            );
          }
        },
      },
    ]);
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
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Target amount (PKR)</Text>
      <TextInput
        value={target}
        onChangeText={setTarget}
        keyboardType="decimal-pad"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Deadline</Text>
      <TextInput
        value={deadline}
        onChangeText={setDeadline}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Starting amount (optional)</Text>
      <TextInput
        value={starting}
        onChangeText={setStarting}
        keyboardType="decimal-pad"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Text style={styles.label}>Monthly contribution goal (optional)</Text>
      <TextInput
        value={monthly}
        onChangeText={setMonthly}
        keyboardType="decimal-pad"
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />
      <Pressable onPress={save} style={styles.save}>
        <Text style={styles.saveText}>Save changes</Text>
      </Pressable>
      <Pressable onPress={remove} style={styles.danger}>
        <Text style={styles.dangerText}>Delete goal</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.s16, gap: space.s8, paddingBottom: space.s32 },
  label: { ...type.captionBold, marginTop: space.s8 },
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
  danger: {
    marginTop: space.s8,
    paddingVertical: space.s16,
    alignItems: "center",
  },
  dangerText: { ...type.bodyMedium, color: colors.danger },
  missing: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: space.s8,
    padding: space.s16,
  },
  missingText: { ...type.body, color: colors.textSecondary },
  link: { ...type.bodyMedium, color: colors.primary },
});
