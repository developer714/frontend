'use client';

import React, { useState, useEffect } from 'react';
import { useBluetooth } from '../utils/useBluetooth';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';
import { supabase } from '../utils/supabase';

export type DeviceType = 'camera' | 'sensor' | 'light' | 'speaker' | 'alarm' | 'other';
export type DeviceStatus = 'online' | 'offline' | 'error' | 'disconnected';

const AVAILABLE_CAPABILITIES = [
  'bluetooth',
  'wifi',
  'battery',
  'notifications',
  'motion_detection',
  'night_vision',
  'two_way_audio',
  'recording',
  'live_streaming',
  'temperature_sensing',
  'humidity_sensing'
];

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

const StatusIndicator: React.FC<{ status: DeviceStatus }> = ({ status }) => {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    error: 'bg-red-500',
    disconnected: 'bg-yellow-500'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${colors[status]} animate-pulse`} />
      <span className="text-sm capitalize">{status}</span>
    </div>
  );
};

const DeviceCard: React.FC<DeviceCardProps> = ({ device, onEdit, onRemove }) => (
  <div className={`border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
    device.status === 'online' ? 'bg-green-50' :
    device.status === 'error' ? 'bg-red-50' :
    device.status === 'offline' ? 'bg-gray-50' : 'bg-yellow-50'
  }`}>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-lg font-semibold">{device.name}</h3>
        <div className="mt-1">
          <StatusIndicator status={device.status} />
        </div>
        <p className="text-sm text-gray-600 mt-2">Type: {device.type}</p>
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
          onClick={() => {
            if (window.confirm('Are you sure you want to remove this device?')) {
              onRemove(device.id);
            }
          }}
          className="text-red-500 hover:text-red-700"
        >
          Remove
        </button>
      </div>
    </div>
    
    {device.capabilities && device.capabilities.length > 0 && (
      <div className="mt-4">
        <h4 className="font-medium mb-2">Capabilities</h4>
        <div className="flex flex-wrap gap-2">
          {device.capabilities.map((capability, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {capability.replace('_', ' ')}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const useDeviceHub = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        lastSeen: new Date(device.last_seen),
        capabilities: device.capabilities || []
      })));
    } catch (error) {
      console.error('Error loading devices:', error);
      setError('Failed to load devices');
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to load devices'
      });
    }
  };

  const startScan = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const device = await requestDevice();
      if (device) {
        await connectToDevice(device);
        const capabilities = await discoverCapabilities(device);
        const newDevice: Device = {
          id: Math.random().toString(36).substr(2, 9),
          name: device.name || 'Unknown Device',
          type: determineDeviceType(capabilities),
          status: 'online',
          lastSeen: new Date(),
          capabilities,
          settings: {},
          batteryLevel: 100,
          signalStrength: 100
        };
        setDevices(prev => [...prev, newDevice]);
        await saveDevice(newDevice);
        addAlert('system', {
          type: 'intrusion',
          severity: 'low',
          message: `Successfully connected to ${newDevice.name}`
        });
      }
    } catch (error) {
      console.error('Error scanning for devices:', error);
      setError('Failed to scan for devices. Please try again.');
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to scan for devices'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const validateDevice = (device: Device): string | null => {
    if (!device.name.trim()) return 'Device name is required';
    if (!device.type) return 'Device type is required';
    if (!device.location?.trim()) return 'Device location is required';
    return null;
  };

  const updateDevice = async (device: Device) => {
    const validationError = validateDevice(device);
    if (validationError) {
      setError(validationError);
      return;
    }

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
      addAlert('system', {
        type: 'intrusion',
        severity: 'low',
        message: `Successfully updated ${device.name}`
      });
    } catch (error) {
      console.error('Error updating device:', error);
      setError('Failed to update device');
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

  return {
    devices,
    isScanning,
    selectedDevice,
    isEditing,
    error,
    startScan,
    setSelectedDevice,
    setIsEditing,
    setError,
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
    error,
    startScan,
    setSelectedDevice,
    setIsEditing,
    setError,
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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map(device => (
          <DeviceCard
            key={device.id}
            device={device}
            onEdit={(device) => {
              setSelectedDevice(device);
              setIsEditing(true);
              setError(null);
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Capabilities</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_CAPABILITIES.map((capability) => (
                    <label key={capability} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedDevice.capabilities.includes(capability)}
                        onChange={(e) => {
                          const newCapabilities = e.target.checked
                            ? [...selectedDevice.capabilities, capability]
                            : selectedDevice.capabilities.filter(c => c !== capability);
                          setSelectedDevice({ ...selectedDevice, capabilities: newCapabilities });
                        }}
                        className="form-checkbox h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm">{capability.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedDevice(null);
                  setError(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateDevice(selectedDevice);
                  if (!error) {
                    setIsEditing(false);
                    setSelectedDevice(null);
                  }
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