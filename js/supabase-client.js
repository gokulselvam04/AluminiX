/*
 * AlumniX Global Supabase Client Initialization
 * Singleton instance of Supabase JS client for authentication and Realtime subscriptions.
 */

function initializeSupabase() {
  // Check if Supabase library is loaded
  if (typeof window.supabase === 'undefined') {
    console.error("[SupabaseClient] Supabase library not loaded. Make sure the CDN script is included.");
    return false;
  }

  // Check if config exists
  if (!window.ALUMNIX_CONFIG) {
    console.error("[SupabaseClient] ALUMNIX_CONFIG not found. Make sure js/config.js is loaded first.");
    return false;
  }

  const supabaseUrl = window.ALUMNIX_CONFIG.SUPABASE_URL;
  const supabaseAnonKey = window.ALUMNIX_CONFIG.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[SupabaseClient] Missing Supabase URL or Anon Key");
    return false;
  }

  try {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    console.log("[SupabaseClient] ✅ Supabase client initialized successfully");
    return true;
  } catch (err) {
    console.error("[SupabaseClient] ❌ Failed to initialize:", err);
    return false;
  }
}

// Initialize immediately if possible
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}

// Also expose init function globally
window.initializeSupabase = initializeSupabase;
