/**
 * Application Configuration
 * Central place for all app-wide configuration constants
 */

export const AppConfig = {
  // API Configuration
  api: {
    defaultTimeout: 10000, // 10 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
  },

  // GraphQL Configuration
  graphql: {
    defaultPollInterval: 5000, // 5 seconds - for real-time dashboard updates
    fetchPolicy: 'cache-and-network' as const,
    pollingIntervalOptions: [
      { label: '3 seconds', value: 3000 },
      { label: '5 seconds', value: 5000 },
      { label: '10 seconds', value: 10000 },
      { label: '15 seconds', value: 15000 },
      { label: '30 seconds', value: 30000 },
      { label: '1 minute', value: 60000 },
      { label: 'Disabled', value: 0 },
    ],
  },

  // Storage Keys
  storage: {
    keys: {
      serverIP: '@unraid_server_ip',
      apiKey: '@unraid_api_key',
      isAuthenticated: '@unraid_is_authenticated',
      servers: '@unraid_servers', // JSON array of saved servers
      activeServerId: '@unraid_active_server_id',
      settings: '@unraid_app_settings', // JSON object for app settings
      lastDashboard: '@unraid_last_dashboard', // cached dashboard payload
    },
  },

  // UI Configuration
  ui: {
    animationDuration: 300,
    toastDuration: 3000,
  },

  // Feature Flags (for future use)
  features: {
    enableNotifications: true,
    enableRealTimeUpdates: true,
    enableDarkMode: true,
  },
} as const;

export type AppConfigType = typeof AppConfig;

