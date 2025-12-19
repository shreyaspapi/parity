import { useAuth } from '@/src/providers/auth-provider';
import { authService } from '@/src/services/auth.service';
import { SavedServer, storageService } from '@/src/services/storage.service';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

// Re-export SavedServer type for backward compatibility
export type { SavedServer } from '@/src/services/storage.service';

function generateId(): string {
  return 'srv_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export interface ServerWithActiveStatus extends SavedServer {
  isActive: boolean;
}

export function useServerManagement() {
  const { activeServerId, switchServer } = useAuth();
  const [servers, setServers] = useState<ServerWithActiveStatus[]>([]);
  const [name, setName] = useState('');
  const [serverIP, setServerIP] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Load servers and annotate with active status
  const loadServers = useCallback(async () => {
    try {
      const list = await storageService.getServers();
      const currentActiveId = await storageService.getActiveServerId();
      
      // Add isActive flag to each server
      const serversWithStatus: ServerWithActiveStatus[] = list.map(server => ({
        ...server,
        isActive: server.id === currentActiveId,
      }));
      
      setServers(serversWithStatus);
    } catch (error) {
      console.error('Failed to load servers:', error);
      setServers([]);
    }
  }, []);

  // Reload when active server changes
  useEffect(() => {
    loadServers();
  }, [loadServers, activeServerId]);

  const addServer = useCallback(async (makeActiveAfterAdd: boolean = false) => {
    if (!name.trim() || !serverIP.trim() || !apiKey.trim()) {
      Alert.alert('Missing info', 'Please fill all fields.');
      return { success: false, error: 'Missing fields' };
    }
    
    setBusy(true);
    setConnectionError(null);
    
    try {
      // First validate the connection
      const validation = await authService.validateCredentials({
        serverIP: serverIP.trim(),
        apiKey: apiKey.trim(),
      });
      
      if (!validation.success) {
        setConnectionError(validation.error || 'Connection failed');
        Alert.alert('Connection Failed', validation.error || 'Could not connect to server');
        return { success: false, error: validation.error };
      }
      
      // Connection valid, add the server
      const newServer: SavedServer = {
        id: generateId(),
        name: name.trim(),
        serverIP: serverIP.trim(),
        apiKey: apiKey.trim(),
      };
      
      const isFirstServer = servers.length === 0;
      
      // Add server to storage
      await storageService.addServer(newServer, makeActiveAfterAdd || isFirstServer);
      
      // Clear form
      setName('');
      setServerIP('');
      setApiKey('');
      setConnectionError(null);
      
      // Reload server list
      await loadServers();
      
      // If this was the first server or we explicitly want to make it active, switch to it
      if (makeActiveAfterAdd || isFirstServer) {
        await switchServer(newServer);
        Alert.alert('Server Added', `${newServer.name} has been added and is now active.`);
      } else {
        Alert.alert('Server Added', `${newServer.name} has been added to your servers.`);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Failed to add server', error);
      const errorMessage = error?.message || 'Failed to add server';
      setConnectionError(errorMessage);
      Alert.alert('Error', errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setBusy(false);
    }
  }, [apiKey, name, serverIP, servers.length, loadServers, switchServer]);

  const removeServer = useCallback(
    async (id: string) => {
      const serverToRemove = servers.find(s => s.id === id);
      if (!serverToRemove) return;
      
      // Show confirmation with different message if it's the active server
      const isActiveServer = serverToRemove.isActive;
      const message = isActiveServer
        ? `Are you sure you want to remove "${serverToRemove.name}"? This is your active server - you will be disconnected.`
        : `Are you sure you want to remove "${serverToRemove.name}"?`;
      
      const performRemove = async () => {
        setBusy(true);
        try {
          await storageService.removeServer(id);
          await loadServers();
          
          if (isActiveServer) {
            Alert.alert('Server Removed', 'Active server was removed. Please select or add a new server.');
          }
        } catch (error: any) {
          console.error('Failed to remove server', error);
          Alert.alert('Error', error?.message || 'Failed to remove server');
        } finally {
          setBusy(false);
        }
      };

      if (Platform.OS === 'web') {
        // Web doesn't have native Alert.alert with callbacks
        performRemove();
      } else {
        Alert.alert(
          'Remove Server',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: performRemove },
          ]
        );
      }
    },
    [servers, loadServers]
  );

  const makeActive = useCallback(
    async (server: SavedServer) => {
      if (server.id === activeServerId) {
        Alert.alert('Already Active', `${server.name} is already your active server.`);
        return;
      }
      
      setBusy(true);
      setConnectionError(null);
      
      try {
        await switchServer(server);
        await loadServers();
        Alert.alert('Server Switched', `Now connected to ${server.name}`);
      } catch (error: any) {
        console.error('Failed to switch server', error);
        const errorMessage = error?.message || 'Failed to switch server';
        setConnectionError(errorMessage);
        Alert.alert('Connection Failed', errorMessage);
      } finally {
        setBusy(false);
      }
    },
    [activeServerId, switchServer, loadServers]
  );

  // Get just the active server
  const activeServer = servers.find(s => s.isActive) || null;

  return {
    servers,
    activeServer,
    activeServerId,
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
    reload: loadServers,
  };
}

