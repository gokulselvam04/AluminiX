import json
from api._common import get_supabase_admin, build_response, cors_headers

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    try:
        params = {}
        if hasattr(request, 'args'):
            params = request.args
        elif hasattr(request, 'query_params'):
            params = request.query_params
            
        dept = params.get("dept") or params.get("department")
        search = params.get("search")

        supabase = get_supabase_admin()

        # Only return students (role = 'student'), no sensitive fields
        query = supabase.table("users").select(
            "id, full_name, department, interest_area, created_at"
        ).eq("role", "student").order("created_at", desc=True)

        if dept and dept != "All":
            query = query.ilike("department", f"%{dept}%")

        res = query.execute()
        students = res.data if res and res.data else []

        # In-memory search filter
        if search and search.strip():
            term = search.lower().strip()
            students = [
                s for s in students
                if term in (s.get("full_name") or "").lower()
                or term in (s.get("department") or "").lower()
                or term in (s.get("interest_area") or "").lower()
            ]

        # Also try to join roadmap_progress for target_role (public info)
        student_ids = [s["id"] for s in students]
        roadmap_map = {}
        if student_ids:
            rp_res = supabase.table("roadmap_progress").select("user_id, target_role, percent_complete").in_("user_id", student_ids).execute()
            if rp_res and rp_res.data:
                for rp in rp_res.data:
                    roadmap_map[rp["user_id"]] = rp

        for s in students:
            rp = roadmap_map.get(s["id"])
            s["target_role"] = rp["target_role"] if rp else None
            s["roadmap_percent"] = rp["percent_complete"] if rp else 0

        return build_response(200, {"students": students, "count": len(students)})
    except Exception as e:
        print(f"[students] Error: {e}")
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
