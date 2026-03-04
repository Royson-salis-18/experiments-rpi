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

# The easiest way to get the check constraint is to query the GraphQL introspection or issue a direct SQL call via RPC if available,
# but we can also just fetch a row from `experiment.tubs` and see what growth_rates exist.
headers["Accept-Profile"] = "experiment"
r = requests.get(f"{base_url}/tubs?select=growth_rate&limit=5", headers=headers)
print("Existing growth rates:", r.text)

# We can also attempt to insert some common values and see what passes (fastest brute force)
data = {
    "experiment_id": 1,
    "label": "Test",
    "soil_type": "loam",
    "plant_name": "tomato"
}
for rate in ["fast", "slow", "moderate", "rapid", "low", "high", "medium"]:
    data["growth_rate"] = rate
    r_test = requests.post(f"{base_url}/tubs", headers=headers, json=data)
    if r_test.status_code == 201:
        print(f"SUCCESS with growth_rate: {rate}")
        break
    else:
        print(f"Failed with {rate}: {r_test.text}")
