
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

if not url or not key:
    print("Missing env vars")
    exit(1)

supabase = create_client(url, key)

# Try to get one row and see the columns
res = supabase.table("sensor_data").select("*").limit(1).execute()
if len(res.data) > 0:
    print("Columns:", res.data[0].keys())
else:
    print("Table is empty, checking schema is harder this way.")
