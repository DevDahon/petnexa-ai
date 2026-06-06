import { MD3LightTheme, configureFonts } from "react-native-paper";

export const palette = {
  teal: "#22C1A8",
  tealDeep: "#18A999",
  navy: "#1E3A8A",
  navySoft: "#314EA5",
  mint: "#A7E3D5",
  peach: "#FFB384",
  yellow: "#FFD166",
  background: "#F4F8FA",
  card: "#FFFFFF",
  text: "#0B1F4D",
  muted: "#667085",
  border: "#E4E7EC",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  softTeal: "#E8F8F5",
  softPeach: "#FFF2E8",
  softDanger: "#FEECEC",
  softNavy: "#EAF0FF",
  softYellow: "#FFF8E1",
};

export const radii = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 26,
  pill: 999,
};

export const shadow = {
  xs: "0 2px 8px rgba(30, 58, 138, 0.05)",
  sm: "0 6px 16px rgba(30, 58, 138, 0.07)",
  md: "0 10px 26px rgba(30, 58, 138, 0.10)",
  lg: "0 16px 34px rgba(30, 58, 138, 0.12)",
};

export const gradients = {
  primary: [palette.teal, palette.tealDeep] as const,
  secondary: [palette.navy, palette.navySoft] as const,
  warm: [palette.softPeach, "#FFFFFF"] as const,
  calm: [palette.softTeal, "#FFFFFF"] as const,
  danger: [palette.softDanger, "#FFFFFF"] as const,
};

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 22,
  fonts: configureFonts({
    config: {
      fontFamily: "System",
    },
  }),
  colors: {
    ...MD3LightTheme.colors,
    primary: palette.teal,
    secondary: palette.navy,
    tertiary: palette.yellow,
    background: palette.background,
    surface: palette.card,
    surfaceVariant: "#EAF3F1",
    error: palette.danger,
    outline: palette.border,
    onSurface: palette.text,
    onSurfaceVariant: palette.muted,
  },
};
