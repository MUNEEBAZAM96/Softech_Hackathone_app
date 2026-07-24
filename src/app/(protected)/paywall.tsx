import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import type { PurchasesPackage } from "react-native-purchases";

import { useSubscription } from "../../providers/SubscriptionProvider";
import { useAppTheme } from "../../providers/ThemeProvider";

const FEATURES: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    icon: "sparkles",
    title: "Daily AI Tips",
    description:
      "A personalized smart insight every day, built from your actual spending.",
  },
  {
    icon: "chatbubbles",
    title: "Interactive AI Copilot",
    description:
      "Chat about your budgets, goals and transactions — answers from your data.",
  },
  {
    icon: "receipt",
    title: "AI Receipt Parsing",
    description:
      "Snap a receipt and let AI turn it into a ready-to-save transaction.",
  },
];

const COMPARISON: { label: string; free: boolean }[] = [
  { label: "Manual income & expense tracking", free: true },
  { label: "Budgets, alerts & savings goals", free: true },
  { label: "Daily AI tip of the day", free: false },
  { label: "Unlimited AI Copilot chats", free: false },
  { label: "Detailed AI transaction parsing", free: false },
];

function packagePeriodLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case "MONTHLY":
      return "per month";
    case "ANNUAL":
      return "per year";
    case "WEEKLY":
      return "per week";
    case "SIX_MONTH":
      return "every 6 months";
    case "THREE_MONTH":
      return "every 3 months";
    case "TWO_MONTH":
      return "every 2 months";
    case "LIFETIME":
      return "one-time";
    default:
      return "";
  }
}

function packageTitle(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case "MONTHLY":
      return "Monthly";
    case "ANNUAL":
      return "Yearly";
    case "WEEKLY":
      return "Weekly";
    case "SIX_MONTH":
      return "6 Months";
    case "THREE_MONTH":
      return "3 Months";
    case "TWO_MONTH":
      return "2 Months";
    case "LIFETIME":
      return "Lifetime";
    default:
      return pkg.product.title || pkg.identifier;
  }
}

/** % saved on the annual plan vs paying monthly for a year (null if unknown). */
function annualSavingsPercent(packages: PurchasesPackage[]): number | null {
  const monthly = packages.find((p) => p.packageType === "MONTHLY");
  const annual = packages.find((p) => p.packageType === "ANNUAL");
  if (!monthly || !annual || monthly.product.price <= 0) return null;
  const pct = Math.round(
    (1 - annual.product.price / (monthly.product.price * 12)) * 100
  );
  return pct > 0 ? pct : null;
}

