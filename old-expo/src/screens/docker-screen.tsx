import { ErrorMessage } from '@/src/components/ui/error-message';
import { LoadingScreen } from '@/src/components/ui/loading-screen';
import { START_CONTAINER, STOP_CONTAINER } from '@/src/graphql/queries';
import { useDockerContainers } from '@/src/hooks/useUnraidQuery';
import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { DemoDataService } from '@/src/services/demo-data.service';
import { useMutation } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  Avatar,
  Badge,
  Chip,
  Divider,
  IconButton,
  Menu,
  Button as PaperButton,
  Card as PaperCard,
  Text as PaperText,
  ProgressBar,
  Searchbar,
  Surface,
  useTheme as usePaperTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// Conditionally import native SwiftUI components only on iOS
let UiButton: any;
let UiChart: any;
let UiDivider: any;
let UiForm: any;
let UiHost: any;
let UiHStack: any;
let UiImage: any;
let UiSection: any;
let UiSpacer: any;
let UiText: any;
let UiVStack: any;
let padding: any;
let frame: any;
let layoutPriority: any;

if (Platform.OS === 'ios') {
  const swiftUIModule = require('@expo/ui/swift-ui');
  UiButton = swiftUIModule.Button;
  UiChart = swiftUIModule.Chart;
  UiDivider = swiftUIModule.Divider;
  UiForm = swiftUIModule.Form;
  UiHost = swiftUIModule.Host;
  UiHStack = swiftUIModule.HStack;
  UiImage = swiftUIModule.Image;
  UiSection = swiftUIModule.Section;
  UiSpacer = swiftUIModule.Spacer;
  UiText = swiftUIModule.Text;
  UiVStack = swiftUIModule.VStack;

  const modifiersModule = require('@expo/ui/swift-ui/modifiers');
  padding = modifiersModule.padding;
  frame = modifiersModule.frame;
  layoutPriority = modifiersModule.layoutPriority;
}

interface ContainerItem {
  id: string;
  names?: string[];
  image?: string;
  state: string;
  status?: string;
  autoStart?: boolean;
}

