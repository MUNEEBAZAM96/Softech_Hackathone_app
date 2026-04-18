/**
 * BudgetIQ design system — spacing uses ONLY 8 / 16 / 24 / 32.
 * Typography: display → title → body → caption hierarchy.
 */

export const space = {
  s8: 8,
  s16: 16,
  s24: 24,
  s32: 32,
} as const;

export type SpaceKey = keyof typeof space;

export const colors = {
  background: "#F4F6FA",
  surface: "#FFFFFF",
  surfaceAlt: "#EEF2F7",
  surfaceElevated: "#FFFFFF",

  primary: "#4F46E5",
  primaryMuted: "#6366F1",
  accent: "#0EA5E9",

  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  border: "#E2E8F0",

  /** Semantic — use for income, positive trends, confirmations */
  success: "#059669",
  /** Semantic — use for expense, errors, destructive actions */
  danger: "#DC2626",
  /** Semantic — use for alerts, cautions, budgets nearing limit */
  warning: "#D97706",

  /** Aliases for money direction (map to semantic) */
  income: "#059669",
  expense: "#DC2626",

  overlay: "rgba(15, 23, 42, 0.06)",
} as const;

/** Typography scale — use StyleSheet + spread these objects */
export const type = {
  display: {
    fontSize: 36,
    fontWeight: "700" as const,
    letterSpacing: -0.8,
    lineHeight: 40,
    color: colors.text,
  },
  displayHero: {
    fontSize: 40,
    fontWeight: "700" as const,
    letterSpacing: -1,
    lineHeight: 44,
    color: "#FFFFFF",
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    lineHeight: 26,
    color: colors.text,
  },
  titleSmall: {
    fontSize: 17,
    fontWeight: "600" as const,
    lineHeight: 22,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
    color: colors.text,
  },
  bodyMedium: {
    fontSize: 15,
    fontWeight: "600" as const,
    lineHeight: 22,
    color: colors.text,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
    letterSpacing: 0.15,
    color: colors.textMuted,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: "700" as const,
    lineHeight: 16,
    letterSpacing: 0.2,
    color: colors.textSecondary,
  },
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Card / bar elevation */
export const shadow = {
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  hero: {
    shadowColor: "#312E81",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 8,
  },
  fab: {
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

/** @deprecated Use `space` — kept for gradual migration */
export const spacing = {
  xs: space.s8,
  sm: space.s8,
  md: space.s16,
  lg: space.s16,
  xl: space.s24,
  xxl: space.s32,
} as const;

/** @deprecated Use `type` */
export const typography = {
  h1: type.title,
  h2: type.title,
  h3: type.titleSmall,
  body: type.body,
  bodyMuted: { ...type.body, color: colors.textMuted },
  caption: type.caption,
} as const;
