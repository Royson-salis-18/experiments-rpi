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
    "Accept": "application/json"
}

def test_endpoint(endpoint):
    url = f"{base_url}/{endpoint}?limit=1"
    response = requests.get(url, headers=headers)
    print(f"\n--- Testing Endpoint: /{endpoint} ---")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("Data:", json.dumps(response.json(), indent=2))
    else:
        print("Error/Message:", response.text)

test_endpoint("experiments")
test_endpoint("tubs")
test_endpoint("plants")
test_endpoint("sensors")
