-- AlumniX Seed Data
-- Karpagam Institute of Technology (KIT) realistic alumni & platform demo data

-- Note: In a live Supabase environment, users are created via auth.users first.
-- This seed script provides sample database records for local demo or direct testing.

-- Insert Sample Users (Alumni & Students)
INSERT INTO public.users (id, full_name, role, email, institution, department, interest_area)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Karthik Subramanian', 'alumni', 'karthik.s@zoho.com', 'Karpagam Institute of Technology', 'Computer Science & Engineering', 'Software Architecture & Cloud'),
    ('a1000000-0000-0000-0000-000000000002', 'Priya Sundaram', 'alumni', 'priya.sundaram@freshworks.com', 'Karpagam Institute of Technology', 'Computer Science & Engineering', 'Full Stack & Product Dev'),
    ('a1000000-0000-0000-0000-000000000003', 'Arun Kumar', 'alumni', 'arun.k@microsoft.com', 'Karpagam Institute of Technology', 'Artificial Intelligence & Data Science', 'Machine Learning & LLMs'),
    ('a1000000-0000-0000-0000-000000000004', 'Deepika Ramesh', 'alumni', 'deepika.ramesh@amazon.com', 'Karpagam Institute of Technology', 'Information Technology', 'DevOps & Distributed Systems'),
    ('a1000000-0000-0000-0000-000000000005', 'Venkatesh Rajan', 'alumni', 'venkatesh.r@bosch.com', 'Karpagam Institute of Technology', 'Electronics & Communication Engineering', 'Embedded Systems & IoT'),
    ('a1000000-0000-0000-0000-000000000006', 'Divya Krishnan', 'alumni', 'divya.k@tcs.com', 'Karpagam Institute of Technology', 'Mechanical Engineering', 'Robotics & Automation'),
    ('s1000000-0000-0000-0000-000000000001', 'Aravind Swaminathan', 'student', 'aravind@kite.ac.in', 'Karpagam Institute of Technology', 'Computer Science & Engineering', 'AI & Web Development'),
    ('s1000000-0000-0000-0000-000000000002', 'Sneha Narayanan', 'student', 'sneha@kite.ac.in', 'Karpagam Institute of Technology', 'Artificial Intelligence & Data Science', 'Data Science & Analytics')
ON CONFLICT (id) DO NOTHING;

-- Insert Alumni Profiles
INSERT INTO public.alumni_profiles (id, user_id, batch_year, department, company, job_role, industry, linkedin_url, bio, mentor_available)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 2019, 'Computer Science & Engineering', 'Zoho Corporation', 'Senior Software Engineer', 'Software Development', 'https://linkedin.com/in/karthik-subramanian-demo', 'KIT CSE Alumnus (2019). Passionate about backend systems, distributed databases, and guiding juniors entering the SaaS industry.', TRUE),
    ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 2020, 'Computer Science & Engineering', 'Freshworks', 'Product Lead / Full Stack Specialist', 'SaaS', 'https://linkedin.com/in/priya-sundaram-demo', 'KIT CSE Alumna (2020). Built scale at Freshworks. Happy to review portfolios, guide on React/Node stacks, and conduct mock interviews.', TRUE),
    ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 2021, 'Artificial Intelligence & Data Science', 'Microsoft', 'AI / ML Engineer', 'Artificial Intelligence', 'https://linkedin.com/in/arun-kumar-demo', 'KIT AI&DS Alumnus (2021). Working on Azure AI models. Eager to help KIT students build strong AI/ML foundations and land top tech roles.', TRUE),
    ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 2018, 'Information Technology', 'Amazon Web Services', 'Cloud Solutions Architect', 'Cloud Computing', 'https://linkedin.com/in/deepika-ramesh-demo', 'AWS Solutions Architect with 6+ years experience. Specializing in cloud infrastructure, Kubernetes, and backend scalability.', TRUE),
    ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 2020, 'Electronics & Communication Engineering', 'Bosch Global Software', 'Embedded IoT Systems Lead', 'Automotive & IoT', 'https://linkedin.com/in/venkatesh-rajan-demo', 'ECE graduate focusing on IoT hardware design, microcontrollers, and C/C++ firmware engineering.', TRUE),
    ('b1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 2017, 'Mechanical Engineering', 'TCS Innovation Labs', 'Robotics R&D Specialist', 'Automation & Mechanical', 'https://linkedin.com/in/divya-krishnan-demo', 'Mechanical lead guiding hardware+software cross-domain engineering careers and CAD/ROS modeling.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Job Listings
INSERT INTO public.jobs (id, posted_by, title, company, location, type, tag, description)
VALUES
    ('j1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Associate Backend Developer', 'Zoho Corporation', 'Chennai / Tenkasi', 'Full-time', 'Backend / Java', 'Looking for strong CSE/IT graduates from KIT with solid understanding of Java, Data Structures, and SQL. Fast-track referral available for KIT alumni network.'),
    ('j2000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'Frontend Engineering Intern (SaaS)', 'Freshworks', 'Chennai (Hybrid)', 'Internship', 'Frontend / React', '6-month paid internship at Freshworks product team. Opportunity for full-time conversion. Strong HTML, CSS, JavaScript fundamentals required.'),
    ('j3000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'Graduate AI Research Fellow', 'Microsoft', 'Bengaluru', 'Full-time', 'AI / ML / Python', 'Join Microsoft India AI team. Ideal for final year AI&DS / CSE students proficient in PyTorch, Python, and Large Language Model fine-tuning.'),
    ('j4000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000004', 'Junior Cloud Infrastructure Associate', 'Amazon Web Services', 'Coimbatore / Remote', 'Full-time', 'Cloud / AWS', 'Hands-on entry role working with AWS infrastructure, Linux administration, and CI/CD pipelines.')
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Mentorship Requests
INSERT INTO public.mentorship_requests (id, student_id, alumni_id, message, status)
VALUES
    ('m1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Hi Karthik sir, I am a final year CSE student at KIT interested in SaaS backend engineering. Would love to get your advice on Zoho interview prep.', 'accepted'),
    ('m2000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'Hello Arun sir, I am an AI&DS 3rd year student. I want to build projects in LLM fine-tuning and apply for AI roles. Would love your mentorship.', 'pending')
ON CONFLICT (id) DO NOTHING;
