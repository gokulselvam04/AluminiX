import os
import json
from typing import Dict, Any, Tuple, Optional
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://bgezdudpyvkehtqfndyo.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZXpkdWRweXZrZWh0cWZuZHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDY4MjYsImV4cCI6MjEwMjI4MjgyNn0.EDNf5wdfRBqP1MbB_u6NTj-Y43am111PZjINizLdO9M")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZXpkdWRweXZrZWh0cWZuZHlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjcwNjgyNiwiZXhwIjoyMTAyMjgyODI2fQ.W_mSi0PFxCKxInG7isdOsX1oPj-auMZ96uVnTqk3wBk")

# Service role client for privileged backend ops
def get_supabase_admin() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Anon client for standard ops
def get_supabase_anon() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def cors_headers() -> Dict[str, str]:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Content-Type": "application/json"
    }

def build_response(status_code: int, body: Dict[str, Any]) -> Tuple[str, int, Dict[str, str]]:
    return json.dumps(body), status_code, cors_headers()

def get_auth_token(headers: Any) -> Optional[str]:
    """
    Extract Bearer token from headers dictionary or WSGI environ.
    """
    auth_header = None
    if isinstance(headers, dict):
        auth_header = headers.get("Authorization") or headers.get("authorization")
    elif hasattr(headers, "get"):
        auth_header = headers.get("Authorization")
        
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    return None

def verify_authenticated_user(headers: Any) -> Optional[Dict[str, Any]]:
    """
    Verify Supabase Bearer token and return user metadata.
    """
    token = get_auth_token(headers)
    if not token:
        return None
        
    try:
        supabase = get_supabase_anon()
        user_res = supabase.auth.get_user(token)
        if user_res and user_res.user:
            return {
                "id": str(user_res.user.id),
                "email": user_res.user.email,
                "user_metadata": user_res.user.user_metadata
            }
    except Exception as e:
        print(f"[_common] Auth verification error: {e}")
        
    return None
