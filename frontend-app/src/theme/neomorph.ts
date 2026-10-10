import { StyleSheet, ViewStyle, Platform } from 'react-native';
import { colors } from './colors';

// Cross-platform Neomorphic Shadows
export const neomorph = StyleSheet.create({
  // Standard Raised Neomorphic Card
  raised: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: '6px 6px 14px #DECED2, -6px -6px 14px #FFFFFF',
      } as any,
      default: {
        shadowColor: colors.shadowDarkStrong,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },

  // Soft Raised Card (Subtle)
  raisedSoft: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 10px #E5D8DA, -4px -4px 10px #FFFFFF',
      } as any,
      default: {
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 4,
      },
    }),
  },

  // Deep Floating Raised Card (Hero / Modals)
  raisedFloating: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    ...Platform.select({
      web: {
        boxShadow: '10px 10px 24px #D8C6CA, -10px -10px 24px #FFFFFF',
      } as any,
      default: {
        shadowColor: colors.shadowDarkStrong,
        shadowOffset: { width: 6, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
      },
    }),
  },

  // Sunken / Inset Style (Input fields, Active switches)
  sunken: {
    backgroundColor: colors.surfaceSunken,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(215, 190, 195, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 3px 3px 6px #DECED2, inset -3px -3px 6px #FFFFFF',
      } as any,
      default: {
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 1, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },

  // Reddish Glow Raised Card (Accentuated)
  raisedGlow: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.22)',
    ...Platform.select({
      web: {
        boxShadow: '6px 6px 16px rgba(225, 29, 72, 0.18), -6px -6px 16px #FFFFFF',
      } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
      },
    }),
  },

  // Primary Reddish Button Glow
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    ...Platform.select({
      web: {
        boxShadow: '4px 6px 16px rgba(225, 29, 72, 0.35), -2px -2px 10px rgba(255, 255, 255, 0.6)',
      } as any,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },

  // Circular Action Button
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '4px 4px 10px #DECED2, -4px -4px 10px #FFFFFF',
      } as any,
      default: {
        shadowColor: colors.shadowDark,
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 4,
      },
    }),
  },
});
