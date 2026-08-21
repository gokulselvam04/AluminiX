# Quick Start: Using AI in AlumniX

## 🎯 5-Minute Setup

Your HuggingFace API is **already integrated**. Here's what's enabled:

| Feature | Endpoint | File |
|---------|----------|------|
| 🤖 AI Matchmaker | `/api/matchmaker-run` | `services/matching_engine.py` |
| 🗺️ Career Roadmap | `/api/roadmap-generate` | `services/roadmap_generator.py` |
| 💬 Chat Assistant | `/api/chat-message` | `api/chat_message.py` |
| 📊 Smart Insights | `/api/dashboard-stats` | `api/dashboard_stats.py` |
| 👤 Profile Analysis | `/api/profile-me` | `api/profile_me.py` |

---

## 🚀 Start Using AI Now

### 1. Start the Server
```bash
python app.py
```

### 2. Make API Calls

**AI Matchmaker**:
```bash
curl -X POST http://127.0.0.1:5000/api/matchmaker-run \
  -d '{"student_dept":"CSE","target_career_path":"Backend Engineer"}'
```

**Career Roadmap**:
```bash
curl -X POST http://127.0.0.1:5000/api/roadmap-generate \
  -d '{"department":"CS","target_role":"ML Engineer"}'
```

**Chat with AI**:
```bash
curl -X POST http://127.0.0.1:5000/api/chat-message \
  -d '{"message":"How do I become a data scientist?"}'
```

---

## 🔌 Use AI in Python Code

```python
from services.ai_client import ai_client

# Generate AI responses anywhere
response = ai_client.generate_completion(
    prompt="Your question here",
    system_prompt="You are a helpful career advisor"
)
print(response)
```

---

## 📚 Full Documentation

See: `AI_INTEGRATION_GUIDE.md` (in this folder)

---

## ⚡ Key Points

✅ Your API key is already in `.env`
✅ AI works across 5+ features
✅ Automatic fallback if API fails
✅ No additional setup needed

**Status**: 🟢 Ready to use!
