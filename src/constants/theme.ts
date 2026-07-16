/**
 * Kulakan Ikan — Unified Design System
 *
 * All screens MUST use these tokens for colors, spacing, typography,
 * shadows, and component styles so the app looks cohesive.
 */
import { Platform, StyleSheet } from "react-native";
import { wp, hp, ms, fontSize as rfs, spacing, radius } from "../utils/responsive";

// ── Color Palette ──
export const Colors = {
  // Primary brand
  navy: "#0A235C", // Deep dark navy from reference
  navyLight: "#1D3A8A",
  royalBlue: "#2B78E4", // Vibrant medium blue
  royalBlueMuted: "rgba(43, 120, 228, 0.15)",
  royalBlueLight: "#6DB0FF", // Light blue for secondary cards

  // Accents
  gold: "#eab308",
  goldLight: "#fef08a",

  // Status
  success: "#22c55e",
  successDark: "#15803d",
  successBg: "rgba(34, 197, 94, 0.12)",
  danger: "#ef4444",
  dangerDark: "#b91c1c",
  dangerBg: "rgba(239, 68, 68, 0.12)",
  info: "#3b82f6",
  warning: "#f59e0b",

  // Surfaces
  background: "#E1F0FA",       // Icy light blue background
  card: "#ffffff",
  cardBlue: "#2B78E4",         // Solid blue card
  cardDark: "#0A235C",         // Dark navy card
  cardPressed: "#F0F7FB",
  inputBg: "#ffffff",
  divider: "#e2e8f0",

  // Text
  textPrimary: "#0A235C",      // Dark navy text
  textSecondary: "#475569",
  textMuted: "#64748b",
  textWhite: "#ffffff",
  textWhiteMuted: "rgba(255, 255, 255, 0.7)",

  // Misc
  overlay: "rgba(0, 7, 45, 0.5)",
  overlayDark: "rgba(0, 7, 45, 0.8)",
  headerBorder: "rgba(0, 7, 45, 0.05)",
} as const;

// ── Typography ──
export const Type = {
  h1: { fontSize: rfs(22), fontWeight: "800" as const, color: Colors.textPrimary, letterSpacing: -0.3 },
  h2: { fontSize: rfs(18), fontWeight: "700" as const, color: Colors.textPrimary },
  h3: { fontSize: rfs(15), fontWeight: "700" as const, color: Colors.textPrimary },
  body: { fontSize: rfs(14), fontWeight: "500" as const, color: Colors.textPrimary },
  bodySmall: { fontSize: rfs(12), fontWeight: "500" as const, color: Colors.textSecondary },
  caption: { fontSize: rfs(11), fontWeight: "600" as const, color: Colors.textMuted },
  label: { fontSize: rfs(13), fontWeight: "600" as const, color: Colors.textPrimary },
  button: { fontSize: rfs(14), fontWeight: "700" as const },
  headerTitle: { fontSize: rfs(18), fontWeight: "800" as const, color: Colors.textPrimary },
  stat: { fontSize: rfs(18), fontWeight: "800" as const, color: Colors.textPrimary },
  statSmall: { fontSize: rfs(13), fontWeight: "700" as const, color: Colors.royalBlue },
};

// ── Shadows ──
export const Shadow = {
  card: Platform.select({
    ios: {
      shadowColor: "#0A235C",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
    default: {},
  }),
  cardLift: Platform.select({
    ios: {
      shadowColor: "#0A235C",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: { elevation: 6 },
    default: {},
  }),
  button: Platform.select({
    ios: {
      shadowColor: "#2B78E4",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    android: { elevation: 4 },
    default: {},
  }),
};

// ── Shared Component Styles ──
export const SharedStyles = StyleSheet.create({
  // Screen container
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header bar
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(16),
    paddingVertical: spacing(14),
    backgroundColor: "transparent",
    borderBottomWidth: 0,
  },

  // Main scrollable content area
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentPadding: {
    padding: spacing(16),
    paddingBottom: spacing(100),
  },

  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: radius(18),
    padding: spacing(18),
    borderWidth: 1,
    borderColor: Colors.royalBlueMuted,
    ...Shadow.card,
  },

  // Form card
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: radius(20),
    padding: spacing(20),
    borderWidth: 1.5,
    borderColor: Colors.royalBlueMuted,
    ...Shadow.card,
  },

  // Input field
  input: {
    height: hp(46),
    backgroundColor: Colors.inputBg,
    borderRadius: radius(12),
    paddingHorizontal: spacing(14),
    fontSize: rfs(14),
    color: Colors.textPrimary,
  },

  // Primary button (green)
  primaryButton: {
    height: hp(48),
    backgroundColor: Colors.success,
    borderRadius: radius(14),
    alignItems: "center",
    justifyContent: "center",
    ...Shadow.button,
  },

  // Outline button
  outlineButton: {
    height: hp(46),
    borderRadius: radius(12),
    borderWidth: 1.5,
    borderColor: Colors.royalBlue,
    alignItems: "center",
    justifyContent: "center",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Stats card row
  statsRow: {
    flexDirection: "row",
    gap: spacing(10),
    marginBottom: spacing(16),
  },

  // Badge
  badgePaid: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: radius(8),
  },
  badgeUnpaid: {
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: spacing(10),
    paddingVertical: spacing(4),
    borderRadius: radius(8),
  },

  // Section title
  sectionTitle: {
    fontSize: rfs(15),
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: spacing(12),
  },

  // Empty state
  emptyState: {
    backgroundColor: Colors.card,
    padding: spacing(40),
    borderRadius: radius(20),
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.royalBlueMuted,
  },

  // Back button
  backButton: {
    padding: spacing(8),
    borderRadius: radius(20),
    marginRight: spacing(8),
  },

  // Header save button
  headerSaveButton: {
    backgroundColor: Colors.success,
    paddingHorizontal: spacing(14),
    paddingVertical: spacing(7),
    borderRadius: radius(10),
  },

  // Accent bar on cards
  accentBar: {
    height: 4,
    borderTopLeftRadius: radius(18),
    borderTopRightRadius: radius(18),
  },

  // Info row in cards
  infoRow: {
    backgroundColor: "#ffffff",
    padding: spacing(12),
    borderRadius: radius(12),
    borderWidth: 1,
    borderColor: Colors.divider,
  },
});

export default { Colors, Type, Shadow, SharedStyles };
