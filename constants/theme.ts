import { MD3LightTheme, configureFonts } from "react-native-paper";

export const palette = {
  // Brand (Refined Teal & Slate Deep)
  teal: "#0D9488",
  tealDeep: "#0F766E",
  tealDark: "#115E59",
  navy: "#1E293B",
  navySoft: "#334155",
  navyDark: "#0F172A",

  // Modern 2026 Accents
  indigo: "#6366F1",
  indigoSoft: "#EEF2FF",
  mint: "#10B981",
  mintLight: "#D1FAE5",
  peach: "#F97316",
  yellow: "#F59E0B",
  gold: "#D97706",

  // Backgrounds
  background: "#F8FAFC",
  backgroundAlt: "#F1F5F9",
  card: "#FFFFFF",
  cardRaised: "#FAFCFE",

  // Text (Slate palette for clean readability)
  text: "#0F172A",
  textSecondary: "#334155",
  muted: "#64748B",
  mutedLight: "#94A3B8",

  // Borders
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // Status
  success: "#10B981",
  successSoft: "#ECFDF5",
  warning: "#F59E0B",
  warningSoft: "#FEF3C7",
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",

  // Soft tones
  softTeal: "#F0FDFA",
  softIndigo: "#EEF2FF",
  softPeach: "#FFF7ED",
  softDanger: "#FEF2F2",
  softNavy: "#F1F5F9",
  softYellow: "#FEFCE8",
  neutralBg: "#F8FAFC",
};

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
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
};

// Legacy string shadows for web compatibility
export const shadowWeb = {
  xs: "0 1px 4px rgba(15, 23, 42, 0.03)",
  sm: "0 3px 10px rgba(15, 23, 42, 0.06)",
  md: "0 6px 18px rgba(15, 23, 42, 0.09)",
  lg: "0 10px 28px rgba(15, 23, 42, 0.12)",
};

export const gradients = {
  primary: [palette.teal, palette.tealDark] as const,
  hero: [palette.teal, "#0B7A6B"] as const,
  secondary: [palette.navy, palette.navySoft] as const,
  warm: [palette.softPeach, "#FFFBF8"] as const,
  calm: [palette.softTeal, "#F5FCFA"] as const,
  mint: [palette.mintLight, "#E0F7F2"] as const,
  indigo: [palette.indigo, "#4F46E5"] as const,
  danger: [palette.dangerSoft, "#FFF5F5"] as const,
  sunset: ["#FFB384", "#FFD9C2"] as const,
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
