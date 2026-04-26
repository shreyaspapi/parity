/**
 * Metric Card Component
 * Compact metric display inspired by UniFi
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

export function MetricCard({
  label,
  value,
  unit,
  subtitle,
  status = 'good',
  icon,
}: MetricCardProps) {
  const { isDark } = useTheme();

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return '#ff3b30';
      case 'warning':
        return '#ff9500';
      default:
        return isDark ? '#ffffff' : '#000000';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
          borderColor: isDark ? '#2c2c2e' : '#e5e5e5',
        },
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.label, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
        {label}
      </Text>
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: getStatusColor() }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
            {unit}
          </Text>
        )}
      </View>
      {subtitle && (
        <Text style={[styles.subtitle, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    minWidth: 100,
  },
  iconContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: '700',
  },
  unit: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 8,
  },
});

