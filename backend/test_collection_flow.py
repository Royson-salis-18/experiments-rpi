import requests
import time
import os

# Let's say we have an experiment with some buckets.
# Based on the user's previous requests, experiment ID 3 and tub ID 102 are relevant.
tub_id = 102
api_url = "http://127.0.0.1:5000/api"

print(f"--- Starting collection for tub {tub_id} ---")
start_res = requests.post(f"{api_url}/buckets/{tub_id}/start_collection")
print("Start Response:", start_res.json())

if start_res.status_code == 200:
    start_time = start_res.json()["start_time"]
    print(f"Start Time: {start_time}")
    
    # Check sensor_status
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

    r = requests.get(f"{base_url}/sensor_status?sensor_id=eq.esp32-001", headers=headers)
    print("Sensor Status after lock:", r.text)
    
    print("--- Simulating Sensor Data Injection ---")
    # We'll inject a row into sensor_data for this tub_id.
    # supabase client is already initialized in app.py environment, but here we can use REST too.
    dummy_payload = {
        "tub_id": tub_id,
        "soil_ph": 6.5,
        "soil_moisture": 45,
        "soil_temp": 22,
        "nitrogen": 15
    }
    inj_res = requests.post(f"{base_url}/sensor_data", headers=headers, json=dummy_payload)
    print("Injection Response:", inj_res.status_code)
    
    print("--- Polling for latest data (should be has_data=True) ---")
    poll_res_2 = requests.get(f"{api_url}/buckets/{tub_id}/latest_data?since={start_time}")
    print("Final Poll (should be has_data=True):", poll_res_2.json())
    
    # Check if sensor_status is unlocked
    unlock_check = requests.get(f"{base_url}/sensor_status?sensor_id=eq.esp32-001", headers=headers)
    print("Sensor Status after unlock:", unlock_check.text)
else:
    print("Failed to start collection.")
