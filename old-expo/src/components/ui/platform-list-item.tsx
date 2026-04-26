/**
 * PlatformListItem Component
 * Uses React Native Paper List.Item on Android/Web, native styling on iOS
 */

import { useTheme } from '@/src/providers/theme-provider';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { List, useTheme as usePaperTheme } from 'react-native-paper';

interface PlatformListItemProps {
  title: string;
  description?: string;
  left?: React.ReactNode | (() => React.ReactNode);
  right?: React.ReactNode | (() => React.ReactNode);
  onPress?: () => void;
  style?: ViewStyle;
  titleStyle?: object;
  descriptionStyle?: object;
  leftIcon?: string;
  rightIcon?: string;
  rightText?: string;
  statusDot?: string;
}

export function PlatformListItem({
  title,
  description,
  left,
  right,
  onPress,
  style,
  titleStyle,
  descriptionStyle,
  leftIcon,
  rightIcon,
  rightText,
  statusDot,
}: PlatformListItemProps) {
  const { isDark } = useTheme();
  const paperTheme = usePaperTheme();

  // iOS uses native-style list items
  if (Platform.OS === 'ios') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        style={[styles.iosListItem, style]}
        activeOpacity={onPress ? 0.7 : 1}
      >
        {statusDot && (
          <View style={[styles.statusDot, { backgroundColor: statusDot }]} />
        )}
        {typeof left === 'function' ? left() : left}
        <View style={styles.iosListItemContent}>
          <Text
            style={[
              styles.iosListItemTitle,
              { color: isDark ? '#ffffff' : '#000000' },
              titleStyle,
            ]}
          >
            {title}
          </Text>
          {description && (
            <Text
              style={[
                styles.iosListItemDescription,
                { color: isDark ? '#8e8e93' : '#6e6e73' },
                descriptionStyle,
              ]}
              numberOfLines={2}
            >
              {description}
            </Text>
          )}
        </View>
        {rightText && (
          <Text style={[styles.iosRightText, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
            {rightText}
          </Text>
        )}
        {typeof right === 'function' ? right() : right}
        {onPress && !right && !rightText && (
          <Text style={[styles.iosChevron, { color: isDark ? '#48484a' : '#c7c7cc' }]}>›</Text>
        )}
      </TouchableOpacity>
    );
  }

  // Android/Web uses React Native Paper
  const renderLeft = () => {
    if (statusDot) {
      return () => <View style={[styles.statusDot, { backgroundColor: statusDot, marginRight: 12 }]} />;
    }
    if (leftIcon) {
      return (props: any) => <List.Icon {...props} icon={leftIcon} />;
    }
    if (typeof left === 'function') {
      return left as () => React.ReactNode;
    }
    return left ? () => left : undefined;
  };

  const renderRight = () => {
    if (rightText) {
      return () => (
        <Text style={[styles.paperRightText, { color: paperTheme.colors.onSurfaceVariant }]}>
          {rightText}
        </Text>
      );
    }
    if (rightIcon) {
      return (props: any) => <List.Icon {...props} icon={rightIcon} />;
    }
    if (typeof right === 'function') {
      return right as () => React.ReactNode;
    }
    return right ? () => right : undefined;
  };

  return (
    <List.Item
      title={title}
      description={description}
      onPress={onPress}
      style={[styles.paperListItem, style]}
      titleStyle={[styles.paperListItemTitle, titleStyle]}
      descriptionStyle={[styles.paperListItemDescription, descriptionStyle]}
      left={renderLeft()}
      right={renderRight()}
    />
  );
}

const styles = StyleSheet.create({
  iosListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  iosListItemContent: {
    flex: 1,
    marginRight: 8,
  },
  iosListItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  iosListItemDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  iosRightText: {
    fontSize: 15,
    marginRight: 4,
  },
  iosChevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  paperListItem: {
    paddingVertical: 4,
  },
  paperListItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  paperListItemDescription: {
    fontSize: 14,
  },
  paperRightText: {
    fontSize: 14,
    alignSelf: 'center',
    marginRight: 8,
  },
});

