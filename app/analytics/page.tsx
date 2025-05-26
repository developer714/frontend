'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface EventMetrics {
  date: string;
  count: number;
  type: string;
}

interface DeviceMetrics {
  device_id: string;
  device_name: string;
  event_count: number;
  uptime: number;
}

interface FaceMetrics {
  face_id: string;
  face_name: string;
  visit_count: number;
  last_seen: string;
}

export default function AnalyticsPage() {
  const [eventMetrics, setEventMetrics] = useState<EventMetrics[]>([]);
  const [deviceMetrics, setDeviceMetrics] = useState<DeviceMetrics[]>([]);
  const [faceMetrics, setFaceMetrics] = useState<FaceMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      const [eventsResponse, devicesResponse, facesResponse] = await Promise.all([
        supabase
          .from('event_metrics')
          .select('*')
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date'),
        supabase
          .from('device_metrics')
          .select('*')
          .order('event_count', { ascending: false })
          .limit(5),
        supabase
          .from('face_metrics')
          .select('*')
          .order('visit_count', { ascending: false })
          .limit(5)
      ]);

      if (eventsResponse.error) throw eventsResponse.error;
      if (devicesResponse.error) throw devicesResponse.error;
      if (facesResponse.error) throw facesResponse.error;

      setEventMetrics(eventsResponse.data || []);
      setDeviceMetrics(devicesResponse.data || []);
      setFaceMetrics(facesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventChartData = {
    labels: eventMetrics.map(metric => new Date(metric.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Events',
        data: eventMetrics.map(metric => metric.count),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const deviceChartData = {
    labels: deviceMetrics.map(metric => metric.device_name),
    datasets: [
      {
        label: 'Event Count',
        data: deviceMetrics.map(metric => metric.event_count),
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      }
    ]
  };

  const faceChartData = {
    labels: faceMetrics.map(metric => metric.face_name || 'Unknown'),
    datasets: [
      {
        label: 'Visit Count',
        data: faceMetrics.map(metric => metric.visit_count),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Analytics</h1>
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

        {loading ? (
          <div className="animate-pulse space-y-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Event Trends */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Event Trends</h2>
              <div className="h-64">
                <Line
                  data={eventChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Events Over Time'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Device Activity */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Device Activity</h2>
              <div className="h-64">
                <Bar
                  data={deviceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: 'Top 5 Devices by Event Count'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Face Recognition Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Face Recognition Stats</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-64">
                  <Doughnut
                    data={faceChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        },
                        title: {
                          display: true,
                          text: 'Top 5 Most Recognized Faces'
                        }
                      }
                    }}
                  />
                </div>
                <div className="space-y-4">
                  {faceMetrics.map((metric) => (
                    <div
                      key={metric.face_id}
                      className="border rounded-lg p-4 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {metric.face_name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Visit Count: {metric.visit_count}
                          </p>
                          <p className="text-sm text-gray-600">
                            Last Seen: {new Date(metric.last_seen).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Device Metrics */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Device Performance</h2>
              <div className="space-y-4">
                {deviceMetrics.map((metric) => (
                  <div
                    key={metric.device_id}
                    className="border rounded-lg p-4 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {metric.device_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Event Count: {metric.event_count}
                        </p>
                        <p className="text-sm text-gray-600">
                          Uptime: {metric.uptime}%
                        </p>
                      </div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${metric.uptime}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 