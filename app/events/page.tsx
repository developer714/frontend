'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface Event {
  id: string;
  type: string;
  face_id?: string;
  class: 'Friend' | 'Unknown' | 'Foe';
  device_id: string;
  trigger_id?: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  video_url?: string;
  notes?: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    face: '',
    class: '',
    device: '',
    trigger: '',
    severity: '',
  });
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      let query = supabase.from('events').select('*');
      
      // Apply filters
      if (filters.face) query = query.eq('face_id', filters.face);
      if (filters.class) query = query.eq('class', filters.class);
      if (filters.device) query = query.eq('device_id', filters.device);
      if (filters.trigger) query = query.eq('trigger_id', filters.trigger);
      if (filters.severity) query = query.eq('severity', filters.severity);

      const { data, error } = await query.order('timestamp', { ascending: false });
      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Events Timeline</h1>
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              className="rounded-lg border-gray-300"
              value={filters.class}
              onChange={(e) => setFilters({ ...filters, class: e.target.value })}
            >
              <option value="">All Classes</option>
              <option value="Friend">Friend</option>
              <option value="Unknown">Unknown</option>
              <option value="Foe">Foe</option>
            </select>
            <select
              className="rounded-lg border-gray-300"
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            >
              <option value="">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {/* Add more filters as needed */}
          </div>
        </div>

        {/* Events Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No events found</div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="border-l-4 border-blue-500 pl-4 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{event.type}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      event.severity === 'high' ? 'bg-red-100 text-red-800' :
                      event.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {event.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedEvent.type}</h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              {selectedEvent.video_url && (
                <div className="mb-4">
                  <video
                    src={selectedEvent.video_url}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Details</h3>
                  <p>Class: {selectedEvent.class}</p>
                  <p>Severity: {selectedEvent.severity}</p>
                  <p>Time: {new Date(selectedEvent.timestamp).toLocaleString()}</p>
                </div>
                {selectedEvent.notes && (
                  <div>
                    <h3 className="font-semibold">Notes</h3>
                    <p>{selectedEvent.notes}</p>
                  </div>
                )}
                <div className="flex justify-end gap-4">
                  <button
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                    onClick={() => {/* Implement export */}}
                  >
                    Export
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    onClick={() => {/* Implement forward */}}
                  >
                    Forward
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