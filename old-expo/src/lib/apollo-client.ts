/**
 * Apollo Client Configuration
 * Sets up GraphQL client with authentication and error handling
 */

import { storageService } from '@/src/services/storage.service';
import {
  ApolloClient,
  ApolloLink,
  from,
  HttpLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';

// Cache configuration
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Configure caching strategies for specific fields if needed
        dockerContainers: {
          merge(existing = [], incoming) {
            return incoming;
          },
        },
      },
    },
  },
});

// Create HTTP link with dynamic URI
const createHttpLink = (serverIP: string) => {
  // Use server IP exactly as entered - no automatic formatting
  const uri = serverIP.trim();

  return new HttpLink({
    uri,

  });
};

// Authentication middleware
const authLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    storageService
      .getApiKey()
      .then((apiKey) => {
        if (apiKey) {
          operation.setContext(({ headers = {} }) => ({
            headers: {
              ...headers,
              'x-api-key': apiKey,
            },
          }));
        }
        return forward(operation);
      })
      .then((observable) => {
        observable.subscribe({
          next: observer.next.bind(observer),
          error: observer.error.bind(observer),
          complete: observer.complete.bind(observer),
        });
      })
      .catch((error) => {
        observer.error(error);
      });
  });
});

// Error handling link
const errorLink = onError((error: any) => {
  if (error.graphQLErrors) {
    error.graphQLErrors.forEach((err: any) => {
      console.error(
        `[GraphQL error]: Message: ${err.message || 'Unknown'}, Location: ${err.locations}, Path: ${err.path}`
      );
    });
  }

  if (error.networkError) {
    console.error(`[Network error]: ${error.networkError}`);
  }
});

// Create Apollo Client instance with dynamic server IP
const createApolloClient = async () => {
  const serverIP = await storageService.getServerIP();

  if (!serverIP) {
    // Return a minimal client if no server is configured (before login)
    // This allows the app to render, but queries will fail gracefully
    // The client will be recreated after login with the user's server URL
    return new ApolloClient({
      link: from([
        errorLink,
        authLink,
        createHttpLink(''), // Empty URL - will fail gracefully if used before login
      ]),
      cache,
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network',
          errorPolicy: 'all',
        },
        query: {
          fetchPolicy: 'network-only',
          errorPolicy: 'all',
        },
        mutate: {
          errorPolicy: 'all',
        },
      },
    });
  }

  // Use the exact server URL the user provided
  return new ApolloClient({
    link: from([errorLink, authLink, createHttpLink(serverIP)]),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
};

// Export client creation function
export { createApolloClient };

// For testing purposes, allow direct client creation with server IP
export const createApolloClientWithServer = (serverIP: string) => {
  return new ApolloClient({
    link: from([errorLink, authLink, createHttpLink(serverIP)]),
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: 'cache-and-network',
        errorPolicy: 'all',
      },
      query: {
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      },
      mutate: {
        errorPolicy: 'all',
      },
    },
  });
};

