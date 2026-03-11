import requests
import os

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
if not supabase_url or not supabase_key:
    raise RuntimeError("Set SUPABASE_URL and a SUPABASE_*_KEY env var before running")
base_url = f"{supabase_url.rstrip('/')}/rest/v1"
headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json"
}

r = requests.get(f"{base_url}/sensor_status", headers=headers)
print("Sensor Status Rows:", r.text)
