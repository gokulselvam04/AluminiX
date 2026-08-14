import json
from api._common import get_supabase_admin, build_response, cors_headers
from services.ai_client import ai_client

def handler(request):
    if hasattr(request, 'method') and request.method == 'OPTIONS':
        return build_response(200, {"ok": True})
        
    method = "POST"
    if hasattr(request, 'method'):
        method = request.method
        
    supabase = get_supabase_admin()
    
    # Check if GET for history or POST for new message
    if method == "GET":
        try:
            params = getattr(request, 'args', {}) or getattr(request, 'query_params', {})
            user_id = params.get("user_id")
            if not user_id:
                return build_response(400, {"error": "Missing user_id parameter"})
                
            res = supabase.table("chat_messages").select("*").eq("user_id", user_id).order("created_at", asc=True).execute()
            messages = res.data if res and res.data else []
            return build_response(200, {"messages": messages})
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
            message_text = body.get("message", "").strip()
            department = body.get("department", "Computer Science & Engineering")
            target_role = body.get("target_role", "Software Engineer")
            roadmap_pct = body.get("roadmap_percent", 0)
            
            if not user_id or not message_text:
                return build_response(400, {"error": "Missing user_id or message content"})
                
            # 1. Save user message to chat_messages table
            supabase.table("chat_messages").insert({
                "user_id": user_id,
                "role": "user",
                "content": message_text
            }).execute()
            
            # 2. Fetch past context (last 5 messages)
            recent_res = supabase.table("chat_messages").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(6).execute()
            history = recent_res.data if recent_res and recent_res.data else []
            history.reverse()
            
            # Format context prompt
            formatted_history = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history])
            
            system_prompt = (
                f"You are the supportive, practical AI Career Mentor on AlumniX for Karpagam Institute of Technology (KIT). "
                f"The student is in '{department}', aiming for '{target_role}', with current roadmap progress of {roadmap_pct}%. "
                f"Give concise, actionable career guidance (under 120 words). Suggest using AlumniX features like the AI Matchmaker, "
                f"Alumni Directory, or My Roadmap checklist when helpful."
            )
            
            user_prompt = f"Student Profile Context: {department}, target path: {target_role}.\n\nRecent Conversation:\n{formatted_history}\n\nUSER: {message_text}"
            
            ai_reply = ai_client.generate_completion(user_prompt, system_prompt)
            
            # 3. Save AI reply to chat_messages table
            ai_msg_res = supabase.table("chat_messages").insert({
                "user_id": user_id,
                "role": "ai",
                "content": ai_reply
            }).execute()
            
            ai_message_obj = ai_msg_res.data[0] if ai_msg_res and ai_msg_res.data else {"role": "ai", "content": ai_reply}
            
            return build_response(200, {
                "success": True,
                "reply": ai_reply,
                "message": ai_message_obj
            })
            
        except Exception as e:
            print(f"[chat_message] Exception: {e}")
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
