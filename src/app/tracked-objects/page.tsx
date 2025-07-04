'use client';

import { useEffect, useState } from 'react';

interface TrackedObject {
  tracked_object_type: string;
  tracked_object_id: string;
  camera: string;
  before_data: any;
  after_data: any;
  received_at: string;
  _timestamp: string;
}

export default function TrackedObjectsPage() {
  const [trackedObjects, setTrackedObjects] = useState<TrackedObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    const fetchTrackedObjects = async () => {
      try {
        setConnectionStatus('connecting');
        const response = await fetch('/api/frigate/mqtt?type=tracked_objects');
        if (!response.ok) throw new Error('Failed to fetch tracked objects');
        
        const data = await response.json();
        setTrackedObjects(data);
        setConnectionStatus('connected');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tracked objects');
        setConnectionStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };

    fetchTrackedObjects();
    const interval = setInterval(fetchTrackedObjects, 5000); // Refresh every 5 seconds
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

  const renderObjectDetails = (obj: TrackedObject) => {
    const details = obj.after_data || obj.before_data;
    if (!details) return null;

    return (
      <div className="mt-2 space-y-2">
        {details.label && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Label: </span>
            <span className="text-gray-600">{details.label}</span>
          </div>
        )}
        {details.confidence && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Confidence: </span>
            <span className="text-gray-600">{(details.confidence * 100).toFixed(1)}%</span>
          </div>
        )}
        {details.region && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Region: </span>
            <span className="text-gray-600">
              x: {details.region.x.toFixed(0)}, y: {details.region.y.toFixed(0)}, 
              w: {details.region.w.toFixed(0)}, h: {details.region.h.toFixed(0)}
            </span>
          </div>
        )}
        {details.area && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Area: </span>
            <span className="text-gray-600">{details.area.toFixed(0)} pixels</span>
          </div>
        )}
        {details.velocity && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Velocity: </span>
            <span className="text-gray-600">
              x: {details.velocity.x.toFixed(1)}, y: {details.velocity.y.toFixed(1)}
            </span>
          </div>
        )}
        {details.stationary !== undefined && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Status: </span>
            <span className="text-gray-600">{details.stationary ? 'Stationary' : 'Moving'}</span>
          </div>
        )}
        {details.score && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Score: </span>
            <span className="text-gray-600">{(details.score * 100).toFixed(1)}%</span>
          </div>
        )}
        {details.sub_label && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Sub Label: </span>
            <span className="text-gray-600">{details.sub_label}</span>
          </div>
        )}
        {details.sub_label_score && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">Sub Label Score: </span>
            <span className="text-gray-600">{(details.sub_label_score * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tracked Objects</h1>
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
            {trackedObjects.map((obj, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-500">
                      {new Date(obj._timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {obj.tracked_object_type}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Camera: </span>
                    <span className="text-gray-600">{obj.camera}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">ID: </span>
                    <span className="text-gray-600">{obj.tracked_object_id}</span>
                  </div>
                  {renderObjectDetails(obj)}
                </div>

                <details className="mt-2">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Show Full Object
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(obj, null, 2)}
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