import os
import sys
from wsgiref.simple_server import make_server

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from api import (
    auth_complete_signup,
    alumni,
    alumni_profile,
    jobs,
    matchmaker_run,
    chat_message,
    roadmap,
    mentorship_request,
    profile_me,
    dashboard_stats,
    impact_stats
)

ROUTES = {
    "/api/auth-complete-signup": auth_complete_signup.app,
    "/api/alumni-profile": alumni_profile.app,
    "/api/alumni": alumni.app,
    "/api/jobs": jobs.app,
    "/api/matchmaker-run": matchmaker_run.app,
    "/api/chat-message": chat_message.app,
    "/api/chat-history": chat_message.app,
    "/api/roadmap-generate": roadmap.app,
    "/api/roadmap-progress": roadmap.app,
    "/api/mentorship-request": mentorship_request.app,
    "/api/mentorship-requests": mentorship_request.app,
    "/api/profile-me": profile_me.app,
    "/api/dashboard-stats": dashboard_stats.app,
    "/api/impact-stats": impact_stats.app
}

def router_app(environ, start_response):
    path = environ.get('PATH_INFO', '')
    
    # Static files handler for local python server
    if not path.startswith('/api/'):
        if path == '/' or path == '':
            path = '/index.html'
        file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), path.lstrip('/'))
        if os.path.exists(file_path) and os.path.isfile(file_path):
            content_type = 'text/html'
            if file_path.endswith('.css'): content_type = 'text/css'
            elif file_path.endswith('.js'): content_type = 'application/javascript'
            elif file_path.endswith('.json'): content_type = 'application/json'
            elif file_path.endswith('.png'): content_type = 'image/png'
            elif file_path.endswith('.svg'): content_type = 'image/svg+xml'
            
            with open(file_path, 'rb') as f:
                content = f.read()
            start_response('200 OK', [('Content-Type', content_type), ('Access-Control-Allow-Origin', '*')])
            return [content]
            
    handler = ROUTES.get(path)
    if handler:
        return handler(environ, start_response)
        
    start_response('404 Not Found', [('Content-Type', 'application/json'), ('Access-Control-Allow-Origin', '*')])
    return [b'{"error": "Endpoint not found"}']

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"[AlumniX Server] Running on http://127.0.0.1:{port}")
    httpd = make_server("127.0.0.1", port, router_app)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")

