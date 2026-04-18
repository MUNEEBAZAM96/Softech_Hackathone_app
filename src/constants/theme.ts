/**
 * BudgetIQ design system — spacing uses ONLY 8 / 16 / 24 / 32.
 * Typography: display → title → body → caption hierarchy.
 * Use `useAppTheme()` for runtime `colors` / `type` / `shadow`; static `colors` defaults to light.
 */

export const space = {
  s8: 8,
  s16: 16,
  s24: 24,
  s32: 32,
} as const;

export type SpaceKey = keyof typeof space;

/** Shared shape for light and dark palettes. */
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  surfaceElevated: string;
  primary: string;
  primaryMuted: string;
  accent: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  success: string;
  danger: string;
  warning: string;
  income: string;
  expense: string;
  overlay: string;
};

export const lightColors: ThemeColors = {
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
  success: "#059669",
  danger: "#DC2626",
  warning: "#D97706",
  income: "#059669",
  expense: "#DC2626",
  overlay: "rgba(15, 23, 42, 0.06)",
};

export const darkColors: ThemeColors = {
  background: "#0F1419",
  surface: "#1A1F26",
  surfaceAlt: "#242B35",
  surfaceElevated: "#252D38",
  primary: "#818CF8",
  primaryMuted: "#A5B4FC",
  accent: "#38BDF8",
  text: "#F1F5F9",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  border: "#334155",
  success: "#34D399",
  danger: "#F87171",
  warning: "#FBBF24",
  income: "#34D399",
  expense: "#F87171",
  overlay: "rgba(241, 245, 249, 0.06)",
};

/** @deprecated Prefer `useAppTheme().colors` — defaults to light for legacy imports. */
export const colors: ThemeColors = lightColors;

export type TypeScale = {
  display: object;
  displayHero: object;
  title: object;
  titleSmall: object;
  body: object;
  bodyMedium: object;
  caption: object;
  captionBold: object;
};

/** Typography tokens bound to a color palette (for dark/light text). */
export function buildType(c: ThemeColors): TypeScale {
  return {
    display: {
      fontSize: 36,
      fontWeight: "700" as const,
      letterSpacing: -0.8,
      lineHeight: 40,
      color: c.text,
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
      color: c.text,
    },
    titleSmall: {
      fontSize: 17,
      fontWeight: "600" as const,
      lineHeight: 22,
      color: c.text,
    },
    body: {
      fontSize: 15,
      fontWeight: "400" as const,
      lineHeight: 22,
      color: c.text,
    },
    bodyMedium: {
      fontSize: 15,
      fontWeight: "600" as const,
      lineHeight: 22,
      color: c.text,
    },
    caption: {
      fontSize: 12,
      fontWeight: "500" as const,
      lineHeight: 16,
      letterSpacing: 0.15,
      color: c.textMuted,
    },
    captionBold: {
      fontSize: 12,
      fontWeight: "700" as const,
      lineHeight: 16,
      letterSpacing: 0.2,
      color: c.textSecondary,
    },
  };
}

/** Static typography (light palette) — prefer `useAppTheme().type`. */
export const type: TypeScale = buildType(lightColors);

const shadowLight = {
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

const shadowDark = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  hero: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  fab: {
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export type ShadowTokens = typeof shadowLight | typeof shadowDark;

export function buildShadow(resolved: "light" | "dark"): ShadowTokens {
  return resolved === "dark" ? shadowDark : shadowLight;
}

/** @deprecated Prefer `useAppTheme().shadow` */
export const shadow: ShadowTokens = shadowLight;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
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

/** @deprecated Prefer `useAppTheme().type` */
export const typography = {
  h1: type.title,
  h2: type.title,
  h3: type.titleSmall,
  body: type.body,
  bodyMuted: { ...type.body, color: lightColors.textMuted },
  caption: type.caption,
} as const;
