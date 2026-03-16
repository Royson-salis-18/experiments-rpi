
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

supabase = create_client(url, key)

def find_table(table_name):
    for schema in ["public", "experiment"]:
        try:
            print(f"Checking {schema}.{table_name}...")
            res = supabase.schema(schema).table(table_name).select("*", count="exact").limit(1).execute()
            print(f"Found in {schema}! Count: {res.count}")
            return schema
        except Exception as e:
            print(f"Not in {schema}: {e}")
    return None

if __name__ == "__main__":
    print("Finding sensor_data...")
    find_table("sensor_data")
    print("\nFinding tubs...")
    find_table("tubs")
    print("\nFinding experiments...")
    find_table("experiments")
