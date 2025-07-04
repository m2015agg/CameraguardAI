import { NextResponse } from 'next/server';
import { loadSettings } from '@/lib/settings';

// Store MQTT settings in memory
let mqttSettings = {
  mqtt_broker: process.env.MQTT_HOST || '',
  mqtt_port: process.env.MQTT_PORT || '',
  mqtt_username: process.env.MQTT_USER || '',
  mqtt_password: process.env.MQTT_PASS || ''
};

console.log('MQTT Settings Debug:', {
  broker: mqttSettings.mqtt_broker,
  port: mqttSettings.mqtt_port,
  user: mqttSettings.mqtt_username,
  pass: mqttSettings.mqtt_password ? '***' : undefined
});

export async function GET() {
  try {
    return NextResponse.json(mqttSettings);
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to load MQTT settings' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const settings = await request.json();
    
    // Update in-memory settings
    mqttSettings = {
      mqtt_broker: settings.mqtt_broker,
      mqtt_port: settings.mqtt_port,
      mqtt_username: settings.mqtt_username,
      mqtt_password: settings.mqtt_password
    };

    console.log('MQTT Settings Updated:', {
      broker: mqttSettings.mqtt_broker,
      port: mqttSettings.mqtt_port,
      user: mqttSettings.mqtt_username,
      pass: mqttSettings.mqtt_password ? '***' : undefined
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to save MQTT settings' 
    }, { status: 500 });
  }
} 