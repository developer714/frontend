'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface ProtectedObject {
  id: string;
  name: string;
  type: 'vehicle' | 'package' | 'door' | 'window' | 'other';
  location: string;
  status: 'active' | 'inactive';
  last_checked: string;
  notes?: string;
}

interface DetectionZone {
  id: string;
  name: string;
  camera_id: string;
  coordinates: { x: number; y: number }[];
  type: 'entry' | 'exit' | 'restricted' | 'monitoring';
  status: 'active' | 'inactive';
}

export default function SmartDetectionPage() {
  const [protectedObjects, setProtectedObjects] = useState<ProtectedObject[]>([]);
  const [detectionZones, setDetectionZones] = useState<DetectionZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingObject, setIsCreatingObject] = useState(false);
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [newObject, setNewObject] = useState<Partial<ProtectedObject>>({
    name: '',
    type: 'other',
    location: '',
    status: 'active'
  });
  const [newZone, setNewZone] = useState<Partial<DetectionZone>>({
    name: '',
    camera_id: '',
    coordinates: [],
    type: 'monitoring',
    status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [objectsResponse, zonesResponse] = await Promise.all([
        supabase.from('protected_objects').select('*'),
        supabase.from('detection_zones').select('*')
      ]);

      if (objectsResponse.error) throw objectsResponse.error;
      if (zonesResponse.error) throw zonesResponse.error;

      setProtectedObjects(objectsResponse.data || []);
      setDetectionZones(zonesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObject = async () => {
    try {
      const { error } = await supabase
        .from('protected_objects')
        .insert([newObject]);

      if (error) throw error;

      await fetchData();
      setIsCreatingObject(false);
      setNewObject({
        name: '',
        type: 'other',
        location: '',
        status: 'active'
      });
    } catch (error) {
      console.error('Error creating protected object:', error);
    }
  };

  const handleCreateZone = async () => {
    try {
      const { error } = await supabase
        .from('detection_zones')
        .insert([newZone]);

      if (error) throw error;

      await fetchData();
      setIsCreatingZone(false);
      setNewZone({
        name: '',
        camera_id: '',
        coordinates: [],
        type: 'monitoring',
        status: 'active'
      });
    } catch (error) {
      console.error('Error creating detection zone:', error);
    }
  };

  const handleToggleStatus = async (type: 'object' | 'zone', id: string, currentStatus: 'active' | 'inactive') => {
    try {
      const table = type === 'object' ? 'protected_objects' : 'detection_zones';
      const { error } = await supabase
        .from(table)
        .update({ status: currentStatus === 'active' ? 'inactive' : 'active' })
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error(`Error toggling ${type} status:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Smart Detection</h1>

        {/* Protected Objects */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Protected Objects</h2>
            <button
              onClick={() => setIsCreatingObject(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Protected Object
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
              ))
            ) : protectedObjects.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                No protected objects added yet
              </div>
            ) : (
              protectedObjects.map((obj) => (
                <div
                  key={obj.id}
                  className="border rounded-lg p-4 hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{obj.name}</h3>
                      <p className="text-sm text-gray-600">
                        Type: {obj.type.charAt(0).toUpperCase() + obj.type.slice(1)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Location: {obj.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        Last checked: {new Date(obj.last_checked).toLocaleString()}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={obj.status === 'active'}
                        onChange={() => handleToggleStatus('object', obj.id, obj.status)}
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

        {/* Detection Zones */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Detection Zones</h2>
            <button
              onClick={() => setIsCreatingZone(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Detection Zone
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
              ))
            ) : detectionZones.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                No detection zones added yet
              </div>
            ) : (
              detectionZones.map((zone) => (
                <div
                  key={zone.id}
                  className="border rounded-lg p-4 hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{zone.name}</h3>
                      <p className="text-sm text-gray-600">
                        Type: {zone.type.charAt(0).toUpperCase() + zone.type.slice(1)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Camera: {zone.camera_id}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zone.status === 'active'}
                        onChange={() => handleToggleStatus('zone', zone.id, zone.status)}
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

        {/* Create Protected Object Modal */}
        {isCreatingObject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Add Protected Object</h2>
                <button
                  onClick={() => setIsCreatingObject(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newObject.name}
                    onChange={(e) => setNewObject({ ...newObject, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newObject.type}
                    onChange={(e) => setNewObject({ ...newObject, type: e.target.value as ProtectedObject['type'] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="vehicle">Vehicle</option>
                    <option value="package">Package</option>
                    <option value="door">Door</option>
                    <option value="window">Window</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={newObject.location}
                    onChange={(e) => setNewObject({ ...newObject, location: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={newObject.notes || ''}
                    onChange={(e) => setNewObject({ ...newObject, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    onClick={() => setIsCreatingObject(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={handleCreateObject}
                  >
                    Add Object
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Detection Zone Modal */}
        {isCreatingZone && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Add Detection Zone</h2>
                <button
                  onClick={() => setIsCreatingZone(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={newZone.name}
                    onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Camera</label>
                  <input
                    type="text"
                    value={newZone.camera_id}
                    onChange={(e) => setNewZone({ ...newZone, camera_id: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={newZone.type}
                    onChange={(e) => setNewZone({ ...newZone, type: e.target.value as DetectionZone['type'] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="entry">Entry</option>
                    <option value="exit">Exit</option>
                    <option value="restricted">Restricted</option>
                    <option value="monitoring">Monitoring</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Zone Coordinates</label>
                  <p className="text-sm text-gray-500 mb-2">
                    Click on the camera view to set zone coordinates
                  </p>
                  <div className="border rounded-lg p-4 bg-gray-50 h-48 flex items-center justify-center">
                    <p className="text-gray-500">Camera view will be displayed here</p>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    onClick={() => setIsCreatingZone(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={handleCreateZone}
                  >
                    Add Zone
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