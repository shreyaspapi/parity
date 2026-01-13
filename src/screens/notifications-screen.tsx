import { ErrorMessage } from '@/src/components/ui/error-message';
import { LoadingScreen } from '@/src/components/ui/loading-screen';
import { GET_NOTIFICATIONS } from '@/src/graphql/queries';
import { usePollingInterval } from '@/src/hooks/usePollingInterval';
import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { DemoDataService } from '@/src/services/demo-data.service';
import { useQuery } from '@apollo/client/react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Linking, Platform, RefreshControl, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Badge,
  Chip,
  Card as PaperCard,
  Text as PaperText,
  SegmentedButtons,
  Surface,
  useTheme as usePaperTheme
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

// iOS native Card component
import { Card } from '@/src/components/ui/card';

type NotificationTypeValue = 'UNREAD' | 'ARCHIVE';
type NotificationImportanceValue = 'ALERT' | 'WARNING' | 'INFO';
type ImportanceFilter = NotificationImportanceValue | 'ALL';

interface NotificationCounts {
  info: number;
  warning: number;
  alert: number;
  total: number;
}

interface NotificationItem {
  id: string;
  title: string;
  subject: string;
  description: string;
  importance: NotificationImportanceValue;
  type: NotificationTypeValue;
  link?: string | null;
  timestamp?: string | null;
  formattedTimestamp?: string | null;
}

interface NotificationsQueryData {
  notifications: {
    overview: {
      unread: NotificationCounts;
      archive: NotificationCounts;
    };
    list: NotificationItem[];
  };
}

type NotificationOverview = NotificationsQueryData['notifications']['overview'];

interface NotificationFilterInput {
  type: NotificationTypeValue;
  offset: number;
  limit: number;
  importance?: NotificationImportanceValue;
}

const TYPE_COLORS: Record<NotificationTypeValue, string> = {
  UNREAD: '#0a84ff',
  ARCHIVE: '#8e8e93',
};

const IMPORTANCE_COLORS: Record<NotificationImportanceValue, string> = {
  ALERT: '#ff453a',
  WARNING: '#ff9f0a',
  INFO: '#32ade6',
};

/**
 * Parse Unraid notification subject to extract meaningful parts
 * Raw format: "Notice [UNRAID] - array health report [PASS]"
 * Extracts: { displaySubject: "Array Health Report", category: "UNRAID", status: "PASS" }
 */
function parseNotificationSubject(rawSubject: string): { displaySubject: string; category?: string; status?: string } {
  // Pattern: "Notice [CATEGORY] - title [STATUS]" or "Alert [CATEGORY] - title [STATUS]"
  const pattern = /^(?:Notice|Alert|Warning)\s*\[([^\]]+)\]\s*-\s*(.+?)\s*(?:\[([^\]]+)\])?$/i;
  const match = rawSubject.match(pattern);

  if (match) {
    const category = match[1]?.trim();
    let subject = match[2]?.trim() || rawSubject;
    const status = match[3]?.trim();

    // Capitalize first letter of each word for display
    subject = subject.replace(/\b\w/g, (c) => c.toUpperCase());

    return { displaySubject: subject, category, status };
  }

  // If no pattern match, just return the original subject
  return { displaySubject: rawSubject };
}

