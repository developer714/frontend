'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

interface VisitorLog {
  id: string;
  face_id: string;
  face_name: string;
  face_class: 'Friend' | 'Unknown' | 'Foe';
  timestamp: string;
  location: string;
  duration: number;
}

interface TriggerLog {
  id: string;
  trigger_name: string;
  trigger_type: string;
  timestamp: string;
  status: 'success' | 'failed';
  actions_taken: string[];
}

interface ThreatReport {
  id: string;
  type: 'tampering' | 'weather' | 'intrusion';
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  location: string;
  description: string;
  status: 'active' | 'resolved';
}

export default function ReportsPage() {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [triggerLogs, setTriggerLogs] = useState<TriggerLog[]>([]);
  const [threatReports, setThreatReports] = useState<ThreatReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'visitors' | 'triggers' | 'threats'>('visitors');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const [visitorsResponse, triggersResponse, threatsResponse] = await Promise.all([
        supabase
          .from('visitor_logs')
          .select('*')
          .gte('timestamp', dateRange.start)
          .lte('timestamp', dateRange.end)
          .order('timestamp', { ascending: false }),
        supabase
          .from('trigger_logs')
          .select('*')
          .gte('timestamp', dateRange.start)
          .lte('timestamp', dateRange.end)
          .order('timestamp', { ascending: false }),
        supabase
          .from('threat_reports')
          .select('*')
          .gte('timestamp', dateRange.start)
          .lte('timestamp', dateRange.end)
          .order('timestamp', { ascending: false })
      ]);

      if (visitorsResponse.error) throw visitorsResponse.error;
      if (triggersResponse.error) throw triggersResponse.error;
      if (threatsResponse.error) throw threatsResponse.error;

      setVisitorLogs(visitorsResponse.data || []);
      setTriggerLogs(triggersResponse.data || []);
      setThreatReports(threatsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: 'visitors' | 'triggers' | 'threats') => {
    // In a real app, this would generate and download a PDF
    console.log(`Exporting ${type} data...`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Reports</h1>
          <div className="flex gap-4">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="rounded-lg border-gray-300"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="rounded-lg border-gray-300"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('visitors')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'visitors'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Visitor Logs
            </button>
            <button
              onClick={() => setActiveTab('triggers')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'triggers'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Trigger Logs
            </button>
            <button
              onClick={() => setActiveTab('threats')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'threats'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Threat Reports
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
                {activeTab === 'visitors' && (
                  <>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => handleExport('visitors')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Export PDF
                      </button>
                    </div>
                    {visitorLogs.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No visitor logs found</div>
                    ) : (
                      visitorLogs.map((log) => (
                        <div
                          key={log.id}
                          className="border rounded-lg p-4 hover:shadow-md"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{log.face_name || 'Unknown'}</h3>
                              <p className="text-sm text-gray-600">
                                Class: {log.face_class}
                              </p>
                              <p className="text-sm text-gray-600">
                                Location: {log.location}
                              </p>
                              <p className="text-sm text-gray-600">
                                Duration: {Math.floor(log.duration / 60)} minutes
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === 'triggers' && (
                  <>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => handleExport('triggers')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Export PDF
                      </button>
                    </div>
                    {triggerLogs.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No trigger logs found</div>
                    ) : (
                      triggerLogs.map((log) => (
                        <div
                          key={log.id}
                          className="border rounded-lg p-4 hover:shadow-md"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{log.trigger_name}</h3>
                              <p className="text-sm text-gray-600">
                                Type: {log.trigger_type}
                              </p>
                              <p className="text-sm text-gray-600">
                                Status: <span className={log.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                                  {log.status}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Actions: {log.actions_taken.join(', ')}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}

                {activeTab === 'threats' && (
                  <>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => handleExport('threats')}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        Export PDF
                      </button>
                    </div>
                    {threatReports.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">No threat reports found</div>
                    ) : (
                      threatReports.map((report) => (
                        <div
                          key={report.id}
                          className="border rounded-lg p-4 hover:shadow-md"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{report.type.charAt(0).toUpperCase() + report.type.slice(1)}</h3>
                              <p className="text-sm text-gray-600">
                                Severity: <span className={
                                  report.severity === 'high' ? 'text-red-600' :
                                  report.severity === 'medium' ? 'text-yellow-600' :
                                  'text-green-600'
                                }>
                                  {report.severity}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600">
                                Location: {report.location}
                              </p>
                              <p className="text-sm text-gray-600">
                                Status: <span className={report.status === 'active' ? 'text-red-600' : 'text-green-600'}>
                                  {report.status}
                                </span>
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                {report.description}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              {new Date(report.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 