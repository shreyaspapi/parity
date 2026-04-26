/**
 * Custom hook to track metrics history for charts
 * Stores the last N data points for time-series visualization
 */

import { useEffect, useRef, useState } from 'react';

export interface MetricSnapshot {
  cpuUsage: number;
  memoryUsage: number;
  timestamp: number;
}

const MAX_HISTORY_POINTS = 20; // Keep last 20 data points

export function useMetricsHistory(currentCpuUsage?: number, currentMemoryUsage?: number) {
  const [history, setHistory] = useState<MetricSnapshot[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  const MIN_UPDATE_INTERVAL = 3000; // Minimum 3 seconds between updates

  useEffect(() => {
    if (currentCpuUsage === undefined || currentMemoryUsage === undefined) {
      return;
    }

    const now = Date.now();

    // Add initial data points immediately for better UX (show chart right away)
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      const initialHistory: MetricSnapshot[] = [];
      
      // Create 10 initial points with slight variations for a nice starting chart
      for (let i = 0; i < 10; i++) {
        const timestamp = now - (10 - i) * 3000;
        const cpuVariation = (Math.random() - 0.5) * 5; // +/- 2.5%
        const memVariation = (Math.random() - 0.5) * 3; // +/- 1.5%
        
        initialHistory.push({
          cpuUsage: Math.max(0, Math.min(100, currentCpuUsage + cpuVariation)),
          memoryUsage: Math.max(0, Math.min(100, currentMemoryUsage + memVariation)),
          timestamp,
        });
      }
      
      setHistory(initialHistory);
      lastUpdateRef.current = now;
      return;
    }
    
    // Only add new data point if enough time has passed
    if (now - lastUpdateRef.current < MIN_UPDATE_INTERVAL) {
      return;
    }

    lastUpdateRef.current = now;

    setHistory((prevHistory) => {
      const newSnapshot: MetricSnapshot = {
        cpuUsage: currentCpuUsage,
        memoryUsage: currentMemoryUsage,
        timestamp: now,
      };

      const updatedHistory = [...prevHistory, newSnapshot];

      // Keep only the last MAX_HISTORY_POINTS
      if (updatedHistory.length > MAX_HISTORY_POINTS) {
        return updatedHistory.slice(updatedHistory.length - MAX_HISTORY_POINTS);
      }

      return updatedHistory;
    });
  }, [currentCpuUsage, currentMemoryUsage]);

  // Convert to chart data format
  const cpuChartData = history.map((snapshot) => ({
    value: snapshot.cpuUsage,
    timestamp: snapshot.timestamp,
  }));

  const memoryChartData = history.map((snapshot) => ({
    value: snapshot.memoryUsage,
    timestamp: snapshot.timestamp,
  }));

  return {
    history,
    cpuChartData,
    memoryChartData,
    hasEnoughData: history.length >= 1, // Show chart as soon as we have any data
  };
}

