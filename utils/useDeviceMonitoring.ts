import { useState, useCallback } from 'react';

interface MonitoringState {
  [deviceId: string]: {
    isMonitoring: boolean;
    lastUpdate: Date;
    alerts: Alert[];
  };
}

interface Alert {
  id: string;
  type: 'intrusion' | 'fire' | 'fall' | 'hazard' | 'unknown_face' | 'inactivity';
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  message: string;
}

export const useDeviceMonitoring = () => {
  const [monitoringState, setMonitoringState] = useState<MonitoringState>({});

  const startMonitoring = useCallback((deviceId: string) => {
    setMonitoringState(prev => ({
      ...prev,
      [deviceId]: {
        isMonitoring: true,
        lastUpdate: new Date(),
        alerts: []
      }
    }));
  }, []);

  const stopMonitoring = useCallback((deviceId: string) => {
    setMonitoringState(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        isMonitoring: false
      }
    }));
  }, []);

  const addAlert = useCallback((deviceId: string, alert: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alert,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };

    setMonitoringState(prev => ({
      ...prev,
      [deviceId]: {
        isMonitoring: prev[deviceId]?.isMonitoring ?? false,
        lastUpdate: prev[deviceId]?.lastUpdate ?? new Date(),
        alerts: [...(prev[deviceId]?.alerts ?? []), newAlert]
      }
    }));
  }, []);

  return {
    monitoringState,
    startMonitoring,
    stopMonitoring,
    addAlert
  };
}; 