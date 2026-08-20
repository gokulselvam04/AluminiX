import json
from api._common import get_supabase_admin, build_response, cors_headers

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    try:
        params = getattr(request, 'args', {}) or getattr(request, 'query_params', {})
        user_id = params.get("user_id")
        role = params.get("role", "student")
        
        supabase = get_supabase_admin()
        
        user_res = supabase.table("users").select("role").eq("id", user_id).execute()
        if not user_res.data:
            return build_response(404, {"error": "User not found"})
        role = user_res.data[0].get("role")
        
        if role == "alumni":
            # Alumni dashboard stats
            alum_res = supabase.table("alumni_profiles").select("id").eq("user_id", user_id).execute()
            if alum_res and alum_res.data and len(alum_res.data) > 0:
                alumni_id = alum_res.data[0]["id"]
                
                # Active Job Posts
                jobs_res = supabase.table("jobs").select("id", count="exact").eq("posted_by", alumni_id).execute()
                active_jobs = jobs_res.count if jobs_res.count is not None else len(jobs_res.data or [])
                
                # Pending Requests
                pending_res = supabase.table("mentorship_requests").select("id", count="exact").eq("alumni_id", alumni_id).eq("status", "pending").execute()
                pending_requests = pending_res.count if pending_res.count is not None else len(pending_res.data or [])
                
                # Mentees Mentored (accepted) — both directions
                accepted_res = supabase.table("mentorship_requests").select("id", count="exact").eq("alumni_id", alumni_id).eq("status", "accepted").execute()
                mentees_mentored = accepted_res.count if accepted_res.count is not None else len(accepted_res.data or [])
            else:
                active_jobs = 0
                pending_requests = 0
                mentees_mentored = 0
                
            return build_response(200, {
                "role": "alumni",
                "stats": {
                    "mentees_mentored": mentees_mentored,
                    "active_job_posts": active_jobs,
                    "pending_requests": pending_requests,
                    "profile_views": 42
                }
            })
            
        else:
            # Student dashboard stats
            # Alumni Connected — count accepted in BOTH directions
            # Where student is the student_id OR student initiated and received from alumni
            conn_res = supabase.table("mentorship_requests").select("id").eq("student_id", user_id).eq("status", "accepted").execute()
            connected_count = len(conn_res.data or [])
            
            # AI Matches Run
            runs_res = supabase.table("matchmaker_runs").select("id", count="exact").eq("student_id", user_id).execute()
            ai_matches = runs_res.count if runs_res.count is not None else len(runs_res.data or [])
            
            # Jobs Total available
            jobs_res = supabase.table("jobs").select("id", count="exact").execute()
            jobs_count = jobs_res.count if jobs_res.count is not None else len(jobs_res.data or [])
            
            # Roadmap %
            roadmap_res = supabase.table("roadmap_progress").select("percent_complete").eq("user_id", user_id).execute()
            roadmap_pct = roadmap_res.data[0]["percent_complete"] if roadmap_res and roadmap_res.data and len(roadmap_res.data) > 0 else 0
            
            return build_response(200, {
                "role": "student",
                "stats": {
                    "alumni_connected": connected_count,
                    "ai_matches_run": ai_matches,
                    "jobs_saved": jobs_count,
                    "roadmap_progress": roadmap_pct
                }
            })
            
    except Exception as e:
        print(f"[dashboard_stats] Error: {e}")
        return build_response(500, {"error": str(e)})

def app(environ, start_response):
    from urllib.parse import parse_qs
    method = environ.get('REQUEST_METHOD', 'GET')
    if method == 'OPTIONS':
        start_response('200 OK', list(cors_headers().items()))
        return [b'{"ok": true}']
        
    query_string = environ.get('QUERY_STRING', '')
    qs = parse_qs(query_string)
    args = {k: v[0] for k, v in qs.items() if v}
    
    class ReqProxy:
        def __init__(self, m, a):
            self.method = m
            self.args = a
            
    body_str, code, headers = handler(ReqProxy(method, args))
    start_response(f'{code} OK', list(headers.items()))
    return [body_str.encode('utf-8')]
