'use client';

import { useState } from 'react';
import mqtt from 'mqtt';

export default function TestPage() {
  const [supabaseStatus, setSupabaseStatus] = useState('');
  const [mqttStatus, setMqttStatus] = useState('');
  const [mqttClient, setMqttClient] = useState<mqtt.MqttClient | null>(null);

  const testSupabase = async () => {
    setSupabaseStatus('Testing...');
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to connect to Supabase');
      setSupabaseStatus('Successfully connected to Supabase!');
    } catch (error) {
      setSupabaseStatus('Error connecting to Supabase');
      console.error(error);
    }
  };

  const testMQTT = async () => {
    setMqttStatus('Testing...');
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();
      
      if (!settings.mqtt_ws_url) {
        throw new Error('MQTT WebSocket URL not configured');
      }

      const client = mqtt.connect(settings.mqtt_ws_url);

      client.on('connect', () => {
        setMqttStatus('Successfully connected to MQTT!');
        client.end();
      });

      client.on('error', (err) => {
        setMqttStatus('Error connecting to MQTT');
        console.error(err);
        client.end();
      });

      setMqttClient(client);
    } catch (error) {
      setMqttStatus('Error testing MQTT connection');
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Connection Tests</h1>
      <div className="space-y-4">
        <div>
          <button
            onClick={testSupabase}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Supabase
          </button>
          {supabaseStatus && (
            <p className={`mt-2 text-sm ${supabaseStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {supabaseStatus}
            </p>
          )}
        </div>
        <div>
          <button
            onClick={testMQTT}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test MQTT
          </button>
          {mqttStatus && (
            <p className={`mt-2 text-sm ${mqttStatus.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {mqttStatus}
            </p>
          )}
        </div>
      </div>
    </main>
  );
} 