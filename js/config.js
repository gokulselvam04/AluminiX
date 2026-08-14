/*
 * AlumniX Centralized Production Configuration
 * Provides public Supabase project credentials and backend API base URL.
 */

window.ALUMNIX_CONFIG = {
  SUPABASE_URL: "https://bgezdudpyvkehtqfndyo.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZXpkdWRweXZrZWh0cWZuZHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDY4MjYsImV4cCI6MjEwMjI4MjgyNn0.EDNf5wdfRBqP1MbB_u6NTj-Y43am111PZjINizLdO9M",
  API_BASE_URL: window.location.origin.includes("5000") ? "http://127.0.0.1:5000/api" : "/api"
};
