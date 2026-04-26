/**
 * Demo Mode Hook
 * Provides mock data when in demo mode
 */

import { DemoDataService } from '@/src/services/demo-data.service';
import { useEffect, useState } from 'react';

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    setIsDemoMode(DemoDataService.isDemoMode());
  }, []);

  return {
    isDemoMode,
    enableDemoMode: () => {
      DemoDataService.enableDemoMode();
      setIsDemoMode(true);
    },
    disableDemoMode: () => {
      DemoDataService.disableDemoMode();
      setIsDemoMode(false);
    },
  };
}

