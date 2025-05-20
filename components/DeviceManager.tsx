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
  <div className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-center">
      <div>
        <h4 className="font-medium">{device.name}</h4>
        <p className="text-sm text-gray-600">Type: {device.type}</p>
        <p className="text-sm text-gray-600">
          Status: {device.status}
        </p>
        <p className="text-sm text-gray-600">
          Last seen: {device.lastSeen.toLocaleString()}
        </p>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => onDisconnect(device.id)}
          className="text-red-500 hover:text-red-700"
        >
          Disconnect
        </button>
      </div>
    </div>
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
        <div className="grid gap-4">
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