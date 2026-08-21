# AlumniX AI Integration Guide

## ✅ Setup Complete: HuggingFace API Integrated

Your HuggingFace API key has been successfully added to your `.env` file and is now active across all AI-powered features in AlumniX.

### API Configuration
- **Provider**: HuggingFace Inference API
- **API Key**: `<YOUR_HUGGING_FACE_TOKEN>`
- **Model**: `meta-llama/Meta-Llama-3-8B-Instruct` (Llama 3 8B)
- **Status**: 🟢 Active and ready to use

---

## 📍 Where AI Is Used in AlumniX

Your project uses AI in **5 key areas**:

### 1. **AI Matchmaker** (`/api/matchmaker-run`)
**File**: `services/matching_engine.py`

Matches students with alumni mentors based on:
- Department & background alignment
- Career goal matching
- Expertise compatibility
- AI-generated personalized "rationale" explaining why this mentor is perfect

**How it works**:
1. Rule-based scoring algorithm calculates match scores
2. Top 3 candidates selected
3. HuggingFace AI generates compelling 1-sentence match explanation
4. Returns ranked matches with AI rationale

**API Call Example**:
```python
POST /api/matchmaker-run
{
  "student_id": "student_123",
  "target_career_path": "Full Stack Developer",
  "interests": "Web development, cloud architecture"
}
```

---

### 2. **Career Roadmap Generator** (`/api/roadmap-generate`)
**File**: `services/roadmap_generator.py`

Generates personalized 5-step career development roadmaps:
- **Step 1**: Core Skill Fundamentals
- **Step 2**: Portfolio Project Development
- **Step 3**: Industry Certification
- **Step 4**: Alumni Mentorship
- **Step 5**: Interview Preparation

**How it works**:
1. Takes student's department and target role
2. HuggingFace generates personalized roadmap steps
3. Returns structured JSON roadmap with milestones

**API Call Example**:
```python
POST /api/roadmap-generate
{
  "department": "Computer Science",
  "target_role": "ML Engineer",
  "current_skills": "Python, Basic ML"
}
```

---

### 3. **AI Chat Assistant** (`/api/chat-message`)
**File**: `api/chat_message.py`

Real-time career mentoring chat powered by HuggingFace AI:
- Career advice and guidance
- Technical skill recommendations
- Resume optimization tips
- Industry insights

**How it works**:
1. User sends chat message
2. Message processed through AI context
3. HuggingFace generates intelligent response
4. Response stored in chat history

---

### 4. **Dashboard Statistics** (`/api/dashboard-stats`)
**File**: `api/dashboard_stats.py` + `services/ai_client.py`

AI-powered dashboard insights:
- Progress summaries
- Personalized recommendations
- Milestone achievements

---

### 5. **Profile Analysis** (`/api/profile-me`)
**File**: `api/profile_me.py`

AI analyzes student profiles to:
- Suggest career paths
- Identify skill gaps
- Recommend mentors

---

## 🔧 How the AI System Works

### Architecture Flow

```
User Request
    ↓
API Endpoint (api/*.py)
    ↓
Services Layer (services/ai_client.py)
    ↓
HuggingFace Inference API (Primary)
    ↓
LLM Response (Llama 3 8B)
    ↓
User Gets AI-Enhanced Result
```

### AI Client Fallback Chain

The system automatically handles failures by falling back through this priority chain:

1. **HuggingFace** (Primary) - Uses your API key
2. **OpenAI** - Falls back if HuggingFace unavailable
3. **Anthropic** - Falls back if OpenAI unavailable
4. **Heuristic Engine** - Smart built-in fallback with no API calls

**Code Location**: `services/ai_client.py` (Lines 1-92)

---

## 🚀 Features Now Enabled

With your HuggingFace API configured:

✅ **AI Matchmaker** - Generate AI-powered mentor match rationales
✅ **Roadmap Generation** - Create personalized career development paths
✅ **Chat Assistant** - Real-time AI-powered career mentoring
✅ **Profile Analysis** - AI insights on student profiles
✅ **Smart Recommendations** - Personalized next-step suggestions

---

## 📊 Environment Variables Setup

Your `.env` file now contains:

```env
# HuggingFace Inference API (Primary AI Provider)
HF_API_TOKEN=<YOUR_HUGGING_FACE_TOKEN>
HF_MODEL=meta-llama/Meta-Llama-3-8B-Instruct
```

