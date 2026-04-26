/**
 * Circular Progress Component
 * A circular progress indicator showing percentage with label
 * Inspired by UniFi mobile app design
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label: string;
  color?: string;
}

export function CircularProgress({
  percentage,
  size = 100,
  strokeWidth = 8,
  label,
  color,
}: CircularProgressProps) {
  const { isDark } = useTheme();

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Determine color based on percentage if not provided
  const getColor = () => {
    if (color) return color;
    if (progress >= 90) return '#ff3b30'; // Red for critical
    if (progress >= 75) return '#ff9500'; // Orange for warning
    return '#34c759'; // Green for good
  };

  const progressColor = getColor();
  const backgroundColor = isDark ? '#2c2c2e' : '#e5e5ea';

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Svg width={size} height={size}>
          {/* Background Circle */}
          <Circle
            stroke={backgroundColor}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          {/* Progress Circle */}
          <Circle
            stroke={progressColor}
            fill="none"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.percentage,
              { color: isDark ? '#ffffff' : '#000000' },
            ]}
          >
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.label,
          { color: isDark ? '#8e8e93' : '#6e6e73' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});

