import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { supabase } from "../supabaseClient";

/**
 * NutriTech Experiments Management Page
 * ------------------------------------
 * This page handles the creation of experiments, assignment of physical tubs
 * to experiment buckets, triggering of sensor readings, and viewing results.
 */

// API Configuration - attempts to read from env or defaults to localhost
const rawUrl = import.meta.env.VITE_API_URL;
const API_URL = (rawUrl && rawUrl.trim() !== "") 
  ? rawUrl 
  : `${window.location.protocol}//127.0.0.1:5000/api`;

/**
 * Pings the backend to check if it's reachable
 */
async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_URL}/health-check`, { 
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(5000) 
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    console.error("[DEBUG] Health check failed:", err.message);
    return false;
  }
}

// Visual configuration for different experiment statuses
const STATUS_CFG = {
  planned:   { label: "Planned",   color: "bg-gray-500/20 text-gray-300 border-gray-500/30",     icon: "schedule" },
  active:    { label: "Active",    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: "play_circle" },
  paused:    { label: "Paused",    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: "pause_circle" },
  completed: { label: "Completed", color: "bg-blue-500/20 text-blue-400 border-blue-500/30",      icon: "check_circle" },
};

/**
 * Renders a stylized badge based on experiment status
 */
function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.planned;
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 shrink-0 ${cfg.color}`}>
      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

/**
 * Single metric display card for sensor readings
 */
function SensorCard({ label, value, unit, icon }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider font-semibold">
        <span className="material-symbols-outlined text-sm">{icon}</span>
        {label}
      </div>
      <div className="text-xl font-bold text-white">
        {value !== undefined && value !== null ? Number(value).toFixed(2) : "—"}
        <span className="text-sm text-gray-400 font-normal ml-1">{unit}</span>
      </div>
    </div>
  );
}

/**
 * Maps raw backend/database keys to frontend display keys
 */
function parseSensorData(sd) {
  return {
    ph: sd.soil_ph, moisture: sd.soil_moisture, temperature: sd.soil_temp,
    nitrogen: sd.nitrogen, phosphorus: sd.phosphorus, potassium: sd.potassium,
    ec: sd.soil_ec, waterPh: sd.water_ph, airTemp: sd.air_temp,
    airHumidity: sd.air_humidity, createdAt: sd.created_at,
    id: sd.id, health: sd.health,
  };
}

/**
 * Formats a date string for display
 */
