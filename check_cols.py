
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

supabase = create_client(url, key)

def dump_schema():
    try:
        # Check tubs
        tubs = supabase.schema('experiment').table('tubs').select("*").limit(1).execute()
        print("Tubs Columns:", list(tubs.data[0].keys()) if tubs.data else "Empty")
        
        # Check experiments
        exps = supabase.schema('experiment').table('experiments').select("*").limit(1).execute()
        print("Experiments Columns:", list(exps.data[0].keys()) if exps.data else "Empty")
        
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    dump_schema()
