import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // During build time, return a dummy client
    // This prevents build failures when env vars aren't set
    if (process.env.NODE_ENV === 'production' && !supabaseUrl) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL environment variable'
      );
    }
    // Return a placeholder client for development/build
    client = createBrowserClient(
      supabaseUrl || 'https://placeholder.supabase.co',
      supabaseAnonKey || 'placeholder-key'
    );
    return client;
  }

  client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return client;
}
