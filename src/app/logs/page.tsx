'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Log {
  timestamp: string;
  level: 'info' | 'error' | 'success';
  message: string;
  details?: any;
  table?: string;
}

type LogTab = 'events' | 'reviews' | 'tracked_objects' | 'general';

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LogTab>('general');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs');
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        const data = await response.json();
        
        // Process logs to add table information
        const processedLogs = data.map((log: Log) => {
          if (log.message.includes('events')) {
            return { ...log, table: 'events' };
          } else if (log.message.includes('reviews')) {
            return { ...log, table: 'reviews' };
          } else if (log.message.includes('tracked_objects')) {
            return { ...log, table: 'tracked_objects' };
          }
          return { ...log, table: 'general' };
        });
        
        setLogs(processedLogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
    // Set up polling every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    if (activeTab === 'general') {
      return !log.table || log.table === 'general';
    }
    return log.table === activeTab;
  });

  const getTabCount = (tab: LogTab) => {
    return logs.filter(log => {
      if (tab === 'general') {
        return !log.table || log.table === 'general';
      }
      return log.table === tab;
    }).length;
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'success':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">System Logs</h1>

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
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {(['general', 'events', 'reviews', 'tracked_objects'] as LogTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {tab.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    {getTabCount(tab) > 0 && (
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {getTabCount(tab)}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Log Content */}
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4 max-h-[calc(100vh-300px)] overflow-y-auto">
                <div className="space-y-2">
                  {filteredLogs.map((log, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`ml-2 font-medium ${getLogColor(log.level)}`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="ml-2">{log.message}</span>
                      {log.details && (
                        <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 