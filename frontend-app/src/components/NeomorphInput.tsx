import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

interface NeomorphInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  icon?: React.ReactNode;
  clearButton?: boolean;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
  multiline?: boolean;
  numberOfLines?: number;
}

export const NeomorphInput: React.FC<NeomorphInputProps> = ({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  icon,
  clearButton = true,
  onSubmitEditing,
  style,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.focused,
        multiline && { height: numberOfLines * 24 + 28, alignItems: 'flex-start' },
        style,
      ]}
    >
      {icon && <View style={styles.iconBox}>{icon}</View>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onSubmitEditing={onSubmitEditing}
        multiline={multiline}
        numberOfLines={numberOfLines}
        style={[styles.input, multiline && styles.multilineInput]}
      />
      {clearButton && value ? (
        <TouchableOpacity
          onPress={() => onChangeText('')}
          style={styles.clearBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSunken,
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(215, 190, 195, 0.4)',
    ...Platform.select({
      web: {
        boxShadow: 'inset 3px 3px 6px #DECED2, inset -3px -3px 6px #FFFFFF',
        outline: 'none',
      } as any,
    }),
  },
  focused: {
    borderColor: colors.primary,
    ...Platform.select({
      web: {
        boxShadow: 'inset 3px 3px 6px #DECED2, inset -3px -3px 6px #FFFFFF, 0 0 0 2px rgba(225, 29, 72, 0.15)',
      } as any,
    }),
  },
  iconBox: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 8,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  clearBtn: {
    padding: 4,
    marginLeft: 6,
  },
  clearText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: 'bold',
  },
});
