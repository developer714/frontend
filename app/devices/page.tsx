"use client"

import React, { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import {
  DevicePhoneMobileIcon,
  PlusIcon,
  WifiIcon,
  SignalIcon,
  CameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useSupabaseUser } from "@/utils/useSupabaseUser";
import { useBluetooth } from "@/utils/useBluetooth";

interface Device {
  id: string;
  name: string;
  device_type: string;
  mac_address: string;
  status: string;
}

const DEVICE_TYPES = [
  { value: "CAMERA", label: "Camera" },
  { value: "SMOKE_DETECTOR", label: "Smoke Detector" },
  { value: "MONITOR", label: "Monitor" },
  { value: "HOME_DEVICE", label: "Home Device" },
];

const deviceTypeIcon = (type: string) => {
  switch (type) {
    case 'Camera':
    case 'CAMERA':
      return <CameraIcon className="w-8 h-8 text-blue-500" />
    case 'Smoke Detector':
    case 'SMOKE_DETECTOR':
      return <WifiIcon className="w-8 h-8 text-gray-500" />
    case 'Monitor':
    case 'MONITOR':
      return <DevicePhoneMobileIcon className="w-8 h-8 text-indigo-500" />
    case 'Home Device':
    case 'HOME_DEVICE':
      return <SignalIcon className="w-8 h-8 text-gray-400" />
    default:
      return <DevicePhoneMobileIcon className="w-8 h-8 text-gray-400" />
  }
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [name, setName] = useState("");
  const [deviceType, setDeviceType] = useState("CAMERA");
  const [mac, setMac] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const user = useSupabaseUser();
  const { requestDevice, connectToDevice } = useBluetooth();

  const fetchDevices = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setDevices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleAddDevice = async () => {
    setLoading(true);
    setError("");
    if (!user) {
      setError("You must be logged in to add a device.");
      setLoading(false);
      return;
    }
    try {
      const device = await requestDevice();
      if (!device) {
        setError("No device selected or Bluetooth not available.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.from("devices").insert([
        {
          name: device.name || "Unknown Device",
          device_type: "MONITOR",
          mac_address: device.id || "",
          owner_id: user.id,
          status: "OFFLINE"
        },
      ]);
      if (error) setError(error.message);
      else setError("");
      fetchDevices();
    } catch (err: any) {
      setError(err.message || "Bluetooth error");
    }
    setLoading(false);
  };

  const handleManageDevice = async (device: Device) => {
    setLoading(true);
    setError("");
    try {
      const btDevice = await requestDevice();
      if (btDevice && btDevice.id === device.mac_address) {
        await connectToDevice(btDevice);
        setError("");
      } else {
        setError("Please select the correct device to connect.");
      }
    } catch (err: any) {
      setError(err.message || "Bluetooth error");
    }
    setLoading(false);
  };

  const deleteDevice = async (id: string) => {
    setLoading(true);
    setError("");
    const { error } = await supabase.from("devices").delete().eq("id", id);
    if (error) setError(error.message);
    fetchDevices();
    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Devices</h1>
        <button
          className="bg-gradient-to-r from-yellow-700 to-yellow-400 hover:from-yellow-800 hover:to-yellow-500 text-white font-semibold px-5 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all duration-200"
          onClick={handleAddDevice}
          disabled={loading}
        >
          <PlusIcon className="w-5 h-5" /> {loading ? 'Scanning...' : 'Add Device'}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {loading ? (
          <div className="col-span-full text-center text-gray-400">Loading...</div>
        ) : devices.length === 0 ? (
          <div className="col-span-full text-center text-gray-400">No devices found.</div>
        ) : (
          devices.map((device) => (
            <div key={device.id} className="bg-white rounded-2xl shadow-lg p-6 flex flex-col gap-4 border-t-4 border-yellow-400 relative hover:shadow-2xl transition-shadow group">
              <div className="absolute top-4 right-4">
                <button
                  className="bg-gradient-to-r from-yellow-700 to-yellow-400 text-white font-semibold px-4 py-1 rounded-lg text-sm shadow group-hover:scale-105 transition-transform"
                  onClick={() => handleManageDevice(device)}
                  disabled={loading}
                >
                  Manage
                </button>
              </div>
              <div className="flex items-center gap-4 mb-2">
                {deviceTypeIcon(device.device_type)}
                <div>
                  <div className="font-semibold text-lg md:text-xl text-gray-900">{device.name}</div>
                  <div className="text-gray-500 text-sm">{device.status || 'Connected'}</div>
                  <div className="text-gray-400 text-xs">{device.device_type}</div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-400">MAC: {device.mac_address}</span>
                <button
                  onClick={() => deleteDevice(device.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600 text-xs focus:outline-none focus:ring-2 focus:ring-red-400"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 