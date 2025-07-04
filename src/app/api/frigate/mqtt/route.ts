import { NextResponse } from 'next/server';
import mqtt, { MqttClient } from 'mqtt';
import { loadSettings } from '@/lib/settings';
// @ts-ignore
import { createClient } from '@supabase/supabase-js';
import type { Message } from '@/types/mqtt';

// Store the MQTT client and messages
let client: MqttClient | null = null;
let events: any[] = [];
let reviews: any[] = [];
let trackedObjects: any[] = [];

// Get MQTT settings from environment variables
const mqttSettings = {
  host: process.env.MQTT_HOST || '10.0.1.50',
  port: process.env.MQTT_PORT || '1883',
  user: process.env.MQTT_USER || 'frigate',
  pass: process.env.MQTT_PASS || 'frigate_2024'
};

// Function to filter out messages older than 1 day
function filterOldMessages(messages: any[]): any[] {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  return messages.filter(msg => {
    const messageDate = new Date(msg._timestamp);
    return messageDate >= oneDayAgo;
  });
}

// Convert to Central Time
function toCentralTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

async function insertEventToSupabase(payload: any, supabase: any) {
  const event_type = payload.type || null;
  const event_id = payload.after?.id || payload.before?.id || null;
  const camera = payload.after?.camera || payload.before?.camera || null;
  const before_data = payload.before || null;
  const after_data = payload.after || null;
  const received_at = toCentralTime(new Date());

  // Detailed logging before insert
  console.log('--- Supabase Event Insert Attempt ---');
  console.log('Insert payload:', {
    event_type,
    event_id,
    camera,
    before_data,
    after_data,
    received_at
  });

  supabase
    .from('events')
    .insert([
      {
        event_type,
        event_id,
        camera,
        before_data,
        after_data,
        received_at
      },
    ])
    .then(({ error }: { error: any }) => {
      if (error) {
        console.error('Supabase event insert error:', error);
      } else {
        console.log('Supabase event insert successful for event_id:', event_id);
      }
    });
}

interface InsertPayload {
  review_type: any;
  review_id: any;
  camera: any;
  zones: any;
  objects: any;
  clip_url: any;
  snapshot_url: any;
  timestamp: string;
  metadata: {
    severity: any;
    detections: any;
    sub_labels: any;
    audio: any;
  };
  reason: string;
  is_alert: boolean;
  created_at: string;
  source: string;
  before_data: any;
  after_data: any;
  status: string;
  reasoning: any;
  [key: string]: any; // Add index signature
}

