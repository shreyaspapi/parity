/**
 * Time Range Selector Component
 * UniFi-style time range buttons (1h, 1D, 1W, 1M)
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type TimeRange = '1h' | '1D' | '1W' | '1M';

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
  ranges?: TimeRange[];
}

export function TimeRangeSelector({
  selected,
  onSelect,
  ranges = ['1h', '1D', '1W', '1M'],
}: TimeRangeSelectorProps) {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      {ranges.map((range) => (
        <TouchableOpacity
          key={range}
          style={[
            styles.button,
            {
              backgroundColor: selected === range 
                ? (isDark ? '#1c1c1e' : '#e5e5ea')
                : 'transparent',
            },
          ]}
          onPress={() => onSelect(range)}
        >
          <Text
            style={[
              styles.buttonText,
              {
                color: selected === range
                  ? (isDark ? '#ffffff' : '#000000')
                  : (isDark ? '#8e8e93' : '#6e6e73'),
                fontWeight: selected === range ? '600' : '400',
              },
            ]}
          >
            {range}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 13,
  },
});

