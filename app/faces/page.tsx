'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface Face {
  id: string;
  name?: string;
  class: 'Friend' | 'Unknown' | 'Foe';
  image_url: string;
  last_seen: string;
  notes?: string;
  triggers?: string[];
}

export default function FacesPage() {
  const [faces, setFaces] = useState<Face[]>([]);
  const [unassignedFaces, setUnassignedFaces] = useState<Face[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFace, setSelectedFace] = useState<Face | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Face>>({});

  useEffect(() => {
    fetchFaces();
  }, []);

  const fetchFaces = async () => {
    try {
      const { data: allFaces, error } = await supabase
        .from('faces')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;

      const assigned = allFaces.filter((face: Face) => face.name);
      const unassigned = allFaces.filter((face: Face) => !face.name);

      setFaces(assigned);
      setUnassignedFaces(unassigned);
    } catch (error) {
      console.error('Error fetching faces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFace = async () => {
    if (!selectedFace) return;

    try {
      const { error } = await supabase
        .from('faces')
        .update(editForm)
        .eq('id', selectedFace.id);

      if (error) throw error;

      await fetchFaces();
      setIsEditing(false);
      setSelectedFace(null);
    } catch (error) {
      console.error('Error updating face:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Face Management</h1>

        {/* Unassigned Faces Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Unassigned Faces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-48"></div>
              ))
            ) : unassignedFaces.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                No unassigned faces to review
              </div>
            ) : (
              unassignedFaces.map((face) => (
                <div
                  key={face.id}
                  className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    setSelectedFace(face);
                    setEditForm(face);
                    setIsEditing(true);
                  }}
                >
                  <img
                    src={face.image_url}
                    alt="Unassigned face"
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <p className="text-sm text-gray-600">
                    Last seen: {new Date(face.last_seen).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Face Profiles Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Face Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faces.map((face) => (
              <div
                key={face.id}
                className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedFace(face);
                  setEditForm(face);
                  setIsEditing(true);
                }}
              >
                <img
                  src={face.image_url}
                  alt={face.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="font-semibold text-lg">{face.name}</h3>
                <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                  face.class === 'Friend' ? 'bg-green-100 text-green-800' :
                  face.class === 'Foe' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {face.class}
                </span>
                <p className="text-sm text-gray-600 mt-2">
                  Last seen: {new Date(face.last_seen).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Edit Face Modal */}
        {selectedFace && isEditing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">Edit Face Profile</h2>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedFace(null);
                  }}
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
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class</label>
                  <select
                    value={editForm.class || 'Unknown'}
                    onChange={(e) => setEditForm({ ...editForm, class: e.target.value as Face['class'] })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Unknown">Unknown</option>
                    <option value="Foe">Foe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedFace(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={handleSaveFace}
                  >
                    Save Changes
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