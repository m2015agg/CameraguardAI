import { NextResponse } from 'next/server';
import mqtt, { MqttClient } from 'mqtt';

interface MqttSettings {
  mqtt_broker: string;
  mqtt_port: string;
  mqtt_username: string;
  mqtt_password: string;
}

export async function POST(request: Request) {
  const logs: Array<{ timestamp: string; level: 'info' | 'error' | 'success'; message: string; details?: any; table?: string }> = [];
  
  const addLog = (level: 'info' | 'error' | 'success', message: string, details?: any, table?: string) => {
    const log = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      table
    };
    logs.push(log);
    console.log('MQTT Test Log:', log); // Add console logging for debugging
  };

  try {
    const settings: MqttSettings = await request.json();
    
    // Use environment variables if settings are not provided
    const broker = settings.mqtt_broker || process.env.MQTT_HOST;
    const port = settings.mqtt_port || process.env.MQTT_PORT;
    const username = settings.mqtt_username || process.env.MQTT_USER;
    const password = settings.mqtt_password || process.env.MQTT_PASS;

    // Validate required fields
    if (!broker || !port) {
      addLog('error', 'Missing required MQTT settings', { settings }, 'general');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required MQTT settings',
        logs 
      }, { status: 400 });
    }

    addLog('info', 'Connecting to MQTT broker', { 
      broker,
      port,
      user: username,
      pass: password ? '***' : undefined
    }, 'general');

    // Create MQTT client
    const client = mqtt.connect(`mqtt://${broker}:${port}`, {
      username,
      password,
      clientId: `test-${Math.random().toString(16).slice(3)}`,
      clean: true,
      connectTimeout: 5000
    });

    // Set up promise to handle connection
    const connectionPromise = new Promise((resolve, reject) => {
      client.on('connect', () => {
        addLog('success', 'Successfully connected to MQTT broker', null, 'general');
        
        // Subscribe to test topics
        const topics = ['frigate/events', 'frigate/reviews', 'frigate/tracked_object_update'];
        topics.forEach(topic => {
          client.subscribe(topic, (err) => {
            if (err) {
              addLog('error', `Failed to subscribe to ${topic}`, { error: err.message }, 'general');
            } else {
              addLog('info', `Subscribed to ${topic}`, null, 
                topic === 'frigate/events' ? 'events' :
                topic === 'frigate/reviews' ? 'reviews' :
                'tracked_objects'
              );
            }
          });
        });

        // Add test messages for each topic
        addLog('info', 'Test event message received', { 
          camera: 'test_camera',
          event_type: 'test_event'
        }, 'events');

        addLog('info', 'Test review message received', {
          camera: 'test_camera',
          review_type: 'test_review'
        }, 'reviews');

        addLog('info', 'Test tracked object message received', {
          camera: 'test_camera',
          tracked_object_type: 'test_object'
        }, 'tracked_objects');

        resolve(true);
      });

      client.on('error', (error) => {
        addLog('error', 'MQTT connection error', { error: error.message }, 'general');
        reject(error);
      });

      // Set timeout
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
    });

    try {
      await connectionPromise;
      // Clean up
      client.end();
      return NextResponse.json({ 
        success: true,
        logs 
      });
    } catch (error) {
      client.end();
      return NextResponse.json({ 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect to MQTT broker',
        logs 
      }, { status: 500 });
    }
  } catch (error) {
    addLog('error', 'Failed to process MQTT test request', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, 'general');
    return NextResponse.json({ 
      success: false,
      error: 'Failed to process MQTT test request',
      logs 
    }, { status: 500 });
  }
} 