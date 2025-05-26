'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface Trigger {
  id: string;
  name: string;
  condition: {
    type: 'face' | 'behavior' | 'time' | 'device';
    value: string;
    operator: 'equals' | 'contains' | 'after' | 'before';
  };
  actions: {
    type: 'notification' | 'light' | 'speaker' | 'alarm' | 'police';
    value: string;
  }[];
  is_active: boolean;
  created_at: string;
}

const TRIGGER_TEMPLATES: {
  name: string;
  condition: {
    type: Trigger['condition']['type'];
    value: string;
    operator: Trigger['condition']['operator'];
  };
  actions: Trigger['actions'];
}[] = [
  {
    name: 'VEXOR Warning',
    condition: {
      type: 'face' as const,
      value: 'Foe',
      operator: 'equals' as const
    },
    actions: [
      { type: 'speaker' as const, value: 'Leave the property now.' },
      { type: 'light' as const, value: 'red_flash' },
      { type: 'notification' as const, value: 'Intruder detected' }
    ]
  },
  {
    name: 'Silent Alert',
    condition: {
      type: 'face' as const,
      value: 'Unknown',
      operator: 'equals' as const
    },
    actions: [
      { type: 'notification' as const, value: 'Unknown person detected' },
      { type: 'light' as const, value: 'yellow_flash' }
    ]
  },
  {
    name: 'Auto Police Contact',
    condition: {
      type: 'behavior' as const,
      value: 'theft',
      operator: 'equals' as const
    },
    actions: [
      { type: 'police' as const, value: 'emergency' },
      { type: 'notification' as const, value: 'Police contacted' },
      { type: 'light' as const, value: 'red_flash' }
    ]
  }
];

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTrigger, setNewTrigger] = useState<Partial<Trigger>>({
    name: '',
    condition: {
      type: 'face',
      value: '',
      operator: 'equals'
    },
    actions: [{ type: 'notification', value: '' }],
    is_active: true
  });

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    try {
      const { data, error } = await supabase
        .from('triggers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers(data || []);
    } catch (error) {
      console.error('Error fetching triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrigger = async () => {
    try {
      const { error } = await supabase
        .from('triggers')
        .insert([newTrigger]);

      if (error) throw error;

      await fetchTriggers();
      setIsCreating(false);
      setNewTrigger({
        name: '',
        condition: {
          type: 'face',
          value: '',
          operator: 'equals'
        },
        actions: [{ type: 'notification', value: '' }],
        is_active: true
      });
    } catch (error) {
      console.error('Error creating trigger:', error);
    }
  };

  const handleToggleTrigger = async (triggerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('triggers')
        .update({ is_active: !currentStatus })
        .eq('id', triggerId);

      if (error) throw error;
      await fetchTriggers();
    } catch (error) {
      console.error('Error toggling trigger:', error);
    }
  };

  const applyTemplate = (template: {
    name: string;
    condition: {
      type: Trigger['condition']['type'];
      value: string;
      operator: Trigger['condition']['operator'];
    };
    actions: Trigger['actions'];
  }) => {
    setNewTrigger({
      ...template,
      name: `${template.name} (Copy)`
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Triggers & Responses</h1>
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create New Trigger
          </button>
        </div>

        {/* Trigger Templates */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Trigger Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TRIGGER_TEMPLATES.map((template, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:shadow-md cursor-pointer"
                onClick={() => applyTemplate(template)}
              >
                <h3 className="font-semibold text-lg mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600">
                  If {template.condition.type} {template.condition.operator} {template.condition.value}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Actions: {template.actions.map(a => a.type).join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Active Triggers */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Active Triggers</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : triggers.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No triggers created yet</div>
            ) : (
              triggers.map((trigger) => (
                <div
                  key={trigger.id}
                  className="border rounded-lg p-4 hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{trigger.name}</h3>
                      <p className="text-sm text-gray-600">
                        If {trigger.condition.type} {trigger.condition.operator} {trigger.condition.value}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        Actions: {trigger.actions.map(a => a.type).join(', ')}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trigger.is_active}
                        onChange={() => handleToggleTrigger(trigger.id, trigger.is_active)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create Trigger Modal */}
        {isCreating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Create New Trigger</h2>
                <button
                  onClick={() => setIsCreating(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trigger Name</label>
                  <input
                    type="text"
                    value={newTrigger.name}
                    onChange={(e) => setNewTrigger({ ...newTrigger, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition Type</label>
                  <select
                    value={newTrigger.condition?.type}
                    onChange={(e) => setNewTrigger({
                      ...newTrigger,
                      condition: { ...newTrigger.condition!, type: e.target.value as Trigger['condition']['type'] }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="face">Face</option>
                    <option value="behavior">Behavior</option>
                    <option value="time">Time</option>
                    <option value="device">Device</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition Value</label>
                  <input
                    type="text"
                    value={newTrigger.condition?.value}
                    onChange={(e) => setNewTrigger({
                      ...newTrigger,
                      condition: { ...newTrigger.condition!, value: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Actions</label>
                  {newTrigger.actions?.map((action, index) => (
                    <div key={index} className="flex gap-2 mt-2">
                      <select
                        value={action.type}
                        onChange={(e) => {
                          const newActions = [...(newTrigger.actions || [])];
                          newActions[index] = { ...action, type: e.target.value as Trigger['actions'][0]['type'] };
                          setNewTrigger({ ...newTrigger, actions: newActions });
                        }}
                        className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="notification">Notification</option>
                        <option value="light">Light</option>
                        <option value="speaker">Speaker</option>
                        <option value="alarm">Alarm</option>
                        <option value="police">Police</option>
                      </select>
                      <input
                        type="text"
                        value={action.value}
                        onChange={(e) => {
                          const newActions = [...(newTrigger.actions || [])];
                          newActions[index] = { ...action, value: e.target.value };
                          setNewTrigger({ ...newTrigger, actions: newActions });
                        }}
                        className="block w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newActions = newTrigger.actions?.filter((_, i) => i !== index);
                          setNewTrigger({ ...newTrigger, actions: newActions });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setNewTrigger({
                      ...newTrigger,
                      actions: [...(newTrigger.actions || []), { type: 'notification', value: '' }]
                    })}
                    className="mt-2 text-blue-500 hover:text-blue-700"
                  >
                    + Add Action
                  </button>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    onClick={() => setIsCreating(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={handleCreateTrigger}
                  >
                    Create Trigger
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 