async function insertReviewToSupabase(payload: any, supabase: any) {
  // Log the raw payload first
  console.log('--- Raw Review Payload ---');
  console.log(JSON.stringify(payload, null, 2));

  // Validate required fields
  if (!payload) {
    console.error('Invalid payload: payload is null or undefined');
    return;
  }

  // Extract data from the review payload
  const review_type = payload.type || null; // 'new', 'update', or 'end'
  const review_id = payload.after?.id || payload.before?.id || null;
  const camera = payload.after?.camera || payload.before?.camera || null;
  const zones = payload.after?.data?.zones || payload.before?.data?.zones || [];
  const objects = payload.after?.data?.objects || payload.before?.data?.objects || [];
  
  // Extract URLs
  const clip_url = payload.after?.clip_path || payload.before?.clip_path || 
                   payload.after?.clip_url || payload.before?.clip_url || null;
  const snapshot_url = payload.after?.thumb_path || payload.before?.thumb_path || 
                      payload.after?.snapshot_url || payload.before?.snapshot_url || null;
  
  // Validate required fields
  if (!review_id) {
    console.error('Invalid payload: missing review_id');
    return;
  }
  if (!camera) {
    console.error('Invalid payload: missing camera');
    return;
  }

  // Use start_time if end_time is null
  const timestamp = payload.after?.end_time ? 
    toCentralTime(new Date(payload.after.end_time * 1000)) : 
    payload.after?.start_time ? 
    toCentralTime(new Date(payload.after.start_time * 1000)) :
    toCentralTime(new Date());

  const metadata = {
    severity: payload.after?.severity || payload.before?.severity || 'unknown',
    detections: payload.after?.data?.detections || payload.before?.data?.detections || [],
    sub_labels: payload.after?.data?.sub_labels || payload.before?.data?.sub_labels || [],
    audio: payload.after?.data?.audio || payload.before?.data?.audio || []
  };

  const reason = payload.after?.severity || payload.before?.severity || 'unknown';
  const is_alert = (payload.after?.severity === 'alert' || payload.before?.severity === 'alert') || false;
  const created_at = toCentralTime(new Date());

  // Check if review already exists
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id, review_type')
    .eq('review_id', review_id)
    .single();

  // Prepare the payload
  const reviewPayload = {
    review_type,
    review_id,
    camera,
    zones,
    objects,
    clip_url,
    snapshot_url,
    timestamp,
    metadata,
    reason,
    is_alert,
    created_at,
    source: 'frigate',
    before_data: payload.before,
    after_data: payload.after,
    status: 'waiting',
    reasoning: {
      initial_status: 'waiting',
      message: `Review ${review_type} received, waiting for Lizi processing`,
      review_lifecycle: {
        type: review_type,
        timestamp: created_at,
        is_update: existingReview ? true : false
      }
    }
  };

  // Detailed logging
  console.log('--- Supabase Review Processing ---');
  console.log('Review type:', review_type);
  console.log('Review ID:', review_id);
  console.log('Existing review:', existingReview ? 'Yes' : 'No');

  if (existingReview) {
    // Update existing review
    console.log('Updating existing review...');
    const { error, data } = await supabase
      .from('reviews')
      .update(reviewPayload)
      .eq('review_id', review_id);

    if (error) {
      console.error('Supabase review update error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Supabase review update successful for review_id:', review_id);
      console.log('Updated data:', data);
    }
  } else {
    // Insert new review
    console.log('Creating new review...');
    const { error, data } = await supabase
      .from('reviews')
      .insert([reviewPayload]);

    if (error) {
      console.error('Supabase review insert error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('Supabase review insert successful for review_id:', review_id);
      console.log('Inserted data:', data);
    }
  }
}

async function insertTrackedObjectToSupabase(payload: any, supabase: any) {
  // Log the raw payload first
  console.log('--- Raw Tracked Object Payload ---');
  console.log(JSON.stringify(payload, null, 2));

  // Validate required fields
  if (!payload) {
    console.error('Invalid payload: payload is null or undefined');
    return;
  }

  // Extract data from the tracked object payload
  const tracked_object_type = payload.type || null;
  const tracked_object_id = payload.after?.id || payload.before?.id || null;
  const camera = payload.after?.camera || payload.before?.camera || null;
  const before_data = payload.before || null;
  const after_data = payload.after || null;
  const received_at = toCentralTime(new Date());
  const created_at = toCentralTime(new Date());

  // Validate required fields
  if (!tracked_object_id) {
    console.error('Invalid payload: missing tracked_object_id');
    return;
  }
  if (!camera) {
    console.error('Invalid payload: missing camera');
    return;
  }

  // Detailed logging before insert
  console.log('--- Supabase Tracked Object Insert Attempt ---');
  console.log('Insert payload:', {
    tracked_object_type,
    tracked_object_id,
    camera,
    before_data,
    after_data,
    received_at,
    created_at
  });

  supabase
    .from('tracked_objects')
    .insert([
      {
        tracked_object_type,
        tracked_object_id,
        camera,
        before_data,
        after_data,
        received_at,
        created_at
      },
    ])
    .then(({ error, data }: { error: any; data: any }) => {
      if (error) {
        console.error('Supabase tracked object insert error:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        // Log the full error object for debugging
        console.error('Full error object:', JSON.stringify(error, null, 2));
      } else {
        console.log('Supabase tracked object insert successful for tracked_object_id:', tracked_object_id);
        console.log('Inserted data:', data);
      }
    });
}

// Initialize MQTT client
function initializeMQTTClient() {
  if (client) {
    return client;
  }

  // If client doesn't exist, create it
  if (!client) {
    // Use environment variables for MQTT connection
    const mqttUrl = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;
    console.log('MQTT Connection Debug:', {
      host: process.env.MQTT_HOST,
      port: process.env.MQTT_PORT,
      user: process.env.MQTT_USER,
      pass: process.env.MQTT_PASS ? '***' : undefined,
      url: mqttUrl
    });
    
    client = mqtt.connect(mqttUrl, {
      clientId: `frigate-web-${Math.random().toString(16).slice(3)}`,
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASS,
      clean: true,
      reconnectPeriod: 1000,
      keepalive: 60,
      connectTimeout: 5000
    });

    // Set up connection event handlers
    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      const topics = ['frigate/events', 'frigate/reviews', 'frigate/tracked_object_update'];
      topics.forEach(topic => {
        client?.subscribe(topic, (err) => {
          if (err) {
            console.error(`Error subscribing to topic ${topic}:`, err);
          } else {
            console.log(`Successfully subscribed to ${topic}`);
          }
        });
      });
    });

    client.on('error', (error) => {
      console.error('MQTT error:', error.message);
      // Don't set client to null on error, let it try to reconnect
    });

    client.on('close', () => {
      console.log('MQTT connection closed');
      // Only set client to null if it was explicitly closed
      if (!client?.reconnecting) {
        client = null;
      }
    });

    client.on('reconnect', () => {
      console.log('MQTT reconnecting...');
    });

    client.on('offline', () => {
      console.log('MQTT client went offline');
    });

    client.on('message', async (topic, message) => {
      try {
        console.log(`Received message on topic: ${topic}`);
        const payload = JSON.parse(message.toString());
        const timestamp = new Date().toISOString();
        
        // Get Supabase client
        const settings = loadSettings();
        const supabase = createClient(settings.supabase_url, settings.supabase_service_role_key);
        
        if (topic === 'frigate/events') {
          console.log('Processing event message');
          events.unshift({ ...payload, _topic: topic, _timestamp: timestamp });
          await insertEventToSupabase(payload, supabase);
        } else if (topic === 'frigate/reviews') {
          console.log('Processing review message');
          reviews.unshift({ ...payload, _topic: topic, _timestamp: timestamp });
          await insertReviewToSupabase(payload, supabase);
        } else if (topic === 'frigate/tracked_object_update') {
          console.log('Processing tracked object message');
          trackedObjects.unshift({ ...payload, _topic: topic, _timestamp: timestamp });
          await insertTrackedObjectToSupabase(payload, supabase);
        }
        
        console.log(`Successfully processed message on ${topic}`);
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  return client;
}

export async function GET(request: Request) {
  try {
    // Load settings first
    const settings = loadSettings();
    if (!settings.supabase_url) {
      console.error('Supabase URL is not set');
      return NextResponse.json({ 
        error: 'Supabase configuration is missing',
        details: 'Please configure Supabase settings in the settings page'
      }, { status: 400 });
    }

    const supabase = createClient(settings.supabase_url, settings.supabase_service_role_key);
    
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';
    
    // Initialize MQTT client if not exists
    if (!client) {
      try {
        initializeMQTTClient();
      } catch (error) {
        console.error('Failed to initialize MQTT client:', error);
        return NextResponse.json({ 
          error: 'Failed to initialize MQTT connection',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Check if client is connected
    if (!client?.connected) {
      console.error('MQTT client not connected');
      return NextResponse.json({ 
        error: 'MQTT client not connected',
        details: 'The MQTT client is not currently connected to the broker'
      }, { status: 503 });
    }

    // Filter out old messages before returning
    try {
      events = filterOldMessages(events);
      reviews = filterOldMessages(reviews);
      trackedObjects = filterOldMessages(trackedObjects);
    } catch (error) {
      console.error('Error filtering messages:', error);
      return NextResponse.json({ 
        error: 'Failed to process messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Return messages based on type parameter
    switch (type) {
      case 'events':
        return NextResponse.json(events);
      case 'reviews':
        return NextResponse.json(reviews);
      case 'tracked_objects':
        return NextResponse.json(trackedObjects);
      default:
        return NextResponse.json({ events, reviews, trackedObjects });
    }
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE() {
  if (client) {
    client.end();
    client = null;
  }
  return NextResponse.json({ message: 'MQTT client disconnected' });
} 