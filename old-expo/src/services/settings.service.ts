/**
 * Settings Service
 * Manages user preferences and app settings
 */

import { AppConfig } from '@/src/config/app.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AppSettings {
  pollingInterval?: number;
  // Add other settings here as needed in the future
}

const SETTINGS_KEY = AppConfig.storage.keys.settings;

class SettingsService {
  /**
   * Get all app settings
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const raw = await AsyncStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        return this.getDefaultSettings();
      }
      const settings = JSON.parse(raw) as AppSettings;
      return { ...this.getDefaultSettings(), ...settings };
    } catch (error) {
      console.error('Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * Get default settings
   */
  getDefaultSettings(): AppSettings {
    return {
      pollingInterval: AppConfig.graphql.defaultPollInterval,
    };
  }

  /**
   * Update specific settings
   */
  async updateSettings(partial: Partial<AppSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...partial };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw new Error('Failed to save settings');
    }
  }

  /**
   * Get polling interval
   */
  async getPollingInterval(): Promise<number> {
    try {
      const settings = await this.getSettings();
      return settings.pollingInterval ?? AppConfig.graphql.defaultPollInterval;
    } catch (error) {
      console.error('Failed to get polling interval:', error);
      return AppConfig.graphql.defaultPollInterval;
    }
  }

  /**
   * Set polling interval
   */
  async setPollingInterval(interval: number): Promise<void> {
    await this.updateSettings({ pollingInterval: interval });
  }

  /**
   * Reset all settings to defaults
   */
  async resetSettings(): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(this.getDefaultSettings()));
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw new Error('Failed to reset settings');
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();

