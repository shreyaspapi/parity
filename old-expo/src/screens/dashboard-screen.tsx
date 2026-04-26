/**
 * Enhanced Dashboard Screen
 * Platform-aware design: iOS native styling, Material Design 3 for Android/Web
 */

import { Card } from '@/src/components/ui/card';
import { CircularProgress } from '@/src/components/ui/circular-progress';
import { ErrorMessage } from '@/src/components/ui/error-message';
import { LineChart } from '@/src/components/ui/line-chart';
import { LoadingScreen } from '@/src/components/ui/loading-screen';
import { MetricCard } from '@/src/components/ui/metric-card';
import { ProgressBar } from '@/src/components/ui/progress-bar';
import { START_ARRAY, STOP_ARRAY } from '@/src/graphql/queries';
import { useMetricsHistory } from '@/src/hooks/useMetricsHistory';
import { useDashboardData } from '@/src/hooks/useUnraidQuery';
import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { DemoDataService } from '@/src/services/demo-data.service';
import { calculatePercentage, formatBytes, formatCapacityKB, formatDiskSize, formatUptime } from '@/src/utils/formatters';
import { useMutation } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Banner,
  Chip,
  Button as PaperButton,
  Text as PaperText,
  Surface,
  useTheme as usePaperTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export function DashboardScreen() {
  const { isDark } = useTheme();
  const { t } = useLocalization();
  const paperTheme = usePaperTheme();
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(DemoDataService.isDemoMode());
  }, []);

  const { loading, error, data, refetch } = useDashboardData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startArray, { loading: startingArray }] = useMutation(START_ARRAY);
  const [stopArray, { loading: stoppingArray }] = useMutation(STOP_ARRAY);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    arrayControl: false,
    processor: true,
    network: false,
    shares: false,
    disks: true,
    cache: true,
  });

  const systemInfo = data?.info;
  const arrayInfo = data?.array;
  const metrics = data?.metrics;
  const shares = data?.shares;
  const vars = data?.vars;

  const memoryInfo = metrics?.memory;
  const memoryPercentage = memoryInfo?.percentTotal || (memoryInfo ? calculatePercentage(Number(memoryInfo.used), Number(memoryInfo.total)) : 0);
  const cpuMetrics = metrics?.cpu;
  const cpuUsage = cpuMetrics?.percentTotal || 0;

  const { cpuChartData, memoryChartData, hasEnoughData } = useMetricsHistory(cpuUsage, memoryPercentage);

  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      refetch();
      return () => {};
    }, [refetch])
  );

  if (loading && !data) {
    return <LoadingScreen message={t('loadingMessages.systemInfo')} />;
  }

  if (error && !data) {
    return <ErrorMessage message={error.message || t('dashboard.errorLoadingSystem')} onRetry={() => refetch()} />;
  }

  const parseCapacityValue = (value: unknown): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric;
    const match = String(value).match(/[\d.]+/);
    return match ? Number(match[0]) || 0 : 0;
  };

  const capacityKb = arrayInfo?.capacity?.kilobytes;
  const usedKb = capacityKb ? parseCapacityValue(capacityKb.used) : 0;
  const totalKb = capacityKb ? parseCapacityValue(capacityKb.total) : 0;
  const diskPercentage = usedKb && totalKb ? calculatePercentage(usedKb, totalKb) : arrayInfo ? calculatePercentage(Number(arrayInfo.capacity.disks.used), Number(arrayInfo.capacity.disks.total)) : 0;

  const flashDisk = arrayInfo?.boot;
  const flashPercentage = flashDisk?.fsSize ? calculatePercentage(Number(flashDisk.fsUsed), Number(flashDisk.fsSize)) : 0;

  const currentTime = systemInfo?.time ? new Date(systemInfo.time) : new Date();
  const timeString = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const allDisks = arrayInfo?.disks || [];
  const unassignedDisks = allDisks.filter((disk) => disk.status === 'DISK_NP' || (disk.type === 'DATA' && disk.status !== 'DISK_OK'));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusColor = (percentage: number) => {
    if (percentage > 90) return '#ff3b30';
    if (percentage > 75) return '#ff9500';
    return '#34c759';
  };

  const isIOS = Platform.OS === 'ios';
  const bgColor = isIOS ? (isDark ? '#000000' : '#f2f2f7') : paperTheme.colors.background;

  // Shared content that works for both platforms
  const renderContent = () => (
    <>
        {/* Demo Mode Banner */}
        {isDemoMode && (
        isIOS ? (
          <View style={[styles.demoBanner, { backgroundColor: isDark ? '#1c2c1c' : '#e5ffe5', borderColor: '#34c759' }]}>
            <Text style={[styles.demoBannerText, { color: isDark ? '#ffffff' : '#000000' }]}>{t('dashboard.demoMode')}</Text>
            <Text style={[styles.demoBannerSubtext, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{t('dashboard.demoModeSubtext')}</Text>
          </View>
        ) : (
          <Banner
            visible={true}
            icon="information"
            style={{ marginBottom: 16, borderRadius: 12 }}
            actions={[]}
          >
            {t('dashboard.demoMode')} - {t('dashboard.demoModeSubtext')}
          </Banner>
        )
      )}

      {/* Server Header */}
        {systemInfo && (
        isIOS ? (
          <View style={styles.headerSection}>
            <View style={styles.serverRow}>
              <Text style={[styles.serverName, { color: isDark ? '#ffffff' : '#000000' }]}>
                {vars?.name || systemInfo.os.hostname || 'Unraid Server'}
              </Text>
              <Text style={[styles.timeText, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{timeString}</Text>
            </View>
            {systemInfo.os.uptime !== undefined && (
              <Text style={[styles.uptimeText, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                {t('dashboard.uptime')}: {formatUptime(systemInfo.os.uptime)} • {systemInfo.os.distro || 'Unraid'} {vars?.version || ''}
              </Text>
            )}
          </View>
        ) : (
          <Surface style={[styles.paperHeader, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]} elevation={1}>
            <View style={styles.paperHeaderRow}>
              <View>
                <PaperText variant="headlineSmall" style={{ fontWeight: 'bold', color: isDark ? '#ffffff' : '#1a1a1a' }}>
                  {vars?.name || systemInfo.os.hostname || 'Unraid Server'}
                </PaperText>
                {systemInfo.os.uptime !== undefined && (
                  <PaperText variant="bodySmall" style={{ color: isDark ? '#a0a0a0' : '#666666', marginTop: 4 }}>
                    {t('dashboard.uptime')}: {formatUptime(systemInfo.os.uptime)}
                  </PaperText>
                )}
              </View>
              <View style={styles.paperTimeContainer}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={isDark ? '#a0a0a0' : '#666666'} />
                <PaperText variant="bodyMedium" style={{ color: isDark ? '#a0a0a0' : '#666666', marginLeft: 4 }}>
                  {timeString}
                </PaperText>
              </View>
            </View>
            <View style={styles.paperChipRow}>
              <Chip icon="server" compact mode="flat" style={{ backgroundColor: isDark ? 'rgba(52,199,89,0.15)' : 'rgba(52,199,89,0.12)' }} textStyle={{ color: isDark ? '#66bb6a' : '#2e7d32' }}>
                {arrayInfo?.state || 'Unknown'}
              </Chip>
              <Chip icon="chip" compact mode="flat" style={{ backgroundColor: isDark ? 'rgba(100,181,246,0.15)' : 'rgba(25,118,210,0.1)' }} textStyle={{ fontSize: 12, color: isDark ? '#64b5f6' : '#1565c0' }}>
                {systemInfo.os.distro || 'Unraid'} {vars?.version || ''}
              </Chip>
            </View>
          </Surface>
        )
        )}

        {/* Quick Metrics Row */}
        {metrics && (
        isIOS ? (
          <View style={styles.metricsRow}>
            <MetricCard label={t('dashboard.ram')} value={memoryPercentage.toFixed(0)} unit="%" subtitle={memoryInfo ? formatBytes(Number(memoryInfo.used)) : ''} status={memoryPercentage > 90 ? 'critical' : memoryPercentage > 75 ? 'warning' : 'good'} />
            <MetricCard label={t('dashboard.cpu')} value={cpuUsage.toFixed(0)} unit="%" subtitle={`${systemInfo?.cpu.cores || 0} cores`} status={cpuUsage > 90 ? 'critical' : cpuUsage > 75 ? 'warning' : 'good'} />
            <MetricCard label="ARRAY" value={diskPercentage.toFixed(0)} unit="%" subtitle={arrayInfo && usedKb ? formatCapacityKB(usedKb) : arrayInfo ? formatCapacityKB(arrayInfo.capacity.disks.used) : ''} status={diskPercentage > 90 ? 'critical' : diskPercentage > 75 ? 'warning' : 'good'} />
          </View>
        ) : (
          <Surface style={[styles.paperMetricsCard, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]} elevation={1}>
            <View style={styles.paperMetricsRow}>
              <View style={styles.paperMetricItem}>
                <View style={[styles.paperMetricIcon, { backgroundColor: `${getStatusColor(memoryPercentage)}18` }]}>
                  <MaterialCommunityIcons name="memory" size={24} color={getStatusColor(memoryPercentage)} />
                </View>
                <PaperText variant="headlineMedium" style={{ fontWeight: 'bold', color: isDark ? '#ffffff' : '#1a1a1a' }}>{memoryPercentage.toFixed(0)}%</PaperText>
                <PaperText variant="labelSmall" style={{ color: isDark ? '#a0a0a0' : '#666666' }}>RAM</PaperText>
              </View>
              <View style={styles.paperMetricItem}>
                <View style={[styles.paperMetricIcon, { backgroundColor: `${getStatusColor(cpuUsage)}18` }]}>
                  <MaterialCommunityIcons name="chip" size={24} color={getStatusColor(cpuUsage)} />
                </View>
                <PaperText variant="headlineMedium" style={{ fontWeight: 'bold', color: isDark ? '#ffffff' : '#1a1a1a' }}>{cpuUsage.toFixed(0)}%</PaperText>
                <PaperText variant="labelSmall" style={{ color: isDark ? '#a0a0a0' : '#666666' }}>CPU</PaperText>
              </View>
              <View style={styles.paperMetricItem}>
                <View style={[styles.paperMetricIcon, { backgroundColor: `${getStatusColor(diskPercentage)}18` }]}>
                  <MaterialCommunityIcons name="harddisk" size={24} color={getStatusColor(diskPercentage)} />
                </View>
                <PaperText variant="headlineMedium" style={{ fontWeight: 'bold', color: isDark ? '#ffffff' : '#1a1a1a' }}>{diskPercentage.toFixed(0)}%</PaperText>
                <PaperText variant="labelSmall" style={{ color: isDark ? '#a0a0a0' : '#666666' }}>Array</PaperText>
              </View>
            </View>
          </Surface>
        )
        )}

        {/* Performance Charts */}
        {metrics && (
          <Card>
            <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>{t('dashboard.performanceTrends')}</Text>
            </View>
            {hasEnoughData ? (
              <View style={styles.chartsContainer}>
              <LineChart data={cpuChartData} width={Dimensions.get('window').width - 64} height={140} label={t('dashboard.cpuUsage')} color="#007aff" maxValue={100} minValue={0} />
                <View style={[styles.divider, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea', marginVertical: 16 }]} />
              <LineChart data={memoryChartData} width={Dimensions.get('window').width - 64} height={140} label={t('dashboard.memoryUsage')} color="#34c759" maxValue={100} minValue={0} />
              </View>
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, color: isDark ? '#8e8e93' : '#6e6e73' }}>{t('dashboard.collectingData')}</Text>
              </View>
            )}
          </Card>
        )}

        {/* System Overview with Circular Progress */}
        {metrics && (
          <Card>
            <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>{t('dashboard.systemOverview')}</Text>
            </View>
            <View style={styles.circularProgressRow}>
            <CircularProgress percentage={memoryPercentage} label={t('dashboard.ramUsage')} size={75} />
            <CircularProgress percentage={flashPercentage} label={t('dashboard.flash')} size={75} />
            <CircularProgress percentage={diskPercentage} label={t('dashboard.storage')} size={75} />
            <CircularProgress percentage={cpuUsage} label={t('dashboard.cpu')} size={75} />
            </View>
            <View style={[styles.divider, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea' }]} />
            <View style={styles.statsGrid}>
              {memoryInfo && (
                <View style={styles.statColumn}>
                <Text style={[styles.statLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{t('dashboard.totalRam')}</Text>
                <Text style={[styles.statValue, { color: isDark ? '#ffffff' : '#000000' }]}>{formatBytes(Number(memoryInfo.total))}</Text>
                </View>
              )}
              {arrayInfo && (
                <View style={styles.statColumn}>
                <Text style={[styles.statLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{t('dashboard.arrayStatus')}</Text>
                <Text style={[styles.statValue, { color: arrayInfo.state?.toLowerCase() === 'started' ? '#34c759' : '#ff9500' }]}>{arrayInfo.state}</Text>
                </View>
              )}
            </View>
          </Card>
        )}

        {/* Array Control */}
        {arrayInfo && (
          <Card>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('arrayControl')}>
              <View>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>{t('dashboard.arrayControl')}</Text>
              <Text style={[styles.compactSubtext, { color: arrayInfo.state?.toLowerCase() === 'started' ? '#34c759' : isDark ? '#8e8e93' : '#6e6e73' }]}>
                  {t('dashboard.status')}: {arrayInfo.state}
                </Text>
              </View>
            <Text style={[styles.expandIcon, { color: '#007aff' }]}>{expandedSections.arrayControl ? '−' : '+'}</Text>
            </TouchableOpacity>

            {expandedSections.arrayControl && (
              <>
                {arrayInfo.state?.toLowerCase() === 'started' ? (
                isIOS ? (
                  <View style={styles.operationRow}>
                    <TouchableOpacity
                      style={[styles.operationButton, { backgroundColor: isDark ? '#2c1c1c' : '#ffe5e5', borderColor: '#ff3b30', opacity: startingArray || stoppingArray ? 0.5 : 1 }]}
                      disabled={startingArray || stoppingArray}
                      onPress={async () => {
                        Alert.alert(t('dashboard.stopArrayTitle'), t('dashboard.stopArrayMessage'), [
                            { text: t('common.cancel'), style: 'cancel' },
                            {
                              text: t('dashboard.stop'),
                              style: 'destructive',
                              onPress: async () => {
                                if (isDemoMode) {
                                  Alert.alert(t('dashboard.demoMode'), t('dashboard.demoModeDisabled'));
                                  return;
                                }
                                await stopArray();
                                await refetch();
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={[styles.operationButtonText, { color: '#ff3b30' }]}>{t('dashboard.stop')}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.operationDescription, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                      <Text style={{ fontWeight: '600' }}>{t('dashboard.stop')}</Text> {t('dashboard.stopDescription')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.paperArrayControl}>
                    <PaperButton
                      mode="outlined"
                      icon="stop"
                      textColor="#ff3b30"
                      style={{ borderColor: '#ff3b30', borderRadius: 12 }}
                      onPress={() => {
                        Alert.alert(t('dashboard.stopArrayTitle'), t('dashboard.stopArrayMessage'), [
                          { text: t('common.cancel'), style: 'cancel' },
                          {
                            text: t('dashboard.stop'),
                            style: 'destructive',
                            onPress: async () => {
                              if (isDemoMode) {
                                Alert.alert(t('dashboard.demoMode'), t('dashboard.demoModeDisabled'));
                                return;
                              }
                              await stopArray();
                              await refetch();
                            },
                          },
                        ]);
                      }}
                      disabled={startingArray || stoppingArray}
                    >
                      {t('dashboard.stopArrayTitle')}
                    </PaperButton>
                    <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 8 }}>
                      {t('dashboard.stop')} {t('dashboard.stopDescription')}
                    </PaperText>
                  </View>
                )
              ) : (
                isIOS ? (
                  <View style={styles.operationRow}>
                    <TouchableOpacity
                      style={[styles.operationButton, { backgroundColor: isDark ? '#1c2c1c' : '#e5ffe5', borderColor: '#34c759', opacity: startingArray || stoppingArray ? 0.5 : 1 }]}
                      disabled={startingArray || stoppingArray}
                      onPress={async () => {
                        if (isDemoMode) {
                          Alert.alert(t('dashboard.demoMode'), t('dashboard.demoModeDisabled'));
                          return;
                        }
                        try {
                          await startArray();
                          await refetch();
                        } catch (e) {}
                      }}
                    >
                      <Text style={[styles.operationButtonText, { color: '#34c759' }]}>{t('dashboard.start')}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.operationDescription, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                      <Text style={{ fontWeight: '600' }}>{t('dashboard.start')}</Text> {t('dashboard.startDescription')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.paperArrayControl}>
                    <PaperButton
                      mode="contained"
                      icon="play"
                      buttonColor="#34c759"
                      style={{ borderRadius: 12 }}
                      onPress={async () => {
                        if (isDemoMode) {
                          Alert.alert(t('dashboard.demoMode'), t('dashboard.demoModeDisabled'));
                          return;
                        }
                        try {
                          await startArray();
                          await refetch();
                        } catch (e) {}
                      }}
                      disabled={startingArray || stoppingArray}
                    >
                      {t('dashboard.start')} Array
                    </PaperButton>
                    <PaperText variant="bodySmall" style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 8 }}>
                      {t('dashboard.start')} {t('dashboard.startDescription')}
                    </PaperText>
                  </View>
                )
              )}
              </>
            )}
          </Card>
        )}

        {/* Boot Device */}
        {flashDisk && (
          <Card>
            <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>{t('dashboard.bootDevice')}</Text>
            </View>
            <View style={styles.bootDeviceContainer}>
              <View style={styles.bootDeviceRow}>
              <Text style={[styles.bootDeviceLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{t('dashboard.device')}</Text>
              <Text style={[styles.bootDeviceValue, { color: isDark ? '#ffffff' : '#000000' }]}>Flash ({flashDisk.device || flashDisk.name})</Text>
              </View>
              <View style={styles.bootDeviceRow}>
              <Text style={[styles.bootDeviceLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{t('dashboard.filesystem')}</Text>
              <Text style={[styles.bootDeviceValue, { color: isDark ? '#ffffff' : '#000000' }]}>{flashDisk.fsType || 'vfat'}</Text>
              </View>
              <View style={styles.bootDeviceRow}>
              <Text style={[styles.bootDeviceLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{t('dashboard.size')}</Text>
              <Text style={[styles.bootDeviceValue, { color: isDark ? '#ffffff' : '#000000' }]}>{formatDiskSize(flashDisk.fsSize || flashDisk.size)}</Text>
              </View>
              <View style={styles.bootDeviceRow}>
              <Text style={[styles.bootDeviceLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{t('dashboard.used')}</Text>
              <Text style={[styles.bootDeviceValue, { color: isDark ? '#ffffff' : '#000000' }]}>{formatDiskSize(flashDisk.fsUsed)}</Text>
              </View>
              <View style={styles.bootDeviceRow}>
              <Text style={[styles.bootDeviceLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{t('dashboard.free')}</Text>
              <Text style={[styles.bootDeviceValue, { color: isDark ? '#ffffff' : '#000000' }]}>{formatDiskSize(flashDisk.fsFree)}</Text>
              </View>
            </View>
            {flashDisk.fsSize && (
              <>
                <View style={[styles.divider, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea', marginVertical: 12 }]} />
              <ProgressBar percentage={flashPercentage} label={`${flashPercentage.toFixed(1)}% used`} height={6} />
              </>
            )}
          </Card>
        )}

      {/* Processor */}
        {systemInfo && cpuMetrics && (
          <Card>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('processor')}>
              <View>
              <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>{t('dashboard.processor')}</Text>
              <Text style={[styles.compactSubtext, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>{systemInfo.cpu.brand}</Text>
              </View>
            <Text style={[styles.expandIcon, { color: '#007aff' }]}>{expandedSections.processor ? '−' : '+'}</Text>
            </TouchableOpacity>
            <View style={styles.processorSummary}>
              <Text style={[styles.loadText, { color: isDark ? '#ffffff' : '#000000' }]}>
                {t('dashboard.load')}: <Text style={{ color: '#34c759' }}>{cpuUsage.toFixed(1)}%</Text>
              </Text>
            </View>
            {expandedSections.processor && cpuMetrics.cpus && cpuMetrics.cpus.length > 0 && (
              <View style={styles.coresContainer}>
                <View style={[styles.divider, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea' }]} />
                {cpuMetrics.cpus.slice(0, 12).map((core, index) => (
                  <View key={index} style={styles.coreItem}>
                  <Text style={[styles.coreLabel, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>CPU {index}</Text>
                    <View style={styles.coreProgress}>
                      <View
                        style={[
                          styles.coreProgressBar,
                          {
                            width: `${Math.min(core.percentTotal, 100)}%`,
                          backgroundColor: core.percentTotal > 80 ? '#ff3b30' : core.percentTotal > 50 ? '#ff9500' : '#34c759',
                          },
                        ]}
                      />
                    </View>
                  <Text style={[styles.corePercentage, { color: isDark ? '#ffffff' : '#000000' }]}>{core.percentTotal.toFixed(0)}%</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>
        )}

      {/* Array Disks */}
        {arrayInfo && arrayInfo.disks && arrayInfo.disks.length > 0 && (
          <Card>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('disks')}>
              <View>
                <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
                  {t('dashboard.arrayDisks')} ({arrayInfo.disks.length})
                </Text>
                <Text style={[styles.compactSubtext, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                  {arrayInfo && usedKb && totalKb
                    ? `${formatCapacityKB(usedKb)} ${t('dashboard.of')} ${formatCapacityKB(totalKb)} ${t('dashboard.used')}`
                  : `${formatCapacityKB(arrayInfo.capacity.disks.used)} ${t('dashboard.of')} ${formatCapacityKB(arrayInfo.capacity.disks.total)} ${t('dashboard.used')}`}
                </Text>
              </View>
            <Text style={[styles.expandIcon, { color: '#007aff' }]}>{expandedSections.disks ? '−' : '+'}</Text>
            </TouchableOpacity>
          <ProgressBar percentage={diskPercentage} label="" hideLabel height={6} />
            {expandedSections.disks && (
              <View style={styles.disksContainer}>
                <View style={[styles.divider, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea' }]} />
                {arrayInfo.disks.map((disk, index) => {
                  const diskUsed = Number(disk.fsUsed || 0);
                  const diskTotal = Number(disk.fsSize || disk.size || 0);
                  const diskUsagePercent = diskTotal > 0 ? (diskUsed / diskTotal) * 100 : 0;
                  const hasUsageData = disk.fsSize && disk.fsUsed;
                  
                  return (
                  <View key={index} style={styles.diskRow}>
                    <View style={styles.diskInfo}>
                      <View style={styles.diskHeader}>
                          <Text style={[styles.diskName, { color: isDark ? '#ffffff' : '#000000' }]}>{disk.name}</Text>
                          <View style={[styles.statusIndicator, { backgroundColor: disk.status === 'DISK_OK' ? '#34c759' : disk.status === 'DISK_NP' ? '#8e8e93' : '#ff3b30' }]} />
                        {disk.temp && (
                            <Text style={[styles.diskTemp, { color: disk.temp > 45 ? '#ff9500' : isDark ? '#8e8e93' : '#6e6e73' }]}>
                            {disk.temp}°C
                          </Text>
                        )}
                      </View>
                        
                        {/* Disk usage info */}
                        <View style={styles.diskUsageRow}>
                          <Text style={[styles.diskDetail, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
                            {formatDiskSize(disk.size)}
                </Text>
                          {hasUsageData && (
                            <Text style={[styles.diskUsageText, { color: isDark ? '#a0a0a0' : '#555555' }]}>
                              {formatDiskSize(disk.fsUsed)} / {formatDiskSize(disk.fsSize)} ({diskUsagePercent.toFixed(0)}%)
              </Text>
                          )}
                        </View>
                        
                        {/* Mini progress bar for disk usage */}
                        {hasUsageData && (
                          <View style={[styles.diskProgressContainer, { backgroundColor: isDark ? '#2c2c2e' : '#e5e5ea' }]}>
                            <View 
                              style={[
                                styles.diskProgressBar, 
                                { 
                                  width: `${Math.min(diskUsagePercent, 100)}%`,
                                  backgroundColor: diskUsagePercent > 90 ? '#ff3b30' : diskUsagePercent > 75 ? '#ff9500' : '#34c759'
                                }
                              ]} 
                            />
                      </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>
        )}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: bgColor }]}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#007aff" colors={[paperTheme.colors.primary]} />}
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 80 },
  headerSection: { marginBottom: 24 },
  serverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serverName: { fontSize: 24, fontWeight: 'bold' },
  timeText: { fontSize: 15, fontWeight: '500' },
  uptimeText: { fontSize: 14, marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  chartsContainer: { marginTop: 12, paddingVertical: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '600' },
  expandIcon: { fontSize: 26, fontWeight: '300' },
  circularProgressRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-evenly', alignItems: 'center', paddingVertical: 20, gap: 16 },
  divider: { height: 1, marginVertical: 16 },
  statsGrid: { flexDirection: 'row', gap: 20, marginTop: 8 },
  statColumn: { flex: 1 },
  statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '600' },
  compactSubtext: { fontSize: 14, marginTop: 4 },
  processorSummary: { marginBottom: 12 },
  loadText: { fontSize: 15 },
  coresContainer: { marginTop: 12 },
  coreItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  coreLabel: { fontSize: 12, width: 50 },
  coreProgress: { flex: 1, height: 6, backgroundColor: '#38383a', borderRadius: 3, overflow: 'hidden' },
  coreProgressBar: { height: '100%', borderRadius: 3 },
  corePercentage: { fontSize: 12, width: 40, textAlign: 'right' },
  disksContainer: { marginTop: 12 },
  diskRow: { marginBottom: 16 },
  diskInfo: { gap: 6 },
  diskHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  diskName: { fontSize: 16, fontWeight: '500' },
  statusIndicator: { width: 8, height: 8, borderRadius: 4 },
  diskDetails: { flexDirection: 'row', gap: 16 },
  diskDetail: { fontSize: 13 },
  diskTemp: { fontSize: 12, marginLeft: 'auto' },
  diskUsageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  diskUsageText: { fontSize: 12 },
  diskProgressContainer: { height: 4, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  diskProgressBar: { height: '100%', borderRadius: 2 },
  operationRow: { marginVertical: 12 },
  operationButton: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', minWidth: 140 },
  operationButtonText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  operationDescription: { fontSize: 14, lineHeight: 20, marginTop: 10 },
  bootDeviceContainer: { gap: 12 },
  bootDeviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  bootDeviceLabel: { fontSize: 15, fontWeight: '500' },
  bootDeviceValue: { fontSize: 15, fontWeight: '600' },
  demoBanner: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20, alignItems: 'center' },
  demoBannerText: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  demoBannerSubtext: { fontSize: 14, textAlign: 'center' },
  // Paper styles
  paperHeader: { borderRadius: 16, padding: 20, marginBottom: 16 },
  paperHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  paperTimeContainer: { flexDirection: 'row', alignItems: 'center' },
  paperChipRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  paperMetricsCard: { borderRadius: 16, padding: 20, marginBottom: 16 },
  paperMetricsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  paperMetricItem: { alignItems: 'center', gap: 6 },
  paperMetricIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  paperArrayControl: { marginVertical: 12, paddingTop: 8 },
});
