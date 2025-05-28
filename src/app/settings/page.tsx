'use client';

import { useEffect, useState } from 'react';
import { Settings } from '@/lib/supabase';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    id: 1,
    mqtt_ws_url: '',
    mqtt_topic: ''
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => setSettings(data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Saving...');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mqtt_ws_url: settings.mqtt_ws_url,
          mqtt_topic: settings.mqtt_topic
        })
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setStatus('Settings saved successfully!');
    } catch (error) {
      setStatus('Error saving settings');
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            MQTT WebSocket URL
          </label>
          <input
            type="text"
            value={settings.mqtt_ws_url}
            onChange={e => setSettings(prev => ({ ...prev, mqtt_ws_url: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            MQTT Topic
          </label>
          <input
            type="text"
            value={settings.mqtt_topic}
            onChange={e => setSettings(prev => ({ ...prev, mqtt_topic: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Save Settings
        </button>
        {status && (
          <p className={`text-sm ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {status}
          </p>
        )}
      </form>
    </main>
  );
} 