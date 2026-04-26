/**
 * ProgressBar Component
 * Visual progress indicator with percentage
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ProgressBarProps {
  percentage: number;
  label?: string;
  color?: string;
  height?: number;
  hideLabel?: boolean;
}

export function ProgressBar({
  percentage,
  label,
  color,
  height = 8,
  hideLabel = false,
}: ProgressBarProps) {
  const { isDark } = useTheme();

  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  // Determine color based on percentage if not provided
  const getColor = () => {
    if (color) return color;
    if (clampedPercentage < 50) return '#34c759';
    if (clampedPercentage < 80) return '#ff9500';
    return '#ff3b30';
  };

  return (
    <View style={styles.container}>
      {label && !hideLabel && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              { color: isDark ? '#ffffff' : '#000000' },
            ]}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.percentage,
              { color: isDark ? '#8e8e93' : '#6e6e73' },
            ]}
          >
            {clampedPercentage.toFixed(1)}%
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: isDark ? '#2c2c2e' : '#e5e5e5',
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${clampedPercentage}%`,
              backgroundColor: getColor(),
              height,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 15,
    fontWeight: '500',
  },
  track: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 6,
  },
});

