import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Conditionally import native tabs only on iOS
let NativeTabs: any;
let Icon: any;
let Label: any;

if (Platform.OS === 'ios') {
  const nativeTabsModule = require('expo-router/unstable-native-tabs');
  NativeTabs = nativeTabsModule.NativeTabs;
  Icon = nativeTabsModule.Icon;
  Label = nativeTabsModule.Label;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  if (Platform.OS === 'ios' && NativeTabs) {
    // Use native system tabs with Liquid Glass design on iOS
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf="house.fill" />
          <Label>Dashboard</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="docker">
          <Icon sf="shippingbox.fill" />
          <Label>Docker</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="vms">
          <Icon sf="desktopcomputer" />
          <Label>VMs</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="notifications">
          <Icon sf="bell.badge.fill" />
          <Label>Notifications</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <Icon sf="gearshape.fill" />
          <Label>Settings</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  // Keep existing JavaScript tabs for Android and other platforms
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="docker"
        options={{
          title: 'Docker',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="shippingbox.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vms"
        options={{
          title: 'VMs',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="desktopcomputer" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bell.badge.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
