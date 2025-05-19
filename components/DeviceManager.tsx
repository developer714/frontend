import React, { useState, useEffect } from 'react';
import { useBluetooth } from '../utils/useBluetooth';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';

interface Device {
  id: string;
  name: string;
  type: 'camera' | 'detector' | 'monitor' | 'home';
  status: 'connected' | 'disconnected';
  lastSeen: Date;
}

export const DeviceManager: React.FC = () => {
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
        setDevices([...devices, newDevice]);
        await connectToDevice(device);
        startMonitoring(device.id);
      }
    } catch (error) {
      console.error('Error scanning for devices:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Device Management</h2>
      <button
        onClick={handleScanDevices}
        disabled={isScanning}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isScanning ? 'Scanning...' : 'Scan for Devices'}
      </button>

      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-3">Connected Devices</h3>
        <div className="grid gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{device.name}</h4>
                  <p className="text-sm text-gray-600">Type: {device.type}</p>
                  <p className="text-sm text-gray-600">
                    Status: {device.status}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => stopMonitoring(device.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 