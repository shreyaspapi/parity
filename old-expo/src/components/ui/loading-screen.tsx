/**
 * LoadingScreen Component
 * Full-screen loading indicator with platform-specific styling
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator as PaperActivityIndicator,
  Text as PaperText,
  Surface,
  useTheme as usePaperTheme,
} from 'react-native-paper';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  const { isDark } = useTheme();
  const paperTheme = usePaperTheme();

  // iOS uses simpler native-style loading
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f2f2f7' }]}>
        <PaperActivityIndicator size="large" color={isDark ? '#007aff' : '#007aff'} />
        <PaperText
          variant="bodyLarge"
          style={[styles.message, { color: isDark ? '#8e8e93' : '#6e6e73' }]}
        >
          {message}
        </PaperText>
      </View>
    );
  }

  // Android/Web uses Material Design styled loading
  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <Surface style={styles.loadingCard} elevation={2}>
        <PaperActivityIndicator size="large" color={paperTheme.colors.primary} />
        <PaperText
          variant="bodyLarge"
          style={[styles.message, { color: paperTheme.colors.onSurface }]}
        >
          {message}
        </PaperText>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    gap: 16,
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
  },
});
