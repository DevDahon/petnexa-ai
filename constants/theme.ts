import { MD3LightTheme, configureFonts } from "react-native-paper";

export const palette = {
  teal: "#22C1A8",
  navy: "#1E3A8A",
  mint: "#A7E3D5",
  peach: "#FFB384",
  yellow: "#FFD166",
  background: "#F2F4F7",
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
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const shadow = {
  boxShadow: "0 8px 24px rgba(30, 58, 138, 0.10)",
};

export const paperTheme = {
  ...MD3LightTheme,
  roundness: 4,
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
