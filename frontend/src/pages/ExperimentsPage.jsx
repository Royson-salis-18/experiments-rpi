import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { supabase } from "../supabaseClient";

const API_URL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  planned:   { label: "Planned",   color: "bg-gray-500/20 text-gray-300 border-gray-500/30",     icon: "schedule" },
  active:    { label: "Active",    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: "play_circle" },
  paused:    { label: "Paused",    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",   icon: "pause_circle" },
  completed: { label: "Completed", color: "bg-blue-500/20 text-blue-400 border-blue-500/30",      icon: "check_circle" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.planned;
  return (
    <span className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 shrink-0 ${cfg.color}`}>
      <span className="material-symbols-outlined text-sm">{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─── Sensor Data Card ───────────────────────────────────────────────────────────
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

function parseSensorData(sd) {
  return {
    ph: sd.soil_ph, moisture: sd.soil_moisture, temperature: sd.soil_temp,
    nitrogen: sd.nitrogen, phosphorus: sd.phosphorus, potassium: sd.potassium,
    ec: sd.soil_ec, waterPh: sd.water_ph, airTemp: sd.air_temp,
    airHumidity: sd.air_humidity, createdAt: sd.created_at,
  };
}

function fmtDate(d) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString(); } catch { return d; }
}

// ─── Shared input style ────────────────────────────────────────────────────────
const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all";
const selectCls = "w-full bg-slate-800 border border-white/10 rounded-xl p-4 text-white focus:border-emerald-500 outline-none transition-all";

// ─── New Experiment Tab ─────────────────────────────────────────────────────────
const NewExperimentTab = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [experiment, setExperiment] = useState(null);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(1);
  const [expData, setExpData] = useState({
    experiment_number: "", title: "", num_buckets: 1, description: "",
    status: "planned", started_at: "", ended_at: "",
  });
  const [bucketData, setBucketData] = useState({ soil_type: "", plant_type: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setExp = (k, v) => setExpData(p => ({ ...p, [k]: v }));
  const setBkt = (k, v) => setBucketData(p => ({ ...p, [k]: v }));

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

  const handleBucketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const totalBuckets = experiment.num_buckets;
      const res = await fetch(`${API_URL}/experiments/${experiment.id}/buckets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket_number: `Bucket ${currentBucketIndex}`, ...bucketData }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      if (currentBucketIndex < totalBuckets) {
        setCurrentBucketIndex(p => p + 1);
        setBucketData({ soil_type: "", plant_type: "" });
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

      {/* ── Step 1: Experiment details ── */}
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

          {expData.status === "active" && (
            <p className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Start date will automatically be set to today.
            </p>
          )}

          {expData.status === "completed" && (
            <p className="text-sm text-blue-400 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span>
              Start and completion dates will automatically be set to today.
            </p>
          )}

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

      {/* ── Step 2: Bucket details ── */}
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
            <label className="block text-sm font-medium text-gray-300 mb-2">Bucket Label</label>
            <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-400">Bucket {currentBucketIndex}</div>
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

// ─── Experiments List Tab ───────────────────────────────────────────────────────
const ExperimentsListTab = () => {
  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchExperiments = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API_URL}/experiments`);
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      if (data.success) setExperiments(data.experiments);
      else throw new Error(data.message || "Unknown error");
    } catch (err) {
      setError(`Could not load experiments: ${err.message}. Make sure the backend is running.`);
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
      <button onClick={fetchExperiments}
        className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-300 text-sm transition-colors">
        Retry
      </button>
    </div>
  );

  if (experiments.length === 0) return (
    <div className="text-center py-16">
      <span className="material-symbols-outlined text-5xl text-gray-600 mb-4 block">science</span>
      <p className="text-gray-400">No experiments yet. Create one to get started!</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {experiments.map((exp) => (
        <div key={exp.id} onClick={() => setSelectedExp(exp)}
          className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-emerald-500/50 cursor-pointer transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1">{exp.experiment_number}: {exp.title}</h3>
              <p className="text-sm text-gray-400">{exp.description || "No description"}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">storage</span>{exp.num_buckets} Buckets
                </span>
                {exp.started_at && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    Started: {fmtDate(exp.started_at)}
                  </span>
                )}
                {exp.ended_at && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">event_available</span>
                    Ended: {fmtDate(exp.ended_at)}
                  </span>
                )}
              </div>
            </div>
            <StatusBadge status={exp.status} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Experiment Details ─────────────────────────────────────────────────────────
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
    started_at: initExp.started_at ? initExp.started_at.split("T")[0].split(" ")[0] : "",
    ended_at: initExp.ended_at ? initExp.ended_at.split("T")[0].split(" ")[0] : "",
  });
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);
  const pollTimers = useRef({});

  // Fetch full details including sensor data on mount
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/experiments/${initExp.id}`);
        const data = await res.json();
        if (data.success) {
          setExperiment(data.experiment);
          setBuckets(data.experiment.buckets || []);
          // Sync draft status
          setStatusDraft({
            status: data.experiment.status || "planned",
            started_at: data.experiment.started_at ? data.experiment.started_at.split("T")[0].split(" ")[0] : "",
            ended_at: data.experiment.ended_at ? data.experiment.ended_at.split("T")[0].split(" ")[0] : "",
          });
        }
      } catch (err) { console.error("Detail fetch error:", err); }
      setLoading(false);
    };
    fetchDetails();
  }, [initExp.id]);

  const isActive = experiment.status === "active";

  const saveStatus = async () => {
    setSavingStatus(true); setStatusSaved(false);
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
      setStatusSaved(true);
      setTimeout(() => setStatusSaved(false), 3000);
    } catch (err) { setErrorMsg(`Failed to update status: ${err.message}`); }
    setSavingStatus(false);
  };

  const startSensorCollection = async (bucket) => {
    setErrorMsg("");
    if (processing) { setErrorMsg("Another bucket is already collecting. Please wait."); return; }
    if (bucket.status === "Data Collected") return;
    if (!supabase) {
      setErrorMsg("Supabase client is not initialized. Check your environment variables.");
      return;
    }
    setProcessing(true); setActiveBucketId(bucket.id);
    const startTime = new Date().toISOString();
    const { error: patchError } = await supabase
      .from("sensor_status")
      .update({ tub_id: bucket.id, is_locked: true, is_active: true })
      .eq("sensor_id", "esp32-001");
    if (patchError) {
      setErrorMsg("Failed to activate sensor. Check Supabase connection.");
      setProcessing(false); setActiveBucketId(null); return;
    }
    const pollInterval = setInterval(async () => {
      const { data: sdArr, error: sdErr } = await supabase
        .from("sensor_data").select("*")
        .eq("tub_id", bucket.id)
        .gte("created_at", startTime)
        .order("created_at", { ascending: false }).limit(1);
      if (sdErr) { console.error("Poll error:", sdErr); return; }
      if (sdArr && sdArr.length > 0) {
        clearInterval(pollInterval); delete pollTimers.current[bucket.id];
        const sd = sdArr[0];
        setBuckets(prev => prev.map(b =>
          b.id === bucket.id ? { ...b, status: "Data Collected", sensor_data: parseSensorData(sd), raw_sd: sd } : b
        ));
        setProcessing(false); setActiveBucketId(null);
        await supabase.from("sensor_status").update({ is_locked: false }).eq("sensor_id", "esp32-001");
      }
    }, 3000);
    pollTimers.current[bucket.id] = pollInterval;
    setTimeout(() => {
      if (pollTimers.current[bucket.id]) {
        clearInterval(pollTimers.current[bucket.id]); delete pollTimers.current[bucket.id];
        setProcessing(false); setActiveBucketId(null);
        setErrorMsg("Sensor timed out. Please try again.");
      }
    }, 5 * 60 * 1000);
  };

  const allCollected = buckets.every(b => b.status === "Data Collected");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-white">{experiment.experiment_number}: {experiment.title}</h2>
          <p className="text-sm text-gray-400 mt-1">{experiment.description || "No description"}</p>
        </div>
        <StatusBadge status={experiment.status} />
        {allCollected && (
          <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span> All Collected
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined">error</span> {errorMsg}
        </div>
      )}

      {/* ── Status Editor ── */}
      <div className="bg-white/3 border border-white/10 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-sm">tune</span> Experiment Actions
        </h3>
        
        <div className="flex flex-wrap items-center gap-3">
          {experiment.status === "planned" && (
            <button onClick={() => {
              setStatusDraft(p => ({ ...p, status: "active", started_at: new Date().toISOString().split("T")[0] }));
              setTimeout(() => document.getElementById("save-status-btn").click(), 50);
            }} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">play_arrow</span> Start Experiment
            </button>
          )}

          {experiment.status === "active" && (
            <button onClick={() => {
              setStatusDraft(p => ({ ...p, status: "paused" }));
              setTimeout(() => document.getElementById("save-status-btn").click(), 50);
            }} className="px-5 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/50 font-semibold rounded-lg transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">pause</span> Pause Experiment
            </button>
          )}

          {experiment.status === "paused" && (
            <button onClick={() => {
              setStatusDraft(p => ({ ...p, status: "active" }));
              setTimeout(() => document.getElementById("save-status-btn").click(), 50);
            }} className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/50 font-semibold rounded-lg transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">play_arrow</span> Resume Experiment
            </button>
          )}

          {(experiment.status === "active" || experiment.status === "paused") && (
            <button onClick={() => {
              setStatusDraft(p => ({ ...p, status: "completed", ended_at: new Date().toISOString().split("T")[0] }));
              setTimeout(() => document.getElementById("save-status-btn").click(), 50);
            }} className="px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 font-semibold rounded-lg transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">done_all</span> Mark Completed
            </button>
          )}
        </div>

        {experiment.status !== "planned" && (
          <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-white/5 text-sm text-gray-400">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="material-symbols-outlined text-sm">play_circle</span>
              Started: <span className="text-white font-medium">{experiment.started_at ? new Date(experiment.started_at).toLocaleDateString() : "Unknown"}</span>
            </div>
            {experiment.status === "completed" && (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Ended: <span className="text-white font-medium">{experiment.ended_at ? new Date(experiment.ended_at).toLocaleDateString() : "Unknown"}</span>
              </div>
            )}
          </div>
        )}

        <div className="hidden">
          <button id="save-status-btn" onClick={saveStatus} disabled={savingStatus}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">save</span>
            {savingStatus ? "Saving..." : "Save Details"}
          </button>
        </div>
      </div>

      {!isActive && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">info</span>
          Sense &amp; Predict are only available for <strong>Active</strong> experiments. Update the status above to enable them.
        </div>
      )}

      {/* ── Bucket Cards ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Tubs</h3>
        {buckets.map((b) => {
          const isActiveB = activeBucketId === b.id;
          const isCollected = b.status === "Data Collected";
          const isOpen = expandedBucket === b.id;
          const sd = b.sensor_data;

          return (
            <div key={b.id} className={`rounded-xl border transition-all ${
              isActiveB ? "border-emerald-500 bg-emerald-500/10" :
              isCollected ? "border-green-500/30 bg-green-500/5" : "border-white/10 bg-white/5"
            }`}>
              {isActiveB && <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-t-xl animate-pulse" />}

              <div className="flex items-center justify-between p-5">
                <div>
                  <h3 className="font-semibold text-lg text-white flex items-center gap-2">
                    {b.bucket_number}
                    {isCollected && <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>}
                  </h3>
                  <div className="flex gap-5 mt-1 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">eco</span>{b.plant_type}</span>
                    <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">landscape</span>{b.soil_type}</span>
                    <span className="text-gray-600 text-xs">ID: {b.id}</span>
                  </div>

                  {/* Quick-view for sensor data when NOT expanded */}
                  {b.sensor_data && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <MiniReading label="Soil pH" value={b.sensor_data.ph} unit="" />
                        <MiniReading label="Moisture" value={b.sensor_data.moisture} unit="%" />
                        <MiniReading label="Nitrogen" value={b.sensor_data.nitrogen} unit="mg/kg" />
                        <MiniReading label="EC" value={b.sensor_data.ec} unit="uS" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Sense button — only active experiments */}
                  {isActive && (
                    isCollected ? (
                      <button onClick={() => setExpandedBucket(isOpen ? null : b.id)}
                        className="px-5 py-2 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">monitoring</span>
                        {isOpen ? "Hide Data" : "View Data"}
                      </button>
                    ) : isActiveB ? (
                      <div className="flex items-center gap-2 text-emerald-400 font-medium px-4 py-2">
                        <span className="material-symbols-outlined animate-spin text-xl">refresh</span> Sensing...
                      </div>
                    ) : (
                      <button onClick={() => startSensorCollection(b)} disabled={processing}
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">sensors</span> Sense Now
                      </button>
                    )
                  )}

                  {/* Predict button — only active experiments */}
                  {isActive && (
                    <button disabled title="Prediction model not yet linked"
                      className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400/50 text-sm font-medium cursor-not-allowed flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">psychology</span> Predict
                    </button>
                  )}

                  {/* Non-active: show status pill */}
                  {!isActive && (
                    <span className="text-xs text-gray-500 italic px-3 py-2">
                      {experiment.status === "completed" ? "Completed" : experiment.status === "planned" ? "Not started" : "Paused"}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded sensor data */}
              {isCollected && isOpen && sd && (
                <div className="px-5 pb-5 pt-1 border-t border-white/10">
                  <div className="text-xs text-gray-500 mb-3">
                    Recorded: {sd.createdAt ? new Date(sd.createdAt).toLocaleString() : "—"}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    <SensorCard label="Soil pH"      value={sd.ph}          unit=""      icon="science" />
                    <SensorCard label="Moisture"     value={sd.moisture}    unit="%"     icon="water_drop" />
                    <SensorCard label="Soil Temp"    value={sd.temperature} unit="°C"    icon="thermostat" />
                    <SensorCard label="Nitrogen"     value={sd.nitrogen}    unit="mg/L"  icon="eco" />
                    <SensorCard label="Phosphorus"   value={sd.phosphorus}  unit="mg/L"  icon="eco" />
                    <SensorCard label="Potassium"    value={sd.potassium}   unit="mg/L"  icon="eco" />
                    <SensorCard label="Soil EC"      value={sd.ec}          unit="dS/m"  icon="electrical_services" />
                    <SensorCard label="Water pH"     value={sd.waterPh}     unit=""      icon="water" />
                    <SensorCard label="Air Temp"     value={sd.airTemp}     unit="°C"    icon="air" />
                    <SensorCard label="Air Humidity" value={sd.airHumidity} unit="%"     icon="humidity_percentage" />
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

// ─── History Tab ────────────────────────────────────────────────────────────────
const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErrorDetails(null);
      if (!supabase) {
        setErrorDetails("Supabase client not initialized. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Render Environment Variables.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("sensor_data").select("*")
        .order("created_at", { ascending: false }).limit(30);
      
      if (error) {
        setErrorDetails(error.message);
      } else {
        setHistory(data || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading history...</div>;
  
  if (errorDetails) return (
    <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
      <div className="flex items-center gap-3 mb-2 font-bold">
        <span className="material-symbols-outlined">warning</span> Query Error
      </div>
      <p className="text-sm">{errorDetails}</p>
      <div className="mt-4 pt-4 border-t border-red-500/20 text-[10px] opacity-50">
        URL: {import.meta.env.VITE_SUPABASE_URL || "NOT SET"}
      </div>
    </div>
  );
  if (history.length === 0) return (
    <div className="text-center py-16">
      <span className="material-symbols-outlined text-5xl text-gray-600 mb-4 block">history</span>
      <p className="text-gray-400">No sensor readings recorded yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">Showing the last {history.length} sensor readings across all tubs.</p>
      {history.map((sd) => (
        <div key={sd.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-white">Tub ID: {sd.tub_id}</span>
              <span className="ml-3 text-xs text-gray-500">{sd.sensor_id}</span>
            </div>
            <span className="text-xs text-gray-500">{new Date(sd.created_at).toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
            {[
              ["pH", sd.soil_ph], ["Moist", sd.soil_moisture != null ? sd.soil_moisture + "%" : null],
              ["Temp", sd.soil_temp != null ? sd.soil_temp + "°C" : null],
              ["N", sd.nitrogen], ["P", sd.phosphorus], ["K", sd.potassium],
              ["EC", sd.soil_ec], ["AirT", sd.air_temp != null ? sd.air_temp + "°C" : null],
              ["Hum", sd.air_humidity != null ? sd.air_humidity + "%" : null]
            ].map(([k, v]) => (
              <div key={k} className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-gray-500">{k}</div>
                <div className="text-white font-medium">
                  {v !== null && v !== undefined ? (typeof v === "number" ? Number(v).toFixed(1) : v) : "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function ExperimentsPage() {
  const [activeTab, setActiveTab] = useState("new");

  const tabs = [
    { id: "new",     label: "New Experiment", icon: "add_circle" },
    { id: "current", label: "Experiments",    icon: "science" },
    { id: "history", label: "Sensor History", icon: "history" },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen">
        <Header />
        <main id="main-scroll" className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Experiment &amp; Predict</h1>
              <p className="text-gray-400 mt-2 text-lg">Create experiments, sense soil data, and generate crop predictions.</p>
            </div>

            <div className="border-b border-white/10">
              <div className="flex gap-1">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-5 font-medium flex items-center gap-2 transition-all border-b-2 text-sm ${
                      activeTab === tab.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-gray-400 hover:text-white"
                    }`}>
                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-16">
              {activeTab === "new"     && <NewExperimentTab onSuccess={() => setActiveTab("current")} />}
              {activeTab === "current" && <ExperimentsListTab />}
              {activeTab === "history" && <HistoryTab />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const MiniReading = ({ label, value, unit }) => (
  <div className="bg-white/3 border border-white/10 rounded-lg p-2">
    <div className="text-[10px] text-gray-500 uppercase">{label}</div>
    <div className="text-xs font-semibold text-white">
      {value !== null && value !== undefined ? `${value}${unit}` : "N/A"}
    </div>
  </div>
);