export function DockerScreen() {
  const { isDark } = useTheme();
  const { t } = useLocalization();
  const paperTheme = usePaperTheme();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setIsDemoMode(DemoDataService.isDemoMode());
  }, []);

  const { loading, error, data, refetch } = useDockerContainers();
  const [startContainer, { loading: starting }] = useMutation(START_CONTAINER);
  const [stopContainer, { loading: stopping }] = useMutation(STOP_CONTAINER);

  const containers: ContainerItem[] = useMemo(() => {
    const a = data as any;
    return a?.docker?.containers || a?.dockerContainers || [];
  }, [data]);

  const filteredContainers = useMemo(() => {
    if (!searchQuery.trim()) return containers;
    const q = searchQuery.trim().toLowerCase();
    return containers.filter((c) => {
      const name = (c.names && c.names[0]) || '';
      return (
        name.toLowerCase().includes(q) ||
        (c.image || '').toLowerCase().includes(q) ||
        (c.status || '').toLowerCase().includes(q)
      );
    });
  }, [containers, searchQuery]);

  const totals = useMemo(() => {
    const total = containers.length;
    const running = containers.filter((c) => c.state?.toLowerCase() === 'running').length;
    const stopped = total - running;
    return { total, running, stopped };
  }, [containers]);

  const pieData = useMemo(() => {
    if (totals.total === 0) {
      return [{ x: 'No Data', y: 1, color: isDark ? '#2c2c2e' : '#d1d1d6' }];
    }
    const slices = [
      { x: 'Running', y: totals.running, color: '#34c759' },
      { x: 'Stopped', y: totals.stopped, color: '#ff3b30' },
    ].filter((slice) => slice.y > 0);
    return slices.length > 0 ? slices : [{ x: 'Total', y: totals.total, color: '#007aff' }];
  }, [isDark, totals]);

  const friendlyError = useMemo(() => {
    if (!error) return null;
    const raw = (error.message || '').toLowerCase();
    if (raw.includes('docker') && (raw.includes('socket') || raw.includes('enoent') || raw.includes('unavailable'))) {
      return t('docker.errorDockerUnavailable');
    }
    if (raw.includes('permission') || raw.includes('forbidden') || raw.includes('unauthorized')) {
      return t('docker.errorDockerPermission');
    }
    return error.message || t('docker.errorLoadingContainers');
  }, [error, t]);

  if (loading && !data) {
    return <LoadingScreen message={t('loadingMessages.containers')} />;
  }

  if (error && !data) {
    return <ErrorMessage message={friendlyError!} onRetry={() => refetch()} />;
  }

  const onStart = async (id: string) => {
    if (isDemoMode) {
      Alert.alert(t('dashboard.demoMode'), t('docker.demoModeStart'));
      return;
    }
    try {
      await startContainer({ variables: { id } });
      await refetch();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('docker.errorStartContainer'));
    }
  };

  const onStop = async (id: string) => {
    if (isDemoMode) {
      Alert.alert(t('dashboard.demoMode'), t('docker.demoModeStop'));
      return;
    }
    try {
      await stopContainer({ variables: { id } });
      await refetch();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('docker.errorStopContainer'));
    }
  };

  const onRestart = async (id: string) => {
    if (isDemoMode) {
      Alert.alert(t('dashboard.demoMode'), t('docker.demoModeRestart'));
      return;
    }
    try {
      await stopContainer({ variables: { id } });
      await startContainer({ variables: { id } });
      await refetch();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('docker.errorRestartContainer'));
    }
  };

  const showActionsFor = (item: ContainerItem) => {
    const isRunning = item.state?.toLowerCase() === 'running';
    if (Platform.OS === 'ios') {
      const options = [isRunning ? t('docker.stop') : t('docker.start'), t('docker.restart'), t('common.cancel')];
      const destructiveButtonIndex = isRunning ? 0 : undefined;
      const cancelButtonIndex = 2;
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title: (item.names && item.names[0]) || item.id,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            if (isRunning) {
              await onStop(item.id);
            } else {
              await onStart(item.id);
            }
          } else if (buttonIndex === 1) {
            await onRestart(item.id);
          }
        }
      );
    } else {
      setMenuVisible(item.id);
    }
  };

  // iOS: Use SwiftUI-based UI for native feel
  if (Platform.OS === 'ios' && UiHost) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f2f2f7' }} edges={['top']}>
        <UiHost style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#f2f2f7' }} colorScheme={isDark ? 'dark' : 'light'}>
          <UiForm>
            <UiSection>
                <UiVStack alignment="leading" spacing={20} modifiers={[padding({ all: 24 })]}>
                <UiHStack alignment="center" spacing={20} modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]}>
                  <UiVStack alignment="leading" spacing={8} modifiers={[layoutPriority(1)]}>
                    <UiText size={15} color={isDark ? '#8e8e93' : '#6e6e73'}>{t('docker.title')}</UiText>
                    <UiText size={34} weight="bold">
                      {totals.total === 0 ? t('common.noData') : `${totals.total}`}
                    </UiText>
                  </UiVStack>
                  <UiSpacer />
                  <UiChart
                    data={pieData}
                    type="pie"
                    animate
                    pieStyle={{ innerRadius: totals.total === 0 ? 0.45 : 0.6, angularInset: totals.total === 0 ? 0 : 6 }}
                    modifiers={[frame({ width: 140, height: 140 })]}
                  />
                </UiHStack>
                <UiDivider />
                <UiVStack spacing={16} modifiers={[frame({ maxWidth: Number.POSITIVE_INFINITY })]}>
                  <UiHStack spacing={12} alignment="center">
                    <UiText size={24} color="#007aff">●</UiText>
                    <UiVStack alignment="leading" spacing={4} modifiers={[layoutPriority(1)]}>
                      <UiText size={17} weight="semibold">{t('docker.total')}</UiText>
                      <UiText size={15} color={isDark ? '#8e8e93' : '#6e6e73'}>
                        {totals.total === 0 ? t('docker.noContainersDetected') : t('docker.combinedContainers')}
                      </UiText>
                    </UiVStack>
                    <UiSpacer />
                    <UiText size={20} weight="semibold" color={isDark ? '#ffffff' : '#000000'}>{`${totals.total}`}</UiText>
                  </UiHStack>
                  <UiDivider />
                  <UiHStack spacing={12} alignment="center">
                    <UiText size={24} color="#34c759">●</UiText>
                    <UiVStack alignment="leading" spacing={4} modifiers={[layoutPriority(1)]}>
                      <UiText size={17} weight="semibold">{t('docker.running')}</UiText>
                      <UiText size={15} color={isDark ? '#8e8e93' : '#6e6e73'}>
                        {totals.running === 0 ? t('docker.noContainersActive') : t('docker.currentlyActive')}
                      </UiText>
                    </UiVStack>
                    <UiSpacer />
                    <UiText size={20} weight="semibold" color={isDark ? '#ffffff' : '#000000'}>{`${totals.running}`}</UiText>
                  </UiHStack>
                  <UiDivider />
                  <UiHStack spacing={12} alignment="center">
                    <UiText size={24} color="#ff3b30">●</UiText>
                    <UiVStack alignment="leading" spacing={4} modifiers={[layoutPriority(1)]}>
                      <UiText size={17} weight="semibold">{t('docker.stopped')}</UiText>
                      <UiText size={15} color={isDark ? '#8e8e93' : '#6e6e73'}>
                        {totals.stopped === 0 ? t('docker.noContainersStopped') : t('docker.currentlyInactive')}
                      </UiText>
                    </UiVStack>
                    <UiSpacer />
                    <UiText size={20} weight="semibold" color={isDark ? '#ffffff' : '#000000'}>{`${totals.stopped}`}</UiText>
                  </UiHStack>
                </UiVStack>
              </UiVStack>
            </UiSection>
            <UiSection title={t('docker.containers')}>
              {filteredContainers.length === 0 ? <UiText size={15}>{t('docker.noContainers')}</UiText> : null}
              {filteredContainers.map((item) => {
                const isRunning = item.state?.toLowerCase() === 'running';
                const name = (item.names && item.names[0]) || item.id;
                const uptime = (item.status && (item.status.split(',').find((s) => s.trim().toLowerCase().startsWith('up')) || '').trim()) || (item.status || '');
                return (
                  <UiHStack key={item.id} spacing={12}>
                    <UiText size={12} color={isRunning ? 'green' : 'red'}>●</UiText>
                    <UiText size={17}>{name}</UiText>
                    <UiSpacer />
                    <UiText size={15}>{uptime}</UiText>
                    <UiButton onPress={() => showActionsFor(item)}>
                      <UiImage systemName="ellipsis.circle" />
                    </UiButton>
                  </UiHStack>
                );
              })}
            </UiSection>
          </UiForm>
        </UiHost>
      </SafeAreaView>
    );
  }

  // Android and Web: Material Design 3 UI with React Native Paper
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: paperTheme.colors.background }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: paperTheme.colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={!!loading} onRefresh={refetch} colors={[paperTheme.colors.primary]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <PaperText variant="headlineMedium" style={{ fontWeight: 'bold', color: paperTheme.colors.onBackground }}>
            {t('docker.title')}
          </PaperText>
          <PaperText variant="bodyMedium" style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 4 }}>
            {t('docker.manageContainers')}
          </PaperText>
        </View>

        {/* Overview Card */}
        <Surface style={styles.overviewCard} elevation={2}>
          <View style={styles.overviewRow}>
            <View style={styles.overviewStats}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#007aff' }]} />
                <View>
                  <PaperText variant="headlineLarge" style={{ fontWeight: 'bold' }}>{totals.total}</PaperText>
                  <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('docker.total')}</PaperText>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#34c759' }]} />
                <View>
                  <PaperText variant="headlineLarge" style={{ fontWeight: 'bold', color: '#34c759' }}>{totals.running}</PaperText>
                  <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('docker.running')}</PaperText>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#ff3b30' }]} />
                <View>
                  <PaperText variant="headlineLarge" style={{ fontWeight: 'bold', color: '#ff3b30' }}>{totals.stopped}</PaperText>
                  <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('docker.stopped')}</PaperText>
                </View>
              </View>
            </View>
          </View>
          {totals.total > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <PaperText variant="labelSmall">{t('docker.running')}</PaperText>
                <PaperText variant="labelSmall">{((totals.running / totals.total) * 100).toFixed(0)}%</PaperText>
              </View>
              <ProgressBar
                progress={totals.running / totals.total}
                color="#34c759"
                style={{ height: 8, borderRadius: 4 }}
              />
            </View>
          )}
        </Surface>

        {/* Search */}
        <Searchbar
          placeholder={t('docker.searchContainers') || 'Search containers...'}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ minHeight: 0 }}
        />

        {/* Container List */}
        <View style={styles.section}>
          <PaperText variant="titleMedium" style={{ marginBottom: 12, fontWeight: '600' }}>
            {t('docker.containers')}
          </PaperText>

          {filteredContainers.length === 0 ? (
            <Surface style={styles.emptyCard} elevation={1}>
              <MaterialCommunityIcons name="docker" size={48} color={paperTheme.colors.onSurfaceVariant} />
              <PaperText variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 12 }}>
                {t('docker.noContainers')}
              </PaperText>
            </Surface>
          ) : (
            filteredContainers.map((item, index) => {
              const isRunning = item.state?.toLowerCase() === 'running';
              const name = (item.names && item.names[0]) || item.id;
              const uptime = (item.status && (item.status.split(',').find((s) => s.trim().toLowerCase().startsWith('up')) || '').trim()) || (item.status || '');

              return (
                <PaperCard key={item.id} style={styles.containerCard} mode="elevated">
                  <PaperCard.Content>
                    <View style={styles.containerHeader}>
                      <View style={styles.containerInfo}>
                        <Avatar.Icon
                          size={40}
                          icon="docker"
                          style={{ backgroundColor: isRunning ? '#34c75920' : '#ff3b3020' }}
                          color={isRunning ? '#34c759' : '#ff3b30'}
                        />
                        <View style={styles.containerText}>
                          <View style={styles.nameRow}>
                            <PaperText variant="titleMedium" style={{ fontWeight: '600' }} numberOfLines={1}>
                              {name}
                            </PaperText>
                            <Badge style={{ backgroundColor: isRunning ? '#34c759' : '#ff3b30', marginLeft: 8 }} size={10} />
                          </View>
                          {item.image && (
                            <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }} numberOfLines={1}>
                              {item.image}
                            </PaperText>
                          )}
                        </View>
                      </View>
                      <Menu
                        visible={menuVisible === item.id}
                        onDismiss={() => setMenuVisible(null)}
                        anchor={
                          <IconButton
                            icon="dots-vertical"
                            onPress={() => setMenuVisible(item.id)}
                            disabled={starting || stopping}
                          />
                        }
                      >
                        <Menu.Item
                          leadingIcon={isRunning ? 'stop' : 'play'}
                          onPress={() => {
                            setMenuVisible(null);
                            isRunning ? onStop(item.id) : onStart(item.id);
                          }}
                          title={isRunning ? t('docker.stop') : t('docker.start')}
                          titleStyle={{ color: isRunning ? '#ff3b30' : '#34c759' }}
                        />
                        <Menu.Item
                          leadingIcon="restart"
                          onPress={() => {
                            setMenuVisible(null);
                            onRestart(item.id);
                          }}
                          title={t('docker.restart')}
                        />
                        <Divider />
                        <Menu.Item leadingIcon="information-outline" onPress={() => setMenuVisible(null)} title={t('docker.details')} />
                      </Menu>
                    </View>

                    <Divider style={{ marginVertical: 12 }} />

                    <View style={styles.containerFooter}>
                      <Chip
                        icon={isRunning ? 'check-circle' : 'close-circle'}
                        mode="flat"
                        compact
                        style={{ backgroundColor: isRunning ? '#34c75915' : '#ff3b3015' }}
                        textStyle={{ color: isRunning ? '#34c759' : '#ff3b30', fontSize: 12 }}
                      >
                        {isRunning ? t('docker.running') : t('docker.stopped')}
                      </Chip>
                      {uptime && (
                        <PaperText variant="labelSmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>
                          {uptime}
                        </PaperText>
                      )}
                    </View>

                    <View style={styles.actionButtons}>
                      <PaperButton
                        mode={isRunning ? 'outlined' : 'contained'}
                        onPress={() => (isRunning ? onStop(item.id) : onStart(item.id))}
                        disabled={starting || stopping}
                        compact
                        icon={isRunning ? 'stop' : 'play'}
                        buttonColor={isRunning ? undefined : '#34c759'}
                        textColor={isRunning ? '#ff3b30' : '#ffffff'}
                        style={styles.actionButton}
                      >
                        {isRunning ? t('docker.stop') : t('docker.start')}
                      </PaperButton>
                      <PaperButton
                        mode="outlined"
                        onPress={() => onRestart(item.id)}
                        disabled={starting || stopping}
                        compact
                        icon="restart"
                        style={styles.actionButton}
                      >
                        {t('docker.restart')}
                      </PaperButton>
                    </View>
                  </PaperCard.Content>
                </PaperCard>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  overviewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewStats: {
    flexDirection: 'row',
    gap: 24,
    flex: 1,
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressSection: {
    marginTop: 20,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  searchBar: {
    borderRadius: 16,
    marginBottom: 16,
  },
  section: {
    marginTop: 8,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  containerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  containerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  containerText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
});
