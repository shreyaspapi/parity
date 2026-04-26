/**
 * PlatformProgress Component
 * Uses React Native Paper ProgressBar on Android/Web, native styling on iOS
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ProgressBar as PaperProgressBar, useTheme as usePaperTheme } from 'react-native-paper';

interface PlatformProgressProps {
  progress: number; // 0-100
  label?: string;
  color?: string;
  height?: number;
  style?: ViewStyle;
  showPercentage?: boolean;
}

export function PlatformProgress({
  progress,
  label,
  color,
  height = 8,
  style,
  showPercentage = false,
}: PlatformProgressProps) {
  const { isDark } = useTheme();
  const paperTheme = usePaperTheme();

  const getProgressColor = () => {
    if (color) return color;
    if (progress > 90) return '#ff3b30';
    if (progress > 75) return '#ff9500';
    return '#007aff';
  };

  const progressColor = getProgressColor();
  const normalizedProgress = Math.min(Math.max(progress, 0), 100) / 100;

  // iOS uses native-style progress
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, style]}>
        {(label || showPercentage) && (
          <View style={styles.labelRow}>
            {label && (
              <Text style={[styles.label, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                {label}
              </Text>
            )}
            {showPercentage && (
              <Text style={[styles.percentage, { color: isDark ? '#ffffff' : '#000000' }]}>
                {progress.toFixed(0)}%
              </Text>
            )}
          </View>
        )}
        <View
          style={[
            styles.iosProgressTrack,
            {
              backgroundColor: isDark ? '#38383a' : '#e5e5ea',
              height,
            },
          ]}
        >
          <View
            style={[
              styles.iosProgressBar,
              {
                backgroundColor: progressColor,
                width: `${progress}%`,
                height,
              },
            ]}
          />
        </View>
      </View>
    );
  }

  // Android/Web uses React Native Paper
  return (
    <View style={[styles.container, style]}>
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={[styles.label, { color: paperTheme.colors.onSurfaceVariant }]}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={[styles.percentage, { color: paperTheme.colors.onSurface }]}>
              {progress.toFixed(0)}%
            </Text>
          )}
        </View>
      )}
      <PaperProgressBar
        progress={normalizedProgress}
        color={progressColor}
        style={[styles.paperProgress, { height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 14,
    fontWeight: '600',
  },
  iosProgressTrack: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  iosProgressBar: {
    borderRadius: 4,
  },
  paperProgress: {
    borderRadius: 4,
  },
});

