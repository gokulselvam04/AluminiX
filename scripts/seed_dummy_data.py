# scripts/seed_dummy_data.py
"""
Utility script to insert dummy student and alumni records into Supabase.
Run with:
    python scripts/seed_dummy_data.py
Ensure the .env contains SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
"""
import os
import uuid
from supabase import create_client

# Load env (if .env exists)
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SERVICE_ROLE_KEY:
    raise RuntimeError("Supabase credentials not set in environment")

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# Dummy data
students = [
    {
        "id": str(uuid.uuid4()),
        "full_name": "Aarav Patel",
        "email": "aarav.patel@example.com",
        "role": "student",
        "department": "Computer Science & Engineering",
        "interest_area": "Machine Learning",
        "institution": "Karpagam Institute of Technology",
    },
    {
        "id": str(uuid.uuid4()),
        "full_name": "Sneha Rao",
        "email": "sneha.rao@example.com",
        "role": "student",
        "department": "Information Technology",
        "interest_area": "Full-Stack Development",
        "institution": "Karpagam Institute of Technology",
    },
    {
        "id": str(uuid.uuid4()),
        "full_name": "Kumar Singh",
        "email": "kumar.singh@example.com",
        "role": "student",
        "department": "Electronics & Communication",
        "interest_area": "Embedded Systems",
        "institution": "Karpagam Institute of Technology",
    },
    {
        "id": str(uuid.uuid4()),
        "full_name": "Meera Nair",
        "email": "meera.nair@example.com",
        "role": "student",
        "department": "Computer Science & Engineering",
        "interest_area": "Data Science",
        "institution": "Karpagam Institute of Technology",
    },
    {
        "id": str(uuid.uuid4()),
        "full_name": "Rohan Verma",
        "email": "rohan.verma@example.com",
        "role": "student",
        "department": "Mechanical Engineering",
        "interest_area": "Robotics",
        "institution": "Karpagam Institute of Technology",
    },
]

alumni = [
    {
        "id": str(uuid.uuid4()),
        "full_name": "Dr. Priya Menon",
        "email": "priya.menon@techcorp.com",
        "role": "alumni",
        "department": "Computer Science & Engineering",
        "industry": "Software",
        "job_role": "Senior Software Engineer",
        "company": "TechCorp",
        "mentor_available": True,
        "bio": "10+ years building scalable web platforms.",
        "whatsapp": "+919876543210",
    },
    {
        "id": str(uuid.uuid4()),
        "full_name": "Anil Kumar",
        "email": "anil.kumar@datasci.io",
        "role": "alumni",
        "department": "Data Science",
        "industry": "Analytics",
        "job_role": "Data Science Lead",
        "company": "DataSci.io",
        "mentor_available": True,
        "bio": "Specialist in machine learning pipelines.",
        "whatsapp": "+919812345678",
    },
    {
        "id": str(uuid.uuid4()),
        "full_name": "Sofia Gomez",
        "email": "sofia.gomez@cloudnet.com",
        "role": "alumni",
        "department": "Information Technology",
        "industry": "Cloud",
        "job_role": "Cloud Solutions Architect",
        "company": "CloudNet",
        "mentor_available": True,
        "bio": "Designing cloud-native solutions for enterprises.",
        "whatsapp": "+919800112233",
    },
    {
        "id": str(uuid.uuid4()),
        "full_name": "Ravi Shah",
        "email": "ravi.shah@electronics.com",
        "role": "alumni",
        "department": "Electronics & Communication",
        "industry": "IoT",
        "job_role": "Embedded Systems Engineer",
        "company": "EmbeddedCo",
        "mentor_available": True,
        "bio": "Building firmware for smart devices.",
        "whatsapp": "+919844556677",
    },
    {
        "id": str(uuid.uuid4()),
        "full_name": "Lakshmi Iyer",
        "email": "lakshmi.iyer@roboticslab.in",
        "role": "alumni",
        "department": "Mechanical Engineering",
        "industry": "Robotics",
        "job_role": "Robotics Research Engineer",
        "company": "RoboticsLab",
        "mentor_available": True,
        "bio": "Developing autonomous robotic platforms.",
        "whatsapp": "+919877665544",
    },
]

def upsert_records(table_name, records):
    res = supabase.table(table_name).upsert(records).execute()
    if res.error:
        print(f"Error upserting into {table_name}:", res.error)
    else:
        print(f"Successfully upserted {len(records)} records into {table_name}")

# Insert into generic users table (students)
upsert_records("users", students)

# Alumni profiles likely stored in a separate table `alumni_profiles`
upsert_records("alumni_profiles", alumni)

print("Dummy data seeding complete.")
