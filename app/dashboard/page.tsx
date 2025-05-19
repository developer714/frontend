'use client'

import React, { useEffect, useState } from 'react';
import { FacialRecognition } from '../../components/FacialRecognition';
import { AIMonitoring } from '../../components/AIMonitoring';
import { supabase } from '@/utils/supabase';

export default function DashboardPage() {
  const [stats, setStats] = useState([
    { label: 'Online Devices', value: 0 },
    { label: 'Offline Devices', value: 0 },
    { label: "+ Today's Events", value: 0 },
    { label: 'Active Alerts', value: 0 },
  ]);
  const [eventLog, setEventLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatsAndEvents = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch devices
        const { data: devices, error: devErr } = await supabase.from('devices').select('*');
        if (devErr) throw devErr;
        const online = devices.filter((d: any) => d.status === 'CONNECTED' || d.status === 'ONLINE').length;
        const offline = devices.filter((d: any) => d.status === 'DISCONNECTED' || d.status === 'OFFLINE').length;

        // Fetch alerts/events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data: alerts, error: alertErr } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false });
        if (alertErr) throw alertErr;
        const todaysEvents = alerts.filter((a: any) => new Date(a.created_at) >= today).length;
        const activeAlerts = alerts.filter((a: any) => a.status === 'active' || a.status === 'ACTIVE').length;
        // For event log, take the latest 4
        const latestEvents = alerts.slice(0, 4).map((a: any) => ({
          type: a.alert_type,
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          icon: a.alert_type === 'Intrusion Detected' ? '!' : a.alert_type === 'Fire Hazard Detected' ? '🔥' : a.alert_type === 'Friendly Face Detected' ? '😊' : '?',
          color: a.alert_type === 'Intrusion Detected' ? 'bg-blue-100 text-blue-600' : a.alert_type === 'Fire Hazard Detected' ? 'bg-red-100 text-red-600' : a.alert_type === 'Friendly Face Detected' ? 'bg-blue-50 text-blue-400' : 'bg-orange-100 text-orange-600',
        }));

        setStats([
          { label: 'Online Devices', value: online },
          { label: 'Offline Devices', value: offline },
          { label: "+ Today's Events", value: todaysEvents },
          { label: 'Active Alerts', value: activeAlerts },
        ]);
        setEventLog(latestEvents);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      }
      setLoading(false);
    };
    fetchStatsAndEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex flex-col lg:flex-row gap-8 p-4 md:p-8">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Dashboard</h1>
        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gradient-to-r from-yellow-700 to-yellow-400 text-white shadow-lg p-6 flex flex-col items-center animate-pulse min-h-[110px]">
                <span className="text-lg font-semibold">&nbsp;</span>
                <span className="text-3xl font-bold mt-2">...</span>
              </div>
            ))
          ) : stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl bg-gradient-to-r from-yellow-700 to-yellow-400 text-white shadow-lg p-6 flex flex-col items-center min-h-[110px]">
              <span className="text-lg font-semibold">{stat.label}</span>
              <span className="text-4xl font-extrabold mt-2 drop-shadow">{stat.value}</span>
            </div>
          ))}
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {/* Facial Recognition Section */}
        <div className="rounded-2xl shadow-lg bg-white p-6">
          <FacialRecognition />
        </div>
        {/* AI Monitoring Section */}
        <div className="rounded-2xl shadow-lg bg-white p-6">
          <AIMonitoring />
        </div>
      </div>
      {/* Event Log */}
      <div className="w-full lg:w-[400px] flex-shrink-0">
        <div className="rounded-2xl shadow-lg bg-white p-6 flex flex-col h-full">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="bg-gray-300 rounded-full px-2 py-1 text-gray-700 text-lg">Event Log</span>
          </h2>
          <div className="flex flex-col gap-4">
            {loading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg p-4 bg-gray-100 shadow border-l-4 animate-pulse">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 font-bold text-xl">...</div>
                  <div>
                    <div className="font-semibold text-gray-800">&nbsp;</div>
                    <div className="text-gray-500 text-sm">...</div>
                  </div>
                </div>
              ))
            ) : eventLog.length === 0 ? (
              <div className="text-gray-400 text-center">No recent events.</div>
            ) : eventLog.map((event, idx) => (
              <div key={idx} className={`flex items-center gap-4 rounded-lg p-4 bg-white shadow border-l-4 ${event.color}`}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${event.color} font-bold text-xl`}>{event.icon}</div>
                <div>
                  <div className="font-semibold text-gray-800">{event.type}</div>
                  <div className="text-gray-500 text-sm">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 