/**
 * Authentication Provider
 * Manages authentication state and provides auth context
 * Supports multi-server management with active server tracking
 */

import { authService } from '@/src/services/auth.service';
import { SavedServer, storageService } from '@/src/services/storage.service';
import type { UnraidCredentials } from '@/src/types/unraid.types';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  credentials: UnraidCredentials | null;
  activeServerId: string | null;
  activeServerName: string | null;
  /** 
   * Incremented each time the server changes, used to force Apollo client rebuild
   * This is more reliable than comparing credentials objects
   */
  serverSwitchCounter: number;
  login: (credentials: UnraidCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  /**
   * Switch to a different server - handles credential update and triggers Apollo rebuild
   */
  switchServer: (server: SavedServer) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [credentials, setCredentials] = useState<UnraidCredentials | null>(null);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeServerName, setActiveServerName] = useState<string | null>(null);
  // Counter to force Apollo client rebuild - more reliable than object comparison
  const [serverSwitchCounter, setServerSwitchCounter] = useState(0);

  const checkAuth = useCallback(async () => {
    try {
      // Check if we're in demo mode
      const isDemoMode = await storageService.isDemoMode();
      
      if (isDemoMode) {
        console.log('Auth: Demo mode detected');
        // Set global flag for demo mode
        global.__DEMO_MODE__ = true;
        setIsAuthenticated(true);
        setCredentials({ serverIP: 'demo', apiKey: 'demo' });
        setActiveServerId('demo');
        setActiveServerName('Demo Server');
        setIsLoading(false);
        return;
      }

      // Ensure demo mode is disabled
      global.__DEMO_MODE__ = false;

      const isLoggedIn = await authService.isLoggedIn();
      const storedCredentials = await storageService.getCredentials();
      const activeServer = await storageService.getActiveServer();
      const activeId = await storageService.getActiveServerId();
      
      setIsAuthenticated(isLoggedIn);
      setCredentials(storedCredentials);
      setActiveServerId(activeId);
      setActiveServerName(activeServer?.name || null);
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setIsAuthenticated(false);
      setCredentials(null);
      setActiveServerId(null);
      setActiveServerName(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (newCredentials: UnraidCredentials) => {
    await storageService.saveCredentials(newCredentials);
    setCredentials(newCredentials);
    setIsAuthenticated(true);
    // Increment counter to signal Apollo should rebuild
    setServerSwitchCounter(prev => prev + 1);
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('AuthProvider: Starting logout...');
      
      // Clear demo mode if active
      await storageService.clearDemoMode();
      
      await authService.logout();
      console.log('AuthProvider: Credentials cleared');
      
      // Clear active server tracking
      await storageService.setActiveServerId(null);
      
      setCredentials(null);
      setIsAuthenticated(false);
      setActiveServerId(null);
      setActiveServerName(null);
      // Increment counter for Apollo cleanup
      setServerSwitchCounter(prev => prev + 1);
      
      console.log('AuthProvider: State updated');
    } catch (error) {
      console.error('AuthProvider: Logout error:', error);
      // Even if there's an error, clear the state
      setCredentials(null);
      setIsAuthenticated(false);
      setActiveServerId(null);
      setActiveServerName(null);
      throw error;
    }
  }, []);

  const switchServer = useCallback(async (server: SavedServer) => {
    console.log('AuthProvider: Switching to server:', server.name);
    try {
      // Validate connection to new server first
      const validation = await authService.validateCredentials({
        serverIP: server.serverIP,
        apiKey: server.apiKey,
      });
      
      if (!validation.success) {
        throw new Error(validation.error || 'Failed to connect to server');
      }
      
      // Connection validated, now switch storage atomically
      await storageService.switchToServer(server);
      
      // Update state
      setCredentials({
        serverIP: server.serverIP,
        apiKey: server.apiKey,
      });
      setActiveServerId(server.id);
      setActiveServerName(server.name);
      setIsAuthenticated(true);
      
      // Increment counter to force Apollo client rebuild
      // This is the key to making the switch work reliably
      setServerSwitchCounter(prev => prev + 1);
      
      console.log('AuthProvider: Server switch complete, counter:', serverSwitchCounter + 1);
    } catch (error) {
      console.error('AuthProvider: Server switch failed:', error);
      throw error;
    }
  }, [serverSwitchCounter]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        credentials,
        activeServerId,
        activeServerName,
        serverSwitchCounter,
        login,
        logout,
        checkAuth,
        switchServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

