import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

interface NeomorphButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const NeomorphButton: React.FC<NeomorphButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const getContainerStyle = (): ViewStyle => {
    const sizeStyles: Record<string, ViewStyle> = {
      sm: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
      md: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 26 },
      lg: { paddingVertical: 16, paddingHorizontal: 28, borderRadius: 32 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: {
        backgroundColor: colors.primary,
        ...Platform.select({
          web: {
            background: 'linear-gradient(135deg, #E11D48 0%, #FF4D6D 100%)',
            boxShadow: isPressed
              ? 'inset 2px 2px 6px rgba(0,0,0,0.3)'
              : '4px 6px 16px rgba(225, 29, 72, 0.35), -2px -2px 10px rgba(255, 255, 255, 0.6)',
          } as any,
          default: {
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
          },
        }),
      },
      secondary: {
        backgroundColor: colors.surface,
        ...Platform.select({
          web: {
            boxShadow: isPressed
              ? 'inset 3px 3px 6px #DECED2, inset -3px -3px 6px #FFFFFF'
              : '4px 4px 10px #DECED2, -4px -4px 10px #FFFFFF',
          } as any,
          default: {
            shadowColor: colors.shadowDark,
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 3,
          },
        }),
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: colors.danger,
        ...Platform.select({
          web: {
            boxShadow: '4px 4px 12px rgba(220, 38, 38, 0.3)',
          } as any,
          default: {
            shadowColor: colors.danger,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          },
        }),
      },
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant],
      opacity: disabled ? 0.55 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeText: Record<string, TextStyle> = {
      sm: { fontSize: 13, fontWeight: '600' },
      md: { fontSize: 15, fontWeight: '700' },
      lg: { fontSize: 17, fontWeight: '700' },
    };

    const variantText: Record<string, TextStyle> = {
      primary: { color: '#FFFFFF' },
      secondary: { color: colors.primary },
      outline: { color: colors.primary },
      ghost: { color: colors.textPrimary },
      danger: { color: '#FFFFFF' },
    };

    return {
      ...sizeText[size],
      ...variantText[variant],
    };
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[styles.base, getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : colors.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});
