"use client"

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";

interface Alert {
  id: string;
  alert_type: string;
  recipient: string;
  message: string;
  status: string;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setAlerts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Alerts</h1>
      {loading && <div className="text-gray-400 mb-2">Loading alerts...</div>}
      {error && <div className="text-red-400 mb-2">{error}</div>}
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-gray-900 text-white">
          <thead>
            <tr className="text-left text-gray-300">
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold">Recipient</th>
              <th className="py-3 px-4 font-semibold">Message</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">No alerts found.</td>
              </tr>
            ) : (
              alerts.map((alert) => (
                <tr key={alert.id} className="border-b border-gray-800 hover:bg-gray-800 transition-colors">
                  <td className="py-3 px-4">{alert.alert_type}</td>
                  <td className="py-3 px-4">{alert.recipient}</td>
                  <td className="py-3 px-4">{alert.message}</td>
                  <td className="py-3 px-4">{alert.status}</td>
                  <td className="py-3 px-4">{new Date(alert.created_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 