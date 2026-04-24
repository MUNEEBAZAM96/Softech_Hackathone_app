import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAtom } from "jotai";

import {
  budgetAlertPreferencesAtom,
  copilotErrorAtom,
  copilotInputDraftAtom,
  copilotIsTypingAtom,
  copilotMessagesAtom,
} from "../../atoms";
import { useFinanceData } from "../../providers/FinanceDataProvider";
import { COPILOT_QUICK_ACTIONS } from "../../constants/copilotQuickActions";
import { useAppTheme } from "../../providers/ThemeProvider";
import { buildCopilotContextSnapshot } from "../../services/copilotContextService";
import { sendCopilotMessage } from "../../services/copilotApiService";
import { createLocalId } from "../../utils/id";
import type { CopilotMessage } from "../../types";

const QUICK_ACTIONS = COPILOT_QUICK_ACTIONS.slice(0, 4);
/** Extra bottom inset so content clears the floating tab bar. */
const TAB_BAR_CLEARANCE = 78;

export default function CopilotChatSection() {
  const { colors, type, space, radius, shadow } = useAppTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<CopilotMessage>>(null);

  const { transactions, goals, budgets, categories } = useFinanceData();
  const [prefs] = useAtom(budgetAlertPreferencesAtom);
  const [messages, setMessages] = useAtom(copilotMessagesAtom);
  const [isTyping, setIsTyping] = useAtom(copilotIsTypingAtom);
  const [error, setError] = useAtom(copilotErrorAtom);
  const [input, setInput] = useAtom(copilotInputDraftAtom);

  const bottomPad = Math.max(insets.bottom, space.s8) + TAB_BAR_CLEARANCE;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1 },
        kav: { flex: 1 },
        inner: {
          flex: 1,
          paddingHorizontal: space.s16,
          paddingTop: space.s8,
        },
        eyebrow: {
          ...type.captionBold,
          letterSpacing: 1.2,
          color: colors.primary,
          marginBottom: space.s8,
        },
        title: {
          ...type.title,
          fontSize: 22,
          letterSpacing: -0.3,
          marginBottom: 4,
        },
        subtitle: {
          ...type.caption,
          color: colors.textSecondary,
          marginBottom: space.s16,
        },
        chipScroll: {
          marginBottom: space.s16,
          flexGrow: 0,
        },
        chipScrollContent: {
          gap: space.s8,
          paddingRight: space.s16,
        },
        chip: {
          paddingVertical: space.s8,
          paddingHorizontal: space.s16,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceAlt,
        },
        chipText: {
          ...type.caption,
          color: colors.textSecondary,
          fontWeight: "600",
        },
        errorBanner: {
          ...type.caption,
          color: colors.danger,
          backgroundColor: `${colors.danger}14`,
          paddingVertical: space.s8,
          paddingHorizontal: space.s16,
          borderRadius: radius.md,
          marginBottom: space.s16,
          borderWidth: 1,
          borderColor: `${colors.danger}35`,
        },
        chatShell: {
          flex: 1,
          minHeight: 120,
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: "hidden",
          ...shadow.card,
        },
        listContent: {
          padding: space.s16,
          flexGrow: 1,
        },
        bubbleUser: {
          alignSelf: "flex-end",
          maxWidth: "88%",
          backgroundColor: colors.primary,
          paddingHorizontal: space.s16,
          paddingVertical: 12,
          borderRadius: radius.lg,
          borderBottomRightRadius: radius.sm,
          marginBottom: space.s8,
        },
        bubbleAssistant: {
          alignSelf: "flex-start",
          maxWidth: "88%",
          backgroundColor: colors.surfaceAlt,
          paddingHorizontal: space.s16,
          paddingVertical: 12,
          borderRadius: radius.lg,
          borderBottomLeftRadius: radius.sm,
          marginBottom: space.s8,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        bubbleText: { ...type.body, color: colors.text, lineHeight: 22 },
        bubbleTextUser: { ...type.body, color: "#FFFFFF", lineHeight: 22 },
        emptyWrap: {
          flex: 1,
          justifyContent: "center",
          paddingVertical: space.s24,
          minHeight: 160,
        },
        emptyPrimary: {
          ...type.bodyMedium,
          color: colors.textSecondary,
          textAlign: "center",
        },
        emptyHint: {
          ...type.caption,
          color: colors.textMuted,
          textAlign: "center",
          marginTop: space.s8,
        },
        typingRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s8,
          paddingVertical: space.s8,
          alignSelf: "flex-start",
        },
        typingText: { ...type.caption, color: colors.textMuted },
        inputWrap: {
          paddingTop: space.s16,
          paddingBottom: bottomPad,
        },
        inputRow: {
          flexDirection: "row",
          gap: space.s8,
          alignItems: "center",
        },
        input: {
          flex: 1,
          ...type.body,
          minHeight: 48,
          maxHeight: 120,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.pill,
          paddingHorizontal: space.s16,
          paddingVertical: 12,
          backgroundColor: colors.surface,
          color: colors.text,
        },
        sendBtn: {
          backgroundColor: colors.primary,
          paddingVertical: 14,
          paddingHorizontal: space.s16,
          borderRadius: radius.pill,
          minWidth: 72,
          alignItems: "center",
          justifyContent: "center",
        },
        sendBtnDisabled: { opacity: 0.45 },
        sendBtnText: { ...type.bodyMedium, color: "#FFFFFF" },
      }),
    [colors, type, space, radius, shadow.card, bottomPad]
  );

  const scrollToEnd = useCallback(() => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages.length, isTyping, scrollToEnd]);

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isTyping) return;

      setError(null);
      const userMsg: CopilotMessage = {
        id: createLocalId("copilot-user"),
        role: "user",
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
          prefs,
          new Date(),
          categories
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
            : "Could not reach the copilot server.";
        setError(msg);
      } finally {
        setIsTyping(false);
      }
    },
    [
      budgets,
      categories,
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

  const renderMessage = useCallback(
    ({ item }: { item: CopilotMessage }) => (
      <View
        style={
          item.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
        }
      >
        <Text
          style={
            item.role === "user" ? styles.bubbleTextUser : styles.bubbleText
          }
        >
          {item.text}
        </Text>
      </View>
    ),
    [styles.bubbleAssistant, styles.bubbleText, styles.bubbleTextUser, styles.bubbleUser]
  );

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 52 : 0}
      >
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>INSIGHTS</Text>
          <Text style={styles.title}>AI Copilot</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Budgets, goals & spending — answered from your data.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {QUICK_ACTIONS.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => sendText(a.prompt)}
                disabled={isTyping}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && { opacity: 0.88 },
                  isTyping && { opacity: 0.45 },
                ]}
              >
                <Text style={styles.chipText}>{a.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {error ? (
            <Text style={styles.errorBanner} numberOfLines={3}>
              {error}
            </Text>
          ) : null}

          <View style={styles.chatShell}>
            <FlatList
              ref={listRef}
              style={{ flex: 1 }}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={scrollToEnd}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                !isTyping ? (
                  <View style={styles.emptyWrap}>
                    <Text style={styles.emptyPrimary}>
                      Start a conversation
                    </Text>
                    <Text style={styles.emptyHint}>
                      Use a shortcut or type a message. Sent via your copilot proxy
                      only.
                    </Text>
                  </View>
                ) : null
              }
              ListFooterComponent={
                isTyping ? (
                  <View style={styles.typingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.typingText}>Thinking…</Text>
                  </View>
                ) : null
              }
            />
          </View>

          <View style={styles.inputWrap}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Message…"
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
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
