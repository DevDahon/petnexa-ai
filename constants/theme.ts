import { MD3LightTheme, MD3DarkTheme, configureFonts } from "react-native-paper";
import type { ThemeMode } from "@/types/domain";

export const palette = {
  // Brand (Rich Emerald Teal & Deep Slate Navy)
  teal: "#0D9488",
  tealDeep: "#0F766E",
  tealDark: "#115E59",
  navy: "#0F172A",
  navySoft: "#1E293B",
  navyDark: "#020617",

  // Modern Vivid Accents
  indigo: "#4F46E5",
  indigoSoft: "#E0E7FF",
  mint: "#059669",
  mintLight: "#A7F3D0",
  peach: "#EA580C",
  yellow: "#D97706",
  gold: "#B45309",

  // Backgrounds & Surface (Crisp Slate High Contrast)
  background: "#F8FAFC",
  backgroundAlt: "#F1F5F9",
  card: "#FFFFFF",
  cardRaised: "#F8FAFC",

  // Text (Deep Slate for Bold High-Contrast Readability)
  text: "#0F172A",
  textSecondary: "#1E293B",
  muted: "#475569",
  mutedLight: "#64748B",

  // Borders
  border: "#CBD5E1",
  borderLight: "#E2E8F0",

  // Status (Vivid High Contrast)
  success: "#059669",
  successSoft: "#D1FAE5",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",

  // Rich Crisp Tones (Non-Pastel, Solid & High-Contrast)
  softTeal: "#CCFBF1",
  softIndigo: "#E0E7FF",
  softPeach: "#FFEDD5",
  softDanger: "#FEE2E2",
  softNavy: "#E2E8F0",
  softYellow: "#FEF3C7",
  neutralBg: "#F1F5F9",
};

export const darkPalette = {
  ...palette,
  teal: "#14B8A6",
  tealDeep: "#0D9488",
  tealDark: "#0F766E",
  navy: "#F8FAFC",
  navySoft: "#E2E8F0",
  navyDark: "#FFFFFF",

  background: "#090D16",
  backgroundAlt: "#0F172A",
  card: "#151D2A",
  cardRaised: "#1E293B",

  text: "#F8FAFC",
  textSecondary: "#E2E8F0",
  muted: "#94A3B8",
  mutedLight: "#64748B",

  border: "#2A364F",
  borderLight: "#1E293B",

  softTeal: "#0F3836",
  softIndigo: "#1E1B4B",
  softPeach: "#451A03",
  softDanger: "#450A0A",
  softNavy: "#1E293B",
  softYellow: "#451A03",
  neutralBg: "#0F172A",
};

export function getPalette(mode?: ThemeMode) {
  if (mode === "dark") return darkPalette;
  return palette;
}

export const radii = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
  xxl: 32,
  pill: 999,
};

export const shadow = {
  xs: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 8,
  },
};

// Legacy string shadows for web compatibility
export const shadowWeb = {
  xs: "0 1px 4px rgba(0, 0, 0, 0.08)",
  sm: "0 3px 10px rgba(0, 0, 0, 0.12)",
  md: "0 6px 18px rgba(0, 0, 0, 0.16)",
  lg: "0 10px 28px rgba(0, 0, 0, 0.22)",
};

export const gradients = {
  primary: ["#0D9488", "#0F766E"] as const,
  hero: ["#0D9488", "#0F766E"] as const,
  secondary: ["#0F172A", "#1E293B"] as const,
  warm: ["#EA580C", "#C2410C"] as const,
  calm: ["#0F766E", "#1E293B"] as const,
  mint: ["#059669", "#047857"] as const,
  indigo: ["#4F46E5", "#3730A3"] as const,
  danger: ["#DC2626", "#991B1B"] as const,
  sunset: ["#D97706", "#92400E"] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontFamily = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semiBold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  extraBold: "Inter_800ExtraBold",
  black: "Inter_900Black",
};

export const typeScale = {
  micro: 12,
  caption: 12,
  label: 13,
  bodySmall: 13,
  body: 14,
  action: 14,
  titleSmall: 16,
  title: 18,
  headlineSmall: 20,
  headline: 24,
  screen: 30,
};

export const lineHeights = {
  micro: 15,
  caption: 16,
  label: 18,
  bodySmall: 20,
  body: 22,
  titleSmall: 22,
  title: 24,
};

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 20,
  fonts: configureFonts({
    config: {
      fontFamily: "Inter_500Medium",
    },
  }),
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.teal,
    secondary: palette.navy,
    tertiary: palette.yellow,
    background: palette.background,
    surface: palette.card,
    surfaceVariant: "#E8F5F2",
    error: palette.danger,
    outline: palette.border,
    onSurface: palette.text,
    onSurfaceVariant: palette.muted,
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: "transparent",
      level1: palette.card,
      level2: palette.cardRaised,
    },
  },
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  roundness: 20,
  fonts: configureFonts({
    config: {
      fontFamily: "Inter_500Medium",
    },
  }),
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkPalette.teal,
    secondary: "#94A3B8",
    tertiary: darkPalette.yellow,
    background: darkPalette.background,
    surface: darkPalette.card,
    surfaceVariant: "#1E293B",
    error: darkPalette.danger,
    outline: darkPalette.border,
    onSurface: darkPalette.text,
    onSurfaceVariant: darkPalette.muted,
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: "transparent",
      level1: darkPalette.card,
      level2: darkPalette.cardRaised,
    },
  },
};

export function getPaperTheme(mode?: ThemeMode) {
  if (mode === "dark") return paperDarkTheme;
  return paperTheme;
}
