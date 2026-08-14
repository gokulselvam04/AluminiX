import json
from api._common import get_supabase_admin, cors_headers, build_response

def handler(request):
    """
    Vercel Serverless Function / WSGI entry point for POST /api/auth-complete-signup
    Uses Supabase Service Role client to insert user row post-signup.
    """
    # Handle CORS OPTIONS preflight
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    try:
        # Parse body from request object
        body = {}
        if hasattr(request, 'get_json'):
            body = request.get_json() or {}
        elif hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
            
        user_id = body.get("user_id")
        email = body.get("email")
        role = body.get("role", "student")
        full_name = body.get("full_name", "")
        department = body.get("department", "Computer Science & Engineering")
        institution = body.get("institution", "Karpagam Institute of Technology")
        
        if not user_id or not email:
            return build_response(400, {"error": "Missing user_id or email"})
            
        admin_client = get_supabase_admin()
        
        # Check if user already exists
        existing = admin_client.table("users").select("*").eq("id", user_id).execute()
        if existing and existing.data and len(existing.data) > 0:
            return build_response(200, {"message": "User record already exists", "user": existing.data[0]})
            
        # Insert user record
        user_row = {
            "id": user_id,
            "email": email,
            "role": role,
            "full_name": full_name,
            "institution": institution,
            "department": department
        }
        
        res = admin_client.table("users").insert(user_row).execute()
        
        if res and res.data:
            return build_response(201, {"success": True, "user": res.data[0]})
        else:
            return build_response(500, {"error": "Failed to create user record"})
            
    except Exception as e:
        print(f"[auth_complete_signup] Exception: {e}")
        return build_response(500, {"error": str(e)})

# WSGI compatibility
def app(environ, start_response):
    import sys
    # Extract method and body for WSGI environment
    method = environ.get('REQUEST_METHOD', 'GET')
    if method == 'OPTIONS':
        start_response('200 OK', list(cors_headers().items()))
        return [b'{"ok": true}']
        
    try:
        content_length = int(environ.get('CONTENT_LENGTH', 0) or 0)
        body_bytes = environ['wsgi.input'].read(content_length) if content_length > 0 else b'{}'
        class ReqProxy:
            def __init__(self, m, b):
                self.method = m
                self.body = b.decode('utf-8')
            def get_json(self):
                return json.loads(self.body) if self.body else {}
                
        body_str, code, headers = handler(ReqProxy(method, body_bytes))
        start_response(f'{code} OK', list(headers.items()))
        return [body_str.encode('utf-8')]
    except Exception as e:
        start_response('500 Internal Error', list(cors_headers().items()))
        return [json.dumps({"error": str(e)}).encode('utf-8')]
