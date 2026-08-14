/*
 * AlumniX Global Supabase Client Initialization
 * Singleton instance of Supabase JS client for authentication and Realtime subscriptions.
 */

if (!window.ALUMNIX_CONFIG) {
  console.error("[SupabaseClient] window.ALUMNIX_CONFIG is missing. Make sure js/config.js is loaded before js/supabase-client.js.");
}

const supabaseUrl = window.ALUMNIX_CONFIG ? window.ALUMNIX_CONFIG.SUPABASE_URL : "";
const supabaseAnonKey = window.ALUMNIX_CONFIG ? window.ALUMNIX_CONFIG.SUPABASE_ANON_KEY : "";

if (window.supabase && supabaseUrl && supabaseAnonKey) {
  try {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log("[SupabaseClient] Production client initialized successfully.");
  } catch (err) {
    console.error("[SupabaseClient] Failed to initialize Supabase client:", err);
  }
} else {
  console.warn("[SupabaseClient] Supabase CDN script or valid configuration keys not found.");
}
