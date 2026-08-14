/*
 * AlumniX Centralized Production Configuration
 * Provides public Supabase project credentials and backend API base URL.
 */

window.ALUMNIX_CONFIG = {
  SUPABASE_URL: "https://plykrrwmcebpvbzzxnwc.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseWtycndtY2VicHZienp4bndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2MzA2OTAsImV4cCI6MjEwMjIwNjY5MH0.or-i_zVU6FG2krbq_CqVfpIv_XZwLmFE2QVAv6xKx9c",
  API_BASE_URL: window.location.origin.includes("5000") ? "http://127.0.0.1:5000/api" : "/api"
};
