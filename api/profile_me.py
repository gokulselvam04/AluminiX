import json
from api._common import get_supabase_admin, build_response, cors_headers

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    method = "GET"
    if hasattr(request, 'method'):
        method = request.method
        
    supabase = get_supabase_admin()
    
    if method == "GET":
        try:
            params = getattr(request, 'args', {}) or getattr(request, 'query_params', {})
            user_id = params.get("user_id")
            if not user_id:
                return build_response(400, {"error": "Missing user_id parameter"})
                
            res = supabase.table("users").select("*").eq("id", user_id).execute()
            if not res.data or len(res.data) == 0:
                return build_response(404, {"error": "User profile record not found"})
                
            user_data = res.data[0]
            
            # Fetch alumni profile if role is alumni
            alumni_data = None
            if user_data.get("role") == "alumni":
                alum_res = supabase.table("alumni_profiles").select("*").eq("user_id", user_id).execute()
                if alum_res.data and len(alum_res.data) > 0:
                    alumni_data = alum_res.data[0]
                    
            return build_response(200, {
                "user": user_data,
                "alumni_profile": alumni_data
            })
        except Exception as e:
            return build_response(500, {"error": str(e)})
            
    elif method == "PATCH":
        try:
            body = {}
            if hasattr(request, 'get_json'):
                body = request.get_json() or {}
            elif hasattr(request, 'body'):
                body = json.loads(request.body) if isinstance(request.body, str) else request.body
                
            user_id = body.get("user_id")
            if not user_id:
                return build_response(400, {"error": "Missing user_id parameter"})
                
            update_fields = {}
            for k in ["full_name", "department", "interest_area"]:
                if k in body:
                    update_fields[k] = body[k]
                    
            if update_fields:
                supabase.table("users").update(update_fields).eq("id", user_id).execute()
                
            res = supabase.table("users").select("*").eq("id", user_id).execute()
            return build_response(200, {"success": True, "user": res.data[0] if res and res.data else {}})
        except Exception as e:
            return build_response(500, {"error": str(e)})
            
    return build_response(405, {"error": "Method not allowed"})

def app(environ, start_response):
    from urllib.parse import parse_qs
    method = environ.get('REQUEST_METHOD', 'GET')
    if method == 'OPTIONS':
        start_response('200 OK', list(cors_headers().items()))
        return [b'{"ok": true}']
        
    query_string = environ.get('QUERY_STRING', '')
    qs = parse_qs(query_string)
    args = {k: v[0] for k, v in qs.items() if v}
    
    content_length = int(environ.get('CONTENT_LENGTH', 0) or 0)
    body_bytes = environ['wsgi.input'].read(content_length) if content_length > 0 else b'{}'
    
    class ReqProxy:
        def __init__(self, m, b, a):
            self.method = m
            self.body = b.decode('utf-8')
            self.args = a
        def get_json(self):
            return json.loads(self.body) if self.body else {}
            
    body_str, code, headers = handler(ReqProxy(method, body_bytes, args))
    start_response(f'{code} OK', list(headers.items()))
    return [body_str.encode('utf-8')]
