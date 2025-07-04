import { NextResponse } from 'next/server';
import { loadSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = loadSettings();
    const apiUrl = `${settings.frigate_api_url}/api/version`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Frigate API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      message: `Successfully connected to Frigate API (Version: ${data.version})`
    });
  } catch (error) {
    console.error('Error testing Frigate connection:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to Frigate API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 