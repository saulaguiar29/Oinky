export const LightColors = {
  primary: "#3dc28f",
  primaryLight: "#d8f3e9",
  secondary: "#FF6B6B",
  success: "#319b72",
  background: "#ecf9f4",
  surface: "#FFFFFF",      // card / input / modal backgrounds
  white: "#FFFFFF",        // text & icons on colored (primary/secondary) backgrounds
  border: "#b1e7d2",
  textPrimary: "#0c271d",
  textSecondary: "#257456",
  depositBg: "#DCFCE7",
  withdrawBg: "#FFE4E6",
};

export const DarkColors = {
  primary: "#3dc28f",
  primaryLight: "#1a3d2f",
  secondary: "#FF6B6B",
  success: "#4ade80",
  background: "#0d1f18",
  surface: "#1a2e22",
  white: "#FFFFFF",
  border: "#2a4a37",
  textPrimary: "#e8f5ee",
  textSecondary: "#7ab89a",
  depositBg: "#1a3d2f",
  withdrawBg: "#3d1a1a",
};

// Backward-compat alias — prefer useTheme() in components
export const Colors = LightColors;

export type ColorPalette = typeof LightColors;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5001/api";
