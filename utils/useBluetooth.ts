/// <reference types="web-bluetooth" />
import { useState, useCallback } from 'react';

declare global {
  interface Navigator {
    bluetooth: Bluetooth;
  }
}

export const useBluetooth = () => {
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);

  const requestDevice = useCallback(async (): Promise<BluetoothDevice | null> => {
    try {
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth is not supported in this browser');
      }

      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'device_information']
      });

      return device;
    } catch (error) {
      console.error('Error requesting Bluetooth device:', error);
      return null;
    }
  }, []);

  const connectToDevice = useCallback(async (device: BluetoothDevice) => {
    try {
      if (!device.gatt) {
        // @ts-ignore - Known issue with @types/web-bluetooth
        const server = await device.gatt?.connect();
        if (server) {
          setConnectedDevice(device);
        }
      }
    } catch (error) {
      console.error('Error connecting to device:', error);
      throw error;
    }
  }, []);

  const disconnectDevice = useCallback(async () => {
    if (connectedDevice?.gatt?.connected) {
      await connectedDevice.gatt.disconnect();
      setConnectedDevice(null);
    }
  }, [connectedDevice]);

  return {
    connectedDevice,
    requestDevice,
    connectToDevice,
    disconnectDevice,
  };
}; 