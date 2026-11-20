/**
 * BamanaShop — Design System Colors
 * Based on Madina Direct brand colors
 */

export const Colors = {
  // Primary brand colors (from Madina Direct: #E94D1C)
  primary: "#E94D1C",
  primaryLight: "#F97316",
  primaryDark: "#C2410C",
  primaryBackground: "#FEF7ED",
  primaryOn: "#FFFFFF",

  // Neutral colors
  background: "#FFFFFF",
  backgroundSecondary: "#FAFAFA",
  backgroundTertiary: "#F5F5F5",

  // Text colors
  textPrimary: "#1A1A1A",
  textSecondary: "#6B6B6B",
  textTertiary: "#9E9E9E",
  textOnPrimary: "#FFFFFF",
  textOnBackground: "#1A1A1A",

  // Border & Dividers
  border: "#E5E5E5",
  borderLight: "#F0F0F0",
  divider: "#E5E5E5",

  // Status colors
  success: "#16A34A",
  successLight: "#DCFCE7",
  error: "#DC2626",
  errorLight: "#FEF2F2",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  info: "#2563EB",
  infoLight: "#DBEAFE",

  // Category colors
  categoryFood: "#F97316",
  categoryElectronics: "#3B82F6",
  categoryFashion: "#EC4899",
  categoryHome: "#06B6D4",

  // Overlay & Shadows
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.15)",

  // Tab bar
  tabActive: "#E94D1C",
  tabInactive: "#9E9E9E",
  tabBackground: "#FFFFFF",

  // Input states
  inputBackground: "#FFFFFF",
  inputBorder: "#E5E5E5",
  inputBorderFocus: "#E94D1C",
  inputPlaceholder: "#9E9E9E",
  inputError: "#DC2626",
  inputErrorBorder: "#FCA5A5",

  // Button states
  buttonPrimary: "#E94D1C",
  buttonPrimaryPressed: "#C2410C",
  buttonPrimaryDisabled: "#FCA5A5",
  buttonSecondary: "#FFFFFF",
  buttonSecondaryBorder: "#E94D1C",
  buttonSecondaryText: "#E94D1C",
  buttonTextOnPrimary: "#FFFFFF",
  buttonTextOnSecondary: "#E94D1C",

  // Card
  cardBackground: "#FFFFFF",
  cardBorder: "#E5E5E5",
  cardShadow: "rgba(0, 0, 0, 0.05)",

  // Badge
  badgePrimary: "#E94D1C",
  badgeSuccess: "#16A34A",
  badgeWarning: "#D97706",
  badgeInfo: "#2563EB",
  badgeOnPrimary: "#FFFFFF",
} as const;

export type ColorKey = keyof typeof Colors;

// Semantic color mappings for easy theming
export const SemanticColors = {
  // Backgrounds
  screenBackground: Colors.background,
  cardBackground: Colors.cardBackground,
  modalBackground: Colors.background,
  headerBackground: Colors.background,
  inputBackground: Colors.inputBackground,
  backgroundSecondary: Colors.backgroundSecondary,
  backgroundTertiary: Colors.backgroundTertiary,
  primaryBackground: Colors.primaryBackground,

  // Text
  textPrimary: Colors.textPrimary,
  textSecondary: Colors.textSecondary,
  textTertiary: Colors.textTertiary,
  textPlaceholder: Colors.inputPlaceholder,
  textError: Colors.inputError,
  textOnPrimary: Colors.textOnPrimary,

  // Interactive
  primaryAction: Colors.buttonPrimary,
  primaryActionPressed: Colors.buttonPrimaryPressed,
  primaryActionDisabled: Colors.buttonPrimaryDisabled,
  secondaryAction: Colors.buttonSecondary,
  secondaryActionBorder: Colors.buttonSecondaryBorder,
  secondaryActionText: Colors.buttonSecondaryText,
  buttonTextOnPrimary: Colors.buttonTextOnPrimary,
  buttonTextOnSecondary: Colors.buttonTextOnSecondary,

  // Borders
  borderDefault: Colors.border,
  borderFocus: Colors.inputBorderFocus,
  borderError: Colors.inputErrorBorder,
  cardBorder: Colors.cardBorder,

  // Status
  success: Colors.success,
  successBackground: Colors.successLight,
  error: Colors.error,
  errorBackground: Colors.errorLight,
  warning: Colors.warning,
  warningBackground: Colors.warningLight,
  info: Colors.info,
  infoBackground: Colors.infoLight,

  // Navigation
  tabActive: Colors.tabActive,
  tabInactive: Colors.tabInactive,
  tabBackground: Colors.tabBackground,
} as const;