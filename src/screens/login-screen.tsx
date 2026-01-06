/**
 * Login Screen
 * Handles user authentication with Unraid server
 */

import { AlertDialog } from '@/src/components/ui/alert-dialog';
import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { authService } from '@/src/services/auth.service';
import { storageService } from '@/src/services/storage.service';
import type { UnraidCredentials } from '@/src/types/unraid.types';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button as PaperButton,
  Divider as PaperDivider,
  Text as PaperText,
  TextInput as PaperTextInput,
  SegmentedButtons,
  useTheme as usePaperTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Conditionally import native SwiftUI components only on iOS
let UiForm: any;
let UiHost: any;
let UiSection: any;
let UiTextField: any;
let UiSecureField: any;
let UiPicker: any;

if (Platform.OS === 'ios') {
  const swiftUIModule = require('@expo/ui/swift-ui');
  UiForm = swiftUIModule.Form;
  UiHost = swiftUIModule.Host;
  UiSection = swiftUIModule.Section;
  UiTextField = swiftUIModule.TextField;
  UiSecureField = swiftUIModule.SecureField;
  UiPicker = swiftUIModule.Picker;
}

interface LoginScreenProps {
  onSuccess: () => void;
}

// Protocol options
const PROTOCOL_OPTIONS = [
  { label: 'No SSL', value: 'http', prefix: 'http://' },
  { label: 'SSL', value: 'https', prefix: 'https://' },
  { label: 'Self-Signed', value: 'https-selfsigned', prefix: 'https://' },
];

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [serverIP, setServerIP] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [protocolIndex, setProtocolIndex] = useState(0); // Default to HTTP
  const [loading, setLoading] = useState(false);
  const [showDemoAlert, setShowDemoAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { isDark } = useTheme();
  const { t } = useLocalization();
  const paperTheme = usePaperTheme();

  const validateInputs = (): boolean => {
    if (!serverIP.trim()) {
      Alert.alert(t('common.error'), t('login.errorNoServerIP'));
      return false;
    }

    if (!apiKey.trim()) {
      Alert.alert(t('common.error'), t('login.errorNoApiKey'));
      return false;
    }

    return true;
  };

  // Build the full server URL with protocol and /graphql endpoint
  const buildServerUrl = (ip: string): string => {
    let cleanIP = ip.trim()
      .replace(/^https?:\/\//, '') // Remove any existing protocol
      .replace(/\/+$/, ''); // Remove trailing slashes
    
    // Remove /graphql if user added it (we'll add it back)
    cleanIP = cleanIP.replace(/\/graphql\/?$/i, '');
    
    const protocol = PROTOCOL_OPTIONS[protocolIndex];
    return `${protocol.prefix}${cleanIP}/graphql`;
  };

  const handleLogin = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const fullServerUrl = buildServerUrl(serverIP);
      const credentials: UnraidCredentials = {
        serverIP: fullServerUrl,
        apiKey: apiKey.trim(),
      };

      const result = await authService.login(credentials);

      if (result.success) {
        // Create a server entry for first-time login
        const serverId = 'srv_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
        const serverName = serverIP.trim()
          .replace(/^https?:\/\//, '')
          .replace(/\/.*$/, '')
          .replace(/:.*$/, '') || 'My Unraid Server';
        
        // Add to server list and set as active
        await storageService.addServer({
          id: serverId,
          name: serverName,
          serverIP: fullServerUrl,
          apiKey: apiKey.trim(),
        }, true);
        
        // Trigger Apollo Client recreation by calling onSuccess
        // The ApolloProvider will recreate the client with new credentials
        onSuccess();
      } else {
        Alert.alert(t('login.connectionFailed'), result.error || t('login.connectionFailedMessage'));
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    if (Platform.OS === 'web') {
      setShowDemoAlert(true);
    } else {
      Alert.alert(
        t('login.demoModeTitle'),
        t('login.demoModeMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('login.demoModeButton'),
            onPress: async () => {
              setLoading(true);
              try {
                console.log('Login: Enabling demo mode...');
                // Enable demo mode
                await storageService.setDemoMode(true);
                console.log('Login: Demo mode enabled, triggering auth check...');
                
                // Trigger app reload with demo data
                onSuccess();
                console.log('Login: Auth check triggered');
              } catch (error: any) {
                console.error('Login: Failed to enable demo mode:', error);
                Alert.alert(t('common.error'), t('login.demoModeError'));
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    }
  };

  if (Platform.OS !== 'ios') {
    return (
      <KeyboardAvoidingView
        behavior="height"
        style={[
          styles.container,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <PaperText variant="headlineMedium" style={{ color: paperTheme.colors.onBackground, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
              {t('login.title')}
            </PaperText>
            <PaperText variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant, textAlign: 'center', maxWidth: 300 }}>
              {t('login.subtitle')}
            </PaperText>
          </View>

          <View style={styles.form}>
            <PaperText variant="labelLarge" style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 8 }}>
              Connection Type
            </PaperText>
            <SegmentedButtons
              value={PROTOCOL_OPTIONS[protocolIndex].value}
              onValueChange={(value) => {
                const index = PROTOCOL_OPTIONS.findIndex(p => p.value === value);
                if (index !== -1) setProtocolIndex(index);
              }}
              buttons={[
                { value: 'http', label: 'No SSL' },
                { value: 'https', label: 'SSL' },
                { value: 'https', label: 'Self-Signed' },
              ]}
              style={{ marginBottom: 16 }}
            />

            <PaperTextInput
              mode="outlined"
              label={t('login.serverIP')}
              placeholder="192.168.1.x:PORT or tower.local"
              value={serverIP}
              onChangeText={setServerIP}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={{ marginBottom: 8, backgroundColor: paperTheme.colors.surface }}
              left={<PaperTextInput.Icon icon="server" />}
            />
            <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 16, marginLeft: 4 }}>
              {t('login.serverIPHint')}
            </PaperText>

            <PaperTextInput
              mode="outlined"
              label={t('login.apiKey')}
              placeholder="••••••••••••••••"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={{ marginBottom: 8, backgroundColor: paperTheme.colors.surface }}
              left={<PaperTextInput.Icon icon="key" />}
            />
            <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 24, marginLeft: 4 }}>
              {t('login.apiKeyHint')}
            </PaperText>

            <PaperButton
              mode="contained"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={{ borderRadius: 8, paddingVertical: 6 }}
              labelStyle={{ fontSize: 16, fontWeight: '600' }}
            >
              {t('login.connect')}
            </PaperButton>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 32 }}>
               <PaperDivider style={{ flex: 1 }} />
               <PaperText variant="labelMedium" style={{ marginHorizontal: 16, color: paperTheme.colors.onSurfaceVariant }}>
                 {t('login.or')}
               </PaperText>
               <PaperDivider style={{ flex: 1 }} />
            </View>

            <PaperButton
              mode="outlined"
              onPress={handleDemoMode}
              style={{ borderRadius: 8, borderColor: paperTheme.colors.outline }}
              labelStyle={{ color: paperTheme.colors.primary }}
            >
              {t('login.tryDemo')}
            </PaperButton>
          </View>

           <View style={styles.footer}>
              <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant, textAlign: 'center', opacity: 0.7 }}>
                {t('login.footer')}
              </PaperText>
           </View>
        </View>

        {Platform.OS === 'web' && (
          <AlertDialog
            visible={showDemoAlert}
            title={t('login.demoModeTitle')}
            message={t('login.demoModeMessage')}
            buttons={[
              { text: t('common.cancel'), style: 'cancel', onPress: () => setShowDemoAlert(false) },
              {
                text: t('login.demoModeButton'),
                style: 'default',
                onPress: async () => {
                  setLoading(true);
                  try {
                    console.log('Login: Enabling demo mode...');
                    // Enable demo mode
                    await storageService.setDemoMode(true);
                    console.log('Login: Demo mode enabled, triggering auth check...');
                    
                    // Trigger app reload with demo data
                    onSuccess();
                    console.log('Login: Auth check triggered');
                  } catch (error: any) {
                    console.error('Login: Failed to enable demo mode:', error);
                    setShowDemoAlert(false);
                    setErrorMessage(error?.message || t('login.demoModeError'));
                    setShowErrorAlert(true);
                  } finally {
                    setLoading(false);
                  }
                }
              }
            ]}
            onDismiss={() => setShowDemoAlert(false)}
          />
        )}

        {Platform.OS === 'web' && (
          <AlertDialog
            visible={showErrorAlert}
            title={t('common.error')}
            message={errorMessage}
            buttons={[
              { text: t('common.ok') || 'OK', style: 'default', onPress: () => setShowErrorAlert(false) }
            ]}
            onDismiss={() => setShowErrorAlert(false)}
          />
        )}
      </KeyboardAvoidingView>
    );
  }

  // iOS: Native SwiftUI UI
  if (Platform.OS === 'ios' && UiHost) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f2f2f7' }} edges={['top', 'bottom']}>
        <ScrollView 
          style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f2f2f7' }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with logo */}
          <View style={styles.iosHeader}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.iosLogo}
              contentFit="contain"
            />
            <Text style={[styles.iosTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
              {t('login.title')}
            </Text>
            <Text style={[styles.iosSubtitle, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
              {t('login.subtitle')}
            </Text>
          </View>

          {/* Connection Type Picker - outside form for clean look */}
          <View style={styles.iosPickerContainer}>
            <Text style={[styles.iosPickerLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
              CONNECTION TYPE
            </Text>
            <UiHost style={{ height: 44 }} colorScheme={isDark ? 'dark' : 'light'}>
              <UiPicker
                options={PROTOCOL_OPTIONS.map(p => p.label)}
                selectedIndex={protocolIndex}
                onOptionSelected={(e: { nativeEvent: { index: number } }) => setProtocolIndex(e.nativeEvent.index)}
                variant="segmented"
              />
            </UiHost>
            <Text style={[styles.iosPickerHint, { color: isDark ? '#48484a' : '#8e8e93' }]}>
              Choose how to connect to your Unraid server
            </Text>
          </View>

          {/* SwiftUI Form - only for input fields */}
          <View style={{ minHeight: 280 }}>
            <UiHost style={{ flex: 1 }} colorScheme={isDark ? 'dark' : 'light'}>
              <UiForm>
                <UiSection title={t('login.serverIP')} footer={t('login.serverIPHint')}>
                  <UiTextField
                    placeholder="192.168.1.x:PORT or tower.local"
                    defaultValue={serverIP}
                    onChangeText={setServerIP}
                    keyboardType="url"
                    autocorrection={false}
                  />
                </UiSection>

                <UiSection title={t('login.apiKey')} footer={t('login.apiKeyHint')}>
                  <UiSecureField
                    placeholder="••••••••••••••••"
                    defaultValue={apiKey}
                    onChangeText={setApiKey}
                  />
                </UiSection>
              </UiForm>
            </UiHost>
          </View>

          {/* Buttons - outside form, no card background */}
          <View style={styles.iosButtonsContainer}>
            <TouchableOpacity
              style={[
                styles.iosConnectButton,
                { backgroundColor: loading ? '#48484a' : '#007aff' },
              ]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.iosConnectButtonText}>{t('login.connect')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.iosDividerContainer}>
              <View style={[styles.iosDividerLine, { backgroundColor: isDark ? '#38383a' : '#c7c7cc' }]} />
              <Text style={[styles.iosDividerText, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                {t('login.or')}
              </Text>
              <View style={[styles.iosDividerLine, { backgroundColor: isDark ? '#38383a' : '#c7c7cc' }]} />
            </View>

            <TouchableOpacity
              style={[
                styles.iosDemoButton,
                {
                  borderColor: isDark ? '#48484a' : '#007aff',
                },
              ]}
              onPress={handleDemoMode}
              activeOpacity={0.8}
            >
              <Text style={[styles.iosDemoButtonText, { color: '#007aff' }]}>
                {t('login.tryDemo')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.iosFooter}>
            <Text style={[styles.iosFooterText, { color: isDark ? '#48484a' : '#8e8e93' }]}>
              {t('login.footer')}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Fallback for non-iOS (shouldn't reach here due to earlier check, but just in case)
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[
        styles.container,
        { backgroundColor: isDark ? '#000000' : '#f2f2f7' },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>
            {t('login.title')}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
            {t('login.subtitle')}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
              {t('login.serverIP')}
            </Text>
            <TextInput
              placeholder="http://192.168.1.x"
              placeholderTextColor={isDark ? '#48484a' : '#c7c7cc'}
              value={serverIP}
              onChangeText={setServerIP}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: isDark ? '#38383a' : '#e5e5ea',
                },
              ]}
            />
            <Text style={[styles.hint, { color: isDark ? '#48484a' : '#8e8e93' }]}>
              {t('login.serverIPHint')}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
              {t('login.apiKey')}
            </Text>
            <TextInput
              placeholder="••••••••••••••••"
              placeholderTextColor={isDark ? '#48484a' : '#c7c7cc'}
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                  color: isDark ? '#ffffff' : '#000000',
                  borderColor: isDark ? '#38383a' : '#e5e5ea',
                },
              ]}
            />
            <Text style={[styles.hint, { color: isDark ? '#48484a' : '#8e8e93' }]}>
              {t('login.apiKeyHint')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: loading ? '#48484a' : '#007aff' },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{t('login.connect')}</Text>
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: isDark ? '#38383a' : '#c7c7cc' }]}>
            <Text style={[styles.dividerText, { backgroundColor: isDark ? '#000000' : '#f2f2f7', color: isDark ? '#8e8e93' : '#6e6e73' }]}>
              {t('login.or')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.demoButton,
              {
                backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                borderColor: isDark ? '#38383a' : '#c7c7cc',
              },
            ]}
            onPress={handleDemoMode}
          >
            <Text style={[styles.demoButtonText, { color: isDark ? '#ffffff' : '#007aff' }]}>
              {t('login.tryDemo')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: isDark ? '#48484a' : '#8e8e93' }]}>
            {t('login.footer')}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
    borderRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: '80%',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    marginTop: 6,
  },
  button: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 32,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
    position: 'absolute',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
  // iOS Native SwiftUI styles
  iosHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  iosLogo: {
    width: 88,
    height: 88,
    marginBottom: 20,
    borderRadius: 20,
  },
  iosTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  iosSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  iosPickerContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  iosPickerLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  iosPickerHint: {
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
  iosButtonsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  iosConnectButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iosConnectButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  iosDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    paddingHorizontal: 8,
  },
  iosDividerLine: {
    flex: 1,
    height: 1,
  },
  iosDividerText: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iosDemoButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iosDemoButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  iosFooter: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginTop: 'auto',
  },
  iosFooterText: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});

