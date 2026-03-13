from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token
)
from supabase import create_client, Client
import os
from datetime import datetime

# Auto-load .env file if present
try:
    from dotenv import load_dotenv
    import pathlib
    _env_path = pathlib.Path(__file__).resolve().parent / ".env"
    load_dotenv(_env_path)
except ImportError:
    pass  # python-dotenv not installed, rely on system env vars


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config["JWT_SECRET_KEY"]  = "super-secret-key"
jwt = JWTManager(app)

# Initialize Supabase client
# Read from environment to avoid committing secrets
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
# Prefer service role key for server-side operations; fall back to anon if provided
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    or os.environ.get("SUPABASE_ANON_KEY", "").strip()
    or os.environ.get("SUPABASE_KEY", "").strip()
)
print(f"[DEBUG] SUPABASE_URL = {SUPABASE_URL[:30]}...")
print(f"[DEBUG] SUPABASE_KEY = {SUPABASE_KEY[:20]}...{SUPABASE_KEY[-10:]}")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_*_KEY environment variables")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    print(data)

    return jsonify({
        "success" : True,
        "message" : "Account created"
    }), 201

@app.route('/login', methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if email == "admin@nutritech.ai" and password=="1234":
        token=create_access_token(identity=email)
        return jsonify({
            'success' : True,
            "message" : "Login Successful"
        }), 200
    
    return jsonify({
        "success" : False,
        "message" : "Invalid email or password"
    }), 401

# --- EXPERIMENTS API ---

# Helper to access the experiment schema using the python client (using postgREST raw table access)
# Since python client defaults to public schema, we can specify the schema in the table call or builder
def exp_schema():
    # Attempting to use the Supabase python client schema method if available, 
    # otherwise defaulting back to the standard table pattern.
    if hasattr(supabase, 'schema'):
        return supabase.schema('experiment')
    # Fallback to standard client if schema() isn't supported in this client version
    return supabase

@app.route("/api/experiments", methods=["POST"])
def create_experiment():
    """Create a new experiment in `experiment.experiments` table"""
    data = request.json
    try:
        # Fetch the max ID to bypass sequence permission issues (42501)
        max_id_res = exp_schema().table('experiments').select("id").order("id", desc=True).limit(1).execute()
        next_id = 1
        if len(max_id_res.data) > 0:
            next_id = max_id_res.data[0]["id"] + 1

        insert_payload = {
            "id": next_id,
            "title": data.get("title", f"Experiment {data.get('experiment_number')}"),
            "description": data.get("description", ""),
            "status": data.get("status", "planned"),
        }
        # Only set date fields if provided and non-empty
        if data.get("started_at"):
            insert_payload["started_at"] = data["started_at"]
        if data.get("ended_at"):
            insert_payload["ended_at"] = data["ended_at"]

        res = exp_schema().table('experiments').insert(insert_payload).execute()
        
        if len(res.data) == 0:
            return jsonify({"success": False, "message": "Failed to create experiment"}), 400
            
        new_exp = res.data[0]
        frontend_exp = {
            "id": new_exp["id"],
            "experiment_number": f"EXP-{new_exp['id']}",
            "title": new_exp.get("title"),
            "num_buckets": data.get("num_buckets"),
            "description": new_exp.get("description"),
            "status": new_exp.get("status", "planned"),
            "started_at": new_exp.get("started_at"),
            "ended_at": new_exp.get("ended_at"),
            "buckets": []
        }
        return jsonify({"success": True, "experiment": frontend_exp}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/experiments", methods=["GET"])
def get_experiments():
    """Return all experiments and their associated tubs"""
    try:
        # Fetch experiments
        exps_res = exp_schema().table('experiments').select("*").execute()
        experiments = exps_res.data
        
        # Fetch all tubs
        tubs_res = exp_schema().table('tubs').select("*").execute()
        tubs = tubs_res.data
        
        # Format for frontend
        formatted_exps = []
        for exp in experiments:
            exp_tubs = [t for t in tubs if t.get("experiment_id") == exp["id"]]
            
            # Count how many are completed to derive general status
            completed_tubs = 0
            formatted_buckets = []
            for idx, tub in enumerate(exp_tubs):
                # Check if sensor data exists to set status
                sensor_check = supabase.table('sensor_data').select("id").eq("tub_id", tub["id"]).limit(1).execute()
                status = "Data Collected" if len(sensor_check.data) > 0 else "Waiting"
                
                formatted_buckets.append({
                    "id": tub["id"],
                    "experiment_id": exp["id"],
                    "bucket_number": tub.get("label", f"Bucket {idx+1}"),
                    "soil_type": tub.get("soil_type"),
                    "plant_type": tub.get("plant_name"),
                    "status": status,
                    "sensor_data": None
                })
                
            frontend_exp = {
                "id": exp["id"],
                "experiment_number": f"EXP-{exp['id']}",
                "title": exp.get("title"),
                "num_buckets": len(exp_tubs),
                "description": exp.get("description"),
                "status": exp.get("status", "planned"),
                "started_at": exp.get("started_at"),
                "ended_at": exp.get("ended_at"),
                "buckets": formatted_buckets
            }
            formatted_exps.append(frontend_exp)
            
        return jsonify({"success": True, "experiments": formatted_exps}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/experiments/<int:exp_id>", methods=["PATCH"])
def update_experiment(exp_id):
    """Update experiment status, started_at, ended_at"""
    data = request.json
    try:
        update_payload = {}
        if "status" in data:
            update_payload["status"] = data["status"]
        # Allow null to clear dates
        if "started_at" in data:
            update_payload["started_at"] = data["started_at"]  # can be None
        if "ended_at" in data:
            update_payload["ended_at"] = data["ended_at"]      # can be None

        if not update_payload:
            return jsonify({"success": False, "message": "Nothing to update"}), 400

        res = exp_schema().table('experiments').update(update_payload).eq("id", exp_id).execute()

        if len(res.data) == 0:
            return jsonify({"success": False, "message": "Experiment not found or no change"}), 404

        updated = res.data[0]
        return jsonify({
            "success": True,
            "experiment": {
                "id": updated["id"],
                "status": updated.get("status"),
                "started_at": updated.get("started_at"),
                "ended_at": updated.get("ended_at"),
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/experiments/<int:id>", methods=["GET"])
def get_experiment(id):
    try:
        exp_res = exp_schema().table('experiments').select("*").eq("id", id).execute()
        if len(exp_res.data) == 0:
            return jsonify({"success": False, "message": "Experiment not found"}), 404
        exp = exp_res.data[0]
        
        tubs_res = exp_schema().table('tubs').select("*").eq("experiment_id", id).execute()
        tubs = tubs_res.data
        
        formatted_buckets = []
        for idx, tub in enumerate(tubs):
            # Try to grab the latest sensor reading for this tub to determine "Data Collected" status
            sensor_res = supabase.table('sensor_data').select("*").eq("tub_id", tub["id"]).order("created_at", desc=True).limit(1).execute()
            
            status = "Waiting"
            sensor_data = None
            if len(sensor_res.data) > 0:
                status = "Data Collected"
                sd = sensor_res.data[0]
                # Send the raw data or a clean map
                sensor_data = {
                    "ph": sd.get("soil_ph"),
                    "moisture": sd.get("soil_moisture"),
                    "temperature": sd.get("soil_temp"),
                    "nitrogen": sd.get("nitrogen"),
                    "phosphorus": sd.get("phosphorus"),
                    "potassium": sd.get("potassium"),
                    "ec": sd.get("soil_ec"),
                    "waterPh": sd.get("water_ph"),
                    "airTemp": sd.get("air_temp"),
                    "airHumidity": sd.get("air_humidity"),
                    "createdAt": sd.get("created_at")
                }
                
            formatted_buckets.append({
                "id": tub["id"],
                "experiment_id": exp["id"],
                "bucket_number": tub.get("label", f"Bucket {idx+1}"),
                "soil_type": tub.get("soil_type"),
                "plant_type": tub.get("plant_name"),
                "status": status,
                "sensor_data": sensor_data
            })
            
        frontend_exp = {
            "id": exp["id"],
            "experiment_number": f"EXP-{exp['id']}",
            "title": exp.get("title"),
            "num_buckets": len(tubs),
            "description": exp.get("description"),
            "status": exp.get("status", "planned"),
            "buckets": formatted_buckets
        }
        return jsonify({"success": True, "experiment": frontend_exp}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/experiments/<int:experiment_id>/buckets", methods=["POST"])
def create_bucket(experiment_id):
    """
    Inserts into Supabase `experiment.tubs` schema
    """
    data = request.json
    try:
        # Fetch max ID for tubs
        max_id_res = exp_schema().table('tubs').select("id").order("id", desc=True).limit(1).execute()
        next_id = 1
        if len(max_id_res.data) > 0:
            next_id = max_id_res.data[0]["id"] + 1

        res = exp_schema().table('tubs').insert({
            "id": next_id,
            "experiment_id": experiment_id,
            "label": data.get("bucket_number"),
            "soil_type": data.get("soil_type"),
            "plant_name": data.get("plant_type"),
            "growth_rate": "rapid" # required enum fallback matching tubs_growth_rate_check constraint
        }).execute()
        
        if len(res.data) == 0:
            return jsonify({"success": False, "message": "Failed to create tub"}), 400
            
        new_tub = res.data[0]
        
        new_bucket = {
            "id": new_tub["id"],
            "experiment_id": experiment_id,
            "bucket_number": new_tub.get("label"),
            "soil_type": new_tub.get("soil_type"),
            "plant_type": new_tub.get("plant_name"),
            "status": "Waiting",
            "sensor_data": None
        }
        
        return jsonify({"success": True, "bucket": new_bucket}), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/buckets/<int:id>/start_collection", methods=["POST"])
def start_collection(id):
    try:
        import requests
        base_url = "https://ciosgjvbflsnrkhbriqh.supabase.co/rest/v1"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        payload = {
            "tub_id": id,
            "is_locked": True,
            "is_active": True
        }
        # We use a PATCH on the row with sensor_id = esp32-001
        patch_res = requests.patch(
            f"{base_url}/sensor_status?sensor_id=eq.esp32-001",
            headers=headers,
            json=payload
        )
        if patch_res.status_code not in [200, 201, 204]:
             raise Exception(f"Failed to update sensor status: {patch_res.text}")
             
        # We return the exact server time right now. We'll only look for sensor data newer than this.
        from datetime import datetime, timezone
        start_time = datetime.now(timezone.utc).isoformat()
        
        return jsonify({"success": True, "start_time": start_time}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/buckets/<int:id>/latest_data", methods=["GET"])
def get_latest_bucket_data(id):
    since = request.args.get("since")
    if since:
        # Handle URL decoding where '+' might become ' '
        since = since.replace(" ", "+")
    try:
        # Fetch actual matching data
        query = supabase.table('sensor_data').select("*").eq("tub_id", id).order("created_at", desc=True).limit(1)
        if since:
            query = query.gte("created_at", since)
            
        sensor_res = query.execute()
        
        if len(sensor_res.data) > 0:
            sd = sensor_res.data[0]
            
            # User request: After getting the data, is_locked must turn to false
            try:
                supabase.table("sensor_status").update({
                    "is_locked": False
                }).eq("sensor_id", "esp32-001").execute()
            except:
                pass

            import json
            sensor_data_json = json.dumps({
                "ph": sd.get("soil_ph", 0),
                "moisture": sd.get("soil_moisture", 0),
                "temperature": sd.get("soil_temp", 0),
                "nitrogen": sd.get("nitrogen", 0)
            })
            return jsonify({
                "success": True, 
                "has_data": True, 
                "sensor_data": sensor_data_json,
                "raw": sd
            }), 200
        else:
            return jsonify({"success": True, "has_data": False}), 200
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400
    """
    Poll this endpoint. Checks the `public.sensor_data` table for the newest reading 
    for this `tub_id` (bucket.id).
    """
    try:
        # We need a cutoff time ideally, but for now we'll just check if *any* data exists
        # In a real rigorous test, we'd check if `created_at` > `experiment.started_at`
        sensor_res = supabase.table('sensor_data').select("*").eq("tub_id", id).order("created_at", desc=True).limit(1).execute()
        
        if len(sensor_res.data) > 0:
            sd = sensor_res.data[0]
            import json
            sensor_data_json = json.dumps({
                "ph": sd.get("soil_ph", 0),
                "moisture": sd.get("soil_moisture", 0),
                "temperature": sd.get("soil_temp", 0),
                "nitrogen": sd.get("nitrogen", 0)
            })
            return jsonify({
                "success": True, 
                "has_data": True, 
                "sensor_data": sensor_data_json,
                "raw": sd
            }), 200
        else:
            return jsonify({"success": True, "has_data": False}), 200
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/buckets/<int:id>", methods=["PATCH"])
def update_bucket(id):
    """
    Maintained for backward compatibility or explicit overrides if needed.
    """
    data = request.json
    try:
        # Since status and sensor_data aren't actually stored on the tub but rather derived 
        # from the existence of sensor_data, we can just fetch the bucket format and return it.
        tub_res = exp_schema().table('tubs').select("*").eq("id", id).execute()
        if len(tub_res.data) == 0:
            return jsonify({"success": False, "message": "Bucket not found"}), 404
            
        tub = tub_res.data[0]
        
        # If the frontend explicitly passed sensor data during the old mock process, 
        # we can still push it to Supabase as a mock insertion if we wanted, 
        # but the real flow shouldn't need this patch anymore.
        
        bucket = {
            "id": tub["id"],
            "experiment_id": tub["experiment_id"],
            "bucket_number": tub.get("label"),
            "soil_type": tub.get("soil_type"),
            "plant_type": tub.get("plant_name"),
            "status": data.get("status", "Waiting"),
            "sensor_data": data.get("sensor_data", None)
        }
        
        return jsonify({"success": True, "bucket": bucket}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True, port=5000)
