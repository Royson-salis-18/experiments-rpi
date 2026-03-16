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

  // Sync state with full backend details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/experiments/${initExp.id}`);
        const data = await res.json();
        if (data.success) {
          setExperiment(data.experiment);
          setBuckets(data.experiment.buckets || []);
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
  }, [initExp.id]);

  /**
   * Updates experiment status (Active, Paused, Completed)
   */
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
   * Triggers the real-time sensor collection flow:
   * 1. Notifies backend to set 'is_locked' = true for the ESP32
   * 2. Starts polling Supabase 'sensor_data' for any reading newer than 'now'
   */
  const startSensorCollection = async (bucket) => {
    setErrorMsg("");
    if (processing) { setErrorMsg("Sensor is already in use."); return; }
    if (!supabase) { setErrorMsg("Supabase client is not initialized."); return; }
    
    setProcessing(true); setActiveBucketId(bucket.id);
    const startTime = new Date().toISOString();
    
    // Step 1: Tell ESP32 to start via sensor_status table
    const { error: patchError } = await supabase
      .from("sensor_status")
      .update({ tub_id: bucket.id, is_locked: true, is_active: true })
      .eq("sensor_id", "esp32-001");
      
    if (patchError) {
      setErrorMsg("Failed to reach sensor.");
      setProcessing(false); setActiveBucketId(null); return;
    }

    // Step 2: Poll for the incoming reading
    const pollInterval = setInterval(async () => {
      const { data: sdArr, error: sdErr } = await supabase
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
        setProcessing(false); setActiveBucketId(null);
        // Release lock
        await supabase.from("sensor_status").update({ is_locked: false }).eq("sensor_id", "esp32-001");
      }
    }, 3000);
    
    pollTimers.current[bucket.id] = pollInterval;
    // Timeout after 5 minutes
    setTimeout(() => {
      if (pollTimers.current[bucket.id]) {
        clearInterval(pollTimers.current[bucket.id]);
        setProcessing(false); setActiveBucketId(null);
        setErrorMsg("Sensor timed out.");
      }
    }, 5 * 60 * 1000);
  };

  /**
   * Manually record a plant health score (0.0 to 1.0) for a specific reading
   */
  const submitHealth = async (bucketId, sensorDataId) => {
    const score = healthInputs[bucketId] || "";
    const val = parseFloat(score);
    if (isNaN(val) || val < 0 || val > 1) {
      setErrorMsg("Health score must be between 0 and 1.");
      return;
    }
    setUpdatingHealth(bucketId);
    try {
      const { error } = await supabase.from("sensor_data").update({ health: val }).eq("id", sensorDataId);
      if (error) throw error;
      setBuckets(prev => prev.map(b => 
        b.id === bucketId ? { ...b, sensor_data: { ...b.sensor_data, health: val } } : b
      ));
    } catch (err) { setErrorMsg(`Failed to save score: ${err.message}`); }
    setUpdatingHealth(null);
  };

  const isActive = experiment.status === "active";

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
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
        </div>
      )}

      {/* -- Action Panel -- */}
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

      {/* -- Individual Bucket Grid -- */}
      <div className="space-y-4">
        {buckets.map((b) => {
          const isSensing = activeBucketId === b.id;
          const isCollected = b.status === "Data Collected";
          const isExpanded = expandedBucket === b.id;
          return (
            <div key={b.id} className={`rounded-xl border transition-all ${isSensing ? "border-emerald-500 bg-emerald-500/10" : isExpanded ? "border-emerald-500/30 bg-white/5" : "border-white/10 bg-white/5"}`}>
              {isSensing && <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-t-xl animate-pulse" />}
              <div className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                    {b.bucket_number} {isCollected && <span className="material-symbols-outlined text-green-500">check_circle</span>}
                  </h3>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500 uppercase tracking-widest">
                    <span>{b.plant_type}</span> | <span>{b.soil_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isActive ? (
                    isSensing ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-medium animate-pulse">
                        <span className="material-symbols-outlined animate-spin text-xl">refresh</span> Sensing...
                      </div>
                    ) : isCollected ? (
                      /* After data is collected, show "View Data" which toggles the expanded panel */
                      <button onClick={() => setExpandedBucket(isExpanded ? null : b.id)}
                        className={`px-5 py-2.5 font-medium rounded-lg flex items-center gap-2 transition-all ${
                          isExpanded 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" 
                            : "bg-white/10 hover:bg-white/15 text-white border border-white/10"
                        }`}>
                        <span className="material-symbols-outlined text-lg">{isExpanded ? "expand_less" : "visibility"}</span>
                        {isExpanded ? "Hide Data" : "View Data"}
                      </button>
                    ) : (
                      /* First time: show "Sense Now" */
                      <button onClick={() => startSensorCollection(b)} disabled={processing}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50">
                        <span className="material-symbols-outlined text-lg">sensors</span> 
                        Sense Now
                      </button>
                    )
                  ) : <span className="text-xs text-gray-600 italic">Experiment not active</span>}
                </div>
              </div>

              {/* Expanded Data View — shown when "View Data" is clicked */}
              {isCollected && isExpanded && (
                <div className="px-5 pb-5 border-t border-white/10 space-y-4">
                  {/* Sensor readings grid */}
                  <div className="pt-4">
                    <p className="text-xs text-gray-500 mb-3">
                      Reading from: {b.sensor_data?.createdAt ? new Date(b.sensor_data.createdAt).toLocaleString() : "Unknown"}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <MiniReading label="Soil pH" value={b.sensor_data?.ph} unit="" />
                      <MiniReading label="Moisture" value={b.sensor_data?.moisture} unit="%" />
                      <MiniReading label="Nitrogen" value={b.sensor_data?.nitrogen} unit="mg/kg" />
                      <MiniReading label="Phosphorus" value={b.sensor_data?.phosphorus} unit="mg/kg" />
                      <MiniReading label="Potassium" value={b.sensor_data?.potassium} unit="mg/kg" />
                      <MiniReading label="Soil Temp" value={b.sensor_data?.temperature} unit="°C" />
                      <MiniReading label="Soil EC" value={b.sensor_data?.ec} unit="dS/m" />
                      <MiniReading label="Plant Health" value={b.sensor_data?.health} unit="" />
                    </div>
                  </div>

                  {/* Health Score Input */}
                  <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                    <input type="number" min="0" max="1" step="0.1" placeholder="Score 0-1"
                      value={healthInputs[b.id] ?? (b.sensor_data?.health || "")}
                      onChange={(e) => setHealthInputs(p => ({ ...p, [b.id]: e.target.value }))}
                      className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-sm w-32 focus:border-emerald-500 outline-none" />
                    <button onClick={() => submitHealth(b.id, b.sensor_data?.id)} disabled={updatingHealth === b.id}
                      className="text-emerald-400 text-xs font-bold hover:underline disabled:opacity-50">
                      {updatingHealth === b.id ? "Saving..." : "Update Health Score"}
                    </button>
                  </div>

                  {/* Sense Again confirmation */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <p className="text-xs text-gray-500">Want to take a fresh reading for this tub?</p>
                    <button 
                      onClick={() => {
                        setExpandedBucket(null);
                        startSensorCollection(b);
                      }} 
                      disabled={processing}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50 transition-all">
                      <span className="material-symbols-outlined text-base">sensors</span> 
                      Sense Now
                    </button>
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

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("sensor_data").select("*").order("created_at", { ascending: false }).limit(20);
      if (!error) setHistory(data || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading history...</div>;

  return (
    <div className="space-y-3">
      {history.map((sd) => (
        <div key={sd.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span className="font-bold text-gray-300 uppercase">Tub {sd.tub_id} ({sd.sensor_id})</span>
            <span>{new Date(sd.created_at).toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="bg-white/5 px-2 py-1 rounded text-xs">pH: {sd.soil_ph}</span>
            <span className="bg-white/5 px-2 py-1 rounded text-xs">Moist: {sd.soil_moisture}%</span>
            <span className="bg-white/5 px-2 py-1 rounded text-xs">Temp: {sd.soil_temp}°C</span>
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

// Utility component for compact data display
const MiniReading = ({ label, value, unit }) => (
  <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-center">
    <div className="text-[10px] text-gray-500 uppercase font-bold">{label}</div>
    <div className="text-xs font-semibold text-white">
      {value !== null && value !== undefined ? `${value}${unit}` : "—"}
    </div>
  </div>
);
