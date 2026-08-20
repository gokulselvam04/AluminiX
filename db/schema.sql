-- AlumniX Supabase Database Schema
-- Designed for Karpagam Institute of Technology (KIT) Alumni Platform

-- 1. Create Tables

-- Core Users table linked to auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'alumni', 'admin')),
    email TEXT UNIQUE NOT NULL,
    institution TEXT DEFAULT 'Karpagam Institute of Technology',
    department TEXT NOT NULL,
    interest_area TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alumni Profiles table
CREATE TABLE IF NOT EXISTS public.alumni_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    batch_year INTEGER NOT NULL,
    department TEXT NOT NULL,
    company TEXT NOT NULL,
    job_role TEXT NOT NULL,
    industry TEXT NOT NULL,
    linkedin_url TEXT,
    bio TEXT,
    mentor_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Board & Referral Listings
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    posted_by UUID NOT NULL REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Internship', 'Full-time', 'Part-time', 'Contract')),
    tag TEXT DEFAULT 'General',
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentorship Requests
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    alumni_id UUID NOT NULL REFERENCES public.alumni_profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    initiated_by TEXT NOT NULL DEFAULT 'student' CHECK (initiated_by IN ('student', 'alumni')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Career Mentor Chat Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student AI Skill Roadmap Progress
CREATE TABLE IF NOT EXISTS public.roadmap_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_role TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    percent_complete INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Matchmaker Execution Log (Audit)
CREATE TABLE IF NOT EXISTS public.matchmaker_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    input_goal TEXT NOT NULL,
    input_interest TEXT,
    results JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_dept ON public.alumni_profiles(department);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_company ON public.alumni_profiles(company);
CREATE INDEX IF NOT EXISTS idx_alumni_profiles_mentor ON public.alumni_profiles(mentor_available);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_student ON public.mentorship_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_alumni ON public.mentorship_requests(alumni_id);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON public.jobs(posted_by);

-- 2. Row Level Security (RLS) Policies

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matchmaker_runs ENABLE ROW LEVEL SECURITY;

-- USERS policies
CREATE POLICY "Users can insert their own record on signup"
    ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can select their own record or public profile info"
    ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can update their own record"
    ON public.users FOR UPDATE USING (auth.uid() = id);

-- ALUMNI_PROFILES policies
CREATE POLICY "Anyone authenticated can view alumni profiles"
    ON public.alumni_profiles FOR SELECT USING (true);

CREATE POLICY "Alumni can insert their profile"
    ON public.alumni_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Alumni can update their profile"
    ON public.alumni_profiles FOR UPDATE USING (auth.uid() = user_id);

-- JOBS policies
CREATE POLICY "Anyone authenticated can view jobs"
    ON public.jobs FOR SELECT USING (true);

CREATE POLICY "Alumni can insert jobs"
    ON public.jobs FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.alumni_profiles WHERE id = posted_by AND user_id = auth.uid())
    );

-- MENTORSHIP_REQUESTS policies
CREATE POLICY "Students can create student-initiated requests"
    ON public.mentorship_requests FOR INSERT WITH CHECK (
        auth.uid() = student_id AND initiated_by = 'student'
    );

CREATE POLICY "Alumni can create alumni-initiated requests"
    ON public.mentorship_requests FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.alumni_profiles WHERE id = alumni_id AND user_id = auth.uid()
        ) AND initiated_by = 'alumni'
    );

CREATE POLICY "Users can view relevant mentorship requests"
    ON public.mentorship_requests FOR SELECT USING (
        auth.uid() = student_id OR EXISTS (
            SELECT 1 FROM public.alumni_profiles WHERE id = alumni_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Only non-initiator can update request status"
    ON public.mentorship_requests FOR UPDATE USING (
        (initiated_by = 'student' AND EXISTS (
            SELECT 1 FROM public.alumni_profiles WHERE id = alumni_id AND user_id = auth.uid()
        )) OR
        (initiated_by = 'alumni' AND auth.uid() = student_id)
    );

-- CHAT_MESSAGES policies
CREATE POLICY "Users can view and manage their own chat messages"
    ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

-- ROADMAP_PROGRESS policies
CREATE POLICY "Users can view and manage their own roadmap"
    ON public.roadmap_progress FOR ALL USING (auth.uid() = user_id);

-- MATCHMAKER_RUNS policies
CREATE POLICY "Students can view their matchmaker runs"
    ON public.matchmaker_runs FOR ALL USING (auth.uid() = student_id);

-- 3. Security Definer Helper View for Public Impact Metrics (Non-PII aggregate counts)
CREATE OR REPLACE VIEW public.impact_metrics_view AS
SELECT
    (SELECT COUNT(*) FROM public.users WHERE role = 'student') AS total_students,
    (SELECT COUNT(*) FROM public.alumni_profiles) AS total_alumni,
    (SELECT COUNT(*) FROM public.mentorship_requests WHERE status = 'accepted') AS connections_made,
    (SELECT COUNT(*) FROM public.jobs) AS active_jobs,
    (SELECT COUNT(*) FROM public.alumni_profiles WHERE mentor_available = true) AS active_mentors;
