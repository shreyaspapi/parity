/**
 * Custom hook to manage and retrieve polling interval from user settings
 */

import { AppConfig } from '@/src/config/app.config';
import { settingsService } from '@/src/services/settings.service';
import { useEffect, useState } from 'react';

/**
 * Hook to get the user's preferred polling interval
 * Returns the polling interval and a function to update it
 */
export function usePollingInterval() {
  const [pollingInterval, setPollingInterval] = useState<number>(
    AppConfig.graphql.defaultPollInterval
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPollingInterval();
  }, []);

  const loadPollingInterval = async () => {
    try {
      const interval = await settingsService.getPollingInterval();
      setPollingInterval(interval);
    } catch (error) {
      console.error('Failed to load polling interval:', error);
      setPollingInterval(AppConfig.graphql.defaultPollInterval);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePollingInterval = async (interval: number) => {
    try {
      await settingsService.setPollingInterval(interval);
      setPollingInterval(interval);
    } catch (error) {
      console.error('Failed to update polling interval:', error);
      throw error;
    }
  };

  return {
    pollingInterval: pollingInterval || undefined, // Return undefined if 0 (disabled)
    updatePollingInterval,
    isLoading,
    refresh: loadPollingInterval,
  };
}

