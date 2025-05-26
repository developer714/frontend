import React, { useState, useEffect } from 'react';
import { useBluetooth } from '../utils/useBluetooth';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';

export type DeviceType = 'camera' | 'detector' | 'monitor' | 'home';
export type DeviceStatus = 'connected' | 'disconnected';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  lastSeen: Date;
}

interface DeviceCardProps {
  device: Device;
  onDisconnect: (id: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onDisconnect }) => (
  <div className="relative bg-white border border-yellow-300 rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5 flex flex-col w-full max-w-full overflow-hidden">
    <div className="flex justify-between items-start mb-2">
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-lg text-gray-900 break-all leading-tight mb-1">{device.name}</h4>
        <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{device.status}</div>
        <div className="text-xs text-gray-400 mb-2">{device.type}</div>
      </div>
      <button
        className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold px-3 py-1 rounded shadow hover:from-yellow-500 hover:to-yellow-700 text-xs ml-2"
      >
        Manage
      </button>
    </div>
    <div className="mt-2 text-xs text-gray-500 break-all">
      <div className="mb-1">
        <span className="font-semibold">MAC:</span> <span>{device.id}</span>
      </div>
      <div>
        <span className="font-semibold">Last seen:</span> {device.lastSeen.toLocaleString()}
      </div>
    </div>
    <button
      onClick={() => onDisconnect(device.id)}
      className="bg-red-500 text-white font-semibold px-3 py-2 rounded shadow hover:bg-red-600 text-xs mt-4 w-full"
    >
      Delete
    </button>
  </div>
);

interface ScanButtonProps {
  isScanning: boolean;
  onScan: () => void;
}

const ScanButton: React.FC<ScanButtonProps> = ({ isScanning, onScan }) => (
  <button
    onClick={onScan}
    disabled={isScanning}
    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
  >
    {isScanning ? 'Scanning...' : 'Scan for Devices'}
  </button>
);

const useDeviceManagement = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const { requestDevice, connectToDevice } = useBluetooth();
  const { startMonitoring, stopMonitoring } = useDeviceMonitoring();

  const handleScanDevices = async () => {
    try {
      setIsScanning(true);
      const device = await requestDevice();
      if (device) {
        const newDevice: Device = {
          id: device.id,
          name: device.name || 'Unknown Device',
          type: 'monitor', // This should be determined based on device characteristics
          status: 'connected',
          lastSeen: new Date(),
        };
        setDevices(prev => [...prev, newDevice]);
        await connectToDevice(device);
        startMonitoring(device.id);
      }
    } catch (error) {
      console.error('Error scanning for devices:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnect = (deviceId: string) => {
    stopMonitoring(deviceId);
    setDevices(prev => prev.map(device =>
      device.id === deviceId
        ? { ...device, status: 'disconnected' }
        : device
    ));
  };

  return {
    devices,
    isScanning,
    handleScanDevices,
    handleDisconnect,
  };
};

export const DeviceManager: React.FC = () => {
  const {
    devices,
    isScanning,
    handleScanDevices,
    handleDisconnect,
  } = useDeviceManagement();

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Device Management</h2>
      
      <ScanButton
        isScanning={isScanning}
        onScan={handleScanDevices}
      />

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Connected Devices</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 