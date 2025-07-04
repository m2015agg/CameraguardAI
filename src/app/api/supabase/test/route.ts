import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { loadSettings } from '@/lib/settings';

export async function GET() {
  const logs: Array<{ timestamp: string; level: 'info' | 'error' | 'success'; message: string; details?: any }> = [];
  
  const addLog = (level: 'info' | 'error' | 'success', message: string, details?: any) => {
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    });
  };

  try {
    const settings = loadSettings();
    
    // Log all settings for debugging
    addLog('info', 'Loaded settings', {
      supabase_url: settings.supabase_url,
      has_anon_key: !!settings.supabase_anon_key,
      anon_key_length: settings.supabase_anon_key?.length,
      has_service_role_key: !!settings.supabase_service_role_key,
      service_role_key_length: settings.supabase_service_role_key?.length
    });

    if (!settings.supabase_url) {
      addLog('error', 'Missing Supabase URL');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing Supabase URL',
        details: 'Please set the SUPABASE_URL environment variable or configure it in settings',
        logs
      }, { status: 400 });
    }

    if (!settings.supabase_anon_key) {
      addLog('error', 'Missing Supabase anon key');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing Supabase anon key',
        details: 'Please set the ANON_KEY environment variable or configure it in settings',
        logs
      }, { status: 400 });
    }

    addLog('info', 'Connecting to Supabase', { url: settings.supabase_url });
    addLog('info', 'Using anon key', { key: settings.supabase_anon_key.substring(0, 10) + '...' });
    
    // Create Supabase client
    const supabase = createClient(
      settings.supabase_url,
      settings.supabase_anon_key,
      {
        auth: {
          persistSession: false
        }
      }
    );
    addLog('success', 'Supabase client created successfully');

    // First, try to get the list of tables
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) {
      addLog('error', 'Failed to get list of tables', { error: tablesError });
      // Continue anyway, as we might still be able to access our tables
    } else {
      addLog('info', 'Available tables', { tables: tables?.map(t => t.tablename) });
    }

    // Check for our actual tables
    const requiredTables = ['events', 'reviews', 'tracked_objects'];
    addLog('info', 'Checking required tables', { tables: requiredTables });

    const tableChecks = await Promise.all(
      requiredTables.map(async (table) => {
        addLog('info', `Checking table: ${table}`);
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === '42P01') {
            addLog('error', `Table ${table} does not exist`, { error });
          } else {
            addLog('error', `Error checking table ${table}`, { error });
          }
        } else {
          addLog('success', `Table ${table} exists and is accessible`);
        }
        
        return {
          table,
          exists: !error || error.code !== '42P01',
          error: error ? {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          } : null
        };
      })
    );

    // If any table exists, we consider the connection successful
    const hasAnyTable = tableChecks.some(check => check.exists);
    
    if (!hasAnyTable) {
      addLog('error', 'No required tables found', { tableChecks });
      return NextResponse.json({ 
        success: false, 
        error: 'No required tables found',
        details: 'None of the required tables (events, reviews, tracked_objects) exist. Please create these tables in your Supabase database.',
        tableChecks,
        logs
      }, { status: 500 });
    }

    addLog('success', 'Connection test completed successfully', { tableChecks });
    return NextResponse.json({ 
      success: true, 
      message: 'Successfully connected to Supabase',
      tableChecks,
      logs
    });
  } catch (error) {
    addLog('error', 'Unexpected error during connection test', { error: error instanceof Error ? error.message : 'Unknown error' });
    console.error('Error testing Supabase connection:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to connect to Supabase',
      details: error instanceof Error ? error.message : 'Unknown error',
      logs
    }, { status: 500 });
  }
} 