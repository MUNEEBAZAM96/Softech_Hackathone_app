import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAtom, useSetAtom } from "jotai";

import {
  budgetAlertPreferencesAtom,
  categoryBudgetsAtom,
  copilotErrorAtom,
  copilotInputDraftAtom,
  copilotIsTypingAtom,
  copilotMessagesAtom,
  savingsGoalsAtom,
  transactionsAtom,
} from "../../atoms";
import { COPILOT_QUICK_ACTIONS } from "../../constants/copilotQuickActions";
import { useAppTheme } from "../../providers/ThemeProvider";
import { buildCopilotContextSnapshot } from "../../services/copilotContextService";
import { sendCopilotMessage } from "../../services/copilotApiService";
import { createLocalId } from "../../utils/id";

export default function CopilotChatSection() {
  const { colors, type, space, radius } = useAppTheme();
  const [transactions] = useAtom(transactionsAtom);
  const [goals] = useAtom(savingsGoalsAtom);
  const [budgets] = useAtom(categoryBudgetsAtom);
  const [prefs] = useAtom(budgetAlertPreferencesAtom);
  const [messages, setMessages] = useAtom(copilotMessagesAtom);
  const [isTyping, setIsTyping] = useAtom(copilotIsTypingAtom);
  const [error, setError] = useAtom(copilotErrorAtom);
  const [input, setInput] = useAtom(copilotInputDraftAtom);

  const scrollRef = useRef<ScrollView>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: space.s16,
          gap: space.s16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        title: { ...type.titleSmall, fontSize: 16 },
        subtitle: { ...type.caption, color: colors.textSecondary },
        chipRow: { flexDirection: "row", flexWrap: "wrap", gap: space.s8 },
        chip: {
          paddingVertical: space.s8,
          paddingHorizontal: space.s16,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
        },
        chipText: { ...type.caption, color: colors.text, fontWeight: "600" },
        chatScroll: { maxHeight: 280 },
        bubbleUser: {
          alignSelf: "flex-end",
          maxWidth: "92%",
          backgroundColor: colors.primaryMuted,
          padding: space.s16,
          borderRadius: radius.md,
          marginBottom: space.s8,
        },
        bubbleAssistant: {
          alignSelf: "flex-start",
          maxWidth: "92%",
          backgroundColor: colors.surfaceAlt,
          padding: space.s16,
          borderRadius: radius.md,
          marginBottom: space.s8,
          borderWidth: 1,
          borderColor: colors.border,
        },
        bubbleText: { ...type.body, color: colors.text },
        bubbleTextUser: { ...type.body, color: "#FFFFFF" },
        typingRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s8,
          paddingVertical: space.s8,
        },
        typingText: { ...type.caption, color: colors.textMuted },
        inputRow: {
          flexDirection: "row",
          gap: space.s8,
          alignItems: "flex-end",
        },
        input: {
          flex: 1,
          ...type.body,
          minHeight: 44,
          maxHeight: 120,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingHorizontal: space.s16,
          paddingVertical: space.s8,
          backgroundColor: colors.background,
          color: colors.text,
        },
        sendBtn: {
          backgroundColor: colors.primary,
          paddingVertical: space.s16,
          paddingHorizontal: space.s16,
          borderRadius: radius.md,
        },
        sendBtnDisabled: { opacity: 0.45 },
        sendBtnText: { ...type.bodyMedium, color: "#FFFFFF" },
        errorBanner: {
          ...type.caption,
          color: colors.danger,
          backgroundColor: `${colors.danger}12`,
          padding: space.s8,
          borderRadius: radius.sm,
        },
        empty: { ...type.caption, color: colors.textMuted, textAlign: "center" },
      }),
    [colors, type, space, radius]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [messages.length, isTyping]);

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isTyping) return;

      setError(null);
      const userMsg = {
        id: createLocalId("copilot-user"),
        role: "user" as const,
        text,
        createdAt: new Date().toISOString(),
      };

      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.text,
      }));

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const context = buildCopilotContextSnapshot(
          transactions,
          goals,
          budgets,
          prefs
        );
        const reply = await sendCopilotMessage({
          message: text,
          history: historyPayload,
          context,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: createLocalId("copilot-asst"),
            role: "assistant",
            text: reply,
            createdAt: new Date().toISOString(),
          },
        ]);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "Something went wrong. Is the copilot server running?";
        setError(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: createLocalId("copilot-err"),
            role: "assistant",
            text:
              `I couldn’t reach the AI service.\n\n${msg}\n\n` +
              `Tip: run the proxy with \`npm run server\`, set \`GITHUB_TOKEN\` in \`.env\`, ` +
              `and point the app to it with \`EXPO_PUBLIC_COPILOT_API_URL\` (e.g. http://localhost:3001 or your LAN IP for a device).`,
            createdAt: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [
      budgets,
      goals,
      isTyping,
      messages,
      prefs,
      setError,
      setInput,
      setIsTyping,
      setMessages,
      transactions,
    ]
  );

  const canSend = input.trim().length > 0 && !isTyping;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>AI Copilot</Text>
      <Text style={styles.subtitle}>
        Ask using your local budgets, goals, and transactions (via secure proxy).
      </Text>

      <View style={styles.chipRow}>
        {COPILOT_QUICK_ACTIONS.map((a) => (
          <Pressable
            key={a.id}
            onPress={() => sendText(a.prompt)}
            disabled={isTyping}
            style={({ pressed }) => [
              styles.chip,
              pressed && { opacity: 0.85 },
              isTyping && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.chipText}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !isTyping ? (
          <Text style={styles.empty}>
            Ask a question or tap a chip. A compact summary of your finances is
            sent to your copilot server — never your API key.
          </Text>
        ) : null}
        {messages.map((m) => (
          <View
            key={m.id}
            style={
              m.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
            }
          >
            <Text
              style={
                m.role === "user" ? styles.bubbleTextUser : styles.bubbleText
              }
            >
              {m.text}
            </Text>
          </View>
        ))}
        {isTyping ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.typingText}>Analyzing your finances…</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask BudgetIQ Copilot…"
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          editable={!isTyping}
          multiline
        />
        <Pressable
          onPress={() => sendText(input)}
          disabled={!canSend}
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
