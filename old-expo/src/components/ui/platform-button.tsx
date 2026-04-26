/**
 * PlatformButton Component
 * Uses React Native Paper Button on Android/Web, native styling on iOS
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Button as PaperButton, useTheme as usePaperTheme } from 'react-native-paper';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'text';

interface PlatformButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  icon?: string;
  compact?: boolean;
}

export function PlatformButton({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  icon,
  compact = false,
}: PlatformButtonProps) {
  const { isDark } = useTheme();
  const paperTheme = usePaperTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          bg: '#007aff',
          text: '#ffffff',
          border: '#007aff',
        };
      case 'secondary':
        return {
          bg: isDark ? '#2c2c2e' : '#f2f2f7',
          text: isDark ? '#ffffff' : '#000000',
          border: isDark ? '#38383a' : '#e5e5ea',
        };
      case 'danger':
        return {
          bg: '#ff3b30',
          text: '#ffffff',
          border: '#ff3b30',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: '#007aff',
          border: '#007aff',
        };
      case 'text':
        return {
          bg: 'transparent',
          text: '#007aff',
          border: 'transparent',
        };
      default:
        return {
          bg: '#007aff',
          text: '#ffffff',
          border: '#007aff',
        };
    }
  };

  // iOS uses native-style buttons
  if (Platform.OS === 'ios') {
    const colors = getVariantColors();
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.iosButton,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: variant === 'outline' ? 1.5 : 0,
            opacity: disabled ? 0.5 : 1,
          },
          compact && styles.compact,
          style,
        ]}
      >
        <Text style={[styles.iosButtonText, { color: colors.text }]}>
          {loading ? 'Loading...' : children}
        </Text>
      </TouchableOpacity>
    );
  }

  // Android/Web uses React Native Paper
  const getPaperMode = (): 'contained' | 'outlined' | 'text' | 'contained-tonal' => {
    switch (variant) {
      case 'primary':
      case 'danger':
        return 'contained';
      case 'secondary':
        return 'contained-tonal';
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const getButtonColor = () => {
    if (variant === 'danger') return '#ff3b30';
    return undefined;
  };

  return (
    <PaperButton
      mode={getPaperMode()}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      buttonColor={getButtonColor()}
      style={[styles.paperButton, compact && styles.compact, style]}
      labelStyle={styles.paperButtonLabel}
      compact={compact}
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  iosButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iosButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  paperButton: {
    borderRadius: 12,
    marginVertical: 4,
  },
  paperButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: 4,
  },
  compact: {
    height: 36,
    paddingHorizontal: 12,
  },
});

