/**
 * Settings Screen
 * App settings and account management with dark mode toggle
 */

import { AlertDialog } from '@/src/components/ui/alert-dialog';
import { AppConfig } from '@/src/config/app.config';
import { usePollingInterval } from '@/src/hooks/usePollingInterval';
import { useAuth } from '@/src/providers/auth-provider';
import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { useApolloClient } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Divider,
  List,
  Button as PaperButton,
  Dialog as PaperDialog,
  Switch as PaperSwitch,
  Text as PaperText,
  Portal,
  RadioButton,
  Surface,
  useTheme as usePaperTheme
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// Conditionally import native SwiftUI components only on iOS
let UiButton: any;
let UiForm: any;
let UiHost: any;
let UiHStack: any;
let UiImage: any;
let UiSection: any;
let UiSpacer: any;
let UiSwitch: any;
let UiText: any;

if (Platform.OS === 'ios') {
  const swiftUIModule = require('@expo/ui/swift-ui');
  UiButton = swiftUIModule.Button;
  UiForm = swiftUIModule.Form;
  UiHost = swiftUIModule.Host;
  UiHStack = swiftUIModule.HStack;
  UiImage = swiftUIModule.Image;
  UiSection = swiftUIModule.Section;
  UiSpacer = swiftUIModule.Spacer;
  UiSwitch = swiftUIModule.Switch;
  UiText = swiftUIModule.Text;
}

function useAdaptiveBottomTabPadding() {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'ios') {
    return insets.bottom;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useBottomTabBarHeight } = require('@react-navigation/bottom-tabs');
    const height: number = useBottomTabBarHeight();
    return height + insets.bottom;
  } catch {
    return insets.bottom;
  }
}

