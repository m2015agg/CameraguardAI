'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FrigateReview {
  _topic: string;
  _timestamp: string;
  type: string;
  before?: any;
  after?: any;
  [key: string]: any;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<FrigateReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setConnectionStatus('connecting');
        const response = await fetch('/api/frigate/mqtt?type=reviews');
        if (!response.ok) throw new Error('Failed to fetch reviews');
        
        const data = await response.json();
        setReviews(data);
        setConnectionStatus('connected');
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reviews');
        setConnectionStatus('disconnected');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
    const interval = setInterval(fetchReviews, 1000);
    return () => clearInterval(interval);
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
          <h1 className="text-3xl font-bold">Frigate Reviews</h1>
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
            {reviews.map((review, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm text-gray-500">
                      {new Date(review._timestamp).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {review.type}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {review.before && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Before: </span>
                      <span className="text-gray-600">
                        {review.before.camera} - {review.before.label}
                        {review.before.score && ` (${formatScore(review.before.score)})`}
                      </span>
                    </div>
                  )}
                  {review.after && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">After: </span>
                      <span className="text-gray-600">
                        {review.after.camera} - {review.after.label}
                        {review.after.score && ` (${formatScore(review.after.score)})`}
                      </span>
                    </div>
                  )}
                </div>

                <details className="mt-2">
                  <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                    Show Full Review
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                    {JSON.stringify(review, null, 2)}
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