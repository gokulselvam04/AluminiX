from typing import List, Dict, Any
from services.ai_client import ai_client

def calculate_match_score(student_dept: str, target_path: str, interest_text: str, alumnus: Dict[str, Any]) -> int:
    score = 0
    
    # 1. Department match (+2)
    alum_dept = (alumnus.get("department") or "").lower()
    if student_dept.lower() in alum_dept or alum_dept in student_dept.lower():
        score += 2
        
    # 2. Industry / Goal match (+3)
    target_lower = target_path.lower()
    alum_industry = (alumnus.get("industry") or "").lower()
    alum_role = (alumnus.get("job_role") or "").lower()
    alum_company = (alumnus.get("company") or "").lower()
    
    if any(k in alum_industry or k in alum_role or k in alum_company for k in target_lower.split()):
        score += 3
        
    # 3. Open to mentor (+1)
    if alumnus.get("mentor_available", True):
        score += 1
        
    # 4. Keyword in Bio match (+2)
    bio = (alumnus.get("bio") or "").lower()
    if interest_text and any(word in bio for word in interest_text.lower().split() if len(word) > 3):
        score += 2
        
    return score

def run_ai_matchmaker(student_dept: str, target_path: str, interest_text: str, alumni_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Matchmaker pipeline: rule-based baseline scoring + AI LLM rationale generation for top 3 candidates.
    """
    scored_alumni = []
    for alum in alumni_list:
        score = calculate_match_score(student_dept, target_path, interest_text, alum)
        scored_alumni.append({
            "score": score,
            "alumnus": alum
        })
        
    # Sort descending by score
    scored_alumni.sort(key=lambda x: x["score"], reverse=True)
    
    # Pick top 3 candidates
    top_candidates = scored_alumni[:3]
    
    results = []
    for idx, item in enumerate(top_candidates, 1):
        alum = item["alumnus"]
        alum_name = alum.get("full_name") or alum.get("users", {}).get("full_name", "Alumnus")
        company = alum.get("company", "Tech Company")
        job_role = alum.get("job_role", "Software Engineer")
        dept = alum.get("department", "Engineering")
        
        prompt = (
            f"Generate a compelling, personalized 1-sentence match rationale for why KIT student aiming for '{target_path}' "
            f"with interest in '{interest_text or 'career growth'}' should connect with alumnus {alum_name}, "
            f"{job_role} at {company} ({dept} batch {alum.get('batch_year', 2020)})."
        )
        system = "You are the AlumniX AI Matchmaker. Keep rationale under 25 words, positive, precise, and encouraging."
        
        rationale = ai_client.generate_completion(prompt, system)
        if not rationale or len(rationale) < 10:
            rationale = f"Strong match for {target_path}: {alum_name} brings proven experience as {job_role} at {company}."
            
        results.append({
            "rank": idx,
            "match_score": item["score"],
            "rationale": rationale.strip('"'),
            "alumnus": alum
        })
        
    return results
