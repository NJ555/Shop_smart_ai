import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from 'react-native';
import { colors } from '../theme/colors';

interface NeomorphCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'raised' | 'raisedSoft' | 'raisedFloating' | 'sunken' | 'glow';
  padding?: number;
  borderRadius?: number;
}

export const NeomorphCard: React.FC<NeomorphCardProps> = ({
  children,
  style,
  variant = 'raised',
  padding = 16,
  borderRadius = 20,
}) => {
  const getShadowStyle = (): ViewStyle => {
    switch (variant) {
      case 'raisedSoft':
        return Platform.select({
          web: {
            boxShadow: '4px 4px 10px #E5D8DA, -4px -4px 10px #FFFFFF',
            backgroundColor: colors.surface,
          } as any,
          default: {
            backgroundColor: colors.surface,
            shadowColor: colors.shadowDark,
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 6,
            elevation: 4,
          },
        });
      case 'raisedFloating':
        return Platform.select({
          web: {
            boxShadow: '10px 10px 24px #DECED2, -10px -10px 24px #FFFFFF',
            backgroundColor: colors.surface,
          } as any,
          default: {
            backgroundColor: colors.surface,
            shadowColor: colors.shadowDarkStrong,
            shadowOffset: { width: 6, height: 6 },
            shadowOpacity: 0.5,
            shadowRadius: 14,
            elevation: 10,
          },
        });
      case 'sunken':
        return Platform.select({
          web: {
            boxShadow: 'inset 3px 3px 6px #DECED2, inset -3px -3px 6px #FFFFFF',
            backgroundColor: colors.surfaceSunken,
            borderWidth: 1,
            borderColor: 'rgba(225, 29, 72, 0.08)',
          } as any,
          default: {
            backgroundColor: colors.surfaceSunken,
            borderWidth: 1,
            borderColor: 'rgba(225, 29, 72, 0.08)',
          },
        });
      case 'glow':
        return Platform.select({
          web: {
            boxShadow: '6px 6px 16px rgba(225, 29, 72, 0.16), -6px -6px 16px #FFFFFF',
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: 'rgba(225, 29, 72, 0.25)',
          } as any,
          default: {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: 'rgba(225, 29, 72, 0.25)',
            shadowColor: colors.primary,
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 6,
          },
        });
      case 'raised':
      default:
        return Platform.select({
          web: {
            boxShadow: '6px 6px 14px #DECED2, -6px -6px 14px #FFFFFF',
            backgroundColor: colors.surface,
          } as any,
          default: {
            backgroundColor: colors.surface,
            shadowColor: colors.shadowDarkStrong,
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 0.45,
            shadowRadius: 8,
            elevation: 6,
          },
        });
    }
  };

  return (
    <View
      style={[
        styles.base,
        { padding, borderRadius },
        getShadowStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
