import json
from api._common import get_supabase_admin, build_response, cors_headers

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    method = "GET"
    if hasattr(request, "method"):
        method = request.method
        
    supabase = get_supabase_admin()
    
    if method == "GET":
        try:
            # Query jobs joining posted_by alumni details
            res = supabase.table("jobs").select("*, alumni_profiles(id, company, job_role, users(full_name, email))").order("created_at", desc=True).execute()
            jobs = res.data if res and res.data else []
            return build_response(200, {"jobs": jobs, "count": len(jobs)})
        except Exception as e:
            return build_response(500, {"error": str(e)})
            
    elif method == "POST":
        try:
            body = {}
            if hasattr(request, 'get_json'):
                body = request.get_json() or {}
            elif hasattr(request, 'body'):
                body = json.loads(request.body) if isinstance(request.body, str) else request.body
                
            user_id = body.get("user_id")
            title = body.get("title")
            company = body.get("company")
            location = body.get("location", "Coimbatore / Remote")
            job_type = body.get("type", "Full-time")
            tag = body.get("tag", "Software")
            description = body.get("description", "")
            
            if not user_id or not title or not company or not description:
                return build_response(400, {"error": "Missing required fields (title, company, description)"})
                
            user_res = supabase.table("users").select("role").eq("id", user_id).execute()
            if not user_res.data or user_res.data[0].get("role") != "alumni":
                return build_response(403, {"error": "Only alumni can post jobs"})

            # Get alumni_profile id for this user_id
            alum_res = supabase.table("alumni_profiles").select("id").eq("user_id", user_id).execute()
            if not alum_res.data or len(alum_res.data) == 0:
                return build_response(400, {"error": "Alumni profile not registered for this user."})
                
            alumni_id = alum_res.data[0]["id"]
            
            job_data = {
                "posted_by": alumni_id,
                "title": title,
                "company": company,
                "location": location,
                "type": job_type,
                "tag": tag,
                "description": description
            }
            
            insert_res = supabase.table("jobs").insert(job_data).execute()
            if insert_res and insert_res.data:
                return build_response(201, {"success": True, "job": insert_res.data[0]})
            else:
                return build_response(500, {"error": "Failed to post job listing"})
        except Exception as e:
            return build_response(500, {"error": str(e)})
            
    return build_response(405, {"error": "Method not allowed"})

def app(environ, start_response):
    method = environ.get('REQUEST_METHOD', 'GET')
    if method == 'OPTIONS':
        start_response('200 OK', list(cors_headers().items()))
        return [b'{"ok": true}']
        
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
