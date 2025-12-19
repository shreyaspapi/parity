/**
 * Apollo Provider Wrapper
 * Manages Apollo Client lifecycle and provides it to the app
 * Re-creates client when server changes using serverSwitchCounter
 */

import { LoadingScreen } from '@/src/components/ui/loading-screen';
import { createApolloClient } from '@/src/lib/apollo-client';
import { useAuth } from '@/src/providers/auth-provider';
import { storageService } from '@/src/services/storage.service';
import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { ApolloProvider as BaseApolloProvider } from '@apollo/client/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ApolloProviderProps {
  children: React.ReactNode;
}

export function ApolloProvider({ children }: ApolloProviderProps) {
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { isAuthenticated, serverSwitchCounter } = useAuth();
  
  // Track previous counter to detect actual changes
  const prevCounterRef = useRef(serverSwitchCounter);
  // Track the current client for cleanup
  const clientRef = useRef<ApolloClient<NormalizedCacheObject> | null>(null);

  const initializeClient = useCallback(async (forceRebuild: boolean = false) => {
    const startTime = Date.now();
    console.log('Apollo: Initializing client...', { 
      isAuthenticated, 
      serverSwitchCounter,
      forceRebuild 
    });

    // If we have an existing client and need to rebuild, clear its cache first
    if (forceRebuild && clientRef.current) {
      console.log('Apollo: Clearing old client cache before rebuild');
      try {
        await clientRef.current.clearStore();
        await clientRef.current.resetStore();
      } catch (e) {
        console.warn('Apollo: Error clearing old client:', e);
      }
    }

    try {
      // Check if we have credentials
      const hasCredentials = await storageService.isAuthenticated();
      console.log('Apollo: Has credentials in storage:', hasCredentials);
      
      // Add timeout to prevent hanging
      const clientPromise = createApolloClient();
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Apollo Client initialization timeout'));
        }, 5000);
      });

      const apolloClient = await Promise.race([clientPromise, timeoutPromise]);
      
      console.log('Apollo: Client created successfully in', Date.now() - startTime, 'ms');
      
      // Store in ref for cleanup
      clientRef.current = apolloClient;
      setClient(apolloClient);
      setIsInitializing(false);
      
    } catch (error: any) {
      console.error('Failed to initialize Apollo Client:', error);
      
      // Create a minimal fallback client
      try {
        const { HttpLink } = await import('@apollo/client');
        
        const minimalClient = new ApolloClient({
          link: new HttpLink({ uri: '' }),
          cache: new InMemoryCache(),
        });
        
        console.log('Apollo: Using fallback client');
        clientRef.current = minimalClient;
        setClient(minimalClient);
      } catch (fallbackError) {
        console.error('Failed to create fallback client:', fallbackError);
      }
      setIsInitializing(false);
    }
  }, [isAuthenticated, serverSwitchCounter]);

  // Initial mount
  useEffect(() => {
    initializeClient(false);
  }, []); // Only on mount

  // Handle server switches - use a separate effect to avoid race conditions
  useEffect(() => {
    // Skip initial render
    if (prevCounterRef.current === serverSwitchCounter) {
      return;
    }
    
    console.log('Apollo: Server switch detected, counter changed from', prevCounterRef.current, 'to', serverSwitchCounter);
    prevCounterRef.current = serverSwitchCounter;
    
    // Force rebuild the client
    setIsInitializing(true);
    initializeClient(true);
  }, [serverSwitchCounter, initializeClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        console.log('Apollo: Cleaning up client on unmount');
        clientRef.current.clearStore().catch(console.error);
      }
    };
  }, []);

  if (isInitializing || !client) {
    return <LoadingScreen message="Connecting to server..." />;
  }

  return <BaseApolloProvider client={client}>{children}</BaseApolloProvider>;
}


