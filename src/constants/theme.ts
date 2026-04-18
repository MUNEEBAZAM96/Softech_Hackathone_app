export const colors = {
  background: "#F5F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5F9",
  primary: "#6366F1",
  primaryDark: "#4F46E5",
  accent: "#22D3EE",
  income: "#10B981",
  expense: "#EF4444",
  text: "#0F172A",
  textMuted: "#64748B",
  border: "#E2E8F0",
  danger: "#DC2626",
  warning: "#F59E0B",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 28, fontWeight: "700" as const, color: colors.text },
  h2: { fontSize: 22, fontWeight: "700" as const, color: colors.text },
  h3: { fontSize: 18, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 14, color: colors.text },
  bodyMuted: { fontSize: 14, color: colors.textMuted },
  caption: { fontSize: 12, color: colors.textMuted },
} as const;
