import { MD3LightTheme, configureFonts } from "react-native-paper";

export const palette = {
  // Brand
  teal: "#22C1A8",
  tealDeep: "#0FA896",
  tealDark: "#0D8F80",
  navy: "#1E3A8A",
  navySoft: "#314EA5",
  navyDark: "#152B6A",

  // Accents
  mint: "#A7E3D5",
  mintLight: "#D0F0EA",
  peach: "#FFB384",
  yellow: "#FFD166",
  gold: "#F5A623",

  // Backgrounds
  background: "#F0F5F9",
  backgroundAlt: "#E8F2F7",
  card: "#FFFFFF",
  cardRaised: "#FAFCFE",

  // Text
  text: "#0B1F4D",
  textSecondary: "#2D4070",
  muted: "#667085",
  mutedLight: "#98A6B5",

  // Borders
  border: "#DDE4EC",
  borderLight: "#EBF0F5",

  // Status
  success: "#16A34A",
  successSoft: "#DCFCE7",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  danger: "#DC2626",
  dangerSoft: "#FEE2E2",

  // Soft tones
  softTeal: "#E4F5F1",
  softPeach: "#FFF0E6",
  softDanger: "#FEECEC",
  softNavy: "#EAF0FF",
  softYellow: "#FFFBEB",
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
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sm: {
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 4,
  },
  lg: {
    shadowColor: "#1E3A8A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 8,
  },
};

// Legacy string shadows for web compatibility
export const shadowWeb = {
  xs: "0 1px 4px rgba(30, 58, 138, 0.04)",
  sm: "0 3px 10px rgba(30, 58, 138, 0.07)",
  md: "0 6px 18px rgba(30, 58, 138, 0.10)",
  lg: "0 10px 28px rgba(30, 58, 138, 0.14)",
};

export const gradients = {
  primary: [palette.teal, palette.tealDark] as const,
  hero: [palette.teal, "#0B7A6B"] as const,
  secondary: [palette.navy, palette.navySoft] as const,
  warm: [palette.softPeach, "#FFFBF8"] as const,
  calm: [palette.softTeal, "#F5FCFA"] as const,
  mint: [palette.mintLight, "#E0F7F2"] as const,
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
