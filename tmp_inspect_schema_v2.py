
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
        # Avoid print buffering issues by flushing
        res = supabase.schema('experiment').table(name).select("*").limit(5).execute()
        if len(res.data) > 0:
            print("Columns:", list(res.data[0].keys()))
            for row in res.data:
                print("Row:", row)
        else:
            print("Table exists but is empty.")
    except Exception as e:
        print("Error checking table:", e)

check_table("tubs")
check_table("experiments")
