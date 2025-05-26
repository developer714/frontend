'use client';

import React, { useState, useEffect } from 'react';
import { useDeviceMonitoring } from '../utils/useDeviceMonitoring';
import { supabase } from '../utils/supabase';

export type ProtectedObject = {
  id: string;
  name: string;
  type: 'item' | 'area' | 'person';
  location: string;
  status: 'protected' | 'at_risk' | 'compromised';
  lastChecked: Date;
  sensitivity: 'low' | 'medium' | 'high';
  notifications: boolean;
};

interface ObjectCardProps {
  object: ProtectedObject;
  onEdit: (object: ProtectedObject) => void;
  onRemove: (id: string) => void;
}

const ObjectCard: React.FC<ObjectCardProps> = ({
  object,
  onEdit,
  onRemove,
}) => {
  const [lastCheckedStr, setLastCheckedStr] = React.useState('');

  React.useEffect(() => {
    setLastCheckedStr(object.lastChecked.toLocaleString());
  }, [object.lastChecked]);

  return (
    <div className={`border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow ${
      object.status === 'protected' ? 'bg-green-50' :
      object.status === 'at_risk' ? 'bg-yellow-50' :
      'bg-red-50'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{object.name}</h3>
          <p className="text-sm text-gray-600">Type: {object.type}</p>
          <p className="text-sm text-gray-600">Location: {object.location}</p>
          <p className="text-sm text-gray-600">Status: {object.status}</p>
          <p className="text-sm text-gray-600">
            Last Checked: {lastCheckedStr}
          </p>
          <p className="text-sm text-gray-600">
            Sensitivity: {object.sensitivity}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(object)}
            className="text-blue-500 hover:text-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => onRemove(object.id)}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const DEFAULT_OBJECTS: ProtectedObject[] = [
  {
    id: '1',
    name: 'Main Entrance',
    type: 'area',
    location: 'Front Door',
    status: 'protected',
    lastChecked: new Date(),
    sensitivity: 'high',
    notifications: true
  },
  {
    id: '2',
    name: 'Safe',
    type: 'item',
    location: 'Office',
    status: 'protected',
    lastChecked: new Date(),
    sensitivity: 'high',
    notifications: true
  },
  {
    id: '3',
    name: 'Server Room',
    type: 'area',
    location: 'Basement',
    status: 'protected',
    lastChecked: new Date(),
    sensitivity: 'high',
    notifications: true
  }
];

const useSmartDetection = () => {
  const [objects, setObjects] = useState<ProtectedObject[]>(DEFAULT_OBJECTS);
  const [selectedObject, setSelectedObject] = useState<ProtectedObject | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { addAlert } = useDeviceMonitoring();

  useEffect(() => {
    loadObjects();
  }, []);

  const loadObjects = async () => {
    try {
      const { data, error } = await supabase
        .from('protected_objects')
        .select('*');

      if (error) throw error;

      setObjects(data.map(obj => ({
        ...obj,
        lastChecked: new Date(obj.last_checked)
      })));
    } catch (error) {
      console.error('Error loading protected objects:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to load protected objects'
      });
    }
  };

  const saveObject = async (object: ProtectedObject) => {
    try {
      const { error } = await supabase
        .from('protected_objects')
        .upsert({
          ...object,
          last_checked: object.lastChecked.toISOString()
        });

      if (error) throw error;

      setObjects(prev =>
        prev.map(obj =>
          obj.id === object.id ? object : obj
        )
      );
    } catch (error) {
      console.error('Error saving protected object:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to save protected object'
      });
    }
  };

  const removeObject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('protected_objects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setObjects(prev =>
        prev.filter(obj => obj.id !== id)
      );
    } catch (error) {
      console.error('Error removing protected object:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to remove protected object'
      });
    }
  };

  const checkObjectStatus = async (object: ProtectedObject) => {
    try {
      // Implement object status checking logic here
      // This would involve checking sensors, cameras, etc.
      const status: 'protected' | 'at_risk' | 'compromised' = 'protected'; // This would be determined by the actual check
      const updatedObject = {
        ...object,
        status,
        lastChecked: new Date()
      };
      await saveObject(updatedObject);
    } catch (error) {
      console.error('Error checking object status:', error);
      addAlert('system', {
        type: 'intrusion',
        severity: 'medium',
        message: 'Failed to check object status'
      });
    }
  };

  return {
    objects,
    selectedObject,
    isEditing,
    setSelectedObject,
    setIsEditing,
    saveObject,
    removeObject,
    checkObjectStatus
  };
};

export const SmartDetection: React.FC = () => {
  const {
    objects,
    selectedObject,
    isEditing,
    setSelectedObject,
    setIsEditing,
    saveObject,
    removeObject,
    checkObjectStatus
  } = useSmartDetection();

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Smart Detection</h2>
        <button
          onClick={() => {
            setSelectedObject({
              id: Math.random().toString(36).substr(2, 9),
              name: '',
              type: 'item',
              location: '',
              status: 'protected',
              lastChecked: new Date(),
              sensitivity: 'medium',
              notifications: true
            });
            setIsEditing(true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Add Protected Object
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {objects.map(object => (
          <ObjectCard
            key={object.id}
            object={object}
            onEdit={(object) => {
              setSelectedObject(object);
              setIsEditing(true);
            }}
            onRemove={removeObject}
          />
        ))}
      </div>

      {isEditing && selectedObject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
            <h3 className="text-xl font-bold mb-4">
              {selectedObject.id ? 'Edit Protected Object' : 'Add Protected Object'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={selectedObject.name}
                  onChange={(e) => setSelectedObject({ ...selectedObject, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                  placeholder="Enter object name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Type</label>
                <select
                  value={selectedObject.type}
                  onChange={(e) => setSelectedObject({ ...selectedObject, type: e.target.value as 'item' | 'area' | 'person' })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                >
                  <option value="item">Item</option>
                  <option value="area">Area</option>
                  <option value="person">Person</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={selectedObject.location}
                  onChange={(e) => setSelectedObject({ ...selectedObject, location: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                  placeholder="Enter object location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Sensitivity</label>
                <select
                  value={selectedObject.sensitivity}
                  onChange={(e) => setSelectedObject({ ...selectedObject, sensitivity: e.target.value as 'low' | 'medium' | 'high' })}
                  className="mt-1 block w-full rounded-lg border-gray-300"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedObject.notifications}
                    onChange={(e) => setSelectedObject({ ...selectedObject, notifications: e.target.checked })}
                    className="form-checkbox h-5 w-5 text-blue-600"
                  />
                  <span>Enable Notifications</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setSelectedObject(null);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveObject(selectedObject);
                  setIsEditing(false);
                  setSelectedObject(null);
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