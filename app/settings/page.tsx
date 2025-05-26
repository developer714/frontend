'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  last_login: string;
}

interface Subscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string;
  features: string[];
}

export default function SettingsPage() {
  const [systemConfig, setSystemConfig] = useState<SystemConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'subscription'>('system');
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configValue, setConfigValue] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configResponse, usersResponse, subscriptionResponse] = await Promise.all([
        supabase
          .from('system_config')
          .select('*')
          .order('key'),
        supabase
          .from('users')
          .select('*')
          .order('email'),
        supabase
          .from('subscriptions')
          .select('*')
          .single()
      ]);

      if (configResponse.error) throw configResponse.error;
      if (usersResponse.error) throw usersResponse.error;
      if (subscriptionResponse.error) throw subscriptionResponse.error;

      setSystemConfig(configResponse.data || []);
      setUsers(usersResponse.data || []);
      setSubscription(subscriptionResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (key: string) => {
    try {
      const { error } = await supabase
        .from('system_config')
        .update({ value: configValue })
        .eq('key', key);

      if (error) throw error;

      setSystemConfig(configs =>
        configs.map(config =>
          config.key === key ? { ...config, value: configValue } : config
        )
      );
      setEditingConfig(null);
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users =>
        users.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleUpgradeSubscription = async (plan: 'pro' | 'enterprise') => {
    // In a real app, this would integrate with a payment processor
    console.log(`Upgrading to ${plan} plan...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Settings</h1>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'system'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              System Configuration
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'users'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              User Management
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'subscription'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Subscription
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'system' && (
                  <div className="space-y-4">
                    {systemConfig.map((config) => (
                      <div
                        key={config.id}
                        className="border rounded-lg p-4 hover:shadow-md"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{config.key}</h3>
                            <p className="text-sm text-gray-600">
                              {config.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            {editingConfig === config.key ? (
                              <>
                                <input
                                  type="text"
                                  value={configValue}
                                  onChange={(e) => setConfigValue(e.target.value)}
                                  className="rounded-lg border-gray-300"
                                />
                                <button
                                  onClick={() => handleUpdateConfig(config.key)}
                                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingConfig(null)}
                                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600">
                                  {config.value}
                                </p>
                                <button
                                  onClick={() => {
                                    setEditingConfig(config.key);
                                    setConfigValue(config.value);
                                  }}
                                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                                >
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'users' && (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="border rounded-lg p-4 hover:shadow-md"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{user.email}</h3>
                            <p className="text-sm text-gray-600">
                              Last login: {new Date(user.last_login).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value as 'admin' | 'user')}
                              className="rounded-lg border-gray-300"
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'subscription' && subscription && (
                  <div className="space-y-6">
                    <div className="border rounded-lg p-6">
                      <h3 className="text-2xl font-bold mb-4">
                        Current Plan: {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <p className="font-semibold">
                            <span className={
                              subscription.status === 'active' ? 'text-green-600' :
                              subscription.status === 'expired' ? 'text-red-600' :
                              'text-yellow-600'
                            }>
                              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Valid Until</p>
                          <p className="font-semibold">
                            {new Date(subscription.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mb-6">
                        <h4 className="font-semibold mb-2">Features</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {subscription.features.map((feature, index) => (
                            <li key={index} className="text-gray-600">{feature}</li>
                          ))}
                        </ul>
                      </div>
                      {subscription.plan !== 'enterprise' && (
                        <button
                          onClick={() => handleUpgradeSubscription(
                            subscription.plan === 'free' ? 'pro' : 'enterprise'
                          )}
                          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Upgrade to {subscription.plan === 'free' ? 'Pro' : 'Enterprise'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 