export function NotificationsScreen() {
  const { isDark } = useTheme();
  const { t } = useLocalization();
  const paperTheme = usePaperTheme();
  const { pollingInterval } = usePollingInterval();

  const [selectedType, setSelectedType] = useState<NotificationTypeValue>('UNREAD');
  const [importanceFilter, setImportanceFilter] = useState<ImportanceFilter>('ALL');
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(DemoDataService.isDemoMode());
  }, []);

  const filterInput = useMemo<NotificationFilterInput>(() => {
    const filter: NotificationFilterInput = {
      type: selectedType,
      offset: 0,
      limit: 50,
    };
    if (importanceFilter !== 'ALL') {
      filter.importance = importanceFilter;
    }
    return filter;
  }, [selectedType, importanceFilter]);

  const queryResult = useQuery<NotificationsQueryData>(GET_NOTIFICATIONS, {
    variables: { filter: filterInput },
    pollInterval: pollingInterval,
    notifyOnNetworkStatusChange: true,
    skip: isDemoMode,
  });

  const demoData = useMemo<NotificationsQueryData | null>(() => {
    if (!isDemoMode) return null;
    const raw = DemoDataService.getNotificationsData();
    const filteredList = raw.notifications.list
      .filter(
        (item) =>
          item.type === selectedType &&
          (importanceFilter === 'ALL' || item.importance === importanceFilter)
      )
      .slice(filterInput.offset, filterInput.offset + filterInput.limit);
    return { notifications: { overview: raw.notifications.overview, list: filteredList } };
  }, [filterInput.limit, filterInput.offset, importanceFilter, isDemoMode, selectedType]);

  const notificationsPayload = isDemoMode ? demoData?.notifications : queryResult.data?.notifications;

  const [renderedNotifications, setRenderedNotifications] = useState<NotificationItem[]>(
    () => notificationsPayload?.list ?? []
  );
  const [overviewState, setOverviewState] = useState<NotificationOverview | null>(
    () => notificationsPayload?.overview ?? null
  );

  useEffect(() => {
    if (!notificationsPayload) return;
    const nextList = notificationsPayload.list ?? [];
    setRenderedNotifications((previous) =>
      haveNotificationListsChanged(previous, nextList) ? nextList : previous
    );
    setOverviewState((previous) =>
      haveOverviewChanged(previous, notificationsPayload.overview) ? notificationsPayload.overview : previous
    );
  }, [notificationsPayload]);

  const loading = isDemoMode ? false : queryResult.loading;
  const error = isDemoMode ? undefined : queryResult.error;
  const networkStatus = isDemoMode ? 7 : queryResult.networkStatus;
  const isRefetching = !isDemoMode && networkStatus === 4;

  const notifications = renderedNotifications;
  const overview = overviewState ?? notificationsPayload?.overview ?? null;
  const hasInitialData = Boolean(notificationsPayload) || notifications.length > 0 || !!overview;
  const activeCounts = selectedType === 'UNREAD' ? overview?.unread : overview?.archive;

  const handleRefresh = useCallback(async () => {
    if (isDemoMode) return;
    await queryResult.refetch({ filter: filterInput });
  }, [filterInput, isDemoMode, queryResult]);

  const handleOpenLink = useCallback(async (link?: string | null) => {
    if (!link) return;
    try {
      await Linking.openURL(link);
    } catch (err) {
      console.warn('Failed to open link', err);
    }
  }, []);

  const keyExtractor = useCallback((item: NotificationItem) => item.id, []);

  // Early returns must come after all hooks
  if (!hasInitialData && !isDemoMode && loading) {
    return <LoadingScreen message={t('loading.notifications')} />;
  }

  if (error && !hasInitialData) {
    return (
      <ErrorMessage
        message={error.message || t('notifications.errorLoadingNotifications')}
        onRetry={handleRefresh}
      />
    );
  }

  // iOS native render
  const renderIOSNotificationItem = ({ item }: { item: NotificationItem }) => {
    const importanceColor = IMPORTANCE_COLORS[item.importance] || '#8e8e93';
    const timestamp =
      item.formattedTimestamp ??
      (item.timestamp ? new Date(item.timestamp).toLocaleString() : t('notifications.unknownTime'));

    // Parse the notification subject to extract meaningful parts
    const { displaySubject, status } = parseNotificationSubject(item.subject);

    const getStatusColor = (s: string) => {
      const upper = s.toUpperCase();
      if (upper === 'PASS' || upper === 'OK' || upper === 'SUCCESS') return '#34c759';
      if (upper === 'FAIL' || upper === 'ERROR' || upper === 'CRITICAL') return '#ff3b30';
      return '#8e8e93';
    };

    return (
      <Card>
        {/* Header row with badges */}
        <View style={styles.iosHeaderRow}>
          <View style={[styles.importancePill, { borderColor: importanceColor, backgroundColor: `${importanceColor}1A` }]}>
            <PaperText style={[styles.importanceText, { color: importanceColor }]}>
              {(item.importance || 'INFO').toLowerCase()}
            </PaperText>
          </View>
          {status && (
            <View style={[styles.statusBadge, { 
              backgroundColor: `${getStatusColor(status)}20`,
              borderColor: getStatusColor(status)
            }]}>
              <PaperText style={[styles.statusText, { color: getStatusColor(status) }]}>
                {status}
              </PaperText>
            </View>
          )}
        </View>

        {/* Title */}
        <PaperText variant="titleMedium" style={[styles.iosTitle, { color: isDark ? '#ffffff' : '#000000' }]}>
          {item.title}
        </PaperText>

        {/* Subject (parsed and highlighted) */}
        <PaperText variant="bodyMedium" style={[styles.iosSubject, { color: '#007aff' }]}>
          {displaySubject}
        </PaperText>

        {/* Description */}
        <PaperText variant="bodyMedium" style={[styles.iosDescription, { color: isDark ? '#d1d1d6' : '#3a3a3c' }]}>
          {item.description}
        </PaperText>

        {/* Footer */}
        <View style={styles.notificationFooter}>
          <View style={styles.iosTimestampRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={isDark ? '#8e8e93' : '#6e6e73'} />
            <PaperText variant="labelSmall" style={{ color: isDark ? '#8e8e93' : '#6e6e73', marginLeft: 4 }}>
            {timestamp}
            </PaperText>
          </View>
          {item.link && (
            <TouchableOpacity onPress={() => handleOpenLink(item.link)} style={styles.iosLinkButton}>
              <PaperText style={{ color: '#007aff', fontWeight: '600', fontSize: 13 }}>
                {t('notifications.open')}
              </PaperText>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#007aff" />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  // Android/Web Paper render
  const renderPaperNotificationItem = ({ item }: { item: NotificationItem }) => {
    const timestamp =
      item.formattedTimestamp ??
      (item.timestamp ? new Date(item.timestamp).toLocaleString() : t('notifications.unknownTime'));

    // Parse the notification subject to extract meaningful parts
    const { displaySubject } = parseNotificationSubject(item.subject);

    // Better theme-aware colors for light/dark mode
    const cardBg = isDark ? '#1c1c1e' : '#ffffff';
    const textPrimary = isDark ? '#ffffff' : '#1a1a1a';
    const textSecondary = isDark ? '#a0a0a0' : '#555555';
    const subjectColor = isDark ? '#5eb5ff' : '#0066cc';
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

    const getIcon = () => {
      switch (item.importance) {
        case 'ALERT': return 'alert-circle';
        case 'WARNING': return 'alert';
        default: return 'information';
      }
    };

    // Adjusted importance colors for better visibility in both themes
    const getImportanceStyle = () => {
      switch (item.importance) {
        case 'ALERT': 
          return { 
            bg: isDark ? 'rgba(239,83,80,0.15)' : 'rgba(211,47,47,0.1)', 
            color: isDark ? '#ef5350' : '#c62828' 
          };
        case 'WARNING': 
          return { 
            bg: isDark ? 'rgba(255,183,77,0.15)' : 'rgba(245,124,0,0.1)', 
            color: isDark ? '#ffb74d' : '#e65100' 
          };
        default: 
          return { 
            bg: isDark ? 'rgba(100,181,246,0.15)' : 'rgba(25,118,210,0.1)', 
            color: isDark ? '#64b5f6' : '#1565c0' 
          };
      }
    };

    const importanceStyle = getImportanceStyle();

    return (
      <PaperCard 
        style={[styles.paperNotificationCard, { backgroundColor: cardBg }]} 
        mode="elevated"
      >
        <PaperCard.Content style={styles.paperCardContent}>
          {/* Header with icon and badge */}
          <View style={styles.paperNotificationTopRow}>
            <View style={[styles.iconContainer, { backgroundColor: importanceStyle.bg }]}>
              <MaterialCommunityIcons name={getIcon()} size={22} color={importanceStyle.color} />
            </View>
            <View style={[styles.paperBadge, { backgroundColor: importanceStyle.bg }]}>
              <PaperText style={[styles.paperBadgeText, { color: importanceStyle.color }]}>
                {item.importance}
              </PaperText>
            </View>
          </View>

          {/* Title */}
          <PaperText variant="titleMedium" style={[styles.paperNotificationTitle, { color: textPrimary }]}>
            {item.title}
          </PaperText>

          {/* Subject (parsed) */}
          <PaperText variant="bodyMedium" style={[styles.paperNotificationSubject, { color: subjectColor }]}>
            {displaySubject}
          </PaperText>

          {/* Description */}
          <PaperText variant="bodyMedium" style={[styles.paperNotificationDescription, { color: textSecondary }]}>
            {item.description}
          </PaperText>

          {/* Footer */}
          <View style={[styles.paperNotificationFooter, { borderTopColor: borderColor }]}>
            <View style={styles.paperTimestampContainer}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={textSecondary} />
              <PaperText variant="labelSmall" style={{ color: textSecondary, marginLeft: 6 }}>
                {timestamp}
              </PaperText>
            </View>
            {item.link && (
              <TouchableOpacity onPress={() => handleOpenLink(item.link)} style={styles.paperLinkButton}>
                <PaperText style={{ color: subjectColor, fontWeight: '600', fontSize: 13 }}>
                  {t('notifications.open')}
                </PaperText>
                <MaterialCommunityIcons name="arrow-right" size={16} color={subjectColor} />
              </TouchableOpacity>
            )}
          </View>
        </PaperCard.Content>
      </PaperCard>
    );
  };

  // iOS native chip
  const renderIOSChip = (key: string, label: string, color: string, selected: boolean, onPress: () => void) => {
    const selectedTextColor = color === TYPE_COLORS.ARCHIVE ? '#000000' : '#ffffff';
    const textColor = selected ? selectedTextColor : color;
    const backgroundColor = selected ? color : 'transparent';
    return (
      <TouchableOpacity
        key={key}
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.iosChip, { borderColor: color, backgroundColor }]}
      >
        <PaperText style={[styles.iosChipLabel, { color: textColor }]}>{label}</PaperText>
      </TouchableOpacity>
    );
  };

  // Summary Card - iOS
  const iosSummaryCard = (
    <Card>
      <PaperText variant="labelLarge" style={{ color: isDark ? '#8e8e93' : '#6e6e73', textTransform: 'uppercase', marginBottom: 12 }}>
        {selectedType === 'UNREAD' ? t('notifications.unread') : t('notifications.archived')} {t('notifications.summary')}
      </PaperText>
      <View style={styles.summaryRow}>
        <PaperText variant="displaySmall" style={{ fontWeight: 'bold' }}>{activeCounts?.total ?? 0}</PaperText>
        <PaperText variant="bodyMedium" style={{ color: isDark ? '#8e8e93' : '#6e6e73', marginLeft: 12 }}>
          {t('notifications.totalNotifications')}
        </PaperText>
      </View>
      <View style={styles.summaryBreakdown}>
        <View style={[styles.summaryItem, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fb', borderColor: isDark ? '#2c2c2e' : '#e5e5ea' }]}>
          <View style={[styles.summaryDot, { backgroundColor: IMPORTANCE_COLORS.INFO }]} />
          <PaperText variant="labelSmall" style={{ color: isDark ? '#8e8e93' : '#6e6e73', textTransform: 'uppercase' }}>
            {t('notifications.info')}
          </PaperText>
          <PaperText variant="titleMedium" style={{ fontWeight: '600' }}>{activeCounts?.info ?? 0}</PaperText>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fb', borderColor: isDark ? '#2c2c2e' : '#e5e5ea' }]}>
          <View style={[styles.summaryDot, { backgroundColor: IMPORTANCE_COLORS.WARNING }]} />
          <PaperText variant="labelSmall" style={{ color: isDark ? '#8e8e93' : '#6e6e73', textTransform: 'uppercase' }}>
            {t('notifications.warnings')}
          </PaperText>
          <PaperText variant="titleMedium" style={{ fontWeight: '600' }}>{activeCounts?.warning ?? 0}</PaperText>
        </View>
        <View style={[styles.summaryItem, { backgroundColor: isDark ? '#1c1c1e' : '#f8f9fb', borderColor: isDark ? '#2c2c2e' : '#e5e5ea' }]}>
          <View style={[styles.summaryDot, { backgroundColor: IMPORTANCE_COLORS.ALERT }]} />
          <PaperText variant="labelSmall" style={{ color: isDark ? '#8e8e93' : '#6e6e73', textTransform: 'uppercase' }}>
            {t('notifications.alerts')}
          </PaperText>
          <PaperText variant="titleMedium" style={{ fontWeight: '600' }}>{activeCounts?.alert ?? 0}</PaperText>
        </View>
      </View>
    </Card>
  );

  // Summary Card - Paper
  const paperSummaryCard = (
    <Surface style={styles.paperSummaryCard} elevation={2}>
      <View style={styles.paperSummaryHeader}>
        <PaperText variant="labelLarge" style={{ color: paperTheme.colors.onSurfaceVariant, textTransform: 'uppercase' }}>
          {selectedType === 'UNREAD' ? t('notifications.unread') : t('notifications.archived')} {t('notifications.summary')}
        </PaperText>
        <Badge size={24} style={{ backgroundColor: paperTheme.colors.primary }}>{activeCounts?.total ?? 0}</Badge>
      </View>

      <View style={styles.paperSummaryStats}>
        <View style={styles.paperStatItem}>
          <View style={[styles.paperStatIcon, { backgroundColor: `${IMPORTANCE_COLORS.INFO}20` }]}>
            <MaterialCommunityIcons name="information" size={20} color={IMPORTANCE_COLORS.INFO} />
          </View>
          <PaperText variant="headlineSmall" style={{ fontWeight: 'bold' }}>{activeCounts?.info ?? 0}</PaperText>
          <PaperText variant="labelSmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('notifications.info')}</PaperText>
        </View>
        <View style={styles.paperStatItem}>
          <View style={[styles.paperStatIcon, { backgroundColor: `${IMPORTANCE_COLORS.WARNING}20` }]}>
            <MaterialCommunityIcons name="alert" size={20} color={IMPORTANCE_COLORS.WARNING} />
          </View>
          <PaperText variant="headlineSmall" style={{ fontWeight: 'bold' }}>{activeCounts?.warning ?? 0}</PaperText>
          <PaperText variant="labelSmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('notifications.warnings')}</PaperText>
        </View>
        <View style={styles.paperStatItem}>
          <View style={[styles.paperStatIcon, { backgroundColor: `${IMPORTANCE_COLORS.ALERT}20` }]}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={IMPORTANCE_COLORS.ALERT} />
          </View>
          <PaperText variant="headlineSmall" style={{ fontWeight: 'bold' }}>{activeCounts?.alert ?? 0}</PaperText>
          <PaperText variant="labelSmall" style={{ color: paperTheme.colors.onSurfaceVariant }}>{t('notifications.alerts')}</PaperText>
        </View>
      </View>
    </Surface>
  );

  // iOS Filters
  const iosFilters = (
    <>
      <View style={styles.chipRow}>
        {renderIOSChip('type-unread', t('notifications.unread'), TYPE_COLORS.UNREAD, selectedType === 'UNREAD', () => setSelectedType('UNREAD'))}
        {renderIOSChip('type-archive', t('notifications.archived'), TYPE_COLORS.ARCHIVE, selectedType === 'ARCHIVE', () => setSelectedType('ARCHIVE'))}
      </View>
      <View style={styles.chipRow}>
        {[
          { key: 'ALL' as ImportanceFilter, label: t('notifications.all'), color: '#007aff' },
          { key: 'ALERT' as ImportanceFilter, label: t('notifications.alerts'), color: IMPORTANCE_COLORS.ALERT },
          { key: 'WARNING' as ImportanceFilter, label: t('notifications.warnings'), color: IMPORTANCE_COLORS.WARNING },
          { key: 'INFO' as ImportanceFilter, label: t('notifications.info'), color: IMPORTANCE_COLORS.INFO },
        ].map(({ key, label, color }) =>
          renderIOSChip(`importance-${key.toLowerCase()}`, label, color, importanceFilter === key, () => setImportanceFilter(key))
        )}
      </View>
    </>
  );

  // Paper Filters
  const paperFilters = (
    <View style={styles.paperFilters}>
      <SegmentedButtons
        value={selectedType}
        onValueChange={(value) => setSelectedType(value as NotificationTypeValue)}
        buttons={[
          { value: 'UNREAD', label: t('notifications.unread'), icon: 'email-outline' },
          { value: 'ARCHIVE', label: t('notifications.archived'), icon: 'archive-outline' },
        ]}
        style={{ marginBottom: 12 }}
      />
      <View style={styles.paperChipRow}>
        {[
          { key: 'ALL' as ImportanceFilter, label: t('notifications.all'), icon: 'filter-variant' },
          { key: 'ALERT' as ImportanceFilter, label: t('notifications.alerts'), icon: 'alert-circle', color: IMPORTANCE_COLORS.ALERT },
          { key: 'WARNING' as ImportanceFilter, label: t('notifications.warnings'), icon: 'alert', color: IMPORTANCE_COLORS.WARNING },
          { key: 'INFO' as ImportanceFilter, label: t('notifications.info'), icon: 'information', color: IMPORTANCE_COLORS.INFO },
        ].map(({ key, label, icon, color }) => (
          <Chip
            key={key}
            selected={importanceFilter === key}
            onPress={() => setImportanceFilter(key)}
            icon={icon}
            mode={importanceFilter === key ? 'flat' : 'outlined'}
            style={{ marginRight: 8, marginBottom: 8 }}
            selectedColor={color}
          >
            {label}
          </Chip>
        ))}
      </View>
    </View>
  );

  // iOS Header
  const iosListHeader = (
    <>
      <PaperText variant="headlineMedium" style={{ fontWeight: 'bold', color: isDark ? '#ffffff' : '#000000', marginBottom: 8 }}>
        {t('notifications.title')}
      </PaperText>
      <PaperText variant="bodyMedium" style={{ color: isDark ? '#8e8e93' : '#6e6e73', marginBottom: 12 }}>
        {t('notifications.subtitle')}
      </PaperText>
      {iosSummaryCard}
      {iosFilters}
    </>
  );

  // Paper Header
  const paperListHeader = (
    <View style={styles.paperHeader}>
      <PaperText variant="headlineMedium" style={{ fontWeight: 'bold', color: paperTheme.colors.onBackground }}>
        {t('notifications.title')}
      </PaperText>
      <PaperText variant="bodyMedium" style={{ color: paperTheme.colors.onSurfaceVariant, marginTop: 4, marginBottom: 16 }}>
        {t('notifications.subtitle')}
      </PaperText>
      {paperSummaryCard}
      {paperFilters}
    </View>
  );

  const isIOS = Platform.OS === 'ios';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isIOS ? (isDark ? '#000000' : '#f2f2f7') : paperTheme.colors.background }]}
      edges={['top']}
    >
      <FlatList
        key={`${selectedType}-${importanceFilter}`}
        data={notifications}
        keyExtractor={keyExtractor}
        renderItem={isIOS ? renderIOSNotificationItem : renderPaperNotificationItem}
        style={[styles.container, { backgroundColor: isIOS ? (isDark ? '#000000' : '#f2f2f7') : paperTheme.colors.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor="#007aff"
            colors={[paperTheme.colors.primary]}
          />
        }
        ListHeaderComponent={isIOS ? iosListHeader : paperListHeader}
        ListEmptyComponent={
          <Surface style={styles.emptyCard} elevation={isIOS ? 0 : 1}>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={48}
              color={isIOS ? (isDark ? '#8e8e93' : '#6e6e73') : paperTheme.colors.onSurfaceVariant}
            />
            <PaperText
              variant="bodyLarge"
              style={{ color: isIOS ? (isDark ? '#8e8e93' : '#6e6e73') : paperTheme.colors.onSurfaceVariant, marginTop: 12, textAlign: 'center' }}
          >
            {t('notifications.noNotificationsFiltered')}
            </PaperText>
          </Surface>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

function haveNotificationListsChanged(previous: NotificationItem[], next: NotificationItem[]) {
  if (previous === next) return false;
  if (previous.length !== next.length) return true;
  for (let i = 0; i < next.length; i++) {
    const prevItem = previous[i];
    const nextItem = next[i];
    if (!prevItem || !nextItem) return true;
    if (
      prevItem.id !== nextItem.id ||
      prevItem.type !== nextItem.type ||
      prevItem.importance !== nextItem.importance ||
      prevItem.title !== nextItem.title ||
      prevItem.subject !== nextItem.subject ||
      prevItem.description !== nextItem.description ||
      prevItem.link !== nextItem.link ||
      prevItem.timestamp !== nextItem.timestamp ||
      prevItem.formattedTimestamp !== nextItem.formattedTimestamp
    ) {
      return true;
    }
  }
  return false;
}

function haveOverviewChanged(previous: NotificationOverview | null, next?: NotificationOverview | null) {
  if (previous === next) return false;
  if (!previous || !next) return true;
  const fields: Array<keyof NotificationCounts> = ['info', 'warning', 'alert', 'total'];
  for (const field of fields) {
    if (previous.unread[field] !== next.unread[field] || previous.archive[field] !== next.archive[field]) {
      return true;
    }
  }
  return false;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  // iOS styles
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  iosChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  iosChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryBreakdown: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  // iOS notification styles
  iosHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  iosTitle: {
    fontWeight: '600',
    fontSize: 17,
    marginBottom: 6,
  },
  iosSubject: {
    fontWeight: '500',
    marginBottom: 8,
  },
  iosDescription: {
    lineHeight: 20,
    marginBottom: 4,
  },
  iosTimestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iosLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  importancePill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  importanceText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notificationFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Paper styles
  paperHeader: {
    marginBottom: 8,
  },
  paperSummaryCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  paperSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  paperSummaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  paperStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  paperStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  paperFilters: {
    marginBottom: 16,
  },
  paperChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  paperNotificationCard: {
    borderRadius: 16,
    marginBottom: 0,
  },
  paperCardContent: {
    padding: 16,
  },
  paperNotificationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paperBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  paperBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  paperBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperNotificationTitle: {
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 6,
  },
  paperNotificationSubject: {
    fontWeight: '500',
    marginBottom: 10,
  },
  paperNotificationDescription: {
    lineHeight: 22,
  },
  paperTimestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paperLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paperNotificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.15)',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
