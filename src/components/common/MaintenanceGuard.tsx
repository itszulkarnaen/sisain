'use client';

import React, { useState, useEffect } from 'react';
import { isMaintenanceActive } from '@/config/maintenance';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  // Evaluasi status maintenance saat initial render
  const [inMaintenance, setInMaintenance] = useState(() => isMaintenanceActive());

  useEffect(() => {
    // Re-check di browser untuk menangkap query param ?bypass=dev atau localStorage
    setInMaintenance(isMaintenanceActive());
  }, []);

  if (inMaintenance) {
    return <MaintenanceScreen />;
  }

  return <>{children}</>;
}
