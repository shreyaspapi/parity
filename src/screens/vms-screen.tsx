import { ErrorMessage } from '@/src/components/ui/error-message';
import { LoadingScreen } from '@/src/components/ui/loading-screen';
import { GET_VMS, START_VM, STOP_VM } from '@/src/graphql/queries';
import { usePollingInterval } from '@/src/hooks/usePollingInterval';
import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { DemoDataService } from '@/src/services/demo-data.service';
import { useMutation, useQuery } from '@apollo/client/react';
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
  useTheme as usePaperTheme,
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

interface VMItem {
  id: string;
  name?: string;
  state: string;
}

export function VMsScreen() {
  const { isDark } = useTheme();
  const { t } = useLocalization();
  const paperTheme = usePaperTheme();
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { pollingInterval } = usePollingInterval();

  useEffect(() => {
    setIsDemoMode(DemoDataService.isDemoMode());
  }, []);

  const queryResult = useQuery<{ vms: { domain?: VMItem[]; domains?: VMItem[] } }>(GET_VMS, {
    pollInterval: pollingInterval,
    notifyOnNetworkStatusChange: true,
    skip: isDemoMode,
  });

  const [startVM, { loading: starting }] = useMutation(START_VM);
  const [stopVM, { loading: stopping }] = useMutation(STOP_VM);

  const { loading, error, data, refetch } = isDemoMode
    ? {
        loading: false,
        error: undefined,
        data: DemoDataService.getVMsData(),
        refetch: async () => ({ data: DemoDataService.getVMsData() }),
      }
    : queryResult;

  const vms: VMItem[] = (data?.vms?.domain || data?.vms?.domains || []) as VMItem[];

  const filteredVMs = useMemo(() => {
    if (!searchQuery.trim()) return vms;
    const q = searchQuery.trim().toLowerCase();
    return vms.filter((vm) => {
      const name = vm.name || vm.id;
      return name.toLowerCase().includes(q) || vm.state?.toLowerCase().includes(q);
    });
  }, [vms, searchQuery]);

  const totals = useMemo(() => {
    const total = vms.length;
    const running = vms.filter((vm) => vm.state?.toLowerCase() === 'running').length;
    const stopped = total - running;
    return { total, running, stopped };
  }, [vms]);

  const pieData = useMemo(() => {
    if (totals.total === 0) {
      return [{ x: t('common.noData'), y: 1, color: isDark ? '#2c2c2e' : '#d1d1d6' }];
    }
    const slices = [
      { x: t('vms.running'), y: totals.running, color: '#34c759' },
      { x: t('vms.stopped'), y: totals.stopped, color: '#ff3b30' },
    ].filter((slice) => slice.y > 0);
    return slices.length > 0 ? slices : [{ x: t('vms.total'), y: totals.total, color: '#007aff' }];
  }, [isDark, totals, t]);

  if (loading && !data) {
    return <LoadingScreen message={t('loadingMessages.vms')} />;
  }

  if (error && !data) {
    return <ErrorMessage message={error.message || t('vms.errorLoadingVMs')} onRetry={() => refetch()} />;
  }

  const onStart = async (id: string) => {
    if (isDemoMode) {
      Alert.alert(t('dashboard.demoMode'), t('vms.demoModeStart'));
      return;
    }
    try {
      await startVM({ variables: { id } });
      await refetch();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('vms.errorStartingVM'));
    }
  };

  const onStop = async (id: string) => {
    if (isDemoMode) {
      Alert.alert(t('dashboard.demoMode'), t('vms.demoModeStop'));
      return;
    }
    try {
      await stopVM({ variables: { id } });
      await refetch();
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message || t('vms.errorStoppingVM'));
    }
  };

  const showActionsFor = (item: VMItem) => {
    const isRunning = item.state?.toLowerCase() === 'running';
    if (Platform.OS === 'ios') {
      const options = [isRunning ? t('vms.stop') : t('vms.start'), t('common.cancel')];
      const destructiveButtonIndex = isRunning ? 0 : undefined;
      const cancelButtonIndex = 1;
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
          title: item.name || item.id,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            if (isRunning) {
              await onStop(item.id);
            } else {
              await onStart(item.id);
            }
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
                    <UiText size={15} color={isDark ? '#8e8e93' : '#6e6e73'}>{t('vms.title')}</UiText>
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
                      <UiText size={17} weight="semibold">{t('vms.total')}</UiText>
                      <UiText size={15} color={isDark ? '#8e8e93' : '#6e6e73'}>
                        {totals.total === 0 ? t('vms.noVMsDetected') : t('vms.discoveredGuests')}
                      </UiText>
                    </UiVStack>
                    <UiSpacer />
                    <UiText size={20} weight="semibold" color={isDark ? '#ffffff' : '#000000'}>{`${totals.total}`}</UiText>
                  </UiHStack>
                  <UiDivider />
                  <UiHStack spacing={12} alignment="center">
                    <UiText size={24} color="#34c759">●</UiText>
                    <UiVStack alignment="leading" spacing={4} modifiers={[layoutPriority(1)]}>
                      <UiText size={17} weight="semibold">{t('vms.running')}</UiText>
                      <UiText size={15} color={isDark ? '#8e8e93' : '#6e6e73'}>
                        {totals.running === 0 ? t('vms.noVMsActive') : t('vms.currentlyPoweredOn')}
                      </UiText>
                    </UiVStack>
                    <UiSpacer />
                    <UiText size={20} weight="semibold" color={isDark ? '#ffffff' : '#000000'}>{`${totals.running}`}</UiText>
                  </UiHStack>
                  <UiDivider />
                  <UiHStack spacing={12} alignment="center">
                    <UiText size={24} color="#ff3b30">●</UiText>
                    <UiVStack alignment="leading" spacing={4} modifiers={[layoutPriority(1)]}>
                      <UiText size={17} weight="semibold">{t('vms.stopped')}</UiText>
                      <UiText size={15} color={isDark ? '#8e8e93' : '#6e6e73'}>
                        {totals.stopped === 0 ? t('vms.noVMsStopped') : t('vms.currentlyPoweredOff')}
                      </UiText>
                    </UiVStack>
                    <UiSpacer />
                    <UiText size={20} weight="semibold" color={isDark ? '#ffffff' : '#000000'}>{`${totals.stopped}`}</UiText>
                  </UiHStack>
                </UiVStack>
              </UiVStack>
            </UiSection>
            <UiSection title={t('vms.title')}>
              {vms.length === 0 ? <UiText size={15}>{t('vms.noVMs')}</UiText> : null}
              {vms.map((item) => {
                const isRunning = item.state?.toLowerCase() === 'running';
                return (
                  <UiHStack key={item.id} spacing={12}>
                    <UiText size={12} color={isRunning ? 'green' : 'red'}>●</UiText>
                    <UiText size={17}>{item.name || item.id}</UiText>
                    <UiSpacer />
                    <UiText size={15}>{item.state}</UiText>
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
            {t('vms.title')}
          </PaperText>
          <PaperText variant="bodyMedium" style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 4 }}>
            {t('vms.manageVMs')}
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
                  <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('vms.total')}</PaperText>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#34c759' }]} />
                <View>
                  <PaperText variant="headlineLarge" style={{ fontWeight: 'bold', color: '#34c759' }}>{totals.running}</PaperText>
                  <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('vms.running')}</PaperText>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#ff3b30' }]} />
                <View>
                  <PaperText variant="headlineLarge" style={{ fontWeight: 'bold', color: '#ff3b30' }}>{totals.stopped}</PaperText>
                  <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('vms.stopped')}</PaperText>
                </View>
              </View>
            </View>
          </View>
          {totals.total > 0 && (
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <PaperText variant="labelSmall">{t('vms.running')}</PaperText>
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
          placeholder={t('vms.searchVMs') || 'Search virtual machines...'}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={{ minHeight: 0 }}
        />

        {/* VM List */}
        <View style={styles.section}>
          <PaperText variant="titleMedium" style={{ marginBottom: 12, fontWeight: '600' }}>
            {t('vms.title')}
          </PaperText>

          {filteredVMs.length === 0 ? (
            <Surface style={styles.emptyCard} elevation={1}>
              <MaterialCommunityIcons name="desktop-classic" size={48} color={paperTheme.colors.onSurfaceVariant} />
              <PaperText variant="bodyLarge" style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 12 }}>
                {t('vms.noVMs')}
              </PaperText>
            </Surface>
          ) : (
            filteredVMs.map((item) => {
              const isRunning = item.state?.toLowerCase() === 'running';
              const name = item.name || item.id;

              return (
                <PaperCard key={item.id} style={styles.vmCard} mode="elevated">
                  <PaperCard.Content>
                    <View style={styles.vmHeader}>
                      <View style={styles.vmInfo}>
                        <Avatar.Icon
                          size={44}
                          icon="desktop-classic"
                          style={{ backgroundColor: isRunning ? '#34c75920' : '#ff3b3020' }}
                          color={isRunning ? '#34c759' : '#ff3b30'}
                        />
                        <View style={styles.vmText}>
                          <View style={styles.nameRow}>
                            <PaperText variant="titleMedium" style={{ fontWeight: '600' }} numberOfLines={1}>
                              {name}
                            </PaperText>
                            <Badge style={{ backgroundColor: isRunning ? '#34c759' : '#ff3b30', marginLeft: 8 }} size={10} />
                          </View>
                          <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>
                            {item.state}
                          </PaperText>
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
                          title={isRunning ? t('vms.stop') : t('vms.start')}
                          titleStyle={{ color: isRunning ? '#ff3b30' : '#34c759' }}
                        />
                        <Divider />
                        <Menu.Item leadingIcon="information-outline" onPress={() => setMenuVisible(null)} title={t('vms.details')} />
                      </Menu>
                    </View>

                    <Divider style={{ marginVertical: 12 }} />

                    <View style={styles.vmFooter}>
                      <Chip
                        icon={isRunning ? 'power' : 'power-off'}
                        mode="flat"
                        compact
                        style={{ backgroundColor: isRunning ? '#34c75915' : '#ff3b3015' }}
                        textStyle={{ color: isRunning ? '#34c759' : '#ff3b30', fontSize: 12 }}
                      >
                        {isRunning ? t('vms.poweredOn') : t('vms.poweredOff')}
                      </Chip>
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
                        {isRunning ? t('vms.stop') : t('vms.start')}
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
  vmCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  vmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vmInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  vmText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vmFooter: {
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
