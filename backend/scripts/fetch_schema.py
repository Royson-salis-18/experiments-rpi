import requests
import json
import os

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")
if not supabase_url or not supabase_key:
    raise RuntimeError("Set SUPABASE_URL and a SUPABASE_*_KEY env var before running")
url = f"{supabase_url.rstrip('/')}/rest/v1/"
headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
data = response.json()

with open("supabase_schema_output.txt", "w") as f:
    if "definitions" in data:
        tables = list(data["definitions"].keys())
        f.write("Available Tables:\n")
        for t in tables:
            f.write(f"\n--- Table: {t} ---\n")
            props = data["definitions"][t].get("properties", {})
            for col, col_data in props.items():
                col_type = col_data.get("type", "unknown")
                col_format = col_data.get("format", "")
                f.write(f"  - {col} ({col_type} {col_format})\n")
    else:
        f.write("Failed to map schema definitions:\n")
        f.write(json.dumps(data, indent=2))
