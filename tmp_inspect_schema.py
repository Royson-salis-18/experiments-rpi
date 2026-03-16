
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

supabase = create_client(url, key)

def check_table(name):
    print(f"\n--- Table: {name} ---")
    try:
        res = supabase.schema('experiment').table(name).select("*").limit(1).execute()
        if len(res.data) > 0:
            print("Columns:", res.data[0].keys())
            print("Sample Data:", res.data[0])
        else:
            print("Table exists but is empty.")
    except Exception as e:
        print("Error checking table:", e)

check_table("tubs")
check_table("mapping")
check_table("experiments")
check_table("tub_config")
