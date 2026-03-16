
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

supabase = create_client(url, key)

with open("schema_dump.txt", "w") as f:
    for table in ["tubs", "mapping", "experiments"]:
        f.write(f"\n--- Table: {table} ---\n")
        try:
            res = supabase.schema('experiment').table(table).select("*").limit(1).execute()
            if len(res.data) > 0:
                f.write(f"Columns: {list(res.data[0].keys())}\n")
                f.write(f"Data: {res.data[0]}\n")
            else:
                f.write("Empty\n")
        except Exception as e:
            f.write(f"Error: {e}\n")
