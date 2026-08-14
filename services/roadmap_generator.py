import json
from typing import List, Dict, Any
from services.ai_client import ai_client

def generate_student_roadmap(dept: str, target_role: str, current_skills: str = "") -> List[Dict[str, Any]]:
    """
    Generate a 5-step career roadmap for a student aiming for a target role.
    """
    prompt = (
        f"Generate a structured 5-step career & skill development roadmap for a {dept} student "
        f"at Karpagam Institute of Technology aiming to become a '{target_role}'. "
        f"Current background: {current_skills or 'Standard coursework'}. "
        f"Return ONLY a JSON array of 5 objects with keys: 'id' (1 to 5), 'title', 'description', 'category' (one of: 'Skill', 'Project', 'Certification', 'Networking'), 'completed' (boolean, default false)."
    )
    system = "You are the AlumniX AI Career Roadmap Generator. Output strictly valid JSON without markdown formatting."
    
    response = ai_client.generate_completion(prompt, system)
    
    # Parse JSON array response safely
    try:
        cleaned = response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        steps = json.loads(cleaned.strip())
        if isinstance(steps, list) and len(steps) > 0:
            return steps
    except Exception as e:
        print(f"[RoadmapGenerator] JSON parse warning: {e}")
        
    # Fallback structured steps
    return [
        {
            "id": 1,
            "title": f"Master Core Fundamentals for {target_role}",
            "description": "Strengthen essential data structures, algorithm problem solving, and object-oriented architecture.",
            "category": "Skill",
            "completed": False
        },
        {
            "id": 2,
            "title": "Build Production-Ready Portfolio Project",
            "description": f"Develop an end-to-end full stack/ML project demonstrating real-world applications relevant to {target_role}.",
            "category": "Project",
            "completed": False
        },
        {
            "id": 3,
            "title": "Obtain Recognized Industry Certification",
            "description": "Complete a verified certification (e.g. AWS Cloud Associate, Google Data Analytics, Meta Frontend).",
            "category": "Certification",
            "completed": False
        },
        {
            "id": 4,
            "title": "KIT Alumni Mentorship & Resume Polish",
            "description": "Connect with 2 KIT Alumni on AlumniX for profile feedback and referral readiness.",
            "category": "Networking",
            "completed": False
        },
        {
            "id": 5,
            "title": "Mock Technical & HR Interview Practice",
            "description": "Participate in mock technical rounds and system design discussions.",
            "category": "Skill",
            "completed": False
        }
    ]
