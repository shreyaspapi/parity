/**
 * Card Component
 * Reusable card container for displaying grouped information
 * Platform-aware: Native styling on iOS, Material Design on Android/Web
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { Card as PaperCard, useTheme as usePaperTheme } from 'react-native-paper';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  mode?: 'elevated' | 'outlined' | 'contained';
}

export function Card({ children, style, onPress, mode = 'elevated' }: CardProps) {
  const { isDark } = useTheme();
  const paperTheme = usePaperTheme();

  // iOS uses native-style cards
  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          styles.iosCard,
          {
            backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
            borderColor: isDark ? '#2c2c2e' : '#e5e5e5',
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Android/Web uses React Native Paper
  if (onPress) {
    return (
      <PaperCard
        mode={mode}
        style={[styles.paperCard, { backgroundColor: paperTheme.colors.surface }, style]}
        onPress={onPress}
      >
        <PaperCard.Content style={styles.paperCardContent}>{children}</PaperCard.Content>
      </PaperCard>
    );
  }

  return (
    <PaperCard
      mode={mode}
      style={[styles.paperCard, { backgroundColor: paperTheme.colors.surface }, style]}
    >
      <PaperCard.Content style={styles.paperCardContent}>{children}</PaperCard.Content>
    </PaperCard>
  );
}

const styles = StyleSheet.create({
  iosCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  paperCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  paperCardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
});