function fmtDate(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

// Tailwind design tokens for reuse
const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all";
const selectCls = "w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-all";

// --------------------------------------------------------------------------------
// TAB 1: NEW EXPERIMENT WIZARD
// --------------------------------------------------------------------------------
const NewExperimentTab = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [experiment, setExperiment] = useState(null);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(1);
  const [expData, setExpData] = useState({
    experiment_number: "", title: "", num_buckets: 1, description: "",
    status: "planned", started_at: "", ended_at: "",
  });
  const [bucketData, setBucketData] = useState({ tub_id: "", soil_type: "", plant_type: "" });
  const [availableTubs, setAvailableTubs] = useState([]);
  const [selectedTubsInSteps, setSelectedTubsInSteps] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setExp = (k, v) => setExpData(p => ({ ...p, [k]: v }));
  const setBkt = (k, v) => setBucketData(p => ({ ...p, [k]: v }));

  // Load available physical tubs when reaching Step 2
  useEffect(() => {
    if (step === 2) {
      const fetchTubs = async () => {
        try {
          const [tubsRes, expsRes] = await Promise.all([
            fetch(`${API_URL}/tubs`),
            fetch(`${API_URL}/experiments`)
          ]);
          const tubsData = await tubsRes.json();
          const expsData = await expsRes.json();
          
          if (tubsData.success) {
            const enrichedTubs = tubsData.tubs.map(t => {
              if (t.is_busy && expsData.success) {
                const exp = expsData.experiments.find(e => e.id === t.current_exp_id);
                return { ...t, exp_title: exp?.title || "Unknown Experiment" };
              }
              return t;
            });
            setAvailableTubs(enrichedTubs);
          }
        } catch (err) { console.error("Tubs fetch error:", err); }
      };
      fetchTubs();
    }
  }, [step]);

  /**
   * Submits initial experiment metadata to create the experiment record
   */
  const handleExpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const payload = {
        ...expData,
        started_at: expData.status !== "planned" ? (expData.started_at || null) : null,
        ended_at:   expData.status === "completed" ? (expData.ended_at || null) : null,
      };
      const res = await fetch(`${API_URL}/experiments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setExperiment(data.experiment);
      setStep(2);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  /**
   * Submits bucket configuration (associates a physical tub with the current experiment)
   */
  const handleBucketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const totalBuckets = experiment.num_buckets;
      const res = await fetch(`${API_URL}/experiments/${experiment.id}/buckets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bucketData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      
      setSelectedTubsInSteps(prev => [...prev, bucketData.tub_id]);
      if (currentBucketIndex < totalBuckets) {
        setCurrentBucketIndex(p => p + 1);
        setBucketData({ tub_id: "", soil_type: "", plant_type: "" });
      } else {
        setStep(3);
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  if (step === 3) return (
    <div className="text-center py-16 px-4">
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500">
          <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
        </div>
      </div>
      <h3 className="text-3xl font-bold mb-3 text-white">Experiment Ready</h3>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">All {experiment.num_buckets} buckets configured.</p>
      <button onClick={onSuccess} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all">
        View & Manage
      </button>
    </div>
  );

  const totalBuckets = experiment?.num_buckets ?? expData.num_buckets;
  const progress = step === 1 ? 0 : Math.round(((currentBucketIndex - 1) / totalBuckets) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4">
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>{error}
        </div>
      )}

      {/* -- Step 1: Experiment General Info -- */}
      {step === 1 && (
        <form onSubmit={handleExpSubmit} className="space-y-5">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-lg">1</div>
              <h2 className="text-2xl font-bold text-white">Experiment Setup</h2>
            </div>
            <p className="text-gray-400 text-sm ml-14">Define your experiment parameters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Experiment Number</label>
            <input required type="text" value={expData.experiment_number}
              onChange={e => setExp("experiment_number", e.target.value)}
              className={inputCls} placeholder="e.g. EXP-001" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input required type="text" value={expData.title}
                onChange={e => setExp("title", e.target.value)}
                className={inputCls} placeholder="Tomato Growth" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Number of Buckets</label>
              <input required type="number" min="1" max="20" value={expData.num_buckets}
                onChange={e => setExp("num_buckets", parseInt(e.target.value) || 1)}
                className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select value={expData.status} onChange={e => {
                const newStatus = e.target.value;
                const today = new Date().toISOString().split("T")[0];
                setExpData(p => ({
                  ...p, 
                  status: newStatus,
                  started_at: newStatus !== "planned" && !p.started_at ? today : p.started_at,
                  ended_at: newStatus === "completed" && !p.ended_at ? today : p.ended_at
                }));
              }} className={selectCls}>
              <option value="planned">Planned</option>
              <option value="active">Active (Started)</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
            <textarea value={expData.description} onChange={e => setExp("description", e.target.value)}
              className={`${inputCls} h-24 resize-none`} placeholder="Brief description..." />
          </div>

          <button disabled={loading} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all">
            {loading ? "Setting up..." : "Continue to Bucket Setup →"}
          </button>
        </form>
      )}

      {/* -- Step 2: Individual Bucket (Tub) Setup -- */}
      {step === 2 && (
        <form onSubmit={handleBucketSubmit} className="space-y-5">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-lg">2</div>
              <h2 className="text-2xl font-bold text-white">Configure Buckets</h2>
            </div>
            <p className="text-gray-400 text-sm ml-14">
              Set up bucket {currentBucketIndex} of {totalBuckets}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Progress</span>
              <span className="text-emerald-400 font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Select Physical Tub</label>
            <select 
              required
              value={bucketData.tub_id}
              onChange={e => setBkt("tub_id", e.target.value)}
              className={selectCls}
            >
              <option value="">-- Choose a Tub --</option>
              {availableTubs.map(tub => {
                const isUsedInForm = selectedTubsInSteps.includes(tub.id);
                const isDisabled = tub.is_busy || isUsedInForm;
                return (
                  <option key={tub.id} value={tub.id} disabled={isDisabled}>
                    {tub.label} {tub.is_busy ? `(Active: ${tub.exp_title || tub.current_exp_id})` : isUsedInForm ? "(Already selected)" : "(Available)"}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Soil Type</label>
            <input required type="text" value={bucketData.soil_type}
              onChange={e => setBkt("soil_type", e.target.value)}
              className={inputCls} placeholder="e.g. Loam, Sandy, Clay" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Plant Type</label>
            <input required type="text" value={bucketData.plant_type}
              onChange={e => setBkt("plant_type", e.target.value)}
              className={inputCls} placeholder="e.g. Tomato, Lettuce, Basil" />
          </div>

          <button disabled={loading} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all">
            {loading ? "Saving..." : currentBucketIndex < totalBuckets ? "Save & Next Bucket →" : "Complete Setup ✓"}
          </button>
        </form>
      )}
    </div>
  );
};

// --------------------------------------------------------------------------------
// TAB 2: ACTIVE EXPERIMENTS LIST
// --------------------------------------------------------------------------------
const ExperimentsListTab = () => {
  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Fetches all experiments from the backend API
   */
  const fetchExperiments = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/experiments`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      if (data.success) setExperiments(data.experiments);
      else throw new Error(data.message);
    } catch (err) {
      setError(`Could not load experiments. Backend might be offline.`);
    }
    setLoading(false);
  };

  useEffect(() => { fetchExperiments(); }, []);

  if (selectedExp) {
    return <ExperimentDetails experiment={selectedExp} onBack={() => { setSelectedExp(null); fetchExperiments(); }} />;
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading experiments...</div>;

  if (error) return (
    <div className="text-center py-16 space-y-4">
      <span className="material-symbols-outlined text-5xl text-red-500/50 block">cloud_off</span>
      <p className="text-red-400 text-sm max-w-md mx-auto">{error}</p>
      <button onClick={fetchExperiments} className="px-5 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 text-sm hover:bg-white/10 transition-colors">Retry</button>
    </div>
  );

  return (
    <div className="space-y-4">
      {experiments.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-gray-600 mb-4 block">science</span>
          <p className="text-gray-400">No experiments found.</p>
        </div>
      ) : (
        experiments.map((exp) => (
          <div key={exp.id} onClick={() => setSelectedExp(exp)}
            className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-emerald-500/50 cursor-pointer transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1">{exp.experiment_number}: {exp.title}</h3>
                <p className="text-sm text-gray-400">{exp.description || "No description"}</p>
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">storage</span>{exp.num_buckets} Buckets</span>
                  {exp.started_at && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span>Started: {fmtDate(exp.started_at)}</span>}
                </div>
              </div>
              <StatusBadge status={exp.status} />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// --------------------------------------------------------------------------------
// EXPERIMENT DETAILS & CONTROL VIEW
// --------------------------------------------------------------------------------
const ExperimentDetails = ({ experiment: initExp, onBack }) => {
  const [experiment, setExperiment] = useState(initExp);
  const [buckets, setBuckets] = useState(initExp.buckets || []);
  const [loading, setLoading] = useState(false);
  const [activeBucketId, setActiveBucketId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedBucket, setExpandedBucket] = useState(null);
  const [statusDraft, setStatusDraft] = useState({
    status: initExp.status || "planned",
    started_at: initExp.started_at ? initExp.started_at.split("T")[0] : "",
    ended_at: initExp.ended_at ? initExp.ended_at.split("T")[0] : "",
  });
  const [savingStatus, setSavingStatus] = useState(false);
  const [healthInputs, setHealthInputs] = useState({});
  const [updatingHealth, setUpdatingHealth] = useState(null);
  const pollTimers = useRef({});
  const healthPollRef = useRef(null);

  /**
   * Re-fetches the latest sensor_data row for every bucket from Supabase
   * and refreshes only the health + sensor_data fields in local state.
   * Called on mount AND every 8 seconds to keep health values in sync.
   */
  const refreshBucketHealth = async (bucketsToRefresh) => {
    if (!supabase || !bucketsToRefresh?.length) return;
    const refreshed = await Promise.all(
      bucketsToRefresh.map(async (bucket) => {
        const { data: sdRows } = await supabase
          .from("sensor_data")
          .select("*")
          .eq("tub_id", bucket.id)
          .order("created_at", { ascending: false })
          .limit(1);
        if (sdRows && sdRows.length > 0) {
          return { ...bucket, status: "Data Collected", sensor_data: parseSensorData(sdRows[0]) };
        }
        return bucket;
      })
    );
    setBuckets(refreshed);
    return refreshed; // return so callers can inspect the fresh values
  };

  /**
   * Fetch full experiment details and the latest sensor reading per tub.
   * Also starts an 8-second polling interval that keeps health values current.
   */
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/experiments/${initExp.id}`);
        const data = await res.json();
        if (data.success) {
          setExperiment(data.experiment);
          const fetchedBuckets = data.experiment.buckets || [];

          // Initial health fetch
          if (supabase) {
            await refreshBucketHealth(fetchedBuckets);
          } else {
            setBuckets(fetchedBuckets);
          }

          setStatusDraft({
            status: data.experiment.status,
            started_at: data.experiment.started_at ? data.experiment.started_at.split("T")[0] : "",
            ended_at: data.experiment.ended_at ? data.experiment.ended_at.split("T")[0] : "",
          });
        }
      } catch (err) { console.error("Detail fetch error:", err); }
      setLoading(false);
    };

    fetchDetails();

    // Poll every 8 seconds to refresh health values across all buckets
    healthPollRef.current = setInterval(() => {
      // Use functional updater to read latest buckets without stale closure
      setBuckets(prev => {
        refreshBucketHealth(prev); // fire-and-forget; setBuckets inside will re-render
        return prev; // return prev so React doesn't re-render for THIS call
      });
    }, 8000);

    return () => {
      if (healthPollRef.current) clearInterval(healthPollRef.current);
    };
  }, [initExp.id]);

  /** Updates experiment status (Active, Paused, Completed) */
  const saveStatus = async () => {
    setSavingStatus(true);
    try {
      const payload = {
        status: statusDraft.status,
        started_at: statusDraft.status !== "planned" ? (statusDraft.started_at || null) : null,
        ended_at:   statusDraft.status === "completed" ? (statusDraft.ended_at || null) : null,
      };
      const res = await fetch(`${API_URL}/experiments/${experiment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setExperiment(p => ({ ...p, ...payload }));
    } catch (err) { setErrorMsg(`Failed to update status: ${err.message}`); }
    setSavingStatus(false);
  };

  /**
   * Triggers sensor collection for a tub.
   * GATE 1 (global): Scans ALL buckets — if any has health=0, blocks sensing on
   *   every tub and names the offending bucket so the user knows where to go.
   * GATE 2 (self): Double-checks the clicked bucket's own health.
   */
  const startSensorCollection = async (bucket) => {
    setErrorMsg("");
    if (processing) { setErrorMsg("Sensor is already in use."); return; }
    if (!supabase) { setErrorMsg("Supabase client is not initialized."); return; }

    // GATE 1 — Re-fetch latest health for ALL buckets right now, then scan
    const latestBuckets = await refreshBucketHealth(
      // We need the current buckets list; use the state snap captured by closure
      buckets
    );
    const allBuckets = latestBuckets || buckets;

    const blockingBucket = allBuckets.find(
      (b) => b.sensor_data && (b.sensor_data.health === 0 || b.sensor_data.health == null)
    );

    if (blockingBucket) {
      const isCurrentBucket = blockingBucket.id === bucket.id;
      const bucketLabel = blockingBucket.bucket_number || `Tub #${blockingBucket.id}`;
      setErrorMsg(
        isCurrentBucket
          ? `⚠ Health score is missing for this bucket (${bucketLabel}). Please enter it below before sensing.`
          : `⚠ Cannot sense — ${bucketLabel} still has a missing health score. Please fill it in first, then come back here.`
      );
      setExpandedBucket(blockingBucket.id); // auto-expand the offending bucket
      return;
    }
    
    setProcessing(true); setActiveBucketId(bucket.id);
    const startTime = new Date().toISOString();
    
    // Tell ESP32 to start via sensor_status table
    const { error: patchError } = await supabase
      .from("sensor_status")
      .update({ tub_id: bucket.id, is_locked: true, is_active: true }) 
      .eq("sensor_id", "esp32-001");
      
    if (patchError) {
      setErrorMsg("Failed to reach sensor.");
      setProcessing(false); setActiveBucketId(null); return;
    }

    // Poll for the incoming reading
    const pollInterval = setInterval(async () => {
      const { data: sdArr } = await supabase
        .from("sensor_data").select("*")
        .eq("tub_id", bucket.id) 
        .gte("created_at", startTime)
        .order("created_at", { ascending: false }).limit(1);
        
      if (sdArr && sdArr.length > 0) {
        clearInterval(pollInterval); delete pollTimers.current[bucket.id];
        const sd = sdArr[0];
        setBuckets(prev => prev.map(b =>
          b.id === bucket.id ? { ...b, status: "Data Collected", sensor_data: parseSensorData(sd) } : b
        ));
        // Auto-expand to show fresh data and prompt for health entry
        setExpandedBucket(bucket.id);
        setProcessing(false); setActiveBucketId(null);
        // Release lock
        await supabase.from("sensor_status").update({ is_locked: false }).eq("sensor_id", "esp32-001");
      }
    }, 3000);
    
    pollTimers.current[bucket.id] = pollInterval;
    setTimeout(() => {
      if (pollTimers.current[bucket.id]) {
        clearInterval(pollTimers.current[bucket.id]);
        setProcessing(false); setActiveBucketId(null);
        setErrorMsg("Sensor timed out.");
      }
    }, 5 * 60 * 1000);
  };

  /**
   * Saves a health score (0.01 - 1.00) to the sensor_data row via the backend.
   * After a successful PATCH, re-fetches the row from Supabase to confirm the
   * health value is genuinely > 0 in the DB before unlocking sensing.
   */
  const submitHealth = async (bucketId) => {
    const score = healthInputs[bucketId];
    if (score === undefined || score === "") {
      setErrorMsg("Please enter a health score.");
      return;
    }
    const val = parseFloat(score);
    if (isNaN(val) || val <= 0 || val > 1) {
      setErrorMsg("Health score must be between 0.01 and 1.00.");
      return;
    }

    setUpdatingHealth(bucketId);
    setErrorMsg("");

    try {
      // 1. Send PATCH to backend
      const res = await fetch(`${API_URL}/sensor_data/${bucketId}/health`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ health: val }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // 2. Re-fetch from Supabase to confirm the DB value is actually > 0
      //    (guards against any silent failure or network inconsistency)
      const { data: sdRows, error: fetchErr } = await supabase
        .from("sensor_data")
        .select("id, health")
        .eq("tub_id", bucketId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchErr) throw new Error(`DB re-check failed: ${fetchErr.message}`);

      const confirmedHealth = sdRows?.[0]?.health ?? 0;

      if (!confirmedHealth || confirmedHealth <= 0) {
        // Health in DB is STILL 0 — update did not stick
        setErrorMsg(
          "Health score was submitted but the database still shows 0. " +
          "Please try again or refresh the page."
        );
        setUpdatingHealth(null);
        return;
      }

      // 3. DB confirmed > 0 — safe to unlock sensing
      setBuckets(prev =>
        prev.map(b =>
          b.id === bucketId
            ? { ...b, sensor_data: { ...b.sensor_data, health: confirmedHealth } }
            : b
        )
      );
      // Clear the input field
      setHealthInputs(prev => { const n = { ...prev }; delete n[bucketId]; return n; });

    } catch (err) {
      setErrorMsg(`Failed to save score: ${err.message}`);
    }

    setUpdatingHealth(null);
  };

  const isActive = experiment.status === "active";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg text-gray-400">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{experiment.experiment_number}: {experiment.title}</h2>
          <p className="text-sm text-gray-400">{experiment.description || "No description provided."}</p>
        </div>
        <StatusBadge status={experiment.status} />
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined">error</span> {errorMsg}
          <button onClick={() => setErrorMsg("")} className="ml-auto text-red-400/50 hover:text-red-400">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Action Panel */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {experiment.status === "planned" && (
            <button onClick={() => {
              statusDraft.status = "active";
              statusDraft.started_at = new Date().toISOString().split("T")[0];
              saveStatus();
            }} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">play_arrow</span> Start Experiment
            </button>
          )}
          {experiment.status === "active" && (
            <>
              <button onClick={() => { statusDraft.status = "paused"; saveStatus(); }} 
                className="px-5 py-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/50 font-semibold rounded-lg hover:bg-amber-500/30">
                <span className="material-symbols-outlined text-sm">pause</span> Pause
              </button>
              <button onClick={() => { 
                statusDraft.status = "completed"; 
                statusDraft.ended_at = new Date().toISOString().split("T")[0];
                saveStatus(); 
              }} 
                className="px-5 py-2.5 bg-blue-500/20 text-blue-400 border border-blue-500/50 font-semibold rounded-lg hover:bg-blue-500/30">
                <span className="material-symbols-outlined text-sm">done_all</span> Complete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bucket Cards */}
      <div className="space-y-4">
        {buckets.map((b) => {
          const isSensing = activeBucketId === b.id;
          const isCollected = b.status === "Data Collected";
          const isExpanded = expandedBucket === b.id;
          const healthMissing = isCollected && (b.sensor_data?.health == null || b.sensor_data?.health === 0);
          const canSense = isActive && !processing;

          return (
            <div key={b.id} className={`rounded-xl border transition-all ${
              isSensing ? "border-emerald-500 bg-emerald-500/10" : 
              healthMissing ? "border-amber-500/40 bg-amber-500/5" :
              isExpanded ? "border-emerald-500/30 bg-white/5" : 
              "border-white/10 bg-white/5"
            }`}>
              {isSensing && <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-t-xl animate-pulse" />}
              
              <div className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                    {b.bucket_number}
                    {isCollected && !healthMissing && <span className="material-symbols-outlined text-green-500">check_circle</span>}
                    {healthMissing && <span className="material-symbols-outlined text-amber-400 text-base">warning</span>}
                  </h3>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500 uppercase tracking-widest">
                    <span>{b.plant_type}</span> | <span>{b.soil_type}</span>
                  </div>
                  {healthMissing && (
                    <p className="text-xs text-amber-400 mt-2">⚠ Health score needed for last reading</p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isActive ? (
                    <div className="flex items-center gap-2">
                      {/* 1. Sensing State */}
                      {isSensing ? (
                        <div className="flex items-center gap-2 text-emerald-400 font-medium animate-pulse">
                          <span className="material-symbols-outlined animate-spin text-xl">refresh</span> Sensing...
                        </div>
                      ) : (
                        <>
                          {/* 2. Expand/Hide Data Toggle */}
                          {isCollected && (
                            <button onClick={() => setExpandedBucket(isExpanded ? null : b.id)}
                              className={`px-5 py-2.5 font-medium rounded-lg flex items-center gap-2 transition-all ${
                                isExpanded 
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
                                  : healthMissing
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse"
                                    : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                              }`}>
                              <span className="material-symbols-outlined text-lg">{isExpanded ? "expand_less" : "visibility"}</span>
                              {isExpanded ? "Hide" : healthMissing ? "Enter Health" : "View Data"}
                            </button>
                          )}

                          {/* 3. Sense Now - ALWAYS visible, will block on click if health missing */}
                          <button onClick={() => startSensorCollection(b)} disabled={!canSense}
                            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50">
                            <span className="material-symbols-outlined text-lg">sensors</span> Sense Now
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-600 italic">Experiment not active</span>
                  )}
                </div>
              </div>

              {/* Expanded Data Panel */}
              {isCollected && isExpanded && (
                <div className="px-5 pb-5 border-t border-white/10 space-y-5">

                  {/* Timestamp + row ID */}
                  <div className="pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="material-symbols-outlined text-sm text-emerald-400">schedule</span>
                      {b.sensor_data?.createdAt
                        ? new Date(b.sensor_data.createdAt).toLocaleString()
                        : "Unknown time"}
                    </div>
                    <span className="text-[10px] text-gray-600 font-mono">ID #{b.sensor_data?.id}</span>
                  </div>

                  {/* ── Soil Readings ── */}
                  <div>
                    <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">grass</span> Soil
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <MiniReading label="pH"        value={b.sensor_data?.ph}          unit=""      icon="science"     color="text-lime-400" />
                      <MiniReading label="Moisture"  value={b.sensor_data?.moisture}    unit="%"     icon="water_drop"  color="text-blue-400" />
                      <MiniReading label="Temp"      value={b.sensor_data?.temperature} unit="°C"   icon="thermostat"  color="text-orange-400" />
                      <MiniReading label="EC"        value={b.sensor_data?.ec}          unit=" dS/m" icon="electrical_services" color="text-yellow-400" />
                    </div>
                  </div>

                  {/* ── Nutrients ── */}
                  <div>
                    <p className="text-[10px] text-purple-400 uppercase font-bold tracking-widest mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">biotech</span> Nutrients (mg/kg)
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniReading label="Nitrogen"   value={b.sensor_data?.nitrogen}   unit=" mg/kg" icon="nitrogen"  color="text-purple-300" />
                      <MiniReading label="Phosphorus" value={b.sensor_data?.phosphorus} unit=" mg/kg" icon="opacity"   color="text-pink-300" />
                      <MiniReading label="Potassium"  value={b.sensor_data?.potassium}  unit=" mg/kg" icon="bolt"      color="text-indigo-300" />
                    </div>
                  </div>

                  {/* ── Environment ── */}
                  <div>
                    <p className="text-[10px] text-sky-400 uppercase font-bold tracking-widest mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">cloud</span> Environment
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <MiniReading label="Water pH"     value={b.sensor_data?.waterPh}    unit=""    icon="water"      color="text-cyan-400" />
                      <MiniReading label="Air Temp"     value={b.sensor_data?.airTemp}    unit="°C"  icon="device_thermostat" color="text-rose-300" />
                      <MiniReading label="Air Humidity" value={b.sensor_data?.airHumidity} unit="%" icon="humidity_percentage" color="text-sky-300" />
                    </div>
                  </div>

                  {/* Health Score Section */}
                  <div className={`pt-4 border-t space-y-3 ${
                    healthMissing
                      ? "border-amber-500/30 bg-amber-500/5 -mx-5 px-5 pb-4 rounded-b-xl"
                      : "border-white/5"
                  }`}>
                    <label className={`text-[10px] font-bold uppercase tracking-widest block ${
                      healthMissing ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {healthMissing ? "⚠ Health Score Required" : "Plant Health Score"} (0.01 – 1.00)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="e.g. 0.75"
                        value={healthInputs[b.id] ?? (b.sensor_data?.health ? String(b.sensor_data.health) : "")}
                        onChange={(e) => setHealthInputs(p => ({ ...p, [b.id]: e.target.value }))}
                        className={`border rounded-lg px-3 py-2 text-sm w-36 outline-none text-white ${
                          healthMissing
                            ? "bg-amber-900/30 border-amber-500/50 focus:border-amber-400"
                            : "bg-slate-900 border-white/10 focus:border-emerald-500"
                        }`}
                      />
                      <button onClick={() => submitHealth(b.id)} disabled={updatingHealth === b.id}
                        className={`px-4 py-2 text-xs font-bold rounded-lg border disabled:opacity-50 transition-all ${
                          healthMissing
                            ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                            : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/30"
                        }`}>
                        {updatingHealth === b.id
                          ? <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm animate-spin">refresh</span> Verifying…</span>
                          : healthMissing ? "Save & Unlock Sensing" : "Update Score"}
                      </button>
                    </div>
                    {healthMissing && (
                      <p className="text-xs text-amber-300/70">
                        You must save a health score for this reading before you can sense again.
                      </p>
                    )}
                    {!healthMissing && b.sensor_data?.health != null && b.sensor_data?.health !== 0 && (
                      <p className="text-xs text-green-400 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm">check_circle</span>
                        Health recorded: <strong>{b.sensor_data.health}</strong> — sensing is unlocked.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --------------------------------------------------------------------------------
// TAB 3: GLOBAL SENSOR HISTORY
// --------------------------------------------------------------------------------
const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sensor_data")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error) setHistory(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const displayed = filter
    ? history.filter(sd => String(sd.tub_id).includes(filter) || String(sd.sensor_id).includes(filter))
    : history;

  const healthColor = (h) => {
    if (!h || h === 0) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (h >= 0.7)      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (h >= 0.4)      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    return               "bg-red-500/20 text-red-400 border-red-500/30";
  };

  if (loading) return (
    <div className="text-center py-16 text-gray-400 flex flex-col items-center gap-3">
      <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
      Loading history...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg">search</span>
          <input
            type="text"
            placeholder="Filter by tub or sensor ID…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <button onClick={fetchHistory}
          className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors">
          <span className="material-symbols-outlined text-sm">refresh</span> Refresh
        </button>
        <span className="text-xs text-gray-600">{displayed.length} record{displayed.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Cards */}
      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-gray-600 mb-3 block">sensor_occupied</span>
          <p className="text-gray-500">No readings match your filter.</p>
        </div>
      ) : displayed.map((sd) => (
        <div key={sd.id} className="bg-white/[0.03] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all space-y-4">

          {/* Header row */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-lg">sensors</span>
                <span className="font-bold text-white text-sm">Tub {sd.tub_id}</span>
                <span className="text-xs text-gray-500 font-mono bg-white/5 px-2 py-0.5 rounded">#{sd.id}</span>
                {sd.sensor_id && (
                  <span className="text-xs text-gray-500">via <span className="text-gray-400">{sd.sensor_id}</span></span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                <span className="material-symbols-outlined text-xs">schedule</span>
                {new Date(sd.created_at).toLocaleString()}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              !sd.health || sd.health === 0
                ? healthColor(sd.health)
                : healthColor(sd.health)
            }`}>
              {!sd.health || sd.health === 0
                ? "⚠ No Health Score"
                : `Health: ${Number(sd.health).toFixed(2)}`}
            </span>
          </div>

          {/* Soil */}
          <div>
            <p className="text-[10px] text-emerald-500/80 uppercase font-bold tracking-widest mb-2">🌱 Soil</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MiniReading label="pH"       value={sd.soil_ph}       unit=""       icon="science"            color="text-lime-400" />
              <MiniReading label="Moisture" value={sd.soil_moisture} unit="%"      icon="water_drop"         color="text-blue-400" />
              <MiniReading label="Temp"     value={sd.soil_temp}     unit="°C"     icon="thermostat"         color="text-orange-400" />
              <MiniReading label="EC"       value={sd.soil_ec}       unit=" dS/m"  icon="electrical_services" color="text-yellow-400" />
            </div>
          </div>

          {/* Nutrients */}
          <div>
            <p className="text-[10px] text-purple-400/80 uppercase font-bold tracking-widest mb-2">💊 Nutrients (mg/kg)</p>
            <div className="grid grid-cols-3 gap-2">
              <MiniReading label="Nitrogen"   value={sd.nitrogen}   unit=" mg/kg" icon="science"  color="text-purple-300" />
              <MiniReading label="Phosphorus" value={sd.phosphorus} unit=" mg/kg" icon="opacity"  color="text-pink-300" />
              <MiniReading label="Potassium"  value={sd.potassium}  unit=" mg/kg" icon="bolt"     color="text-indigo-300" />
            </div>
          </div>

          {/* Environment */}
          <div>
            <p className="text-[10px] text-sky-400/80 uppercase font-bold tracking-widest mb-2">🌤 Environment</p>
            <div className="grid grid-cols-3 gap-2">
              <MiniReading label="Water pH"   value={sd.water_ph}     unit=""    icon="water"               color="text-cyan-400" />
              <MiniReading label="Air Temp"   value={sd.air_temp}     unit="°C"  icon="device_thermostat"   color="text-rose-300" />
              <MiniReading label="Humidity"   value={sd.air_humidity} unit="%"   icon="humidity_percentage" color="text-sky-300" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// --------------------------------------------------------------------------------
// ROOT COMPONENT
// --------------------------------------------------------------------------------
export default function ExperimentsPage() {
  const [activeTab, setActiveTab] = useState("new");
  const [backendUp, setBackendUp] = useState(true);

  // Periodic health check for backend service
  useEffect(() => {
    const check = async () => setBackendUp(await checkBackendHealth());
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: "new",     label: "New",       icon: "add_circle" },
    { id: "current", label: "Experiments", icon: "science" },
    { id: "history", label: "History",     icon: "history" },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          {!backendUp && (
            <div className="mb-6 bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-center text-red-400 text-sm animate-pulse">
              Backend Service Offline. Please check your server.
            </div>
          )}

          <div className="max-w-5xl mx-auto space-y-8">
            <header>
              <h1 className="text-4xl font-bold">NutriTech Center</h1>
              <p className="text-gray-400 mt-2">Manage experiments and collect plant vitals.</p>
            </header>

            <nav className="flex gap-1 border-b border-white/10">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-6 font-medium flex items-center gap-2 border-b-2 transition-all ${
                    activeTab === tab.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-gray-400 hover:text-white"
                  }`}>
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span> {tab.label}
                </button>
              ))}
            </nav>

            <section className="pb-16">
              {activeTab === "new"     && <NewExperimentTab onSuccess={() => setActiveTab("current")} />}
              {activeTab === "current" && <ExperimentsListTab />}
              {activeTab === "history" && <HistoryTab />}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

// Utility component for compact sensor reading display with icon + colour accent
const MiniReading = ({ label, value, unit, icon, color = "text-gray-300" }) => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 flex flex-col gap-1">
    <div className="flex items-center gap-1 text-[10px] text-gray-500 uppercase font-bold tracking-wider">
      {icon && <span className={`material-symbols-outlined text-xs ${color}`}>{icon}</span>}
      {label}
    </div>
    <div className={`text-sm font-bold ${color}`}>
      {value !== null && value !== undefined && value !== 0
        ? `${Number(value).toFixed(2)}${unit}`
        : <span className="text-gray-600">—</span>}
    </div>
  </div>
);
