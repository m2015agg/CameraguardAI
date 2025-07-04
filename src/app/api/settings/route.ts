import { NextResponse } from 'next/server';
import { Settings, loadSettings, saveSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = loadSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const settings: Settings = await request.json();
    saveSettings(settings);
    return NextResponse.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Error in POST /api/settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
} 