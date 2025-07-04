'use client';

import { useEffect, useState } from 'react';

interface Log {
  timestamp: string;
  level: string;
  message: string;
  name?: string;
}

export default function LiziLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/lizi/logs');
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Lizi Logs</h1>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="bg-gray-50 rounded-lg p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm">
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span className={`ml-2 font-medium text-gray-600`}>
                      [{log.level?.toUpperCase() || 'INFO'}]
                    </span>
                    {log.name && (
                      <span className="ml-2 text-xs text-blue-500">[{log.name}]</span>
                    )}
                    <span className="ml-2">{log.message}</span>
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