from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token
)
from supabase import create_client, Client
import os
from datetime import datetime

"""
NutriTech Backend API
---------------------
This service manages experiments, physical tubs, and interacts with Supabase
to fetch and store sensor data.
"""

# Auto-load .env file if present
try:
    from dotenv import load_dotenv
    import pathlib
    _env_path = pathlib.Path(__file__).resolve().parent / ".env"
    load_dotenv(_env_path)
except ImportError:
    pass  # python-dotenv not installed, rely on system env vars

app = Flask(__name__)
# Enable CORS for frontend communication
CORS(app, resources={r"/api/*": {"origins": "*"}})

# JWT Configuration (for future authentication expansion)
app.config["JWT_SECRET_KEY"]  = "super-secret-key"
jwt = JWTManager(app)

# Cache for discovered table schemas to avoid repetitive schema lookups
TABLE_SCHEMAS = {}

# Initialize Supabase client using environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
# Prioritize service role key for full DB access; fallback to anon key
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    or os.environ.get("SUPABASE_ANON_KEY", "").strip()
    or os.environ.get("SUPABASE_KEY", "").strip()
)

print(f"[INFO] Initializing Supabase client with URL: {SUPABASE_URL[:30]}...")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_*_KEY environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --------------------------------------------------------------------------------
# AUTHENTICATION ENDPOINTS (Mock Implementation)
# --------------------------------------------------------------------------------

@app.route("/signup", methods=["POST"])
def signup():
    """Mock signup endpoint"""
    data = request.json
    return jsonify({
        "success" : True,
        "message" : "Account created"
    }), 201

@app.route('/login', methods=["POST"])
def login():
    """Mock login endpoint - currently hardcoded for admin access"""
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if email == "admin@nutritech.ai" and password=="1234":
        token = create_access_token(identity=email)
        return jsonify({
            'success' : True,
            "message" : "Login Successful"
        }), 200
    
    return jsonify({
        "success" : False,
        "message" : "Invalid email or password"
    }), 401

# --------------------------------------------------------------------------------
# HELPERS
# --------------------------------------------------------------------------------

def get_table(table_name):
    """
    Robustly finds a table in either 'experiment' or 'public' schemas.
    Maintains a cache in TABLE_SCHEMAS to speed up subsequent requests.
    """
    if table_name in TABLE_SCHEMAS:
        schema_name = TABLE_SCHEMAS[table_name]
        return supabase.schema(schema_name).table(table_name) if schema_name != 'public' else supabase.table(table_name)
    
    # Check each potential schema
    for schema_name in ["experiment", "public"]:
        try:
            target = supabase.schema(schema_name) if schema_name != 'public' else supabase
            # Verify table existence with a no-op select
            target.table(table_name).select("*").limit(0).execute()
            TABLE_SCHEMAS[table_name] = schema_name
            print(f"[DEBUG] Discovered table '{table_name}' in schema '{schema_name}'")
            return target.table(table_name)
        except Exception:
            continue
            
    # Default to 'experiment' schema if discovery fails
    return supabase.schema('experiment').table(table_name)

# --------------------------------------------------------------------------------
# EXPERIMENTS & TUBS API
# --------------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    """Base API endpoint with health status and available endpoints"""
    return jsonify({
        "status": "online",
        "message": "NutriTech Backend API is running",
        "endpoints": ["/api/experiments", "/api/tubs", "/api/health-check"]
    }), 200

