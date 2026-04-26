/**
 * StatItem Component
 * Displays a label-value pair for statistics
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatItemProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}

export function StatItem({ label, value, unit, color }: StatItemProps) {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          { color: isDark ? '#8e8e93' : '#6e6e73' },
        ]}
      >
        {label}
      </Text>
      <View style={styles.valueContainer}>
        <Text
          style={[
            styles.value,
            { color: color || (isDark ? '#ffffff' : '#000000') },
          ]}
        >
          {value}
        </Text>
        {unit && (
          <Text
            style={[
              styles.unit,
              { color: isDark ? '#8e8e93' : '#6e6e73' },
            ]}
          >
            {' '}
            {unit}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
    fontWeight: '500',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
  },
  unit: {
    fontSize: 14,
  },
});

