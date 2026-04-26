/**
 * Line Chart Component
 * A simple line chart for showing time-series data
 * Built with react-native-svg
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Path, Circle, Text as SvgText } from 'react-native-svg';

export interface ChartDataPoint {
  value: number;
  timestamp?: number;
}

interface LineChartProps {
  data: ChartDataPoint[];
  width?: number;
  height?: number;
  color?: string;
  label?: string;
  showDots?: boolean;
  maxValue?: number;
  minValue?: number;
}

export function LineChart({
  data,
  width = 300,
  height = 120,
  color,
  label,
  showDots = false,
  maxValue,
  minValue = 0,
}: LineChartProps) {
  const { isDark } = useTheme();

  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={[styles.noDataText, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
          No data available
        </Text>
      </View>
    );
  }

  // Calculate chart dimensions
  const padding = { top: 20, right: 10, bottom: 20, left: 35 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Get min and max values from data
  const values = data.map(d => d.value);
  const dataMin = minValue ?? Math.min(...values);
  const dataMax = maxValue ?? Math.max(...values, 100); // Default max to 100 for percentages

  // Calculate points
  const stepX = chartWidth / Math.max(data.length - 1, 1);
  const points = data.map((point, index) => {
    const x = padding.left + index * stepX;
    const normalizedValue = ((point.value - dataMin) / (dataMax - dataMin)) || 0;
    const y = padding.top + chartHeight - normalizedValue * chartHeight;
    return { x, y, value: point.value };
  });

  // Create path for line
  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x},${point.y}`;
    }
    return `${acc} L ${point.x},${point.y}`;
  }, '');

  // Create path for gradient fill
  const fillPathData = `${pathData} L ${points[points.length - 1].x},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;

  const chartColor = color || (isDark ? '#007aff' : '#007aff');
  const gridColor = isDark ? '#2c2c2e' : '#e5e5ea';
  const textColor = isDark ? '#8e8e93' : '#6e6e73';
  const axisColor = isDark ? '#48484a' : '#c7c7cc';

  return (
    <View style={[styles.container, { width, height }]}>
      {label && (
        <Text style={[styles.label, { color: isDark ? '#ffffff' : '#000000' }]}>
          {label}
        </Text>
      )}
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((factor, index) => {
          const y = padding.top + chartHeight * (1 - factor);
          return (
            <Line
              key={index}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke={gridColor}
              strokeWidth="1"
              opacity={0.3}
            />
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.5, 1].map((factor, index) => {
          const y = padding.top + chartHeight * (1 - factor);
          const value = Math.round(dataMin + (dataMax - dataMin) * factor);
          return (
            <SvgText
              key={index}
              x={padding.left - 8}
              y={y + 4}
              fontSize="10"
              fill={textColor}
              textAnchor="end"
            >
              {value}
            </SvgText>
          );
        })}

        {/* Gradient fill under line */}
        <Path
          d={fillPathData}
          fill={chartColor}
          fillOpacity={0.1}
        />

        {/* Line */}
        <Path
          d={pathData}
          stroke={chartColor}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {showDots && points.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="3"
            fill={chartColor}
          />
        ))}

        {/* Last value highlight */}
        {points.length > 0 && (
          <>
            <Circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="4"
              fill={chartColor}
              opacity={0.3}
            />
            <Circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="2.5"
              fill={chartColor}
            />
          </>
        )}

        {/* Axes */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke={axisColor}
          strokeWidth="1"
        />
        <Line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke={axisColor}
          strokeWidth="1"
        />
      </Svg>
      
      {/* Current value */}
      {points.length > 0 && (
        <Text style={[styles.currentValue, { color: chartColor }]}>
          {points[points.length - 1].value.toFixed(1)}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  noDataText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
  },
  currentValue: {
    position: 'absolute',
    top: 24,
    right: 12,
    fontSize: 18,
    fontWeight: '700',
  },
});

