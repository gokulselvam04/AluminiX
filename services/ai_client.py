import os
import json
import requests
from typing import Dict, Any, Optional

class AIClient:
    def __init__(self):
        # Existing keys
        self.openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
        # New HuggingFace configuration
        self.hf_token = os.environ.get("HF_API_TOKEN", "").strip()
        # Default model – you can override via env var HF_MODEL
        self.hf_model = os.environ.get("HF_MODEL", "meta-llama/Meta-Llama-3-8B-Instruct").strip()

    def generate_completion(self, prompt: str, system_prompt: str = "") -> str:
        """
        Generate completion using HuggingFace (if token provided), OpenAI, Anthropic, or fallback heuristic LLM.
        """
        # 1️⃣ HuggingFace Inference API – primary if token present
        if self.hf_token:
            try:
                headers = {
                    "Authorization": f"Bearer {self.hf_token}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "inputs": f"{system_prompt}\n\n{prompt}",
                    "parameters": {
                        "max_new_tokens": 256,
                        "temperature": 0.7,
                        "return_full_text": False
                    },
                    "options": {"use_cache": False}
                }
                url = f"https://api-inference.huggingface.co/models/{self.hf_model}"
                res = requests.post(url, headers=headers, json=payload, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    # The response is a list of dicts with a 'generated_text' field
                    if isinstance(data, list) and data:
                        return data[0].get('generated_text', '').strip()
                else:
                    print(f"[AIClient] HuggingFace error {res.status_code}: {res.text}")
            except Exception as e:
                print(f"[AIClient] HuggingFace exception: {e}")
        # 2️⃣ OpenAI fallback
        if self.openai_key:
            try:
                headers = {
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user",   "content": prompt}
                    ],
                    "temperature": 0.7
                }
                res = requests.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"[AIClient] OpenAI error: {e}")
        # 3️⃣ Anthropic fallback
        if self.anthropic_key:
            try:
                headers = {
                    "x-api-key": self.anthropic_key,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "claude-3-haiku-20240307",
                    "max_tokens": 1024,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": prompt}]
                }
                res = requests.post("https://api.anthropic.com/v1/messages", json=payload, headers=headers, timeout=12)
                if res.status_code == 200:
                    data = res.json()
                    return data["content"][0]["text"]
            except Exception as e:
                print(f"[AIClient] Anthropic error: {e}")
        # 4️⃣ Heuristic fallback when no external keys work
        return self._heuristic_fallback(prompt, system_prompt)

    def _heuristic_fallback(self, prompt: str, system_prompt: str) -> str:
        """
        Smart fallback engine providing realistic responses when external API keys are unavailable.
        """
        prompt_lower = prompt.lower()
        if "roadmap" in prompt_lower or "skill" in prompt_lower:
            return json.dumps([
                {"step": 1, "title": "Core Foundations & DSA Mastery", "description": "Master Data Structures in Java/Python, focus on Array, Trees, and Graph algorithms.", "category": "Skill"},
                {"step": 2, "title": "Full Stack System Project", "description": "Build a scalable web application using REST APIs, HTML/CSS/JS, and Postgres DB.", "category": "Project"},
                {"step": 3, "title": "Cloud & CI/CD Deployment", "description": "Deploy services on AWS/Vercel with GitHub Actions for automated deployment.", "category": "Certification"},
                {"step": 4, "title": "Alumni Mentorship & Mock Interviews", "description": "Connect with 2 Alumni mentors in target companies for resume review and tech mocks.", "category": "Networking"}
            ])
        elif "matchmaker" in prompt_lower or "rationale" in prompt_lower:
            return "Matched based on shared department background, expertise alignment, and active mentorship availability at top target organization."
        else:
            return (
                "Hello! As your AlumniX AI Career Mentor, I'm here to support your journey at Karpagam Institute of Technology. "
                "Based on your profile, I recommend exploring our AI Matchmaker to connect with alumni at top tech firms, "
                "or tracking your technical milestones on your My Roadmap page. What specific goal are you working on today?"
            )

ai_client = AIClient()
