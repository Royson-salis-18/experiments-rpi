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
    "Accept-Profile": "experiment",
    "Content-Type": "application/json"
}

print("Checking Experiments...")
r_exp = requests.get(f"{base_url}/experiments?select=id,title,description,status&order=id.desc&limit=5", headers=headers)
print(r_exp.text)

print("\nChecking Tubs...")
r_tubs = requests.get(f"{base_url}/tubs?select=id,experiment_id,label,soil_type,plant_name,growth_rate&order=id.desc&limit=5", headers=headers)
print(r_tubs.text)
