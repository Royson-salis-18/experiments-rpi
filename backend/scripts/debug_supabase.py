from supabase import create_client, Client
import os
import json

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Set SUPABASE_URL and a SUPABASE_*_KEY env var before running")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    res = supabase.table("sensor_status").update({
        "tub_id": 102,
        "is_locked": True,
        "is_active": True
    }).eq("sensor_id", "esp32-001").execute()
    print("Result:", res)
except Exception:
    import traceback
    traceback.print_exc()
