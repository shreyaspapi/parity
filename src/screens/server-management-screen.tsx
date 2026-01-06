import { Card } from '@/src/components/ui/card';
import { ServerWithActiveStatus, useServerManagement } from '@/src/hooks/useServerManagement';
import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  Chip,
  Divider,
  Button as PaperButton,
  Card as PaperCard,
  Text as PaperText,
  TextInput as PaperTextInput,
  Surface,
  useTheme as usePaperTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Conditionally import native SwiftUI components only on iOS
let UiButton: any;
let UiForm: any;
let UiHost: any;
let UiHStack: any;
let UiImage: any;
let UiSection: any;
let UiSpacer: any;
let UiText: any;
let UiVStack: any;

if (Platform.OS === 'ios') {
  const swiftUIModule = require('@expo/ui/swift-ui');
  UiButton = swiftUIModule.Button;
  UiForm = swiftUIModule.Form;
  UiHost = swiftUIModule.Host;
  UiHStack = swiftUIModule.HStack;
  UiImage = swiftUIModule.Image;
  UiSection = swiftUIModule.Section;
  UiSpacer = swiftUIModule.Spacer;
  UiText = swiftUIModule.Text;
  UiVStack = swiftUIModule.VStack;
}

export function ServerManagementScreen() {
  const { isDark } = useTheme();
  const { t } = useLocalization();
  const paperTheme = usePaperTheme();

  const {
    servers,
    name,
    serverIP,
    apiKey,
    busy,
    connectionError,
    setName,
    setServerIP,
    setApiKey,
    addServer,
    removeServer,
    makeActive,
  } = useServerManagement();

  const handleAddServer = async () => {
    // Add server but don't automatically make it active (unless it's the first)
    await addServer(false);
  };

  const handleRemoveServer = (id: string) => {
    // The removeServer function now handles confirmation internally
    removeServer(id);
  };

  // iOS: Use SwiftUI-based UI for native feel
  if (Platform.OS === 'ios' && UiHost) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f2f2f7' }} edges={['top']}>
        {/* RN Add Server form outside of UiHost to avoid mixing views */}
        <View style={{ padding: 16 }}>
          <Card>
            <Text style={[styles.title, { color: isDark ? '#ffffff' : '#000000' }]}>Add Server</Text>
            <View style={styles.field}>
              <Text style={[styles.label, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDark ? '#ffffff' : '#000000',
                    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                    borderColor: isDark ? '#38383a' : '#c7c7cc',
                  },
                ]}
                placeholder="My Unraid"
                placeholderTextColor={isDark ? '#6e6e73' : '#8e8e93'}
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>Server URL</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDark ? '#ffffff' : '#000000',
                    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                    borderColor: isDark ? '#38383a' : '#c7c7cc',
                  },
                ]}
                placeholder="http://192.168.1.100:3001/graphql"
                placeholderTextColor={isDark ? '#6e6e73' : '#8e8e93'}
                value={serverIP}
                onChangeText={setServerIP}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.field}>
              <Text style={[styles.label, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>API Key</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: isDark ? '#ffffff' : '#000000',
                    backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                    borderColor: isDark ? '#38383a' : '#c7c7cc',
                  },
                ]}
                placeholder="API key"
                placeholderTextColor={isDark ? '#6e6e73' : '#8e8e93'}
                value={apiKey}
                onChangeText={setApiKey}
                autoCapitalize="none"
                secureTextEntry
              />
            </View>
            {connectionError && (
              <Text style={styles.errorText}>{connectionError}</Text>
            )}
            <TouchableOpacity
              style={[styles.primaryBtn, { opacity: busy ? 0.5 : 1 }]}
              disabled={busy}
              onPress={handleAddServer}
            >
              <Text style={styles.primaryBtnText}>{busy ? 'Connecting...' : 'Add Server'}</Text>
            </TouchableOpacity>
          </Card>
        </View>
        {/* SwiftUI list for saved servers */}
        <UiHost style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f2f2f7' }} colorScheme={isDark ? 'dark' : 'light'}>
          <UiForm>
            <UiSection title="Saved Servers">
              {servers.length === 0 ? (
                <UiText size={15}>No saved servers</UiText>
              ) : (
                servers.map((item) => (
                  <UiHStack key={item.id} spacing={8}>
                    {item.isActive && <UiImage systemName="checkmark.circle.fill" />}
                    <UiText size={17} style={{ fontWeight: item.isActive ? '600' : '400' }}>
                      {item.name}
                    </UiText>
                    {item.isActive && (
                      <UiText size={13} color="#34c759">
                        Active
                      </UiText>
                    )}
                    <UiSpacer />
                    {!item.isActive && (
                      <UiButton onPress={() => makeActive(item)}>
                        <UiText size={15} color="#007aff">
                          Connect
                        </UiText>
                      </UiButton>
                    )}
                    <UiButton onPress={() => handleRemoveServer(item.id)}>
                      <UiText size={15} color="#ff3b30">
                        Remove
                      </UiText>
                    </UiButton>
                  </UiHStack>
                ))
              )}
            </UiSection>
          </UiForm>
        </UiHost>
      </SafeAreaView>
    );
  }

  // Android and Web: Material Design 3 UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: paperTheme.colors.background }} edges={['top']}>
      <FlatList
        style={{ flex: 1, backgroundColor: paperTheme.colors.background }}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            <PaperText variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 8 }}>
              {t('servers.title') || 'Servers'}
            </PaperText>
            <PaperText variant="bodyMedium" style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 20 }}>
              {t('servers.description') || 'Manage your saved Unraid servers'}
            </PaperText>

            {/* Add Server Card */}
            <Surface style={styles.addServerCard} elevation={2}>
              <PaperText variant="titleMedium" style={{ fontWeight: '600', marginBottom: 16 }}>
                Add New Server
              </PaperText>

              <PaperTextInput
                mode="outlined"
                label="Server Name"
                placeholder="My Unraid Server"
                value={name}
                onChangeText={setName}
                style={styles.paperInput}
                left={<PaperTextInput.Icon icon="tag" />}
              />

              <PaperTextInput
                mode="outlined"
                label="Server URL"
                placeholder="http://192.168.1.100:3001/graphql"
                value={serverIP}
                onChangeText={setServerIP}
                style={styles.paperInput}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                left={<PaperTextInput.Icon icon="server" />}
              />

              <PaperTextInput
                mode="outlined"
                label="API Key"
                placeholder="Your API key"
                value={apiKey}
                onChangeText={setApiKey}
                style={styles.paperInput}
                autoCapitalize="none"
                secureTextEntry
                left={<PaperTextInput.Icon icon="key" />}
              />

              {connectionError && (
                <PaperText variant="bodySmall" style={{ color: '#ff3b30', marginBottom: 8 }}>
                  {connectionError}
                </PaperText>
              )}

              <PaperButton
                mode="contained"
                onPress={handleAddServer}
                loading={busy}
                disabled={busy}
                style={styles.addButton}
                icon="plus"
              >
                {busy ? 'Connecting...' : 'Add Server'}
              </PaperButton>
            </Surface>

            <PaperText variant="titleMedium" style={{ fontWeight: '600', marginTop: 24, marginBottom: 12 }}>
              Saved Servers ({servers.length})
            </PaperText>
          </View>
        }
        data={servers}
        keyExtractor={(s) => s.id}
        renderItem={({ item }: { item: ServerWithActiveStatus }) => (
          <PaperCard 
            style={[
              styles.serverCard, 
              item.isActive && { borderWidth: 2, borderColor: '#34c759' }
            ]} 
            mode="elevated"
          >
            <PaperCard.Content>
              <View style={styles.serverHeader}>
                <View style={[
                  styles.serverIconContainer,
                  item.isActive && { backgroundColor: '#34c75915' }
                ]}>
                  <MaterialCommunityIcons 
                    name={item.isActive ? 'server-network' : 'server'} 
                    size={28} 
                    color={item.isActive ? '#34c759' : paperTheme.colors.primary} 
                  />
                </View>
                <View style={styles.serverInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <PaperText variant="titleMedium" style={{ fontWeight: '600' }}>
                      {item.name}
                    </PaperText>
                    {item.isActive && (
                      <Chip 
                        mode="flat" 
                        compact 
                        style={{ backgroundColor: '#34c75920' }}
                        textStyle={{ color: '#34c759', fontSize: 11 }}
                      >
                        Active
                      </Chip>
                    )}
                  </View>
                  <PaperText
                    variant="bodySmall"
                    style={{ color: paperTheme.colors.onSurfaceVariant }}
                    numberOfLines={1}
                  >
                    {item.serverIP}
                  </PaperText>
                </View>
              </View>

              <Divider style={{ marginVertical: 12 }} />

              <View style={styles.serverActions}>
                {item.isActive ? (
                  <PaperButton
                    mode="contained"
                    disabled
                    compact
                    icon="check-circle"
                    style={[styles.serverActionButton, { backgroundColor: '#34c759' }]}
                    labelStyle={{ color: '#fff' }}
                  >
                    Connected
                  </PaperButton>
                ) : (
                  <PaperButton
                    mode="contained"
                    onPress={() => makeActive(item)}
                    disabled={busy}
                    loading={busy}
                    compact
                    icon="power"
                    style={styles.serverActionButton}
                  >
                    Connect
                  </PaperButton>
                )}
                <PaperButton
                  mode="outlined"
                  onPress={() => handleRemoveServer(item.id)}
                  disabled={busy}
                  compact
                  icon="delete"
                  textColor="#ff3b30"
                  style={[styles.serverActionButton, { borderColor: '#ff3b30' }]}
                >
                  Remove
                </PaperButton>
              </View>
            </PaperCard.Content>
          </PaperCard>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <Surface style={styles.emptyCard} elevation={1}>
            <MaterialCommunityIcons name="server-off" size={48} color={paperTheme.colors.onSurfaceVariant} />
            <PaperText
              variant="bodyLarge"
              style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}
            >
              No servers saved yet
            </PaperText>
            <PaperText
              variant="bodySmall"
              style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}
            >
              Add your first server above to get started
            </PaperText>
          </Surface>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  // iOS styles
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: '#007aff',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 13,
    marginBottom: 8,
    marginTop: -4,
  },
  // Paper styles
  addServerCard: {
    borderRadius: 20,
    padding: 20,
  },
  paperInput: {
    marginBottom: 12,
  },
  addButton: {
    marginTop: 8,
    borderRadius: 12,
  },
  serverCard: {
    borderRadius: 16,
  },
  serverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#007aff15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serverInfo: {
    flex: 1,
  },
  serverActions: {
    flexDirection: 'row',
    gap: 8,
  },
  serverActionButton: {
    flex: 1,
    borderRadius: 10,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
