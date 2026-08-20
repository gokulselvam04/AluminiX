import json
from api._common import get_supabase_admin, build_response, cors_headers

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})

    method = "POST"
    if hasattr(request, "method"):
        method = request.method
        
    supabase = get_supabase_admin()

    # ─────────────────────────── GET (fetch) ───────────────────────────────
    if method == "GET":
        try:
            params = getattr(request, 'args', {}) or getattr(request, 'query_params', {})
            user_id = params.get("user_id")

            if not user_id:
                return build_response(400, {"error": "Missing user_id parameter"})

            res = supabase.table("alumni_profiles").select("*").eq("user_id", user_id).execute()
            if res and res.data and len(res.data) > 0:
                return build_response(200, {"alumni_profile": res.data[0]})
            else:
                return build_response(404, {"error": "Alumni profile not found"})

        except Exception as e:
            return build_response(500, {"error": str(e)})

    # ─────────────────────────── POST (create/update) ────────────────────────
    elif method == "POST":
        try:
            body = {}
            if hasattr(request, 'get_json'):
                body = request.get_json() or {}
            elif hasattr(request, 'body'):
                body = json.loads(request.body) if isinstance(request.body, str) else request.body
                
            user_id = body.get("user_id")
            batch_year = int(body.get("batch_year") or 2020)
            department = body.get("department", "Computer Science & Engineering")
            company = body.get("company", "")
            job_role = body.get("job_role", "")
            industry = body.get("industry", "Software Development")
            linkedin_url = body.get("linkedin_url", "")
            bio = body.get("bio", "")
            mentor_available = bool(body.get("mentor_available", True))
            
            if not user_id or not company or not job_role:
                return build_response(400, {"error": "Missing required alumni fields (user_id, company, job_role)"})
            
            user_res = supabase.table("users").select("role").eq("id", user_id).execute()
            if not user_res.data or user_res.data[0].get("role") != "alumni":
                return build_response(403, {"error": "Only alumni can update alumni profiles"})
            
            profile_data = {
                "user_id": user_id,
                "batch_year": batch_year,
                "department": department,
                "company": company,
                "job_role": job_role,
                "industry": industry,
                "linkedin_url": linkedin_url,
                "bio": bio,
                "mentor_available": mentor_available
            }
            
            # Upsert alumni profile
            res = supabase.table("alumni_profiles").upsert(profile_data, on_conflict="user_id").execute()
            
            if res and res.data:
                return build_response(200, {"success": True, "alumni_profile": res.data[0]})
            else:
                return build_response(500, {"error": "Failed to save alumni profile"})
        except Exception as e:
            print(f"[alumni_profile] Error: {e}")
            return build_response(500, {"error": str(e)})

def app(environ, start_response):
    from urllib.parse import parse_qs
    method = environ.get('REQUEST_METHOD', 'POST')
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