export function SettingsScreen() {
  const { theme, isDark, setTheme } = useTheme();
  const { logout, credentials, activeServerName, checkAuth } = useAuth();
  const { locale, setLocale, availableLocales } = useLocalization();
  const { t } = useLocalization();
  const paperTheme = usePaperTheme();
  const apolloClient = useApolloClient();
  const { pollingInterval, updatePollingInterval } = usePollingInterval();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPollingModal, setShowPollingModal] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showLogoutErrorAlert, setShowLogoutErrorAlert] = useState(false);
  const [logoutErrorMessage, setLogoutErrorMessage] = useState('');
  const bottomTabPadding = useAdaptiveBottomTabPadding();
  const router = useRouter();

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apolloClient.clearStore();
      await logout();
      await checkAuth();
    } catch (error: any) {
      console.error('Logout error:', error);
      if (Platform.OS === 'web' || Platform.OS === 'android') {
        setLogoutErrorMessage(error?.message || t('settings.logoutError'));
        setShowLogoutErrorAlert(true);
      } else {
        Alert.alert(t('common.error'), `${t('settings.logoutError')}: ${error?.message || t('errors.generic')}`);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web' || Platform.OS === 'android') {
      setShowLogoutAlert(true);
      return;
    }
    Alert.alert(t('settings.logout'), t('settings.logoutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logout'), style: 'destructive', onPress: performLogout },
    ]);
  };

  const handleDarkModeToggle = async (value: boolean) => {
    await setTheme(value ? 'dark' : 'light');
  };

  const handleAutoModeToggle = async (value: boolean) => {
    await setTheme(value ? 'auto' : isDark ? 'dark' : 'light');
  };

  const handlePollingIntervalChange = () => {
    if (Platform.OS === 'ios') {
      const options = AppConfig.graphql.pollingIntervalOptions;
      Alert.alert(
        t('settings.pollingFrequency') || 'Polling Frequency',
        t('settings.pollingDescription') || 'How often should the app refresh data automatically?',
        [
          ...options.map((option) => ({
            text: option.label,
            onPress: async () => {
              try {
                await updatePollingInterval(option.value);
                Alert.alert(t('common.ok'), `${t('settings.pollingUpdated')} ${option.label.toLowerCase()}`);
              } catch (error: any) {
                Alert.alert(t('common.error'), error.message || t('settings.updateError'));
              }
            },
          })),
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    } else {
      setShowPollingModal(true);
    }
  };

  const getPollingIntervalLabel = () => {
    const currentValue = pollingInterval || AppConfig.graphql.defaultPollInterval;
    const option = AppConfig.graphql.pollingIntervalOptions.find((opt) => opt.value === currentValue);
    return option?.label || '5 seconds';
  };

  const handleLanguageChange = () => {
    setShowLanguageModal(true);
  };

  const handleLanguageSelect = async (code: string, name: string) => {
    try {
      await setLocale(code as any);
      setShowLanguageModal(false);
      if (Platform.OS === 'ios') {
        Alert.alert(t('common.ok'), `${t('settings.languageChanged')} ${name}`);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('errors.generic'));
    }
  };

  const getCurrentLanguageName = () => {
    return availableLocales[locale] || 'English';
  };

  // iOS Language Modal
  const iosLanguageModal = (
    <Modal
      visible={showLanguageModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              {t('settings.selectLanguage')}
            </Text>
            <TouchableOpacity onPress={() => setShowLanguageModal(false)} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: isDark ? '#0a84ff' : '#007aff' }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.languageList}>
            {Object.entries(availableLocales).map(([code, name]) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.languageOption,
                  {
                    backgroundColor: code === locale ? (isDark ? '#2c2c2e' : '#f2f2f7') : 'transparent',
                    borderBottomColor: isDark ? '#2c2c2e' : '#e5e5ea',
                  },
                ]}
                onPress={() => handleLanguageSelect(code, name)}
              >
                <Text style={[styles.languageText, { color: isDark ? '#ffffff' : '#000000', fontWeight: code === locale ? '600' : '400' }]}>
                  {name}
                </Text>
                {code === locale && <Text style={[styles.checkmark, { color: isDark ? '#0a84ff' : '#007aff' }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Paper Language Dialog
  const paperLanguageDialog = (
    <Portal>
      <PaperDialog visible={showLanguageModal} onDismiss={() => setShowLanguageModal(false)}>
        <PaperDialog.Title>{t('settings.selectLanguage')}</PaperDialog.Title>
        <PaperDialog.ScrollArea style={{ maxHeight: 400 }}>
          <RadioButton.Group onValueChange={(value) => handleLanguageSelect(value, availableLocales[value as keyof typeof availableLocales] || value)} value={locale}>
            {Object.entries(availableLocales).map(([code, name]) => (
              <RadioButton.Item key={code} label={name} value={code} />
            ))}
          </RadioButton.Group>
        </PaperDialog.ScrollArea>
        <PaperDialog.Actions>
          <PaperButton onPress={() => setShowLanguageModal(false)}>{t('common.cancel')}</PaperButton>
        </PaperDialog.Actions>
      </PaperDialog>
    </Portal>
  );

  // Paper Polling Dialog
  const paperPollingDialog = (
    <Portal>
      <PaperDialog visible={showPollingModal} onDismiss={() => setShowPollingModal(false)}>
        <PaperDialog.Title>{t('settings.pollingFrequency')}</PaperDialog.Title>
        <PaperDialog.Content>
          <PaperText variant="bodyMedium" style={{ marginBottom: 16, color: paperTheme.colors.onSurfaceVariant }}>
            {t('settings.pollingDescription')}
          </PaperText>
          <RadioButton.Group
            onValueChange={async (value) => {
              await updatePollingInterval(parseInt(value, 10));
              setShowPollingModal(false);
            }}
            value={String(pollingInterval || AppConfig.graphql.defaultPollInterval)}
          >
            {AppConfig.graphql.pollingIntervalOptions.map((option) => (
              <RadioButton.Item key={option.value} label={option.label} value={String(option.value)} />
            ))}
          </RadioButton.Group>
        </PaperDialog.Content>
        <PaperDialog.Actions>
          <PaperButton onPress={() => setShowPollingModal(false)}>{t('common.cancel')}</PaperButton>
        </PaperDialog.Actions>
      </PaperDialog>
    </Portal>
  );

  // Paper Logout Dialog
  const paperLogoutDialog = (
    <Portal>
      <PaperDialog visible={showLogoutAlert} onDismiss={() => setShowLogoutAlert(false)}>
        <PaperDialog.Title>{t('settings.logout')}</PaperDialog.Title>
        <PaperDialog.Content>
          <PaperText variant="bodyMedium">{t('settings.logoutConfirm')}</PaperText>
        </PaperDialog.Content>
        <PaperDialog.Actions>
          <PaperButton onPress={() => setShowLogoutAlert(false)}>{t('common.cancel')}</PaperButton>
          <PaperButton
            textColor="#ff3b30"
            onPress={async () => {
              setShowLogoutAlert(false);
              await performLogout();
            }}
          >
            {t('settings.logout')}
          </PaperButton>
        </PaperDialog.Actions>
      </PaperDialog>
    </Portal>
  );

  // iOS SwiftUI Settings
  if (Platform.OS === 'ios' && UiHost) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f2f2f7' }]} edges={['top']}>
        <UiHost style={{ flex: 1 }} colorScheme={isDark ? 'dark' : 'light'}>
          <UiForm>
            <UiSection title="Appearance">
              <UiHStack spacing={8}>
                <UiImage systemName="aqi.medium" />
                <UiText size={17}>{t('settings.automatic')}</UiText>
                <UiSpacer />
                <UiSwitch value={theme === 'auto'} onValueChange={handleAutoModeToggle} />
              </UiHStack>
              {theme !== 'auto' && (
                <UiHStack spacing={8}>
                  <UiImage systemName="moon.fill" />
                  <UiText size={17}>{t('settings.darkMode')}</UiText>
                  <UiSpacer />
                  <UiSwitch value={theme === 'dark'} onValueChange={handleDarkModeToggle} />
                </UiHStack>
              )}
            </UiSection>

            <UiSection title={t('settings.language') || 'Language'}>
              <UiButton onPress={handleLanguageChange}>
                <UiHStack spacing={8}>
                  <UiImage systemName="globe" />
                  <UiText size={17}>{t('settings.language') || 'Language'}</UiText>
                  <UiSpacer />
                  <UiText size={17}>{getCurrentLanguageName()}</UiText>
                  <UiImage systemName="chevron.right" />
                </UiHStack>
              </UiButton>
            </UiSection>

            <UiSection title="Management">
              <UiButton onPress={() => router.push('/servers')}>
                <UiHStack spacing={8}>
                  <UiImage systemName="server.rack" />
                  <UiText size={17}>Servers</UiText>
                  <UiSpacer />
                  <UiImage systemName="chevron.right" />
                </UiHStack>
              </UiButton>
            </UiSection>

            <UiSection title="Data Refresh">
              <UiButton onPress={handlePollingIntervalChange}>
                <UiHStack spacing={8}>
                  <UiImage systemName="speedometer" />
                  <UiText size={17}>Polling Frequency</UiText>
                  <UiSpacer />
                  <UiText size={17}>{getPollingIntervalLabel()}</UiText>
                </UiHStack>
              </UiButton>
              <UiHStack spacing={8}>
                <UiImage systemName="arrow.clockwise" />
                <UiText size={17}>Manual Refresh</UiText>
                <UiSpacer />
                <UiText size={17}>Pull to refresh</UiText>
              </UiHStack>
            </UiSection>

            <UiSection title="Server Information">
              <UiHStack spacing={8}>
                <UiImage systemName="server.rack" />
                <UiText size={17}>Active Server</UiText>
                <UiSpacer />
                <UiText size={17}>{activeServerName || 'Not connected'}</UiText>
              </UiHStack>
              <UiHStack spacing={8}>
                <UiImage systemName="network" />
                <UiText size={17}>Server URL</UiText>
                <UiSpacer />
                <UiText size={15}>{credentials?.serverIP || 'N/A'}</UiText>
              </UiHStack>
              <UiHStack spacing={8}>
                <UiImage systemName="checkmark.circle.fill" />
                <UiText size={17}>Connection Status</UiText>
                <UiSpacer />
                <UiText size={17} color="#34c759">Connected</UiText>
              </UiHStack>
              <UiHStack spacing={8}>
                <UiImage systemName="info.circle" />
                <UiText size={17}>Version</UiText>
                <UiSpacer />
                <UiText size={17}>1.0.0</UiText>
              </UiHStack>
              <UiHStack spacing={8}>
                <UiImage systemName="paintbrush.fill" />
                <UiText size={17}>{t('settings.currentTheme')}</UiText>
                <UiSpacer />
                <UiText size={17}>{isDark ? t('settings.dark') : t('settings.light')}</UiText>
              </UiHStack>
            </UiSection>

            <UiSection title={t('settings.actions') || 'Actions'}>
              <UiButton
                onPress={() => {
                  Alert.alert(t('settings.clearCache') || 'Clear Cache', t('settings.clearCacheDescription') || 'This will clear all cached data.', [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('common.delete'),
                      onPress: async () => {
                        await apolloClient.clearStore();
                        Alert.alert(t('common.ok'), t('settings.cacheCleared'));
                      },
                    },
                  ]);
                }}
              >
                <UiHStack spacing={8}>
                  <UiImage systemName="trash" />
                  <UiText size={17}>Clear Cache</UiText>
                  <UiSpacer />
                </UiHStack>
              </UiButton>
              <UiButton onPress={handleLogout} disabled={isLoggingOut}>
                <UiHStack spacing={8}>
                  <UiImage systemName="rectangle.portrait.and.arrow.right" />
                  <UiText size={17}>{isLoggingOut ? 'Logging out...' : 'Logout'}</UiText>
                  <UiSpacer />
                </UiHStack>
              </UiButton>
            </UiSection>
          </UiForm>
        </UiHost>
        {iosLanguageModal}
      </SafeAreaView>
    );
  }

  // Theme-aware colors for better visibility
  const bgColor = isDark ? '#121212' : '#f5f5f5';
  const cardBg = isDark ? '#1c1c1e' : '#ffffff';
  const textPrimary = isDark ? '#ffffff' : '#1a1a1a';
  const textSecondary = isDark ? '#a0a0a0' : '#666666';
  const accentColor = isDark ? '#5eb5ff' : '#0066cc';
  const successColor = isDark ? '#66bb6a' : '#2e7d32';
  const dangerColor = isDark ? '#ef5350' : '#c62828';
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const iconColor = isDark ? '#a0a0a0' : '#666666';

  // Android/Web Material Design 3 Settings
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: bgColor }}
        contentContainerStyle={[styles.content, { paddingBottom: 16 + bottomTabPadding }]}
      >
        <PaperText variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 20, color: textPrimary }}>
          {t('settings.settingsTitle')}
        </PaperText>

        {/* Appearance Section */}
        <Surface style={[styles.section, { backgroundColor: cardBg }]} elevation={0}>
          <PaperText variant="labelLarge" style={[styles.sectionTitle, { color: accentColor }]}>
            {t('settings.appearance')}
          </PaperText>

          <List.Item
            title={t('settings.automatic')}
            titleStyle={{ color: textPrimary }}
            description={t('settings.followSystemTheme')}
            descriptionStyle={{ color: textSecondary }}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" color={iconColor} />}
            right={() => <PaperSwitch value={theme === 'auto'} onValueChange={handleAutoModeToggle} />}
          />

          {theme !== 'auto' && (
            <>
              <Divider style={{ backgroundColor: dividerColor }} />
              <List.Item
                title={t('settings.darkMode')}
                titleStyle={{ color: textPrimary }}
                description={t('settings.useDarkTheme')}
                descriptionStyle={{ color: textSecondary }}
                left={(props) => <List.Icon {...props} icon="weather-night" color={iconColor} />}
                right={() => <PaperSwitch value={theme === 'dark'} onValueChange={handleDarkModeToggle} />}
              />
            </>
          )}
        </Surface>

        {/* Language Section */}
        <Surface style={[styles.section, { backgroundColor: cardBg }]} elevation={0}>
          <PaperText variant="labelLarge" style={[styles.sectionTitle, { color: accentColor }]}>
            {t('settings.language')}
          </PaperText>
          <List.Item
            title={t('settings.language')}
            titleStyle={{ color: textPrimary }}
            description={t('settings.selectLanguage')}
            descriptionStyle={{ color: textSecondary }}
            left={(props) => <List.Icon {...props} icon="translate" color={iconColor} />}
            right={(props) => (
              <View style={styles.listRight}>
                <PaperText variant="bodyMedium" style={{ color: accentColor }}>
                  {getCurrentLanguageName()}
                </PaperText>
                <MaterialCommunityIcons name="chevron-right" size={24} color={iconColor} />
              </View>
            )}
            onPress={handleLanguageChange}
          />
        </Surface>

        {/* Server Management */}
        <Surface style={[styles.section, { backgroundColor: cardBg }]} elevation={0}>
          <PaperText variant="labelLarge" style={[styles.sectionTitle, { color: accentColor }]}>
            Management
          </PaperText>
          <List.Item
            title={t('servers.title')}
            titleStyle={{ color: textPrimary }}
            description={t('settings.manageSavedServers')}
            descriptionStyle={{ color: textSecondary }}
            left={(props) => <List.Icon {...props} icon="server" color={iconColor} />}
            right={(props) => <MaterialCommunityIcons name="chevron-right" size={24} color={iconColor} />}
            onPress={() => router.push('/servers')}
          />
        </Surface>

        {/* Server Information */}
        <Surface style={[styles.section, { backgroundColor: cardBg }]} elevation={0}>
          <PaperText variant="labelLarge" style={[styles.sectionTitle, { color: accentColor }]}>
            {t('settings.serverInformation')}
          </PaperText>
          <List.Item
            title="Active Server"
            titleStyle={{ color: textPrimary }}
            description={activeServerName || t('settings.notConnected')}
            descriptionStyle={{ color: successColor, fontWeight: '500' }}
            left={(props) => <List.Icon {...props} icon="server" color={successColor} />}
          />
          <Divider style={{ backgroundColor: dividerColor }} />
          <List.Item
            title={t('settings.serverIP')}
            titleStyle={{ color: textPrimary }}
            description={credentials?.serverIP || 'N/A'}
            descriptionStyle={{ color: textSecondary }}
            descriptionNumberOfLines={2}
            left={(props) => <List.Icon {...props} icon="ip-network" color={iconColor} />}
          />
          <Divider style={{ backgroundColor: dividerColor }} />
          <List.Item
            title={t('settings.connectionStatus')}
            titleStyle={{ color: textPrimary }}
            left={(props) => <List.Icon {...props} icon="check-circle" color={successColor} />}
            right={() => (
              <PaperText variant="bodyMedium" style={{ color: successColor }}>
                {t('settings.connected')}
              </PaperText>
            )}
          />
        </Surface>

        {/* Data Refresh */}
        <Surface style={[styles.section, { backgroundColor: cardBg }]} elevation={0}>
          <PaperText variant="labelLarge" style={[styles.sectionTitle, { color: accentColor }]}>
            {t('settings.dataRefresh')}
          </PaperText>
          <List.Item
            title={t('settings.pollingFrequency')}
            titleStyle={{ color: textPrimary }}
            description={t('settings.howOftenRefreshData')}
            descriptionStyle={{ color: textSecondary }}
            left={(props) => <List.Icon {...props} icon="clock-fast" color={iconColor} />}
            right={(props) => (
              <View style={styles.listRight}>
                <PaperText variant="bodyMedium" style={{ color: accentColor }}>
                  {getPollingIntervalLabel()}
                </PaperText>
                <MaterialCommunityIcons name="chevron-right" size={24} color={iconColor} />
              </View>
            )}
            onPress={handlePollingIntervalChange}
          />
          <Divider style={{ backgroundColor: dividerColor }} />
          <List.Item
            title={t('settings.manualRefresh')}
            titleStyle={{ color: textPrimary }}
            description={t('settings.pullToRefresh')}
            descriptionStyle={{ color: textSecondary }}
            left={(props) => <List.Icon {...props} icon="refresh" color={iconColor} />}
          />
        </Surface>

        {/* App Information */}
        <Surface style={[styles.section, { backgroundColor: cardBg }]} elevation={0}>
          <PaperText variant="labelLarge" style={[styles.sectionTitle, { color: accentColor }]}>
            {t('settings.appInformation')}
          </PaperText>
          <List.Item
            title={t('settings.version')}
            titleStyle={{ color: textPrimary }}
            left={(props) => <List.Icon {...props} icon="information" color={iconColor} />}
            right={() => <PaperText variant="bodyMedium" style={{ color: textSecondary }}>1.0.0</PaperText>}
          />
          <Divider style={{ backgroundColor: dividerColor }} />
          <List.Item
            title={t('settings.currentTheme')}
            titleStyle={{ color: textPrimary }}
            left={(props) => <List.Icon {...props} icon="palette" color={iconColor} />}
            right={() => (
              <PaperText variant="bodyMedium" style={{ color: textSecondary }}>{isDark ? t('settings.dark') : t('settings.light')}</PaperText>
            )}
          />
        </Surface>

        {/* Actions */}
        <Surface style={[styles.section, { backgroundColor: cardBg }]} elevation={0}>
          <PaperText variant="labelLarge" style={[styles.sectionTitle, { color: accentColor }]}>
            {t('settings.actions') || 'Actions'}
          </PaperText>
          <List.Item
            title={t('settings.clearCache')}
            titleStyle={{ color: textPrimary }}
            description="Clear all cached data"
            descriptionStyle={{ color: textSecondary }}
            left={(props) => <List.Icon {...props} icon="delete-outline" color={iconColor} />}
            onPress={() => {
              Alert.alert(t('settings.clearCache'), t('settings.clearCacheDescription') || 'This will clear all cached data.', [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: 'Clear',
                  onPress: async () => {
                    await apolloClient.clearStore();
                    Alert.alert('Success', t('settings.cacheCleared') || 'Cache cleared successfully');
                  },
                },
              ]);
            }}
          />
          <Divider style={{ backgroundColor: dividerColor }} />
          <List.Item
            title={isLoggingOut ? t('settings.loggingOut') : t('settings.logout')}
            titleStyle={{ color: dangerColor }}
            left={(props) => <List.Icon {...props} icon="logout" color={dangerColor} />}
            onPress={handleLogout}
            disabled={isLoggingOut}
          />
        </Surface>

        {/* Footer */}
        <View style={styles.footer}>
          <PaperText variant="bodySmall" style={{ color: textSecondary, textAlign: 'center' }}>
            {t('settings.unraidMobileApp')}
          </PaperText>
          <PaperText variant="bodySmall" style={{ color: textSecondary, textAlign: 'center' }}>
            {t('settings.builtWith')}
          </PaperText>
        </View>
      </ScrollView>

      {paperLanguageDialog}
      {paperPollingDialog}
      {paperLogoutDialog}

      {Platform.OS === 'web' && (
        <AlertDialog
          visible={showLogoutErrorAlert}
          title={t('common.error') || 'Error'}
          message={logoutErrorMessage}
          buttons={[{ text: t('common.ok') || 'OK', style: 'default', onPress: () => setShowLogoutErrorAlert(false) }]}
          onDismiss={() => setShowLogoutErrorAlert(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 16,
    gap: 4,
  },
  // iOS Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '400',
  },
  languageList: {
    maxHeight: 400,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  languageText: {
    fontSize: 16,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '600',
  },
});
