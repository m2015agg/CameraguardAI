'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadSettings } from '@/lib/settings';

interface SystemStatus {
  mqtt: {
    status: 'connected' | 'disconnected' | 'connecting';
    responseTime: number;
    lastChecked: string;
    messages: number;
  };
  supabase: {
    status: 'connected' | 'disconnected' | 'connecting';
    responseTime: number;
    lastChecked: string;
    tables?: Array<{
      schemaname: string;
      tablename: string;
      columns: Array<{
        column_name: string;
        data_type: string;
        is_nullable: string;
      }>;
    }>;
  };
}

export default function HomePage() {
  const [status, setStatus] = useState<SystemStatus>({
    mqtt: {
      status: 'disconnected',
      responseTime: 0,
      lastChecked: '',
      messages: 0
    },
    supabase: {
      status: 'disconnected',
      responseTime: 0,
      lastChecked: ''
    }
  });

  const checkMQTTStatus = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/frigate/mqtt');
      if (!response.ok) throw new Error('Failed to connect to MQTT');
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      setStatus(prev => ({
        ...prev,
        mqtt: {
          status: 'connected',
          responseTime,
          lastChecked: new Date().toISOString(),
          messages: Array.isArray(data) ? data.length : 0
        }
      }));
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        mqtt: {
          ...prev.mqtt,
          status: 'disconnected',
          responseTime: 0,
          lastChecked: new Date().toISOString()
        }
      }));
    }
  };

  const checkSupabaseStatus = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/supabase/test');
      if (!response.ok) throw new Error('Failed to connect to Supabase');
      const data = await response.json();
      
      // If we get a response, even if there's an error message, the connection is working
      const responseTime = Date.now() - startTime;
      
      setStatus(prev => ({
        ...prev,
        supabase: {
          status: 'connected',
          responseTime,
          lastChecked: new Date().toISOString(),
          tables: data.tables
        }
      }));
    } catch (error) {
      console.error('Supabase connection error:', error);
      setStatus(prev => ({
        ...prev,
        supabase: {
          ...prev.supabase,
          status: 'disconnected',
          responseTime: 0,
          lastChecked: new Date().toISOString()
        }
      }));
    }
  };

  const checkAllStatus = async () => {
    await Promise.all([
      checkMQTTStatus(),
      checkSupabaseStatus()
    ]);
  };

  useEffect(() => {
    checkAllStatus();
    const interval = setInterval(checkAllStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const StatusBadge = ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
    const colors = {
      connected: 'bg-green-100 text-green-800',
      disconnected: 'bg-red-100 text-red-800',
      connecting: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">System Status</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* MQTT Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">MQTT Messages</h2>
                <p className="text-sm text-gray-500">Real-time event monitoring</p>
              </div>
              <StatusBadge status={status.mqtt.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-medium">{status.mqtt.responseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Checked:</span>
                <span className="font-medium">
                  {new Date(status.mqtt.lastChecked).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Messages:</span>
                <span className="font-medium">{status.mqtt.messages}</span>
              </div>
            </div>
          </div>

          {/* Supabase Status */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">Supabase</h2>
                <p className="text-sm text-gray-500">Database connection</p>
              </div>
              <StatusBadge status={status.supabase.status} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time:</span>
                <span className="font-medium">{status.supabase.responseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Checked:</span>
                <span className="font-medium">
                  {new Date(status.supabase.lastChecked).toLocaleTimeString()}
                </span>
              </div>
              {status.supabase.tables && status.supabase.tables.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-700 mb-2">Tables:</h3>
                  <div className="space-y-4">
                    {status.supabase.tables.map((table) => (
                      <div key={table.tablename} className="bg-gray-50 rounded p-3">
                        <h4 className="font-medium text-gray-800 mb-2">{table.tablename}</h4>
                        <div className="space-y-1">
                          {table.columns.map((column) => (
                            <div key={column.column_name} className="flex justify-between text-xs">
                              <span className="text-gray-600">{column.column_name}</span>
                              <span className="text-gray-500">
                                {column.data_type}
                                {column.is_nullable === 'YES' ? ' (nullable)' : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 