These variables are automatically loaded when the Python backend starts.

---

## 💡 Using the AI API in Your Code

### Example 1: Generate Completion

```python
from services.ai_client import ai_client

# Basic usage
response = ai_client.generate_completion(
    prompt="Generate a career roadmap for a CS student",
    system_prompt="You are a career advisor"
)
print(response)
```

### Example 2: In the Matchmaker

```python
from services.matching_engine import run_ai_matchmaker

results = run_ai_matchmaker(
    student_dept="Computer Science",
    target_path="ML Engineer",
    interest_text="Deep Learning, Python",
    alumni_list=alumni_data
)
# Returns: [{rank, match_score, rationale, alumnus}, ...]
```

### Example 3: Generate Roadmap

```python
from services.roadmap_generator import generate_student_roadmap

roadmap = generate_student_roadmap(
    dept="Computer Science",
    target_role="Full Stack Developer",
    current_skills="JavaScript, React"
)
# Returns: List of 5 roadmap steps with AI-generated descriptions
```

---

## 🧪 Testing the Integration

### Test 1: Start the Server

```bash
# From workspace root
python app.py
```

Server will run on `http://127.0.0.1:5000`

### Test 2: Test Matchmaker API

```bash
curl -X POST http://127.0.0.1:5000/api/matchmaker-run \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "test_student",
    "student_dept": "CSE",
    "target_career_path": "Backend Engineer",
    "interests": "Databases, API design"
  }'
```

### Test 3: Test Roadmap API

```bash
curl -X POST http://127.0.0.1:5000/api/roadmap-generate \
  -H "Content-Type: application/json" \
  -d '{
    "department": "Computer Science",
    "target_role": "ML Engineer",
    "current_skills": "Python, Statistics"
  }'
```

---

## ⚙️ Customizing AI Behavior

### Change the Model

Edit your `.env` to use a different HuggingFace model:

```env
# Available options:
HF_MODEL=meta-llama/Meta-Llama-3-70B-Instruct      # More powerful, slower
HF_MODEL=mistralai/Mistral-7B-Instruct-v0.2       # Faster, good quality
HF_MODEL=bigcode/starcoder2-15b                    # Best for code
```

### Adjust Generation Parameters

Edit `services/ai_client.py` (Lines 24-30):

```python
payload = {
    "inputs": f"{system_prompt}\n\n{prompt}",
    "parameters": {
        "max_new_tokens": 256,      # Increase for longer responses
        "temperature": 0.7,          # Lower = more focused, Higher = more creative
        "return_full_text": False
    },
    "options": {"use_cache": False}
}
```

---

## 🔐 Security Notes

- **API Key Protection**: Your `.env` file is git-ignored. Never commit it.
- **Rate Limits**: HuggingFace has rate limits. Monitor usage.
- **Token Safety**: Your HF token should only be in `.env`, never in code.
- **Fallback Safety**: Even if API is down, system gracefully falls back to heuristic responses.

---

## 📈 Next Steps

1. **Restart your server** to load the new environment variables
2. **Test the AI Matchmaker** with real student data
3. **Monitor AI response quality** and adjust prompts as needed
4. **Scale AI features** to more parts of your application as needed

---

## 🆘 Troubleshooting

### Issue: "HuggingFace error 429: Too Many Requests"
- **Solution**: You've hit rate limits. Wait a few minutes and retry, or switch to a cheaper/faster model.

### Issue: "HuggingFace error 503: Service Unavailable"
- **Solution**: The model is loading. Wait 30-60 seconds and retry. System will fallback to heuristic engine.

### Issue: "API Key invalid"
- **Solution**: Verify your key in `.env` matches the provided key exactly.

### Issue: AI responses seem generic
- **Solution**: The heuristic fallback is running. Check:
  1. Your API key is correct in `.env`
  2. Server was restarted after adding the key
  3. HuggingFace API is not rate-limited

---

## 📞 Support

For issues with your HuggingFace integration:
1. Visit [HuggingFace Inference API Docs](https://huggingface.co/docs/api-inference)
2. Check your API key at [HuggingFace Settings](https://huggingface.co/settings/tokens)
3. Monitor usage at [HuggingFace Dashboard](https://huggingface.co/models)

---

**Setup Date**: August 2026
**API Provider**: HuggingFace Inference API
**Status**: ✅ Active and Ready
