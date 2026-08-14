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
            role = params.get("role", "student")
            
            if not user_id:
                return build_response(400, {"error": "Missing user_id parameter"})
                
            if role == "alumni":
                # Get alumni_profile id for this user_id
                alum_res = supabase.table("alumni_profiles").select("id").eq("user_id", user_id).execute()
                if not alum_res.data or len(alum_res.data) == 0:
                    return build_response(200, {"requests": []})
                alumni_id = alum_res.data[0]["id"]
                
                req_res = supabase.table("mentorship_requests").select("*, users!mentorship_requests_student_id_fkey(full_name, email, department)").eq("alumni_id", alumni_id).order("created_at", desc=True).execute()
                requests_list = req_res.data if req_res and req_res.data else []
                return build_response(200, {"requests": requests_list})
            else:
                # Student sent requests
                req_res = supabase.table("mentorship_requests").select("*, alumni_profiles(id, company, job_role, users(full_name, email))").eq("student_id", user_id).order("created_at", desc=True).execute()
                requests_list = req_res.data if req_res and req_res.data else []
                return build_response(200, {"requests": requests_list})
        except Exception as e:
            return build_response(500, {"error": str(e)})
            
    elif method == "POST":
        try:
            body = {}
            if hasattr(request, 'get_json'):
                body = request.get_json() or {}
            elif hasattr(request, 'body'):
                body = json.loads(request.body) if isinstance(request.body, str) else request.body
                
            student_id = body.get("student_id")
            alumni_id = body.get("alumni_id")
            message = body.get("message", "").strip()
            
            if not student_id or not alumni_id or not message:
                return build_response(400, {"error": "Missing student_id, alumni_id, or message"})
                
            req_data = {
                "student_id": student_id,
                "alumni_id": alumni_id,
                "message": message,
                "status": "pending"
            }
            
            res = supabase.table("mentorship_requests").insert(req_data).execute()
            if res and res.data:
                return build_response(201, {"success": True, "request": res.data[0]})
            else:
                return build_response(500, {"error": "Failed to submit mentorship request"})
        except Exception as e:
            return build_response(500, {"error": str(e)})
            
    elif method == "PATCH":
        try:
            body = {}
            if hasattr(request, 'get_json'):
                body = request.get_json() or {}
            elif hasattr(request, 'body'):
                body = json.loads(request.body) if isinstance(request.body, str) else request.body
                
            request_id = body.get("request_id")
            status = body.get("status")  # 'accepted' or 'declined'
            
            if not request_id or status not in ['accepted', 'declined']:
                return build_response(400, {"error": "Invalid request_id or status"})
                
            res = supabase.table("mentorship_requests").update({"status": status}).eq("id", request_id).execute()
            if res and res.data:
                return build_response(200, {"success": True, "request": res.data[0]})
            else:
                return build_response(500, {"error": "Failed to update request status"})
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
