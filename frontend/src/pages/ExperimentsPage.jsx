import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import VirtualKeyboard from "../components/VirtualKeyboard";
import { supabase } from "../supabaseClient";

const API_URL = "http://localhost:5000/api";

// ─── Sensor Data Card ──────────────────────────────────────────────────────────
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
    ph: sd.soil_ph,
    moisture: sd.soil_moisture,
    temperature: sd.soil_temp,
    nitrogen: sd.nitrogen,
    phosphorus: sd.phosphorus,
    potassium: sd.potassium,
    ec: sd.soil_ec,
    waterPh: sd.water_ph,
    airTemp: sd.air_temp,
    airHumidity: sd.air_humidity,
    createdAt: sd.created_at,
  };
}

// ─── New Experiment Tab ────────────────────────────────────────────────────────
const NewExperimentTab = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [experiment, setExperiment] = useState(null);
  const [currentBucketIndex, setCurrentBucketIndex] = useState(1);
  const [expData, setExpData] = useState({ experiment_number: "", title: "", num_buckets: 1, description: "" });
  const [bucketData, setBucketData] = useState({ soil_type: "", plant_type: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/experiments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expData),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      setExperiment(data.experiment);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleBucketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/experiments/${experiment.id}/buckets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket_number: `Bucket ${currentBucketIndex}`, ...bucketData }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message);
      if (currentBucketIndex < experiment.num_buckets) {
        setCurrentBucketIndex((prev) => prev + 1);
        setBucketData({ soil_type: "", plant_type: "" });
      } else {
        setStep(3);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  if (step === 3) {
    return (
      <div className="text-center py-16 px-4">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500">
            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
          </div>
        </div>
        <h3 className="text-3xl font-bold mb-3 text-white">Experiment Ready</h3>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">All {experiment.num_buckets} buckets configured. Ready to sense!</p>
        <button onClick={onSuccess} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all">
          View & Manage
        </button>
      </div>
    );
  }

  const progress = step === 1 ? 0 : Math.round(((currentBucketIndex - 1) / experiment.num_buckets) * 100);

  return (
    <div className="max-w-2xl mx-auto px-4">
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">error</span>
          {error}
        </div>
      )}
      {step === 1 && (
        <form onSubmit={handleExpSubmit} className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-lg">1</div>
              <h2 className="text-2xl font-bold text-white">Experiment Setup</h2>
            </div>
            <p className="text-gray-400 text-sm ml-14">Define your experiment parameters</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Experiment Number</label>
              <input required type="text" value={expData.experiment_number} onChange={(e) => setExpData({ ...expData, experiment_number: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all" placeholder="e.g. EXP-001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                <input required type="text" value={expData.title} onChange={(e) => setExpData({ ...expData, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all" placeholder="Tomato Growth" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Number of Buckets</label>
                <input required type="number" min="1" max="20" value={expData.num_buckets} onChange={(e) => setExpData({ ...expData, num_buckets: parseInt(e.target.value) || 1 })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
              <textarea value={expData.description} onChange={(e) => setExpData({ ...expData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all h-24 resize-none" placeholder="Brief description..." />
            </div>
          </div>
          <button disabled={loading} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all">
            {loading ? "Setting up..." : "Continue to Bucket Setup →"}
          </button>
        </form>
      )}
      {step === 2 && (
        <form onSubmit={handleBucketSubmit} className="space-y-6">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-lg">2</div>
              <h2 className="text-2xl font-bold text-white">Configure Buckets</h2>
            </div>
            <p className="text-gray-400 text-sm ml-14">Set up bucket {currentBucketIndex} of {experiment.num_buckets}</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm font-semibold text-emerald-400">{progress}%</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Bucket Label</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-gray-400">Bucket {currentBucketIndex}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Soil Type</label>
              <input required type="text" value={bucketData.soil_type} onChange={(e) => setBucketData({ ...bucketData, soil_type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all" placeholder="e.g. Loam, Sandy, Clay" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Plant Type</label>
              <input required type="text" value={bucketData.plant_type} onChange={(e) => setBucketData({ ...bucketData, plant_type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all" placeholder="e.g. Tomato, Lettuce, Basil" />
            </div>
          </div>
          <button disabled={loading} className="w-full py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 transition-all">
            {loading ? "Saving..." : currentBucketIndex < experiment.num_buckets ? "Save & Next Bucket →" : "Complete Setup ✓"}
          </button>
        </form>
      )}
    </div>
  );
};

// ─── Experiments List Tab ──────────────────────────────────────────────────────
const ExperimentsListTab = () => {
  const [experiments, setExperiments] = useState([]);
  const [selectedExp, setSelectedExp] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/experiments`);
      const data = await res.json();
      if (data.success) setExperiments(data.experiments);
    } catch (err) {
      console.error("Failed to fetch experiments", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  if (selectedExp) {
    return <ExperimentDetails experiment={selectedExp} onBack={() => { setSelectedExp(null); fetchExperiments(); }} />;
  }

  if (loading) return <div className="text-center py-16 text-gray-400">Loading experiments...</div>;

  if (experiments.length === 0) {
    return (
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-5xl text-gray-600 mb-4 inline-block">science</span>
        <p className="text-gray-400">No experiments yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {experiments.map((exp) => (
        <div key={exp.id} onClick={() => setSelectedExp(exp)}
          className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-emerald-500/50 cursor-pointer transition-all">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">{exp.experiment_number}: {exp.title}</h3>
              <p className="text-sm text-gray-400">{exp.description || "No description"}</p>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">storage</span>{exp.num_buckets} Buckets</span>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
              exp.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-400"
            }`}>{exp.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Experiment Details ────────────────────────────────────────────────────────
const ExperimentDetails = ({ experiment, onBack }) => {
  const [buckets, setBuckets] = useState(experiment.buckets || []);
  const [activeBucketId, setActiveBucketId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [expandedBucket, setExpandedBucket] = useState(null);
  const pollTimers = useRef({});

  const startSensorCollection = async (bucket) => {
    setErrorMsg("");
    if (processing) {
      setErrorMsg("Another bucket is already collecting. Please wait.");
      return;
    }
    if (bucket.status === "Data Collected") return;

    setProcessing(true);
    setActiveBucketId(bucket.id);

    // Record timestamp BEFORE updating sensor_status
    const startTime = new Date().toISOString();

    // Update sensor_status with the correct tub_id for this bucket
    const { error: patchError } = await supabase
      .from("sensor_status")
      .update({ tub_id: bucket.id, is_locked: true, is_active: true })
      .eq("sensor_id", "esp32-001");

    if (patchError) {
      console.error("Failed to update sensor_status:", patchError);
      setErrorMsg("Failed to activate sensor. Check Supabase connection.");
      setProcessing(false);
      setActiveBucketId(null);
      return;
    }

    // Poll for new sensor_data AFTER startTime for this specific tub_id
    const pollInterval = setInterval(async () => {
      const { data: sdArr, error: sdErr } = await supabase
        .from("sensor_data")
        .select("*")
        .eq("tub_id", bucket.id)
        .gte("created_at", startTime)   // Only data NEWER than when we started
        .order("created_at", { ascending: false })
        .limit(1);

      if (sdErr) { console.error("Poll error:", sdErr); return; }

      if (sdArr && sdArr.length > 0) {
        clearInterval(pollInterval);
        delete pollTimers.current[bucket.id];
        const sd = sdArr[0];
        const sensorParsed = parseSensorData(sd);
        setBuckets((prev) => prev.map((b) =>
          b.id === bucket.id
            ? { ...b, status: "Data Collected", sensor_data: sensorParsed, raw_sd: sd }
            : b
        ));
        setProcessing(false);
        setActiveBucketId(null);
        // Unlock sensor
        await supabase.from("sensor_status").update({ is_locked: false }).eq("sensor_id", "esp32-001");
      }
    }, 3000);

    pollTimers.current[bucket.id] = pollInterval;

    // Timeout after 5 minutes
    setTimeout(() => {
      if (pollTimers.current[bucket.id]) {
        clearInterval(pollTimers.current[bucket.id]);
        delete pollTimers.current[bucket.id];
        if (activeBucketId === bucket.id) {
          setProcessing(false);
          setActiveBucketId(null);
          setErrorMsg("Sensor timed out. Please try again.");
        }
      }
    }, 5 * 60 * 1000);
  };

  const allCollected = buckets.every((b) => b.status === "Data Collected");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-6">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{experiment.experiment_number}: {experiment.title}</h2>
          <p className="text-sm text-gray-400 mt-1">{experiment.description || "No description"}</p>
        </div>
        
        <button
          disabled
          title="Global sync not yet configured"
          className="bg-slate-800 hover:bg-slate-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors cursor-not-allowed opacity-50 border border-white/5"
        >
          <span className="material-symbols-outlined text-lg">sync</span> Sync All Sensors
        </button>

        {allCollected && (
          <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">check_circle</span> Complete
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined">error</span> {errorMsg}
        </div>
      )}

      {/* Bucket Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Tubs</h3>
        {buckets.map((b) => {
          const isActive = activeBucketId === b.id;
          const isCollected = b.status === "Data Collected";
          const isOpen = expandedBucket === b.id;
          const sd = b.sensor_data;

          return (
            <div key={b.id} className={`rounded-xl border transition-all ${
              isActive ? "border-emerald-500 bg-emerald-500/10" :
              isCollected ? "border-green-500/30 bg-green-500/5" :
              "border-white/10 bg-white/5"
            }`}>
              {isActive && <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-t-xl animate-pulse"></div>}

              {/* Bucket Row */}
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
                </div>

                <div className="flex items-center gap-3">
                  {/* Sync button (idle) */}
                  <button
                    disabled
                    title="Sensor sync not yet linked"
                    className="px-4 py-2 rounded-lg border border-blue-500/30 text-blue-400/50 text-sm font-medium cursor-not-allowed flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">sync</span>
                    Sync
                  </button>

                  {/* Predict button (idle) */}
                  <button
                    disabled
                    title="Prediction model not yet linked"
                    className="px-4 py-2 rounded-lg border border-purple-500/30 text-purple-400/50 text-sm font-medium cursor-not-allowed flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">psychology</span>
                    Predict
                  </button>

                  {/* Sense / Status button */}
                  {isCollected ? (
                    <button
                      onClick={() => setExpandedBucket(isOpen ? null : b.id)}
                      className="px-5 py-2 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-sm font-medium flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">monitoring</span>
                      {isOpen ? "Hide Data" : "View Data"}
                    </button>
                  ) : isActive ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-medium px-4 py-2">
                      <span className="material-symbols-outlined animate-spin text-xl">refresh</span>
                      Sensing...
                    </div>
                  ) : (
                    <button
                      onClick={() => startSensorCollection(b)}
                      disabled={processing}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">sensors</span>
                      Sense Now
                    </button>
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
                    <SensorCard label="Soil pH" value={sd.ph} unit="" icon="science" />
                    <SensorCard label="Moisture" value={sd.moisture} unit="%" icon="water_drop" />
                    <SensorCard label="Soil Temp" value={sd.temperature} unit="°C" icon="thermostat" />
                    <SensorCard label="Nitrogen" value={sd.nitrogen} unit="mg/L" icon="eco" />
                    <SensorCard label="Phosphorus" value={sd.phosphorus} unit="mg/L" icon="eco" />
                    <SensorCard label="Potassium" value={sd.potassium} unit="mg/L" icon="eco" />
                    <SensorCard label="Soil EC" value={sd.ec} unit="dS/m" icon="electrical_services" />
                    <SensorCard label="Water pH" value={sd.waterPh} unit="" icon="water" />
                    <SensorCard label="Air Temp" value={sd.airTemp} unit="°C" icon="air" />
                    <SensorCard label="Air Humidity" value={sd.airHumidity} unit="%" icon="humidity_percentage" />
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

// ─── History Tab ───────────────────────────────────────────────────────────────
const HistoryTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("sensor_data")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error) setHistory(data || []);
      setLoading(false);
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading history...</div>;
  if (history.length === 0) return (
    <div className="text-center py-16">
      <span className="material-symbols-outlined text-5xl text-gray-600 mb-4 inline-block">history</span>
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
              ["pH", sd.soil_ph], ["Moist", sd.soil_moisture + "%"], ["Temp", sd.soil_temp + "°C"],
              ["N", sd.nitrogen], ["P", sd.phosphorus], ["K", sd.potassium],
              ["EC", sd.soil_ec], ["AirT", sd.air_temp + "°C"], ["Hum", sd.air_humidity + "%"]
            ].map(([k, v]) => (
              <div key={k} className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-gray-500">{k}</div>
                <div className="text-white font-medium">{v !== null && v !== undefined ? Number(v).toFixed(1) : "—"}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ExperimentsPage() {
  const [activeTab, setActiveTab] = useState("new");

  const tabs = [
    { id: "new", label: "New Experiment", icon: "add_circle" },
    { id: "current", label: "Experiments", icon: "science" },
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
              <h1 className="text-4xl font-bold tracking-tight">Experiment & Predict</h1>
              <p className="text-gray-400 mt-2 text-lg">Create experiments, sense soil data, and generate crop predictions.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10">
              <div className="flex gap-1">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`py-3 px-5 font-medium flex items-center gap-2 transition-all border-b-2 text-sm ${
                      activeTab === tab.id ? "border-emerald-500 text-emerald-400" : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="mb-16">
              {activeTab === "new" && <NewExperimentTab onSuccess={() => setActiveTab("current")} />}
              {activeTab === "current" && <ExperimentsListTab />}
              {activeTab === "history" && <HistoryTab />}
            </div>
          </div>
        </main>
        <VirtualKeyboard />
      </div>
    </div>
  );
}
