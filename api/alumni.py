import json
from api._common import get_supabase_admin, cors_headers, build_response

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    try:
        # Extract query parameters
        params = {}
        if hasattr(request, 'args'):
            params = request.args
        elif hasattr(request, 'query_params'):
            params = request.query_params
            
        dept = params.get("dept") or params.get("department")
        industry = params.get("industry")
        search = params.get("search")
        
        supabase = get_supabase_admin()
        
        mentor_available = params.get("mentor_available")

        # Select alumni profiles joining user details
        query = supabase.table("alumni_profiles").select("*, users(full_name, email, institution)").order("created_at", desc=True)
        
        if mentor_available and mentor_available.lower() == "true":
            query = query.eq("mentor_available", True)

        if dept and dept != "All":
            query = query.ilike("department", f"%{dept}%")
        if industry and industry != "All":
            query = query.ilike("industry", f"%{industry}%")
            
        res = query.execute()
        alumni = res.data if res and res.data else []
        
        # In-memory search filter if search term provided
        if search and search.strip():
            term = search.lower().strip()
            filtered = []
            for item in alumni:
                name = (item.get("users", {}).get("full_name") or "").lower()
                company = (item.get("company") or "").lower()
                role = (item.get("job_role") or "").lower()
                bio = (item.get("bio") or "").lower()
                if term in name or term in company or term in role or term in bio:
                    filtered.append(item)
            alumni = filtered
            
        return build_response(200, {"alumni": alumni, "count": len(alumni)})
    except Exception as e:
        print(f"[alumni] Error: {e}")
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
