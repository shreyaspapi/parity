/**
 * PlatformChip Component
 * Uses React Native Paper Chip on Android/Web, native styling on iOS
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Chip as PaperChip, useTheme as usePaperTheme } from 'react-native-paper';

interface PlatformChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: string;
  style?: ViewStyle;
}

export function PlatformChip({
  label,
  selected = false,
  onPress,
  color = '#007aff',
  icon,
  style,
}: PlatformChipProps) {
  const { isDark } = useTheme();
  const paperTheme = usePaperTheme();

  // iOS uses native-style chips
  if (Platform.OS === 'ios') {
    const textColor = selected ? (color === '#8e8e93' ? '#000000' : '#ffffff') : color;
    const backgroundColor = selected ? color : 'transparent';
    const borderColor = color;

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.iosChip,
          {
            borderColor,
            backgroundColor,
          },
          style,
        ]}
      >
        <Text style={[styles.iosChipLabel, { color: textColor }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  // Android/Web uses React Native Paper
  return (
    <PaperChip
      selected={selected}
      onPress={onPress}
      icon={icon}
      style={[styles.paperChip, style]}
      textStyle={styles.paperChipText}
      selectedColor={color}
      showSelectedCheck={false}
      mode={selected ? 'flat' : 'outlined'}
    >
      {label}
    </PaperChip>
  );
}

const styles = StyleSheet.create({
  iosChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  iosChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  paperChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  paperChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

