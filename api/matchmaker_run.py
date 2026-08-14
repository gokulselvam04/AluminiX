import json
from api._common import get_supabase_admin, build_response, cors_headers
from services.matching_engine import run_ai_matchmaker

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    try:
        body = {}
        if hasattr(request, 'get_json'):
            body = request.get_json() or {}
        elif hasattr(request, 'body'):
            body = json.loads(request.body) if isinstance(request.body, str) else request.body
            
        student_id = body.get("student_id")
        department = body.get("department", "Computer Science & Engineering")
        target_path = body.get("target_path", "Software Engineer")
        interest_text = body.get("interest_text", "")
        
        supabase = get_supabase_admin()
        
        # Pull alumni profiles open to mentorship
        alum_res = supabase.table("alumni_profiles").select("*, users(full_name, email, institution)").eq("mentor_available", True).execute()
        alumni_pool = alum_res.data if alum_res and alum_res.data else []
        
        # Run AI matching engine pipeline
        matches = run_ai_matchmaker(department, target_path, interest_text, alumni_pool)
        
        # Log matchmaker execution to matchmaker_runs if student_id provided
        if student_id:
            try:
                supabase.table("matchmaker_runs").insert({
                    "student_id": student_id,
                    "input_goal": target_path,
                    "input_interest": interest_text,
                    "results": matches
                }).execute()
            except Exception as log_err:
                print(f"[matchmaker_run] Audit log warning: {log_err}")
                
        return build_response(200, {
            "success": True,
            "query": {
                "department": department,
                "target_path": target_path,
                "interest_text": interest_text
            },
            "matches": matches
        })
        
    except Exception as e:
        print(f"[matchmaker_run] Error: {e}")
        return build_response(500, {"error": str(e)})

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
