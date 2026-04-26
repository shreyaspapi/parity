import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingScreen } from '@/src/components/ui/loading-screen';
import { ApolloProvider } from '@/src/providers/apollo-provider';
import { AuthProvider, useAuth } from '@/src/providers/auth-provider';
import { LocalizationProvider } from '@/src/providers/localization-provider';
import { ThemeProvider, useTheme } from '@/src/providers/theme-provider';
import { LoginScreen } from '@/src/screens/login-screen';


export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { isDark } = useTheme();
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Loading..." />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        <LoginScreen onSuccess={checkAuth} />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    );
  }

  // Show main app navigation
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="servers" options={{ title: 'Servers' }} />
        <Stack.Screen
          name="add-server"
          options={{ title: 'Add Server', presentation: 'modal' }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocalizationProvider>
        <ThemeProvider>
          <AuthProvider>
            <ApolloProvider>
              <RootNavigator />
            </ApolloProvider>
          </AuthProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </SafeAreaProvider>
  );
}
