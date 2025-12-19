/**
 * Storage Service
 * Handles all secure storage operations using AsyncStorage
 * Provides abstraction layer for credential management
 */

import { AppConfig } from '@/src/config/app.config';
import type { UnraidCredentials } from '@/src/types/unraid.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEMO_MODE_KEY = '@unraid:demo_mode';
const LOCALE_KEY = '@unraid:locale';

export interface SavedServer {
  id: string;
  name: string;
  serverIP: string;
  apiKey: string;
}

class StorageService {
  /**
   * Demo mode management
   */
  async isDemoMode(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(DEMO_MODE_KEY);
      const isDemo = value === 'true';
      console.log('Storage: isDemoMode check:', isDemo);
      return isDemo;
    } catch (error) {
      console.error('Storage: isDemoMode error:', error);
      return false;
    }
  }

  async setDemoMode(enabled: boolean): Promise<void> {
    console.log('Storage: setDemoMode:', enabled);
    await AsyncStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false');
    global.__DEMO_MODE__ = enabled;
    console.log('Storage: Demo mode set, global flag:', global.__DEMO_MODE__);
  }

  async clearDemoMode(): Promise<void> {
    console.log('Storage: clearDemoMode');
    await AsyncStorage.removeItem(DEMO_MODE_KEY);
    global.__DEMO_MODE__ = false;
  }

  /**
   * Server management (multi-server)
   */
  async getServers(): Promise<SavedServer[]> {
    try {
      const raw = await AsyncStorage.getItem(AppConfig.storage.keys.servers);
      if (!raw) return [];
      const servers = JSON.parse(raw);
      if (Array.isArray(servers)) return servers;
      return [];
    } catch {
      return [];
    }
  }

  async saveServers(servers: SavedServer[]): Promise<void> {
    await AsyncStorage.setItem(AppConfig.storage.keys.servers, JSON.stringify(servers));
  }

  /**
   * Get the currently active server ID
   */
  async getActiveServerId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AppConfig.storage.keys.activeServerId);
    } catch (error) {
      console.error('Storage: getActiveServerId error:', error);
      return null;
    }
  }

  /**
   * Set the active server by ID
   * This atomically updates both the active server ID and credentials
   */
  async setActiveServerId(serverId: string | null): Promise<void> {
    try {
      if (serverId === null) {
        await AsyncStorage.removeItem(AppConfig.storage.keys.activeServerId);
        return;
      }
      await AsyncStorage.setItem(AppConfig.storage.keys.activeServerId, serverId);
    } catch (error) {
      console.error('Storage: setActiveServerId error:', error);
      throw error;
    }
  }

  /**
   * Get the active server details (combines active ID lookup with server list)
   */
  async getActiveServer(): Promise<SavedServer | null> {
    try {
      const activeId = await this.getActiveServerId();
      if (!activeId) return null;
      
      const servers = await this.getServers();
      return servers.find(s => s.id === activeId) || null;
    } catch (error) {
      console.error('Storage: getActiveServer error:', error);
      return null;
    }
  }

  /**
   * Switch to a different server - atomic operation
   * Updates active server ID and credentials together
   */
  async switchToServer(server: SavedServer): Promise<void> {
    console.log('Storage: switchToServer:', server.name);
    try {
      // Clear the Apollo cache flag to signal cache should be cleared
      await AsyncStorage.setItem('@unraid:cache_invalidated', Date.now().toString());
      
      // Update active server ID and credentials atomically
      await AsyncStorage.multiSet([
        [AppConfig.storage.keys.activeServerId, server.id],
        [AppConfig.storage.keys.serverIP, server.serverIP],
        [AppConfig.storage.keys.apiKey, server.apiKey],
        [AppConfig.storage.keys.isAuthenticated, 'true'],
      ]);
      
      console.log('Storage: Server switched successfully to:', server.name);
    } catch (error) {
      console.error('Storage: switchToServer error:', error);
      throw error;
    }
  }

  /**
   * Add a new server and optionally make it active
   */
  async addServer(server: SavedServer, makeActive: boolean = false): Promise<void> {
    try {
      const servers = await this.getServers();
      const updated = [...servers, server];
      await this.saveServers(updated);
      
      if (makeActive) {
        await this.switchToServer(server);
      }
      
      console.log('Storage: Server added:', server.name, makeActive ? '(active)' : '');
    } catch (error) {
      console.error('Storage: addServer error:', error);
      throw error;
    }
  }

  /**
   * Remove a server from the list
   * If it's the active server, clears active state
   */
  async removeServer(serverId: string): Promise<void> {
    try {
      const servers = await this.getServers();
      const activeId = await this.getActiveServerId();
      
      const updated = servers.filter(s => s.id !== serverId);
      await this.saveServers(updated);
      
      // If we removed the active server, clear credentials
      if (activeId === serverId) {
        await this.setActiveServerId(null);
        await this.clearCredentials();
        console.log('Storage: Active server was removed, credentials cleared');
      }
      
      console.log('Storage: Server removed:', serverId);
    } catch (error) {
      console.error('Storage: removeServer error:', error);
      throw error;
    }
  }

  /**
   * @deprecated Use switchToServer instead
   */
  async setActiveServer(server: { serverIP: string; apiKey: string }): Promise<void> {
    await this.saveCredentials({ serverIP: server.serverIP, apiKey: server.apiKey });
  }

  /**
   * App settings
   */
  async getSettings<T = any>(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(AppConfig.storage.keys.settings);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async updateSettings(partial: Record<string, any>): Promise<void> {
    const current = (await this.getSettings<Record<string, any>>()) || {};
    const next = { ...current, ...partial };
    await AsyncStorage.setItem(AppConfig.storage.keys.settings, JSON.stringify(next));
  }

  /**
   * Cached dashboard data for offline fallback
   */
  async saveLastDashboard(payload: any): Promise<void> {
    try {
      await AsyncStorage.setItem(AppConfig.storage.keys.lastDashboard, JSON.stringify(payload));
    } catch {}
  }

  async getLastDashboard<T = any>(): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(AppConfig.storage.keys.lastDashboard);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
  /**
   * Save Unraid credentials securely
   */
  async saveCredentials(credentials: UnraidCredentials): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [AppConfig.storage.keys.serverIP, credentials.serverIP],
        [AppConfig.storage.keys.apiKey, credentials.apiKey],
        [AppConfig.storage.keys.isAuthenticated, 'true'],
      ]);
    } catch (error) {
      throw new Error(`Failed to save credentials: ${error}`);
    }
  }

  /**
   * Retrieve stored credentials
   */
  async getCredentials(): Promise<UnraidCredentials | null> {
    try {
      const values = await AsyncStorage.multiGet([
        AppConfig.storage.keys.serverIP,
        AppConfig.storage.keys.apiKey,
      ]);

      const serverIP = values[0][1];
      const apiKey = values[1][1];

      if (!serverIP || !apiKey) {
        return null;
      }

      return { serverIP, apiKey };
    } catch (error) {
      console.error('Failed to retrieve credentials:', error);
      return null;
    }
  }

  /**
   * Get server IP only
   */
  async getServerIP(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AppConfig.storage.keys.serverIP);
    } catch (error) {
      console.error('Failed to retrieve server IP:', error);
      return null;
    }
  }

  /**
   * Get API key only
   */
  async getApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(AppConfig.storage.keys.apiKey);
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(AppConfig.storage.keys.isAuthenticated);
      return value === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all stored credentials (logout)
   */
  async clearCredentials(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        AppConfig.storage.keys.serverIP,
        AppConfig.storage.keys.apiKey,
        AppConfig.storage.keys.isAuthenticated,
      ]);
    } catch (error) {
      throw new Error(`Failed to clear credentials: ${error}`);
    }
  }

  /**
   * Update server IP
   */
  async updateServerIP(serverIP: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AppConfig.storage.keys.serverIP, serverIP);
    } catch (error) {
      throw new Error(`Failed to update server IP: ${error}`);
    }
  }

  /**
   * Update API key
   */
  async updateApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem(AppConfig.storage.keys.apiKey, apiKey);
    } catch (error) {
      throw new Error(`Failed to update API key: ${error}`);
    }
  }

  /**
   * Locale management
   */
  async getLocale(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LOCALE_KEY);
    } catch (error) {
      console.error('Failed to retrieve locale:', error);
      return null;
    }
  }

  async setLocale(locale: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LOCALE_KEY, locale);
    } catch (error) {
      console.error('Failed to save locale:', error);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();

