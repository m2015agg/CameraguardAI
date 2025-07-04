import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { loadSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = loadSettings();
    const supabase = createClient(settings.supabase_url, settings.supabase_anon_key);
    
    // Fetch logs from all tables
    const [eventsResult, reviewsResult, trackedObjectsResult] = await Promise.all([
      supabase.from('events').select('*').order('received_at', { ascending: false }).limit(100),
      supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('tracked_objects').select('*').order('received_at', { ascending: false }).limit(100)
    ]);

    // Process events logs
    const eventsLogs = eventsResult.data?.map(event => ({
      timestamp: event.received_at,
      level: 'info',
      message: `Event ${event.event_type} from camera ${event.camera}`,
      details: event,
      table: 'events'
    })) || [];

    // Process reviews logs
    const reviewsLogs = reviewsResult.data?.map(review => ({
      timestamp: review.created_at,
      level: review.is_alert ? 'error' : 'info',
      message: `Review ${review.review_type} from camera ${review.camera}`,
      details: review,
      table: 'reviews'
    })) || [];

    // Process tracked objects logs
    const trackedObjectsLogs = trackedObjectsResult.data?.map(obj => ({
      timestamp: obj.received_at,
      level: 'info',
      message: `Tracked object ${obj.tracked_object_type} from camera ${obj.camera}`,
      details: obj,
      table: 'tracked_objects'
    })) || [];

    // Combine all logs and sort by timestamp
    const allLogs = [...eventsLogs, ...reviewsLogs, ...trackedObjectsLogs]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(allLogs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 