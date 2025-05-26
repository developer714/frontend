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
import { DeviceHub } from '../../components/DeviceHub';

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
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Device Management</h1>
      <DeviceHub />
    </div>
  );
} 