@app.route("/api/experiments", methods=["POST"])
def create_experiment():
    """
    Creates a new entry in the `experiments` table.
    Bypasses sequence issues by manually calculating the next ID.
    """
    data = request.json
    try:
        # Get latest ID to increment (workaround for sequence permission issues)
        max_id_res = get_table('experiments').select("id").order("id", descending=True).limit(1).execute()
        next_id = max_id_res.data[0]["id"] + 1 if max_id_res.data else 1

        insert_payload = {
            "id": next_id,
            "title": data.get("title", f"Experiment {data.get('experiment_number')}"),
            "description": data.get("description", ""),
            "status": data.get("status", "planned"),
        }
        
        # Add dates if provided
        if data.get("started_at"):
            insert_payload["started_at"] = data["started_at"]
        if data.get("ended_at"):
            insert_payload["ended_at"] = data["ended_at"]

        res = get_table('experiments').insert(insert_payload).execute()
        
        if not res.data:
            return jsonify({"success": False, "message": "Failed to create experiment"}), 400
            
        new_exp = res.data[0]
        return jsonify({
            "success": True, 
            "experiment": {
                "id": new_exp["id"],
                "experiment_number": f"EXP-{new_exp['id']}",
                "title": new_exp.get("title"),
                "status": new_exp.get("status", "planned"),
                "started_at": new_exp.get("started_at"),
                "ended_at": new_exp.get("ended_at")
            }
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/experiments", methods=["GET"])
def get_experiments():
    """
    Returns a list of all experiments with their associated physical tubs (buckets).
    Optimized to fetch sensor status in a single pass.
    """
    try:
        # Fetch all experiments
        exps_res = get_table('experiments').select("*").execute()
        experiments = exps_res.data or []
        
        # Fetch all physical tubs
        tubs_res = get_table('tubs').select("*").execute()
        tubs = tubs_res.data or []
        
        # Optimization: Identify tubs that have any sensor readings to determine status
        try:
            sensor_check_res = get_table('sensor_data').select("tub_id").execute()
            tubs_with_data = set(row["tub_id"] for row in (sensor_check_res.data or []))
        except Exception:
            tubs_with_data = set()
        
        formatted_exps = []
        for exp in experiments:
            # Filter tubs belonging to this experiment
            exp_tubs = [t for t in tubs if t.get("experiment_id") == exp["id"]]
            
            buckets = []
            for idx, tub in enumerate(exp_tubs):
                buckets.append({
                    "id": tub["id"],
                    "bucket_number": tub.get("label", f"Bucket {idx+1}"),
                    "soil_type": tub.get("soil_type"),
                    "plant_type": tub.get("plant_name"),
                    "status": "Data Collected" if tub["id"] in tubs_with_data else "Waiting"
                })
            
            formatted_exps.append({
                "id": exp["id"],
                "experiment_number": f"EXP-{exp['id']}",
                "title": exp.get("title"),
                "num_buckets": len(exp_tubs),
                "description": exp.get("description"),
                "status": exp.get("status", "planned"),
                "started_at": exp.get("started_at"),
                "ended_at": exp.get("ended_at"),
                "buckets": buckets
            })
            
        return jsonify({"success": True, "experiments": formatted_exps}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/tubs", methods=["GET"])
def get_tubs():
    """Returns a list of all physical tubs and whether they are currently assigned to an active experiment."""
    try:
        tubs_res = get_table('tubs').select("*").execute()
        tubs = tubs_res.data or []
        
        # Identify experiments that are NOT completed
        exps_res = get_table('experiments').select("id, status").execute()
        active_exp_ids = [e["id"] for e in (exps_res.data or []) if e.get("status") != "completed"]
        
        formatted_tubs = []
        for t in tubs:
            exp_id = t.get("experiment_id")
            # A tub is busy if it has an experiment_id that is still active
            is_busy = exp_id is not None and exp_id in active_exp_ids
            
            formatted_tubs.append({
                "id": t["id"],
                "label": t.get("label"),
                "is_busy": is_busy,
                "current_exp_id": exp_id if is_busy else None
            })
        return jsonify({"success": True, "tubs": formatted_tubs}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/health-check", methods=["GET"])
def health_check():
    """Verifies backend and database connectivity for the frontend"""
    try:
        get_table('experiments')
        return jsonify({
            "success": True, 
            "status": "connected",
            "message": "Backend and Database are reachable"
        }), 200
    except Exception as e:
        return jsonify({
            "success": True, 
            "status": "partial_error",
            "message": f"Server is up but DB check failed: {str(e)}"
        }), 200

@app.route("/api/experiments/<int:exp_id>", methods=["PATCH"])
def update_experiment(exp_id):
    """Updates status and dates for an experiment. Frees tubs if experiment is marked completed."""
    data = request.json
    try:
        update_payload = {k: v for k, v in data.items() if k in ["status", "started_at", "ended_at"]}
        if not update_payload:
            return jsonify({"success": False, "message": "Nothing to update"}), 400

        res = get_table('experiments').update(update_payload).eq("id", exp_id).execute()

        if not res.data:
            return jsonify({"success": False, "message": "Experiment not found"}), 404

        # If experiment is completed, release all associated tubs
        if data.get("status") == "completed":
            get_table('tubs').update({"experiment_id": None}).eq("experiment_id", exp_id).execute()

        return jsonify({"success": True, "experiment": res.data[0]}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/experiments/<int:id>", methods=["GET"])
def get_experiment(id):
    """Returns detailed information for a single experiment including latest sensor readings for each bucket."""
    try:
        exp_res = get_table('experiments').select("*").eq("id", id).execute()
        if not exp_res.data:
            return jsonify({"success": False, "message": "Experiment not found"}), 404
        exp = exp_res.data[0]
        
        tubs_res = get_table('tubs').select("*").eq("experiment_id", id).execute()
        tubs = tubs_res.data or []
        
        buckets = []
        for idx, tub in enumerate(tubs):
            # Fetch latest sensor reading for this specific tub
            sensor_res = get_table('sensor_data').select("*").eq("tub_id", tub["id"]).order("created_at", descending=True).limit(1).execute()
            
            sensor_data = None
            if sensor_res.data:
                sd = sensor_res.data[0]
                sensor_data = {
                    "id": sd.get("id"),
                    "health": sd.get("health"),
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
                
            buckets.append({
                "id": tub["id"],
                "bucket_number": tub.get("label", f"Bucket {idx+1}"),
                "soil_type": tub.get("soil_type"),
                "plant_type": tub.get("plant_name"),
                "status": "Data Collected" if sensor_data else "Waiting",
                "sensor_data": sensor_data
            })
            
        return jsonify({
            "success": True, 
            "experiment": {
                **exp,
                "experiment_number": f"EXP-{exp['id']}",
                "buckets": buckets
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/experiments/<int:experiment_id>/buckets", methods=["POST"])
def create_bucket(experiment_id):
    """Assigns a physical tub to an experiment and sets its initial plant/soil parameters."""
    data = request.json
    tub_id = data.get("tub_id")
    
    if not tub_id:
        return jsonify({"success": False, "message": "Physical Tub ID is required"}), 400

    try:
        res = get_table('tubs').update({
            "experiment_id": experiment_id,
            "soil_type": data.get("soil_type"),
            "plant_name": data.get("plant_type"),
            "growth_rate": "rapid" 
        }).eq("id", tub_id).execute()
        
        if not res.data:
            return jsonify({"success": False, "message": "Failed to update tub"}), 400
            
        return jsonify({
            "success": True, 
            "bucket": {
                "id": res.data[0]["id"],
                "experiment_id": experiment_id,
                "bucket_number": res.data[0].get("label"),
                "status": "Waiting"
            }
        }), 201
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/buckets/<int:id>/start_collection", methods=["POST"])
def start_collection(id):
    """
    Triggers the ESP32 sensor for a specific tub by updating `sensor_status`.
    Returns the current server time to help the frontend filter for 'new' data.
    """
    try:
        import requests
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        payload = {"tub_id": id, "is_locked": True, "is_active": True}
        
        # Patch sensor_status to notify ESP32 to start sensing
        url = f"{SUPABASE_URL}/rest/v1/sensor_status?sensor_id=eq.esp32-001"
        requests.patch(url, headers=headers, json=payload)
             
        from datetime import datetime, timezone
        return jsonify({"success": True, "start_time": datetime.now(timezone.utc).isoformat()}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

@app.route("/api/buckets/<int:id>/latest_data", methods=["GET"])
def get_latest_bucket_data(id):
    """Polls for the latest sensor data for a tub, optionally since a given timestamp."""
    since = request.args.get("since", "").replace(" ", "+")
    try:
        query = get_table('sensor_data').select("*").eq("tub_id", id).order("created_at", descending=True).limit(1)
        if since:
            query = query.gte("created_at", since)
            
        sensor_res = query.execute()
        
        if sensor_res.data:
            sd = sensor_res.data[0]
            # Unlock sensor after successful data retrieval
            try:
                supabase.table("sensor_status").update({"is_locked": False}).eq("sensor_id", "esp32-001").execute()
            except:
                pass

            return jsonify({
                "success": True, 
                "has_data": True, 
                "raw": sd
            }), 200
        else:
            return jsonify({"success": True, "has_data": False}), 200
            
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 400

if __name__ == "__main__":
    # Run server on all interfaces for network accessibility
    app.run(host='0.0.0.0', debug=True, port=5000)
