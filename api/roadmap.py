import json
from api._common import get_supabase_admin, build_response, cors_headers
from services.roadmap_generator import generate_student_roadmap

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    method = "POST"
    if hasattr(request, 'method'):
        method = request.method
        
    supabase = get_supabase_admin()
    
    if method == "POST":
        try:
            body = {}
            if hasattr(request, 'get_json'):
                body = request.get_json() or {}
            elif hasattr(request, 'body'):
                body = json.loads(request.body) if isinstance(request.body, str) else request.body
                
            user_id = body.get("user_id")
            department = body.get("department", "Computer Science & Engineering")
            target_role = body.get("target_role", "Software Engineer")
            skills = body.get("current_skills", "")
            
            if not user_id:
                return build_response(400, {"error": "Missing user_id parameter"})
                
            # Check if student already has a roadmap
            existing = supabase.table("roadmap_progress").select("*").eq("user_id", user_id).execute()
            if existing and existing.data and len(existing.data) > 0 and not body.get("regenerate"):
                return build_response(200, {"roadmap": existing.data[0]})
                
            # Generate new roadmap steps
            steps = generate_student_roadmap(department, target_role, skills)
            
            roadmap_data = {
                "user_id": user_id,
                "target_role": target_role,
                "steps": steps,
                "percent_complete": 0
            }
            
            upsert_res = supabase.table("roadmap_progress").upsert(roadmap_data, on_conflict="user_id").execute()
            saved = upsert_res.data[0] if upsert_res and upsert_res.data else roadmap_data
            
            return build_response(200, {"success": True, "roadmap": saved})
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
            step_id = body.get("step_id")
            completed = body.get("completed", False)
            
            if not user_id or step_id is None:
                return build_response(400, {"error": "Missing user_id or step_id"})
                
            row_res = supabase.table("roadmap_progress").select("*").eq("user_id", user_id).execute()
            if not row_res.data or len(row_res.data) == 0:
                return build_response(404, {"error": "No roadmap found for user"})
                
            roadmap_record = row_res.data[0]
            steps = roadmap_record.get("steps", [])
            
            # Toggle completed state for target step
            completed_count = 0
            for step in steps:
                if str(step.get("id")) == str(step_id):
                    step["completed"] = bool(completed)
                if step.get("completed"):
                    completed_count += 1
                    
            pct = int((completed_count / len(steps)) * 100) if len(steps) > 0 else 0
            
            update_res = supabase.table("roadmap_progress").update({
                "steps": steps,
                "percent_complete": pct
            }).eq("user_id", user_id).execute()
            
            return build_response(200, {
                "success": True,
                "percent_complete": pct,
                "roadmap": update_res.data[0] if update_res and update_res.data else None
            })
        except Exception as e:
            return build_response(500, {"error": str(e)})
            
    return build_response(405, {"error": "Method not allowed"})

def app(environ, start_response):
    method = environ.get('REQUEST_METHOD', 'POST')
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
