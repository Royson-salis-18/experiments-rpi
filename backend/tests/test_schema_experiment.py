import requests
import os
import json

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

for tb in ["experiments", "tubs"]:
    r = requests.get(f"{base_url}/{tb}?select=*&limit=1", headers=headers)
    print(f"experiment schema - {tb} -> {r.status_code}")
    if r.status_code == 200:
        print(r.json())
        
# also let's fetch the OpenAPI spec for the experiment schema
req = requests.get(f"{base_url}/", headers=headers)
try:
    data = req.json()
    if "definitions" in data:
        print("\nTables in experiment schema:")
        print(list(data["definitions"].keys()))
except:
    pass
