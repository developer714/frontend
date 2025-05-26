'use client';

import React from 'react';
import { DeviceHub } from '../components/DeviceHub';
import { SmartDetection } from '../components/SmartDetection';
import { AIResponse } from '../components/AIResponse';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Devices Online</span>
              <span className="font-medium">12/15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Protected Objects</span>
              <span className="font-medium">8/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Alerts</span>
              <span className="font-medium text-red-600">2</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm">Motion detected in Server Room</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Camera 3 battery low</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">System backup completed</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Scan for Devices
            </button>
            <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              Check All Objects
            </button>
            <button className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
              Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Device Status</h3>
          <DeviceHub />
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Protected Objects</h3>
          <SmartDetection />
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">AI Response System</h3>
        <AIResponse />
      </div>
    </div>
  );
} 