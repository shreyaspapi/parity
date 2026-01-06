import { ServerWithActiveStatus, useServerManagement } from '@/src/hooks/useServerManagement';
import { useLocalization } from '@/src/providers/localization-provider';
import { useTheme } from '@/src/providers/theme-provider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ServersRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { t } = useLocalization();
  const { servers, busy, makeActive, removeServer } = useServerManagement();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: t('servers.title'),
      // keep native back button on the left
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/add-server')} style={{ paddingHorizontal: 12 }}>
          <Text style={{ color: '#007aff', fontWeight: '600', fontSize: 16 }}>+</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, t]);

  const renderItem = ({ item }: { item: ServerWithActiveStatus }) => (
    <View style={[
      styles.card,
      item.isActive && { borderWidth: 2, borderColor: '#34c759' }
    ]}>
      <View style={styles.row}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={item.isActive ? 'server-network' : 'server'} 
            size={24} 
            color={item.isActive ? '#34c759' : (isDark ? '#8e8e93' : '#6e6e73')} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.serverName, { color: isDark ? '#ffffff' : '#000000' }]}>{item.name}</Text>
            {item.isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={[styles.serverUrl, { color: isDark ? '#8e8e93' : '#6e6e73' }]} numberOfLines={1}>
            {item.serverIP}
          </Text>
        </View>
        <View style={styles.actions}>
          {item.isActive ? (
            <View style={[styles.actionBtn, { backgroundColor: '#34c75920', borderColor: '#34c759' }]}>
              <MaterialCommunityIcons name="check" size={16} color="#34c759" />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionBtn}
              disabled={busy}
              onPress={() => makeActive(item)}
            >
              <Text style={[styles.actionText, { color: '#007aff' }]}>
                {t('servers.connect') || 'Connect'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            disabled={busy}
            onPress={() => removeServer(item.id)}
          >
            <Text style={[styles.actionText, { color: '#ff3b30' }]}>{t('servers.remove')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f2f2f7' }]} edges={['top']}>
      <FlatList
        style={[styles.container, { backgroundColor: isDark ? '#000000' : '#f2f2f7' }]}
        contentContainerStyle={styles.content}
        data={servers}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="server-off" size={48} color={isDark ? '#48484a' : '#c7c7cc'} />
            <Text style={[styles.emptyText, { color: isDark ? '#8e8e93' : '#6e6e73' }]}>
              {t('servers.noSavedServers')}
            </Text>
            <Text style={[styles.emptySubtext, { color: isDark ? '#48484a' : '#8e8e93' }]}>
              Tap + to add your first server
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e5ea',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f2f2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  serverUrl: {
    fontSize: 12,
  },
  activeBadge: {
    backgroundColor: '#34c75920',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: '#34c759',
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5ea',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 14,
  },
});


