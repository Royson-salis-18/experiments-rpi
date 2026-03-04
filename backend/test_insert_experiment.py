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
    "Accept-Profile": "experiment",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

data = {
    "title": "Test Exp",
    "description": "testing",
    "status": "planned"
}

r = requests.post(f"{base_url}/experiments", headers=headers, json=data)
print(f"Status: {r.status_code}")
print(f"Response: {r.text}")

# If permission is denied, try fetching the max ID to bypass sequence
if r.status_code != 201:
    print("Trying to bypass sequence by providing ID manually...")
    r_get = requests.get(f"{base_url}/experiments?select=id&order=id.desc&limit=1", headers=headers)
    if r_get.status_code == 200:
        rows = r_get.json()
        next_id = 1
        if len(rows) > 0:
            next_id = rows[0]["id"] + 1
        
        data["id"] = next_id
        r_manual = requests.post(f"{base_url}/experiments", headers=headers, json=data)
        print(f"Manual ID Insert Status: {r_manual.status_code}")
        print(f"Manual ID Insert Response: {r_manual.text}")
