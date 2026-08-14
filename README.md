# AlumniX — AI-Based Alumni Career & Networking Platform (Production Integration)

**AlumniX** is a full-stack, multi-user AI-powered alumni career and networking platform built for **Karpagam Institute of Technology (KIT)**. It connects students with verified alumni mentors, provides automated AI career matchmaker scoring with similarity rationales, 24/7 AI career mentorship chat, skill roadmaps, and real-time alumni job referrals.

---

## 🔑 Production Supabase Project Credentials

```text
Project URL: https://<your-supabase-project>.supabase.co
Anon / Public Key: <your-supabase-anon-key>
Service Role Key (Backend Server Secrets ONLY): <your-supabase-service-role-key>
Publishable Key: <your-publishable-key>
Secret Key: <your-secret-key>
```

---

## 🎨 Tech Stack & Architecture

- **Frontend**: Plain HTML5, Vanilla CSS3 (`styles.css`), Vanilla JavaScript (ES6+).
- **Configuration**: `/js/config.js` (`window.ALUMNIX_CONFIG`) & `/js/supabase-client.js` (`window.supabaseClient`).
- **Realtime Integration**: `/js/realtime.js` listening for live database changes on `mentorship_requests` and `jobs` tables across active user browsers.
- **Backend**: Python WSGI / Vercel Serverless Functions (`/api/*.py`, `_common.py`, `services/`).
- **Database & Auth**: Supabase Postgres + Supabase Auth + RLS (`db/schema.sql`, `db/seed.sql`).
- **AI Engine**: Pluggable AI service (`services/ai_client.py`) supporting OpenAI/Anthropic APIs with built-in heuristic AI fallback.

---

## ⚡ Setup & Production Deployment

### 1. Database Setup in Supabase
1. Log into your [Supabase Dashboard](https://supabase.com) for project `plykrrwmcebpvbzzxnwc`.
2. Open **SQL Editor** and run `db/schema.sql` to generate all core tables (`users`, `alumni_profiles`, `jobs`, `mentorship_requests`, `chat_messages`, `roadmap_progress`, `matchmaker_runs`), indexes, security definer view, and Row Level Security (RLS) policies.
3. (Optional) Run `db/seed.sql` to populate initial demo records.
4. Go to **Database → Realtime** and enable Realtime replication for `mentorship_requests` and `jobs` tables.
5. Navigate to **Authentication → Settings**, scroll to **Email Auth**, and set **"Confirm email" to OFF** for instant demo login.

### 2. Frontend Configuration
The public configuration file `/js/config.js` is configured as follows:
```javascript
window.ALUMNIX_CONFIG = {
  SUPABASE_URL: "https://<your-supabase-project>.supabase.co",
  SUPABASE_ANON_KEY: "<your-supabase-anon-key>",
  API_BASE_URL: "/api"
};
```

### 3. Backend Environment Configuration (`.env`)
The backend secret file `.env` contains:
```env
SUPABASE_URL=https://<your-supabase-project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
AI_PROVIDER=openai
OPENAI_API_KEY=
ALLOWED_ORIGIN=*
```
*Note: The `SUPABASE_SERVICE_ROLE_KEY` is kept exclusively in backend server environments and is NEVER exposed to the frontend.*

### 4. Running Locally
```bash
pip install -r requirements.txt
python app.py
```
Open `http://127.0.0.1:5000` in your browser.

---

## 🚀 Deploying to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy to Production:
```bash
vercel --prod
```
3. Set the Environment Variables in Vercel Dashboard Project Settings:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`)

---

## 🧪 Multi-User Real-World Verification Steps

1. **Student Account & Request**:
   - Open Browser A (`http://127.0.0.1:5000/signup.html`).
   - Sign up as Student (`student1@kite.ac.in`).
   - Navigate to Directory or AI Matchmaker and send a mentorship request.

2. **Alumni Account & Realtime Approval**:
   - Open Browser B (`http://127.0.0.1:5000/signup.html?role=alumni`).
   - Sign up as Alumni (`alumni1@company.com`) and complete Alumni Profile.
   - Open **Mentorship Requests**. The request from Browser A appears live via Supabase Realtime!
   - Click **Accept Request**.

3. **Status Sync**:
   - In Browser A, the mentorship request status automatically transitions to `accepted` in real-time.
