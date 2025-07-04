'use client';

import { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '@/lib/settings';

// Use the Settings interface from the library
type Settings = {
  frigate_api_url: string;
  supabase_url: string;
  supabase_anon_key: string;
  supabase_service_role_key: string;
};

// Separate interface for MQTT settings
interface MqttSettings {
  mqtt_broker: string;
  mqtt_port: string;
  mqtt_username: string;
  mqtt_password: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'success';
  message: string;
  details?: any;
  table?: string;
}

type LogTab = 'events' | 'reviews' | 'tracked_objects' | 'general';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    frigate_api_url: '',
    supabase_url: '',
    supabase_anon_key: '',
    supabase_service_role_key: ''
  });

  const [mqttSettings, setMqttSettings] = useState<MqttSettings>({
    mqtt_broker: '',
    mqtt_port: '',
    mqtt_username: '',
    mqtt_password: ''
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<LogTab>('general');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  useEffect(() => {
    const loadAllSettings = async () => {
      try {
        // Load core settings
        const savedSettings = loadSettings();
        setSettings(savedSettings);

        // Load MQTT settings from API
        const response = await fetch('/api/settings/mqtt');
        if (response.ok) {
          const mqttData = await response.json();
          setMqttSettings(mqttData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
        setLoading(false);
      }
    };

    loadAllSettings();
  }, []);

  const handleSave = async () => {
    try {
      // Save core settings
      saveSettings(settings);

      // Save MQTT settings
      const response = await fetch('/api/settings/mqtt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mqttSettings),
      });

      if (!response.ok) {
        throw new Error('Failed to save MQTT settings');
      }

      setSuccess('Settings saved successfully');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
      setSuccess(null);
    }
  };

  const testConnection = async () => {
    setConnectionStatus('connecting');
    setError(null);
    setSuccess(null);
    setLogs([]);

    const startTime = Date.now();
    try {
      const response = await fetch('/api/supabase/test');
      const endTime = Date.now();
      const data = await response.json();

      setResponseTime(endTime - startTime);
      setLastChecked(new Date().toLocaleTimeString());

      if (response.ok && data.success) {
        setConnectionStatus('connected');
        setSuccess('Successfully connected to Supabase');
        // Process logs to categorize them
        const processedLogs = data.logs.map((log: LogEntry) => {
          if (log.message.includes('Event') || log.message.includes('event')) {
            return { ...log, table: 'events' };
          } else if (log.message.includes('Review') || log.message.includes('review')) {
            return { ...log, table: 'reviews' };
          } else if (log.message.includes('Tracked object') || log.message.includes('tracked_object')) {
            return { ...log, table: 'tracked_objects' };
          }
          return { ...log, table: 'general' };
        });
        setLogs(processedLogs);
      } else {
        setConnectionStatus('disconnected');
        setError(data.error || 'Failed to connect to Supabase');
        setLogs(data.logs || []);
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('Failed to connect to Supabase');
    }
  };

  const testMqttConnection = async () => {
    setConnectionStatus('connecting');
    setError(null);
    setSuccess(null);
    setLogs([]);

    const startTime = Date.now();
    try {
      const response = await fetch('/api/frigate/mqtt/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mqttSettings),
      });
      const endTime = Date.now();
      const data = await response.json();

      setResponseTime(endTime - startTime);
      setLastChecked(new Date().toLocaleTimeString());

      if (response.ok) {
        setConnectionStatus('connected');
        setSuccess('Successfully connected to MQTT broker');
        // Process logs to categorize them
        const processedLogs = data.logs.map((log: LogEntry) => {
          if (log.message.includes('Event') || log.message.includes('event')) {
            return { ...log, table: 'events' };
          } else if (log.message.includes('Review') || log.message.includes('review')) {
            return { ...log, table: 'reviews' };
          } else if (log.message.includes('Tracked object') || log.message.includes('tracked_object')) {
            return { ...log, table: 'tracked_objects' };
          }
          return { ...log, table: 'general' };
        });
        setLogs(processedLogs);
      } else {
        setConnectionStatus('disconnected');
        setError(data.error || 'Failed to connect to MQTT broker');
        setLogs(data.logs || []);
      }
    } catch (err) {
      setConnectionStatus('disconnected');
      setError('Failed to connect to MQTT broker');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Supabase Settings */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Supabase Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Supabase URL</label>
              <input
                type="text"
                value={settings.supabase_url}
                onChange={(e) => setSettings({ ...settings, supabase_url: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supabase Anon Key</label>
              <input
                type="password"
                value={settings.supabase_anon_key}
                onChange={(e) => setSettings({ ...settings, supabase_anon_key: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Supabase Service Role Key</label>
              <input
                type="password"
                value={settings.supabase_service_role_key}
                onChange={(e) => setSettings({ ...settings, supabase_service_role_key: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={testConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Test Connection
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* MQTT Settings */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Frigate MQTT Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">MQTT Broker</label>
              <input
                type="text"
                value={mqttSettings.mqtt_broker}
                onChange={(e) => setMqttSettings({ ...mqttSettings, mqtt_broker: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">MQTT Port</label>
              <input
                type="text"
                value={mqttSettings.mqtt_port}
                onChange={(e) => setMqttSettings({ ...mqttSettings, mqtt_port: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">MQTT Username</label>
              <input
                type="text"
                value={mqttSettings.mqtt_username}
                onChange={(e) => setMqttSettings({ ...mqttSettings, mqtt_username: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">MQTT Password</label>
              <input
                type="password"
                value={mqttSettings.mqtt_password}
                onChange={(e) => setMqttSettings({ ...mqttSettings, mqtt_password: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={testMqttConnection}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Test MQTT Connection
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {lastChecked && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Connection Status</h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Last checked: {lastChecked}</span>
                {responseTime && (
                  <span className="text-sm text-gray-500">Response time: {responseTime}ms</span>
                )}
                <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                  connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                </span>
              </div>
            </div>

            {/* Logs */}
            <div className="border-t border-gray-200 pt-4">
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
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Success: </strong>
            <span className="block sm:inline">{success}</span>
          </div>
        )}
      </div>
    </div>
  );
} 