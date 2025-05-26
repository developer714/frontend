import React, { useState, useEffect } from 'react';
import { useBluetooth } from '../utils/useBluetooth';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';
import { supabase } from '../utils/supabase';

export type DeviceType = 'camera' | 'sensor' | 'light' | 'speaker' | 'alarm' | 'other';
export type DeviceStatus = 'online' | 'offline' | 'error' | 'disconnected';

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  lastSeen: Date;
  batteryLevel?: number;
  signalStrength?: number;
  location?: string;
  capabilities: string[];
  settings: {
    [key: string]: any;
  };
}

interface DeviceCardProps {
  device: Device;
  onEdit: (device: Device) => void;
  onRemove: (id: string) => void;
}

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onEdit, onRemove }) => (
  <div className={`border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
    device.status === 'online' ? 'bg-green-50' :
    device.status === 'error' ? 'bg-red-50' :
    device.status === 'offline' ? 'bg-gray-50' : 'bg-yellow-50'
  }`}>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-semibold">{device.name}</h3>
        <p className="text-sm text-gray-600">Type: {device.type}</p>
        <p className="text-sm text-gray-600">Status: {device.status}</p>
        <p className="text-sm text-gray-600">
          Last Seen: {device.lastSeen.toLocaleString()}
        </p>
        {device.batteryLevel !== undefined && (
          <p className="text-sm text-gray-600">
            Battery: {device.batteryLevel}%
          </p>
        )}
        {device.signalStrength !== undefined && (
          <p className="text-sm text-gray-600">
            Signal: {device.signalStrength}%
          </p>
        )}
        {device.location && (
          <p className="text-sm text-gray-600">
            Location: {device.location}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(device)}
          className="text-blue-500 hover:text-blue-700"
        >
          Edit
        </button>
        <button
          onClick={() => onRemove(device.id)}
          className="text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>
    </div>
    <div className="mt-4">
      <h4 className="font-medium mb-2">Capabilities</h4>
      <div className="flex flex-wrap gap-2">
        {device.capabilities.map((capability, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
          >
            {capability}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const useDeviceHub = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { requestDevice, connectToDevice, disconnectDevice } = useBluetooth();
  const { addAlert } = useDeviceMonitoring();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*');

      if (error) throw error;

      setDevices(data.map(device => ({
        ...device,
        lastSeen: new Date(device.last_seen)
      })));
    } catch (error) {
      console.error('Error loading devices:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to load devices'
      });
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    try {
      const device = await requestDevice();
      if (device) {
        await connectToDevice(device);
        // Auto-discover device capabilities
        const capabilities = await discoverCapabilities(device);
        const newDevice: Device = {
          id: Math.random().toString(36).substr(2, 9),
          name: device.name || 'Unknown Device',
          type: determineDeviceType(capabilities),
          status: 'online',
          lastSeen: new Date(),
          capabilities,
          settings: {}
        };
        setDevices(prev => [...prev, newDevice]);
        await saveDevice(newDevice);
      }
    } catch (error) {
      console.error('Error scanning for devices:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to scan for devices'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const discoverCapabilities = async (device: BluetoothDevice): Promise<string[]> => {
    // This would be implemented based on the actual device's GATT services
    // For now, return some mock capabilities
    return ['bluetooth', 'battery', 'notifications'];
  };

  const determineDeviceType = (capabilities: string[]): DeviceType => {
    if (capabilities.includes('camera')) return 'camera';
    if (capabilities.includes('light')) return 'light';
    if (capabilities.includes('speaker')) return 'speaker';
    if (capabilities.includes('alarm')) return 'alarm';
    if (capabilities.includes('sensor')) return 'sensor';
    return 'other';
  };

  const saveDevice = async (device: Device) => {
    try {
      const { error } = await supabase
        .from('devices')
        .insert({
          ...device,
          last_seen: device.lastSeen.toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving device:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to save device'
      });
    }
  };

  const updateDevice = async (device: Device) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          ...device,
          last_seen: device.lastSeen.toISOString()
        })
        .eq('id', device.id);

      if (error) throw error;

      setDevices(prev =>
        prev.map(d =>
          d.id === device.id ? device : d
        )
      );
    } catch (error) {
      console.error('Error updating device:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to update device'
      });
    }
  };

  const removeDevice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDevices(prev =>
        prev.filter(d => d.id !== id)
      );
    } catch (error) {
      console.error('Error removing device:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to remove device'
      });
    }
  };

  return {
    devices,
    isScanning,
    selectedDevice,
    isEditing,
    startScan,
    setSelectedDevice,
    setIsEditing,
    updateDevice,
    removeDevice
  };
};

export const DeviceHub: React.FC = () => {
  const {
    devices,
    isScanning,
    selectedDevice,
    isEditing,
    startScan,
    setSelectedDevice,
    setIsEditing,
    updateDevice,
    removeDevice
  } = useDeviceHub();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Device Hub</h2>
        <button
          onClick={startScan}
          disabled={isScanning}
          className={`px-4 py-2 rounded-lg ${
            isScanning
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}
        >
          {isScanning ? 'Scanning...' : 'Scan for Devices'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            onEdit={(device) => {
              setSelectedDevice(device);
              setIsEditing(true);
            }}
            onRemove={removeDevice}
          />
        ))}
      </div>

      {isEditing && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">Edit Device</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={selectedDevice.name}
                  onChange={(e) => setSelectedDevice({ ...selectedDevice, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={selectedDevice.type}
                  onChange={(e) => setSelectedDevice({ ...selectedDevice, type: e.target.value as DeviceType })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                >
                  <option value="camera">Camera</option>
                  <option value="sensor">Sensor</option>
                  <option value="light">Light</option>
                  <option value="speaker">Speaker</option>
                  <option value="alarm">Alarm</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={selectedDevice.location || ''}
                  onChange={(e) => setSelectedDevice({ ...selectedDevice, location: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                  placeholder="Enter device location"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedDevice(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateDevice(selectedDevice);
                  setIsEditing(false);
                  setSelectedDevice(null);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 