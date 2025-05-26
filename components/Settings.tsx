'use client';

import React, { useState, useEffect } from 'react';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';
import { supabase } from '../utils/supabase';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'enterprise';
export type NotificationPreference = 'email' | 'sms' | 'push' | 'all';

interface SystemSettings {
  subscriptionTier: SubscriptionTier;
  notificationPreferences: NotificationPreference[];
  autoDiscovery: boolean;
  dataRetention: number; // days
  maxDevices: number;
  maxProtectedObjects: number;
  aiResponseEnabled: boolean;
  smartDetectionEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  theme: 'light' | 'dark' | 'system';
}

const DEFAULT_SETTINGS: SystemSettings = {
  subscriptionTier: 'free',
  notificationPreferences: ['email'],
  autoDiscovery: true,
  dataRetention: 30,
  maxDevices: 5,
  maxProtectedObjects: 10,
  aiResponseEnabled: true,
  smartDetectionEnabled: true,
  backupFrequency: 'daily',
  theme: 'system'
};

const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    features: [
      'Basic monitoring',
      'Up to 5 devices',
      'Email notifications',
      '7-day data retention'
    ]
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    features: [
      'Advanced monitoring',
      'Up to 15 devices',
      'All notification types',
      '30-day data retention',
      'AI response system'
    ]
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    features: [
      'Full monitoring suite',
      'Unlimited devices',
      'Priority support',
      '90-day data retention',
      'AI response system',
      'Smart detection',
      'Daily backups'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 49.99,
    features: [
      'Custom monitoring solutions',
      'Unlimited everything',
      '24/7 support',
      'Unlimited data retention',
      'Custom AI integration',
      'Advanced analytics',
      'Custom backup schedule'
    ]
  }
};

const useSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isEditing, setIsEditing] = useState(false);
  const { addAlert } = useDeviceMonitoring();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error) throw error;

      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to load system settings'
      });
    }
  };

  const saveSettings = async (newSettings: SystemSettings) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(newSettings);

      if (error) throw error;

      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to save system settings'
      });
    }
  };

  const updateSubscription = async (tier: SubscriptionTier) => {
    try {
      // Here you would integrate with your payment processor
      // For now, we'll just update the settings
      const newSettings = {
        ...settings,
        subscriptionTier: tier
      };
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Error updating subscription:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to update subscription'
      });
    }
  };

  return {
    settings,
    isEditing,
    setIsEditing,
    saveSettings,
    updateSubscription
  };
};

export const Settings: React.FC = () => {
  const {
    settings,
    isEditing,
    setIsEditing,
    saveSettings,
    updateSubscription
  } = useSettings();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Settings</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Edit Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subscription Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-4">Subscription</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Current Plan:</span>
              <span className="text-blue-600 font-semibold">
                {SUBSCRIPTION_TIERS[settings.subscriptionTier].name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Price:</span>
              <span>${SUBSCRIPTION_TIERS[settings.subscriptionTier].price}/month</span>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features:</h4>
              <ul className="list-disc list-inside space-y-1">
                {SUBSCRIPTION_TIERS[settings.subscriptionTier].features.map((feature, index) => (
                  <li key={index} className="text-gray-600">{feature}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => updateSubscription('premium')}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Upgrade Plan
            </button>
          </div>
        </div>

        {/* System Configuration Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-4">System Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => saveSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'system' })}
                className="mt-1 block w-full rounded-lg border-gray-300"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Data Retention (days)</label>
              <input
                type="number"
                value={settings.dataRetention}
                onChange={(e) => saveSettings({ ...settings, dataRetention: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-lg border-gray-300"
                min="1"
                max="365"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => saveSettings({ ...settings, backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                className="mt-1 block w-full rounded-lg border-gray-300"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoDiscovery}
                  onChange={(e) => saveSettings({ ...settings, autoDiscovery: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>Enable Auto-Discovery</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.aiResponseEnabled}
                  onChange={(e) => saveSettings({ ...settings, aiResponseEnabled: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>Enable AI Response</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.smartDetectionEnabled}
                  onChange={(e) => saveSettings({ ...settings, smartDetectionEnabled: e.target.checked })}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>Enable Smart Detection</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 