export default function PaywallScreen() {
  const { colors, type, space, radius, resolvedMode } = useAppTheme();
  const insets = useSafeAreaInsets();
  const {
    isPro,
    isConfigured,
    offerings,
    refreshOfferings,
    purchase,
    restore,
  } = useSubscription();

  const packages = useMemo(
    () => offerings?.current?.availablePackages ?? [],
    [offerings]
  );
  const savingsPct = useMemo(() => annualSavingsPercent(packages), [packages]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<"purchase" | "restore" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offeringsLoading, setOfferingsLoading] = useState(false);

  const selectedPackage =
    packages.find((p) => p.identifier === selectedId) ??
    packages.find((p) => p.packageType === "ANNUAL") ??
    packages[0] ??
    null;

  useEffect(() => {
    if (isConfigured && !offerings) {
      setOfferingsLoading(true);
      void refreshOfferings().finally(() => setOfferingsLoading(false));
    }
  }, [isConfigured, offerings, refreshOfferings]);

  // Already Pro (or purchase completed via listener) — nothing to sell.
  useEffect(() => {
    if (isPro) {
      router.back();
    }
  }, [isPro]);

  const onPurchase = useCallback(async () => {
    if (!selectedPackage || busy) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setError(null);
    setBusy("purchase");
    try {
      await purchase(selectedPackage);
      // Success closes the screen via the isPro effect above.
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Purchase failed. Please try again."
      );
    } finally {
      setBusy(null);
    }
  }, [busy, purchase, selectedPackage]);

  const onRestore = useCallback(async () => {
    if (busy) return;
    setError(null);
    setBusy("restore");
    try {
      const restored = await restore();
      if (!restored) {
        setError("No active subscription found to restore.");
      }
    } catch (e) {
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Restore failed. Please try again."
      );
    } finally {
      setBusy(null);
    }
  }, [busy, restore]);

  const isDark = resolvedMode === "dark";
  const gradientColors = (
    isDark ? ["#1E1B4B", "#0F1419"] : ["#EEF2FF", "#F4F6FA"]
  ) as [string, string];
  const glassBg = isDark ? "rgba(255, 255, 255, 0.04)" : colors.surface;
  const glassBorder = isDark ? "rgba(255, 255, 255, 0.08)" : colors.border;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: { flex: 1 },
        scroll: { flex: 1 },
        content: {
          paddingHorizontal: space.s24,
          paddingBottom: insets.bottom + space.s24,
          gap: space.s24,
          width: "100%",
          maxWidth: 560,
          alignSelf: "center",
        },
        closeRow: {
          alignItems: "flex-end",
          paddingTop: Math.max(insets.top, space.s16),
        },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: glassBg,
          borderWidth: 1,
          borderColor: glassBorder,
          alignItems: "center",
          justifyContent: "center",
        },
        hero: {
          alignItems: "center",
          gap: space.s8,
        },
        heroRing: {
          width: 104,
          height: 104,
          borderRadius: 52,
          padding: 3,
          marginBottom: space.s8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isDark ? 0.55 : 0.35,
          shadowRadius: 28,
          elevation: 14,
        },
        heroInner: {
          flex: 1,
          borderRadius: 49,
          backgroundColor: isDark ? "#171531" : "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        },
        heroTitleRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
        },
        heroTitle: {
          ...type.display,
          fontSize: 30,
          lineHeight: 38,
          textAlign: "center",
        },
        heroTitleAccent: {
          ...type.display,
          fontSize: 30,
          lineHeight: 38,
          color: colors.primary,
        },
        heroSubtitle: {
          ...type.body,
          color: colors.textSecondary,
          textAlign: "center",
          maxWidth: 320,
        },
        sectionTitle: {
          ...type.captionBold,
          color: colors.textMuted,
          letterSpacing: 1.4,
          marginBottom: space.s8,
          marginLeft: space.s8,
        },
        featureCard: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s16,
          backgroundColor: glassBg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: glassBorder,
          padding: space.s16,
        },
        featureIconWrap: {
          width: 42,
          height: 42,
          borderRadius: radius.md,
          overflow: "hidden",
        },
        featureIconGradient: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        featureBody: { flex: 1, gap: 2 },
        featureTitle: { ...type.titleSmall, fontSize: 15 },
        featureDesc: {
          ...type.caption,
          color: colors.textMuted,
          lineHeight: 17,
        },
        compareCard: {
          backgroundColor: glassBg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: glassBorder,
          overflow: "hidden",
        },
        compareHeader: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space.s16,
          paddingVertical: space.s8 + 4,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: glassBorder,
        },
        compareHeaderLabel: { flex: 1 },
        compareCol: {
          width: 52,
          alignItems: "center",
        },
        compareColText: {
          ...type.captionBold,
          color: colors.textMuted,
        },
        compareProPill: {
          paddingVertical: 3,
          paddingHorizontal: space.s8 + 2,
          borderRadius: radius.pill,
          backgroundColor: colors.primary,
        },
        compareProPillText: {
          ...type.captionBold,
          color: "#FFFFFF",
          letterSpacing: 0.8,
        },
        compareRow: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: space.s16,
          paddingVertical: space.s8 + 4,
        },
        compareRowDivider: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: glassBorder,
        },
        compareRowLabel: {
          ...type.caption,
          fontSize: 13,
          color: colors.textSecondary,
          flex: 1,
          paddingRight: space.s8,
        },
        errorBanner: {
          ...type.caption,
          color: colors.danger,
          backgroundColor: `${colors.danger}14`,
          borderWidth: 1,
          borderColor: `${colors.danger}35`,
          borderRadius: radius.md,
          paddingVertical: space.s8,
          paddingHorizontal: space.s16,
        },
        packageStack: {
          gap: space.s16,
          paddingTop: space.s8 + 2,
        },
        packageCard: {
          borderRadius: radius.lg,
          borderWidth: 2,
          borderColor: glassBorder,
          backgroundColor: glassBg,
        },
        packageCardSelected: {
          borderColor: colors.primary,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isDark ? 0.45 : 0.25,
          shadowRadius: 14,
          elevation: 8,
        },
        packageInner: {
          flexDirection: "row",
          alignItems: "center",
          gap: space.s16,
          paddingVertical: space.s16,
          paddingHorizontal: space.s16,
        },
        packageOverlay: {
          ...StyleSheet.absoluteFillObject,
          borderRadius: radius.lg - 2,
        },
        packageBadge: {
          position: "absolute",
          top: -11,
          right: space.s16,
          borderRadius: radius.pill,
          overflow: "hidden",
        },
        packageBadgeInner: {
          paddingVertical: 3,
          paddingHorizontal: space.s8 + 2,
        },
        packageBadgeText: {
          ...type.captionBold,
          fontSize: 10,
          color: "#FFFFFF",
          letterSpacing: 1,
        },
        packageBody: { flex: 1 },
        packageTitle: { ...type.bodyMedium, fontSize: 16 },
        packagePeriod: {
          ...type.caption,
          color: colors.textMuted,
          marginTop: 2,
        },
        packageSavings: {
          ...type.captionBold,
          color: colors.success,
          marginTop: 2,
        },
        packagePrice: {
          ...type.titleSmall,
          fontSize: 18,
          color: colors.primary,
        },
        emptyCard: {
          backgroundColor: glassBg,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: glassBorder,
          padding: space.s24,
          alignItems: "center",
          gap: space.s8,
        },
        emptyText: {
          ...type.body,
          color: colors.textSecondary,
          textAlign: "center",
        },
        retryLink: { ...type.bodyMedium, color: colors.primary },
        subscribeWrap: {
          borderRadius: radius.pill,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.45 : 0.3,
          shadowRadius: 18,
          elevation: 8,
        },
        subscribeGradient: {
          borderRadius: radius.pill,
          paddingVertical: space.s16,
          alignItems: "center",
          justifyContent: "center",
        },
        subscribeText: {
          ...type.bodyMedium,
          color: "#FFFFFF",
          fontSize: 16,
          letterSpacing: 0.2,
        },
        restoreBtn: {
          alignItems: "center",
          paddingVertical: space.s8,
        },
        restoreText: { ...type.bodyMedium, color: colors.primary },
        footnote: {
          ...type.caption,
          color: colors.textMuted,
          textAlign: "center",
        },
      }),
    [
      colors,
      type,
      space,
      radius,
      isDark,
      glassBg,
      glassBorder,
      insets.top,
      insets.bottom,
    ]
  );

  const showPackages = isConfigured && packages.length > 0;

  return (
    <LinearGradient colors={gradientColors} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.closeRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && { opacity: 0.7 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Close paywall"
          >
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroRing}
          >
            <View style={styles.heroInner}>
              <Ionicons name="diamond" size={40} color={colors.primary} />
            </View>
          </LinearGradient>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>BudgetIQ </Text>
            <Text style={styles.heroTitleAccent}>Premium</Text>
          </View>
          <Text style={styles.heroSubtitle}>
            Unlock the AI copilot and daily tips built from your own finances.
          </Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>WHAT YOU GET</Text>
          <View style={{ gap: space.s8 }}>
            {FEATURES.map((f) => (
              <View key={f.title} style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <LinearGradient
                    colors={[colors.primary, colors.primaryMuted]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureIconGradient}
                  >
                    <Ionicons name={f.icon} size={20} color="#FFFFFF" />
                  </LinearGradient>
                </View>
                <View style={styles.featureBody}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionTitle}>FREE VS PRO</Text>
          <View style={styles.compareCard}>
            <View style={styles.compareHeader}>
              <View style={styles.compareHeaderLabel} />
              <View style={styles.compareCol}>
                <Text style={styles.compareColText}>FREE</Text>
              </View>
              <View style={styles.compareCol}>
                <View style={styles.compareProPill}>
                  <Text style={styles.compareProPillText}>PRO</Text>
                </View>
              </View>
            </View>
            {COMPARISON.map((row, idx) => (
              <View
                key={row.label}
                style={[
                  styles.compareRow,
                  idx < COMPARISON.length - 1 && styles.compareRowDivider,
                ]}
              >
                <Text style={styles.compareRowLabel}>{row.label}</Text>
                <View style={styles.compareCol}>
                  {row.free ? (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={colors.textMuted}
                    />
                  ) : (
                    <Ionicons
                      name="close"
                      size={18}
                      color={colors.textMuted}
                      style={{ opacity: 0.5 }}
                    />
                  )}
                </View>
                <View style={styles.compareCol}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.success}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {error ? (
          <Text style={styles.errorBanner} numberOfLines={3}>
            {error}
          </Text>
        ) : null}

        {!isConfigured ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="cloud-offline-outline"
              size={28}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              Purchases aren't available right now. Please try again later.
            </Text>
          </View>
        ) : offeringsLoading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.emptyText}>Loading plans…</Text>
          </View>
        ) : !showPackages ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No subscription plans could be loaded.
            </Text>
            <Pressable
              onPress={() => {
                setOfferingsLoading(true);
                void refreshOfferings().finally(() =>
                  setOfferingsLoading(false)
                );
              }}
            >
              <Text style={styles.retryLink}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>CHOOSE YOUR PLAN</Text>
            <View style={styles.packageStack}>
              {packages.map((pkg) => {
                const selected =
                  selectedPackage?.identifier === pkg.identifier;
                const isAnnual = pkg.packageType === "ANNUAL";
                return (
                  <Pressable
                    key={pkg.identifier}
                    onPress={() => setSelectedId(pkg.identifier)}
                    style={({ pressed }) => [
                      styles.packageCard,
                      selected && styles.packageCardSelected,
                      pressed && { transform: [{ scale: 0.985 }] },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    {selected ? (
                      <LinearGradient
                        colors={[`${colors.primary}1F`, `${colors.primary}05`]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.packageOverlay}
                      />
                    ) : null}
                    <View style={styles.packageInner}>
                      <Ionicons
                        name={
                          selected ? "radio-button-on" : "radio-button-off"
                        }
                        size={22}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                      <View style={styles.packageBody}>
                        <Text style={styles.packageTitle}>
                          {packageTitle(pkg)}
                        </Text>
                        <Text style={styles.packagePeriod}>
                          {packagePeriodLabel(pkg)}
                        </Text>
                        {isAnnual && savingsPct ? (
                          <Text style={styles.packageSavings}>
                            Save {savingsPct}% vs monthly
                          </Text>
                        ) : null}
                      </View>
                      <Text style={styles.packagePrice}>
                        {pkg.product.priceString}
                      </Text>
                    </View>
                    {isAnnual ? (
                      <View style={styles.packageBadge}>
                        <LinearGradient
                          colors={[colors.warning, colors.primary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.packageBadgeInner}
                        >
                          <Text style={styles.packageBadgeText}>
                            BEST VALUE
                          </Text>
                        </LinearGradient>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {showPackages ? (
          <View style={{ gap: space.s8 }}>
            <Pressable
              onPress={() => void onPurchase()}
              disabled={busy !== null || !selectedPackage}
              style={({ pressed }) => [
                styles.subscribeWrap,
                pressed && { transform: [{ scale: 0.98 }] },
                (busy !== null || !selectedPackage) && { opacity: 0.5 },
              ]}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryMuted]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.subscribeGradient}
              >
                {busy === "purchase" ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.subscribeText}>Subscribe Now</Text>
                )}
              </LinearGradient>
            </Pressable>
            <Pressable
              onPress={() => void onRestore()}
              disabled={busy !== null}
              style={({ pressed }) => [
                styles.restoreBtn,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
            >
              {busy === "restore" ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </Pressable>
            <Text style={styles.footnote}>
              Subscriptions renew automatically and can be cancelled anytime in
              your store account settings.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}
