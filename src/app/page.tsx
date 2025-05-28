'use client';

import { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import { Settings } from '@/lib/supabase';

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  useEffect(() => {
    // Fetch settings
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.mqtt_ws_url && data.mqtt_topic) {
          connectMQTT(data.mqtt_ws_url, data.mqtt_topic);
        }
      })
      .catch(console.error);

    return () => {
      if (client) {
        client.end();
      }
    };
  }, []);

  const connectMQTT = (wsUrl: string, topic: string) => {
    const mqttClient = mqtt.connect(wsUrl);

    mqttClient.on('connect', () => {
      console.log('Connected to MQTT');
      mqttClient.subscribe(topic);
    });

    mqttClient.on('message', (topic, message) => {
      setMessages(prev => [...prev, message.toString()].slice(-50));
    });

    mqttClient.on('error', (err) => {
      console.error('MQTT Error:', err);
    });

    setClient(mqttClient);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Camera Guard AI</h1>
      <div className="bg-gray-100 p-4 rounded-lg h-[600px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className="mb-2 p-2 bg-white rounded shadow">
            {msg}
          </div>
        ))}
      </div>
    </main>
  );
} 