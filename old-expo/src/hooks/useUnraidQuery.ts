/**
 * Custom hooks for Unraid GraphQL queries
 * Provides type-safe, reusable hooks for data fetching
 */

import { AppConfig } from '@/src/config/app.config';
import {
  GET_ARRAY_STATUS,
  GET_DASHBOARD_DATA,
  GET_DOCKER_CONTAINERS,
  GET_SYSTEM_INFO,
} from '@/src/graphql/queries';
import { DemoDataService } from '@/src/services/demo-data.service';
import type {
  ArrayStatusResponse,
  DashboardData,
  DockerContainersResponse,
  SystemInfoResponse,
} from '@/src/types/unraid.types';
import { useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { usePollingInterval } from './usePollingInterval';

/**
 * Hook to fetch system information
 */
export function useSystemInfo(pollInterval?: number) {
  const { pollingInterval: userPollingInterval } = usePollingInterval();
  
  return useQuery<SystemInfoResponse>(GET_SYSTEM_INFO, {
    pollInterval: pollInterval ?? userPollingInterval ?? AppConfig.graphql.defaultPollInterval,
    notifyOnNetworkStatusChange: true,
  });
}

/**
 * Hook to fetch array/storage status
 */
export function useArrayStatus(pollInterval?: number) {
  const { pollingInterval: userPollingInterval } = usePollingInterval();
  
  return useQuery<ArrayStatusResponse>(GET_ARRAY_STATUS, {
    pollInterval: pollInterval ?? userPollingInterval ?? AppConfig.graphql.defaultPollInterval,
    notifyOnNetworkStatusChange: true,
  });
}

/**
 * Hook to fetch Docker containers
 * Supports demo mode with mock data
 */
export function useDockerContainers(pollInterval?: number) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { pollingInterval: userPollingInterval } = usePollingInterval();

  useEffect(() => {
    setIsDemoMode(DemoDataService.isDemoMode());
  }, []);

  const queryResult = useQuery<DockerContainersResponse>(GET_DOCKER_CONTAINERS, {
    pollInterval: pollInterval ?? userPollingInterval ?? AppConfig.graphql.defaultPollInterval,
    notifyOnNetworkStatusChange: true,
    skip: isDemoMode,
  });

  // Return demo data if in demo mode
  if (isDemoMode) {
    return {
      ...queryResult,
      data: DemoDataService.getDockerData() as DockerContainersResponse,
      loading: false,
      error: undefined,
      networkStatus: 7,
    };
  }

  return queryResult;
}

/**
 * Hook to fetch all dashboard data in a single query
 * More efficient than multiple separate queries
 * Supports demo mode with mock data
 */
export function useDashboardData(pollInterval?: number) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const { pollingInterval: userPollingInterval } = usePollingInterval();

  useEffect(() => {
    setIsDemoMode(DemoDataService.isDemoMode());
  }, []);

  const queryResult = useQuery<DashboardData>(GET_DASHBOARD_DATA, {
    pollInterval: pollInterval ?? userPollingInterval ?? AppConfig.graphql.defaultPollInterval,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
    returnPartialData: false,
    skip: isDemoMode, // Skip real query in demo mode
  });

  // Return demo data if in demo mode
  if (isDemoMode) {
    return {
      ...queryResult,
      data: DemoDataService.getDashboardData() as DashboardData,
      loading: false,
      error: undefined,
      networkStatus: 7, // Ready
    };
  }

  return queryResult;
}

/**
 * Hook to fetch system info without polling (one-time fetch)
 */
export function useSystemInfoOnce() {
  return useQuery<SystemInfoResponse>(GET_SYSTEM_INFO, {
    fetchPolicy: 'network-only',
  });
}

