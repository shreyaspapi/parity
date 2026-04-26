/**
 * Authentication Service
 * Handles authentication logic and credential validation
 */

import type { UnraidCredentials } from '@/src/types/unraid.types';
import { ApolloClient, from, gql, HttpLink, InMemoryCache } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// Simple health check query to validate connection
const HEALTH_CHECK_QUERY = gql`
  query HealthCheck {
    info {
      os {
        platform
      }
    }
  }
`;

/**
 * Create a temporary Apollo Client for credential validation
 */
const createTempApolloClient = (serverIP: string, apiKey: string) => {
  // Use server IP exactly as entered - no automatic formatting
  const uri = serverIP.trim();

  console.log('Creating temp client with:');
  console.log('  URI:', uri);
  console.log('  API Key:', apiKey.substring(0, 10) + '...');

  const httpLink = new HttpLink({
    uri,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  });

  // Error handling link
  const errorLink = onError(({ graphQLErrors, networkError }: any) => {
    if (graphQLErrors) {
      graphQLErrors.forEach((err: any) => {
        console.error(
          `[GraphQL error]: Message: ${err.message || 'Unknown'}, Location: ${err.locations}, Path: ${err.path}`
        );
      });
    }
    if (networkError) {
      console.error(`[Network error]: ${networkError}`);
    }
  });

  return new ApolloClient({
    link: from([errorLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
    },
  });
};

class AuthService {
  /**
   * Validate credentials by attempting a test query
   * Creates a temporary client with the provided server IP and API key
   */
  async validateCredentials(
    credentials: UnraidCredentials
  ): Promise<{ success: boolean; error?: string }> {
    // Create a temporary client with the provided credentials
    const tempClient = createTempApolloClient(credentials.serverIP, credentials.apiKey);
    
    try {
      console.log('Validating credentials for:', credentials.serverIP);
      
      // Add timeout to prevent hanging
      // Note: x-api-key is already set in the authLink, no need to set it again
      const queryPromise = tempClient.query({
        query: HEALTH_CHECK_QUERY,
        fetchPolicy: 'network-only',
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Connection timeout - server did not respond within 10 seconds'));
        }, 10000); // 10 second timeout
      });

      const result = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (result.data && result.data.info) {
        console.log('Validation successful!');
        // Clean up the temporary client
        await tempClient.clearStore();
        return { success: true };
      }

      await tempClient.clearStore();
      return { success: false, error: 'Invalid response from server' };
    } catch (error: any) {
      console.error('Credential validation failed:', error);
      
      // Clean up the temporary client
      await tempClient.clearStore();
      
      const serverURL = credentials.serverIP;
      let errorMessage = 'Failed to connect to Unraid server';
      
      // Check for timeout first
      if (error.message?.includes('timeout') || error.message?.includes('did not respond')) {
        errorMessage = `⏱️ Connection Timeout\n\nServer: ${serverURL}\n\nThe server did not respond within 10 seconds.\n\nPossible issues:\n• Server URL is incorrect\n• Unraid API is not running\n• Device not on same network\n• Firewall blocking connection\n\nVerify:\n1. Server URL format: http://IP:PORT/graphql\n2. Unraid API is running: systemctl status unraid-api\n3. You can access ${serverURL} in a browser`;
      } else if (error.networkError) {
        const networkErr = error.networkError;
        
        if (networkErr.message?.includes('CORS') || networkErr.message?.includes('access control')) {
          errorMessage = `🚫 CORS Error\n\nServer: ${serverURL}\n\nThe server is blocking cross-origin requests.\n\nFix:\n• Configure CORS in Unraid API settings\n• Add your device's IP to allowed origins\n• Check firewall settings`;
        } else if (networkErr.message?.includes('Failed to fetch') || networkErr.message?.includes('Network request failed') || networkErr.message?.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = `🔌 Connection Refused\n\nServer: ${serverURL}\n\nCannot connect to the server.\n\nCheck:\n• Server URL is correct\n• Unraid API is running\n• Port is correct (usually 3001)\n• Device is on same network\n• Firewall allows connections`;
        } else {
          errorMessage = `🌐 Network Error\n\nServer: ${serverURL}\n\nError: ${networkErr.message || 'Unable to reach server'}\n\nTry:\n• Check network connection\n• Verify server is reachable\n• Test in browser first`;
        }
      } else if (error.graphQLErrors?.length > 0) {
        errorMessage = `🔑 Authentication Error\n\n${error.graphQLErrors[0].message || 'Invalid API key or insufficient permissions'}\n\nCheck:\n• API key is correct\n• API key has proper permissions\n• Generate new key: unraid-api apikey --create`;
      } else if (error.message) {
        errorMessage = `❌ Error\n\n${error.message}\n\nServer: ${serverURL}`;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Login with credentials
   */
  async login(
    credentials: UnraidCredentials
  ): Promise<{ success: boolean; error?: string }> {
    // Validate credentials first using temporary client
    const validation = await this.validateCredentials(credentials);
    
    if (!validation.success) {
      return validation;
    }

    // Save credentials if validation succeeds
    try {
      const { storageService } = await import('./storage.service');
      await storageService.saveCredentials(credentials);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to save credentials' };
    }
  }

  /**
   * Logout (clear credentials)
   */
  async logout(): Promise<void> {
    const { storageService } = await import('./storage.service');
    await storageService.clearCredentials();
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const { storageService } = await import('./storage.service');
    return await storageService.isAuthenticated();
  }

  /**
   * Get stored credentials
   */
  async getStoredCredentials(): Promise<UnraidCredentials | null> {
    const { storageService } = await import('./storage.service');
    return await storageService.getCredentials();
  }
}

// Export singleton instance
export const authService = new AuthService();

