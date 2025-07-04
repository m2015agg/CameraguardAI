import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Attempting to fetch logs from lizi-api...');
    const response = await fetch('http://10.0.1.217:5001/logs', {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch logs: ${response.statusText} - ${errorText}`);
    }
    
    const logs = await response.json();
    console.log(`Successfully fetched ${logs.length} logs`);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching Lizi logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Lizi logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 