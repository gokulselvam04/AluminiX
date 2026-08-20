import json
from api._common import get_supabase_admin, build_response, cors_headers

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})

    method = "GET"
    if hasattr(request, "method"):
        method = request.method

    supabase = get_supabase_admin()

    # ─────────────────────────── GET (list) ───────────────────────────────
    if method == "GET":
        try:
            params = getattr(request, 'args', {}) or getattr(request, 'query_params', {})
            user_id = params.get("user_id")
            role    = params.get("role", "student")

            if not user_id:
                return build_response(400, {"error": "Missing user_id parameter"})

            # Verify role from DB (don't trust query param alone)
            user_res = supabase.table("users").select("role").eq("id", user_id).execute()
            if not user_res.data:
                return build_response(404, {"error": "User not found"})
            db_role = user_res.data[0].get("role", "student")

            if db_role == "alumni":
                # Get alumni_profile id for this user_id
                alum_res = supabase.table("alumni_profiles").select("id").eq("user_id", user_id).execute()
                if not alum_res.data:
                    return build_response(200, {"requests": []})
                alumni_id = alum_res.data[0]["id"]

                # All requests involving this alumni (both directions)
                req_res = supabase.table("mentorship_requests")\
                    .select("*, users!mentorship_requests_student_id_fkey(full_name, department)")\
                    .eq("alumni_id", alumni_id)\
                    .order("created_at", desc=True)\
                    .execute()
                requests_list = req_res.data if req_res and req_res.data else []
                return build_response(200, {"requests": requests_list})

            else:
                # All requests involving this student (both directions)
                req_res = supabase.table("mentorship_requests")\
                    .select("*, alumni_profiles(id, company, job_role, users(full_name))")\
                    .eq("student_id", user_id)\
                    .order("created_at", desc=True)\
                    .execute()
                requests_list = req_res.data if req_res and req_res.data else []
                return build_response(200, {"requests": requests_list})

        except Exception as e:
            return build_response(500, {"error": str(e)})


    # ─────────────────────────── POST (create) ────────────────────────────
    elif method == "POST":
        try:
            body = {}
            if hasattr(request, 'get_json'):
                body = request.get_json() or {}
            elif hasattr(request, 'body'):
                body = json.loads(request.body) if isinstance(request.body, str) else request.body

            student_id    = body.get("student_id")
            alumni_id     = body.get("alumni_id")       # alumni_profiles.id  (preferred)
            alumni_user_id = body.get("alumni_user_id") # fallback: users.id of the alumnus
            message       = body.get("message", "").strip()
            initiated_by  = body.get("initiated_by")    # 'student' or 'alumni'

            if not student_id or not message or initiated_by not in ("student", "alumni"):
                return build_response(400, {"error": "Missing or invalid fields (student_id, message, initiated_by)"})

            if not alumni_id and not alumni_user_id:
                return build_response(400, {"error": "Either alumni_id or alumni_user_id is required"})

            if initiated_by == "student":
                if not alumni_id:
                    return build_response(400, {"error": "alumni_id (profile id) required for student-initiated requests"})
                # Verify the caller is really a student
                user_res = supabase.table("users").select("role").eq("id", student_id).execute()
                if not user_res.data or user_res.data[0].get("role") != "student":
                    return build_response(403, {"error": "Only students can initiate student-side requests"})
            else:
                # Alumni initiating — resolve alumni_id from profile if not given
                if not alumni_id and alumni_user_id:
                    alum_lookup = supabase.table("alumni_profiles").select("id").eq("user_id", alumni_user_id).execute()
                    if not alum_lookup.data:
                        return build_response(400, {"error": "No alumni profile found for this user"})
                    alumni_id = alum_lookup.data[0]["id"]

                alum_res = supabase.table("alumni_profiles").select("user_id").eq("id", alumni_id).execute()
                if not alum_res.data:
                    return build_response(400, {"error": "Alumni profile not found"})
                alumnus_user_id = alum_res.data[0]["user_id"]
                user_res = supabase.table("users").select("role").eq("id", alumnus_user_id).execute()
                if not user_res.data or user_res.data[0].get("role") != "alumni":
                    return build_response(403, {"error": "Only alumni can initiate alumni-side requests"})

            req_data = {
                "student_id":   student_id,
                "alumni_id":    alumni_id,
                "message":      message,
                "status":       "pending",
                "initiated_by": initiated_by,
            }

            res = supabase.table("mentorship_requests").insert(req_data).execute()
            if res and res.data:
                return build_response(201, {"success": True, "request": res.data[0]})
            else:
                return build_response(500, {"error": "Failed to submit mentorship request"})

        except Exception as e:
            return build_response(500, {"error": str(e)})

    # ─────────────────────────── PATCH (accept/decline) ───────────────────
    elif method == "PATCH":
        try:
            body = {}
            if hasattr(request, 'get_json'):
                body = request.get_json() or {}
            elif hasattr(request, 'body'):
                body = json.loads(request.body) if isinstance(request.body, str) else request.body

            request_id = body.get("request_id")
            status     = body.get("status")       # 'accepted' or 'declined'
            user_id    = body.get("user_id")      # the person accepting/declining

            if not request_id or status not in ('accepted', 'declined') or not user_id:
                return build_response(400, {"error": "Invalid request_id, status, or user_id"})

            # Fetch the request row
            row_res = supabase.table("mentorship_requests")\
                .select("student_id, alumni_id, initiated_by, status")\
                .eq("id", request_id)\
                .execute()
            if not row_res.data:
                return build_response(404, {"error": "Request not found"})
            row = row_res.data[0]

            if row["status"] != "pending":
                return build_response(400, {"error": "Request is no longer pending"})

            initiated_by = row.get("initiated_by", "student")

            # Determine who is allowed to respond
            # The NON-initiating party responds.
            if initiated_by == "student":
                # Only the alumni can accept/decline
                alum_res = supabase.table("alumni_profiles").select("user_id").eq("id", row["alumni_id"]).execute()
                if not alum_res.data or alum_res.data[0]["user_id"] != user_id:
                    return build_response(403, {"error": "Only the receiving alumni can respond to this request"})
            else:
                # initiated_by == 'alumni' — only the student can accept/decline
                if row["student_id"] != user_id:
                    return build_response(403, {"error": "Only the receiving student can respond to this request"})

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
