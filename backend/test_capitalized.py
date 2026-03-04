import requests
import os

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
if not supabase_url or not supabase_key:
    raise RuntimeError("Set SUPABASE_URL and a SUPABASE_*_KEY env var before running")
base_url = f"{supabase_url.rstrip('/')}/rest/v1"
headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}"
}

for tb in ["Experiments", "Tubs", "Buckets", "EXPERIMENTS", "TUBS", "Tubs", "experiments", "tubs"]:
    r = requests.get(f"{base_url}/{tb}?select=*&limit=1", headers=headers)
    print(f"{tb} -> {r.status_code}")
