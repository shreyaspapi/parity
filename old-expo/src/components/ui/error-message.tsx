/**
 * ErrorMessage Component
 * Displays error messages with retry option - platform-specific styling
 */

import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Button as PaperButton,
  Text as PaperText,
  Surface,
  useTheme as usePaperTheme,
} from 'react-native-paper';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  const { isDark } = useTheme();
  const { t } = useLocalization();
  const paperTheme = usePaperTheme();

  // iOS uses native-style error
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f2f2f7' }]}>
        <View style={[styles.iosIconContainer, { backgroundColor: isDark ? '#2c1c1c' : '#ffebee' }]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ff3b30" />
        </View>
        <PaperText
          variant="titleMedium"
          style={[styles.iosTitle, { color: isDark ? '#ffffff' : '#000000' }]}
        >
          Oops! Something went wrong
        </PaperText>
        <PaperText
          variant="bodyMedium"
          style={[styles.message, { color: isDark ? '#8e8e93' : '#6e6e73' }]}
        >
          {message}
        </PaperText>
        {onRetry && (
          <TouchableOpacity
            style={[styles.iosRetryButton, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}
            onPress={onRetry}
          >
            <PaperText style={[styles.iosRetryText, { color: '#007aff' }]}>
              {t('common.retry')}
            </PaperText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Android/Web uses Material Design styled error
  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <Surface style={styles.errorCard} elevation={2}>
        <View style={[styles.iconContainer, { backgroundColor: '#ff3b3015' }]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ff3b30" />
        </View>
        <PaperText variant="titleLarge" style={styles.title}>
          Error
        </PaperText>
        <PaperText
          variant="bodyMedium"
          style={[styles.paperMessage, { color: paperTheme.colors.onSurfaceVariant }]}
        >
          {message}
        </PaperText>
        {onRetry && (
          <PaperButton
            mode="contained"
            onPress={onRetry}
            icon="refresh"
            style={styles.retryButton}
          >
            {t('common.retry')}
          </PaperButton>
        )}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  // iOS styles
  iosIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iosTitle: {
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  iosRetryButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iosRetryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Paper styles
  errorCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: '600',
    marginBottom: 8,
  },
  paperMessage: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
  },
});
