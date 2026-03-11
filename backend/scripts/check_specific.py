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
    "Accept-Profile": "experiment"
}

print("Searching for EXP-3 details...")
r_exp = requests.get(f"{base_url}/experiments?id=eq.3", headers=headers)
print("Experiment 3:", r_exp.text)

r_tub = requests.get(f"{base_url}/tubs?id=eq.102", headers=headers)
print("Tub 102:", r_tub.text)
