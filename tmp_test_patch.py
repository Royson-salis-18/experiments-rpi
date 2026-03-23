"""Quick diagnostic: test the exact same REST API PATCH the backend does."""
import os, requests
from dotenv import load_dotenv
load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
svc_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
anon_key = os.environ.get("SUPABASE_ANON_KEY", "").strip()

# Show which key the backend would actually use
backend_key = svc_key or anon_key or os.environ.get("SUPABASE_KEY", "").strip()
print(f"Service role key set: {bool(svc_key)}  (len={len(svc_key)})")
print(f"Anon key set:         {bool(anon_key)}  (len={len(anon_key)})")
print(f"Backend uses:         {'SERVICE ROLE' if svc_key else 'ANON'}")
print()

# Test with SERVICE ROLE key (bypasses RLS)
if svc_key:
    print("=== PATCH with SERVICE ROLE key ===")
    h = {
        "apikey": svc_key,
        "Authorization": f"Bearer {svc_key}",
        "Content-Type": "application/json",
        "Content-Profile": "public",
        "Prefer": "return=representation",
    }
    r = requests.patch(f"{url}/rest/v1/sensor_data?tub_id=eq.102&health=eq.0",
                       headers=h, json={"health": 0.55})
    print(f"  Status: {r.status_code}")
    print(f"  Body:   {r.text[:500]}")
    # Undo the change
    if r.json():
        requests.patch(f"{url}/rest/v1/sensor_data?tub_id=eq.102&health=eq.0.55",
                       headers=h, json={"health": 0})
        print("  (reverted)")
    print()

# Test with ANON key (subject to RLS)
if anon_key:
    print("=== PATCH with ANON key ===")
    h2 = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Content-Profile": "public",
        "Prefer": "return=representation",
    }
    r2 = requests.patch(f"{url}/rest/v1/sensor_data?tub_id=eq.102&health=eq.0",
                        headers=h2, json={"health": 0.55})
    print(f"  Status: {r2.status_code}")
    print(f"  Body:   {r2.text[:500]}")
