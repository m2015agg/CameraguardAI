'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MQTTMessage {
  _topic: string;
  _timestamp: string;
  type: string;
  before?: any;
  after?: any;
  [key: string]: any;
}

export default function MQTTMessagesPage() {
  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setConnectionStatus('connecting');
        const response = await fetch('/api/frigate/mqtt');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.details || data.error || 'Failed to fetch messages');
        }
        
        setMessages(data);
        setConnectionStatus('connected');
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
        console.error('MQTT fetch error:', errorMessage);
        setError(errorMessage);
        setConnectionStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMessages();

    // Set up polling with exponential backoff
    let retryCount = 0;
    const maxRetryCount = 5;
    const baseInterval = 1000; // Start with 1 second

    const poll = () => {
      fetchMessages().then(() => {
        // Reset retry count on success
        retryCount = 0;
      }).catch(() => {
        // Increase retry count on failure
        retryCount = Math.min(retryCount + 1, maxRetryCount);
      });
    };

    // Initial poll
    const interval = setInterval(poll, baseInterval * Math.pow(2, retryCount));

    return () => {
      clearInterval(interval);
    };
  }, []);

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1) + '%';
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">MQTT Messages</h1>
          <StatusBadge status={connectionStatus} />
        </div>

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
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mb-2">
                      {message._topic}
                    </span>
                    <div className="text-sm text-gray-500">
                      {new Date(message._timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {message.type}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {message.before && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Before: </span>
                      <span className="text-gray-600">
                        {message.before.camera} - {message.before.label}
                        {message.before.score && ` (${formatScore(message.before.score)})`}
                      </span>
                    </div>
                  )}
                  {message.after && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">After: </span>
                      <span className="text-gray-600">
                        {message.after.camera} - {message.after.label}
                        {message.after.score && ` (${formatScore(message.after.score)})`}
                      </span>
                    </div>
                  )}
                </div>

                <details className="mt-2">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Show Full Message
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(message, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 