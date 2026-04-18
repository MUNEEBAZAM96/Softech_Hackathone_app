import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAtom } from "jotai";

import { themeModeAtom } from "../atoms";
import {
  buildShadow,
  buildType,
  darkColors,
  lightColors,
  radius,
  space,
  type ThemeColors,
  type ShadowTokens,
  type TypeScale,
} from "../constants/theme";
import type { ThemeMode } from "../types";

export type ResolvedTheme = "light" | "dark";

export type AppThemeContextValue = {
  /** User setting: system | light | dark */
  mode: ThemeMode;
  /** Effective palette after resolving system */
  resolvedMode: ResolvedTheme;
  colors: ThemeColors;
  type: TypeScale;
  shadow: ShadowTokens;
  space: typeof space;
  radius: typeof radius;
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<AppThemeContextValue | null>(null);

function resolveEffective(
  mode: ThemeMode,
  systemScheme: string | null | undefined
): ResolvedTheme {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return systemScheme === "dark" ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useAtom(themeModeAtom);

  const resolvedMode = resolveEffective(mode, systemScheme);
  const colors = resolvedMode === "dark" ? darkColors : lightColors;
  const type = useMemo(() => buildType(colors), [colors]);
  const shadow = useMemo(() => buildShadow(resolvedMode), [resolvedMode]);

  const value = useMemo<AppThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      colors,
      type,
      shadow,
      space,
      radius,
      setMode,
    }),
    [mode, resolvedMode, colors, type, shadow, setMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function ThemedStatusBar() {
  const { resolvedMode } = useAppTheme();
  return (
    <StatusBar style={resolvedMode === "dark" ? "light" : "dark"} />
  );
}
