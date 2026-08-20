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
            
        # Accept both 'id' and 'user_id' field names
        user_id = body.get("id") or body.get("user_id")
        email = body.get("email")
        role = body.get("role", "student")
        full_name = body.get("full_name", "")
        department = body.get("department", "Computer Science & Engineering")
        institution = body.get("institution", "Karpagam Institute of Technology")
        
        if not email:
            return build_response(400, {"error": "Missing email"})

        admin_client = get_supabase_admin()

        # If no user_id provided, generate one
        if not user_id:
            import uuid
            user_id = str(uuid.uuid4())
            
        # Upsert user record (insert or update on conflict)
        user_row = {
            "id": user_id,
            "email": email,
            "role": role,
            "full_name": full_name,
            "institution": institution,
            "department": department
        }
        
        res = admin_client.table("users").upsert(user_row).execute()
        
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
