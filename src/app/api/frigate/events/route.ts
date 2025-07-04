import { NextResponse } from 'next/server';
import { loadSettings } from '@/lib/settings';

interface FrigateEvent {
  id: string;
  camera: string;
  label: string;
  zones: string[];
  start_time: number;
  end_time: number;
  has_clip: boolean;
  has_snapshot: boolean;
  plus_id: string | null;
  retain_indefinitely: boolean;
  sub_label: string | null;
  top_score: number | null;
  false_positive: boolean | null;
  box: number[] | null;
  data: {
    box: number[];
    region: number[];
    score: number;
    top_score: number;
    attributes: any[];
    type: string;
    max_severity: string;
  };
  thumbnail: string;
}

export async function GET() {
  try {
    const settings = loadSettings();
    const apiUrl = `${settings.frigate_api_url}/api/events`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Frigate API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const event: FrigateEvent = await request.json();
    
    // Log the event data
    console.log('Received Frigate event:', {
      id: event.id,
      camera: event.camera,
      label: event.label,
      start_time: new Date(event.start_time * 1000).toISOString(),
      score: event.data.score,
      severity: event.data.max_severity,
      has_thumbnail: !!event.thumbnail
    });

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Event received successfully',
      event_id: event.id 
    });
  } catch (error) {
    console.error('Error processing Frigate event:', error);
    return NextResponse.json(
      { error: 'Failed to process event' },
      { status: 500 }
    );
  }
} 