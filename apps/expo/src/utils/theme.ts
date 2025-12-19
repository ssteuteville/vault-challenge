/**
 * Theme colors that match the NextJS app's Tailwind theme
 * Based on oklch color space converted to hex for React Native compatibility
 *
 * Light mode primary: oklch(0.65 0.22 240) → Blue
 * Dark mode primary: oklch(0.7 0.2 240) → Lighter Blue
 */

export const colors = {
  // Primary - Blue (hue 240 in oklch)
  primary: "#4A7BF7",
  primaryLight: "#5B8BFF",
  primaryForeground: "#FFFFFF",

  // Accent - Orange (hue 30 in oklch)
  accent: "#E0854D",
  accentForeground: "#1E2432",

  // Backgrounds
  background: {
    light: "#FAFBFD",
    dark: "#1C1F26",
  },

  // Cards
  card: {
    light: "#FFFFFF",
    dark: "#1C1F26",
  },

  // Foreground (text)
  foreground: {
    light: "#1E2432",
    dark: "#F8FAFC",
  },

  // Muted
  muted: {
    light: "#F0F3F8",
    dark: "#2A2F3A",
  },
  mutedForeground: {
    light: "#71778A",
    dark: "#9CA3AF",
  },

  // Borders
  border: {
    light: "#E4E9F2",
    dark: "#373D4A",
  },

  // Secondary
  secondary: {
    light: "#EEF0F8",
    dark: "#2A2F3A",
  },
  secondaryForeground: {
    light: "#4A5568",
    dark: "#A0AEC0",
  },

  // Status colors (same as NextJS)
  status: {
    available: "#10B981",
    availableLight: "rgba(16, 185, 129, 0.2)",
    borrowed: "#F59E0B",
    borrowedLight: "rgba(245, 158, 11, 0.2)",
    unavailable: "#6B7280",
    unavailableLight: "rgba(107, 114, 128, 0.2)",
  },

  // Semantic colors
  destructive: "#EF4444",
  destructiveForeground: "#FFFFFF",

  // Tab bar specific
  tabBar: {
    background: "#1C1F26",
    inactive: "#9CA3AF",
  },
} as const;

// Tab configuration with theme-aligned colors
export const tabColors = {
  sharing: colors.status.available,
  browse: colors.primary,
  borrowing: colors.status.borrowed,
} as const;

// Helper to get color based on color scheme
export function getColor(
  colorKey:
    | "background"
    | "card"
    | "foreground"
    | "muted"
    | "mutedForeground"
    | "border"
    | "secondary"
    | "secondaryForeground",
  isDark: boolean,
): string {
  const colorValue = colors[colorKey];
  if (typeof colorValue === "object" && "light" in colorValue) {
    return isDark ? colorValue.dark : colorValue.light;
  }
  return colorValue as string;
}

