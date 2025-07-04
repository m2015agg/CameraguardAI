export interface Settings {
  frigate_api_url: string;
  supabase_url: string;
  supabase_anon_key: string;
  supabase_service_role_key: string;
}

const DEFAULT_SETTINGS: Settings = {
  frigate_api_url: process.env.NEXT_PUBLIC_FRIGATE_API_URL || 'http://10.0.1.50:5000',
  supabase_url: process.env.SUPABASE_URL || '',
  supabase_anon_key: process.env.ANON_KEY || '',
  supabase_service_role_key: process.env.SERVICE_ROLE_KEY || ''
};

export function loadSettings(): Settings {
  if (typeof window === 'undefined') {
    // Server-side: use environment variables
    return DEFAULT_SETTINGS;
  }

  // Client-side: try to load from localStorage
  const storedSettings = localStorage.getItem('settings');
  if (storedSettings) {
    try {
      return JSON.parse(storedSettings);
    } catch (e) {
      console.error('Error parsing stored settings:', e);
    }
  }

  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: Settings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('settings', JSON.stringify(settings));
  }
} 