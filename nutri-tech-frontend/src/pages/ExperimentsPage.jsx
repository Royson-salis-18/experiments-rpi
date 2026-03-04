import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

const API_URL = "http://localhost:5000/api";

const TabIcon = ({ name, active }) => (
    <span className={`material-symbols-outlined text-xl ${active ? 'text-brand-gold' : 'text-gray-400'}`}>
        {name}
    </span>
);

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
        setLoading(true); setError("");
        try {
            // Calling Backend API
            const response = await fetch(`${API_URL}/experiments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expData)
            });
            const data = await response.json();

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
            // Calling Backend API
            const response = await fetch(`${API_URL}/experiments/${experiment.id}/buckets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bucket_number: `Bucket ${currentBucketIndex}`,
                    ...bucketData
                })
            });
            const data = await response.json();

            if (!data.success) throw new Error(data.message);

            if (currentBucketIndex < experiment.num_buckets) {
                setCurrentBucketIndex(prev => prev + 1);
                setBucketData({ soil_type: "", plant_type: "" });
            } else {
                setStep(3);
            }
        } catch (err) { setError(err.message); }
        setLoading(false);
    };

    if (step === 3) {
        return (
            <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
                <span className="material-symbols-outlined text-6xl text-green-500 mb-4 animate-bounce">check_circle</span>
                <h3 className="text-2xl font-bold mb-2">Experiment Configured</h3>
                <p className="text-gray-400 mb-6">All {experiment.num_buckets} buckets have been successfully configured.</p>
                <button onClick={onSuccess} className="px-6 py-2 bg-brand-gold text-brand-black rounded-lg font-medium hover:brightness-110 shadow-lg shadow-brand-gold/20 transition-all">
                    View Experiments
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-6">{error}</div>}

            {step === 1 && (
                <form onSubmit={handleExpSubmit} className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="size-8 rounded-full bg-brand-gold text-brand-black flex items-center justify-center font-bold">1</div>
                        <h2 className="text-xl font-semibold text-white">Experiment Details</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Experiment Number</label>
                            <input required type="text" value={expData.experiment_number} onChange={e => setExpData({ ...expData, experiment_number: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-gold outline-none transition-colors" placeholder="e.g. EXP-101" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Number of Buckets</label>
                            <input required type="number" min="1" max="20" value={expData.num_buckets} onChange={e => setExpData({ ...expData, num_buckets: parseInt(e.target.value) || 1 })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-gold outline-none transition-colors" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Experiment Title</label>
                        <input required type="text" value={expData.title} onChange={e => setExpData({ ...expData, title: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-gold outline-none transition-colors" placeholder="Tomato Growth Under UV" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Description (Optional)</label>
                        <textarea value={expData.description} onChange={e => setExpData({ ...expData, description: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-gold outline-none transition-colors h-24" placeholder="Brief description..."></textarea>
                    </div>
                    <button disabled={loading} className="w-full py-3 bg-brand-gold text-brand-black rounded-lg font-medium hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-brand-gold/10">
                        {loading ? "Saving..." : "Save & Configure Buckets"}
                    </button>
                </form>
            )}

            {step === 2 && (
                <form onSubmit={handleBucketSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-brand-gold text-brand-black flex items-center justify-center font-bold">2</div>
                            <h2 className="text-xl font-semibold text-white">Config Bucket {currentBucketIndex} of {experiment.num_buckets}</h2>
                        </div>
                        <div className="text-sm bg-brand-gold/20 text-brand-gold px-3 py-1 rounded-full">{Math.round((currentBucketIndex - 1) / experiment.num_buckets * 100)}% Complete</div>
                    </div>

                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-8">
                        <div className="bg-brand-gold h-full transition-all duration-300" style={{ width: `${(currentBucketIndex - 1) / experiment.num_buckets * 100}%` }}></div>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Bucket Number</label>
                        <input disabled type="text" value={`Bucket ${currentBucketIndex}`} className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-gray-500 cursor-not-allowed" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Type of Soil</label>
                        <input required type="text" value={bucketData.soil_type} onChange={e => setBucketData({ ...bucketData, soil_type: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-gold outline-none transition-colors" placeholder="e.g. Loam, Sandy, Peat" />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Type of Plant</label>
                        <input required type="text" value={bucketData.plant_type} onChange={e => setBucketData({ ...bucketData, plant_type: e.target.value })} className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-brand-gold outline-none transition-colors" placeholder="e.g. Tomato, Basil" />
                    </div>
                    <button disabled={loading} className="w-full py-3 bg-brand-gold text-brand-black rounded-lg font-medium hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-brand-gold/10">
                        {loading ? "Saving..." : `Save Bucket ${currentBucketIndex}`}
                    </button>
                </form>
            )}
        </div>
    );
};

const CurrentExperimentsTab = () => {
    const [experiments, setExperiments] = useState([]);
    const [selectedExp, setSelectedExp] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchExperiments = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/experiments`);
            const data = await res.json();
            if (data.success) {
                setExperiments(data.experiments);
            }
        } catch (err) { console.error("Failed to fetch experiments", err); }
        setLoading(false);
    };

    useEffect(() => { fetchExperiments(); }, []);

    if (selectedExp) {
        return <ExperimentDetails experiment={selectedExp} onBack={() => { setSelectedExp(null); fetchExperiments(); }} />;
    }

    if (loading) {
        return <div className="text-center py-10 text-gray-400">Loading experiments...</div>
    }

    if (experiments.length === 0) {
        return <div className="text-center py-10 text-gray-400">No experiments found. Create a new one!</div>
    }

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-sm text-gray-400 border-b border-white/10">
                <div>Number</div>
                <div>Title</div>
                <div>Buckets</div>
                <div>Status</div>
            </div>
            {experiments.map(exp => (
                <div
                    key={exp.id}
                    onClick={() => setSelectedExp(exp)}
                    className="grid grid-cols-4 gap-4 p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors items-center"
                >
                    <div className="font-semibold text-white">{exp.experiment_number}</div>
                    <div className="text-gray-300 truncate">{exp.title}</div>
                    <div className="text-gray-400">{exp.num_buckets} Buckets</div>
                    <div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${exp.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                            exp.status === 'Configured' ? 'bg-blue-500/20 text-blue-400' :
                                'bg-gray-500/20 text-gray-400'
                            }`}>
                            {exp.status}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

const ExperimentDetails = ({ experiment, onBack }) => {
    const [buckets, setBuckets] = useState(experiment.buckets || []);
    const [activeBucketId, setActiveBucketId] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const startSensorCollection = async (bucket) => {
        setErrorMsg("");
        if (processing) {
            setErrorMsg("Another bucket is currently collecting data. Please wait.");
            return;
        }

        // Ensure sequential logic: user must do Bucket 1, then 2, etc. (optional strictly sequential logic)
        const isSequential = !buckets.find(b => b.id < bucket.id && b.status !== "Data Collected");
        if (!isSequential) {
            setErrorMsg("Please collect data from previous buckets before this one.");
            return;
        }

        if (bucket.status === "Data Collected") return;

        setProcessing(true);
        setActiveBucketId(bucket.id);

        let startTime = "";
        try {
            const startRes = await fetch(`${API_URL}/buckets/${bucket.id}/start_collection`, { method: "POST" });
            const startData = await startRes.json();
            if (startData.success) {
                startTime = startData.start_time;
            }
        } catch (err) {
            console.error("Failed to start collection", err);
        }

        // Polling the backend for sensor data
        const pollInterval = setInterval(async () => {
            try {
                let url = `${API_URL}/buckets/${bucket.id}/latest_data`;
                if (startTime) {
                    url += `?since=${encodeURIComponent(startTime)}`;
                }
                const response = await fetch(url);
                const data = await response.json();

                if (data.success && data.has_data) {
                    clearInterval(pollInterval);

                    // Force an update to the bucket locally to show "Data Collected" and the sensor payload
                    const updatedBucket = {
                        ...bucket,
                        status: "Data Collected",
                        sensor_data: data.sensor_data
                    };

                    setBuckets(prev => prev.map(b => b.id === bucket.id ? updatedBucket : b));
                    setProcessing(false);
                    setActiveBucketId(null);
                }
            } catch (err) {
                console.error("Polling error:", err);
                // We keep polling even on temporary network faults 
            }
        }, 3000); // Check every 3 seconds

        // Safety timeout - stop polling after 5 minutes if no data arrives
        setTimeout(() => {
            if (activeBucketId === bucket.id) {
                clearInterval(pollInterval);
                setProcessing(false);
                setActiveBucketId(null);
                setErrorMsg("Sensor timed out after 5 minutes of inactivity.");
            }
        }, 5 * 60 * 1000);
    };

    // Check if all collected
    const allCollected = buckets.every(b => b.status === "Data Collected");

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{experiment.experiment_number}: {experiment.title}</h2>
                    <p className="text-sm text-gray-400 mt-1">{experiment.description || "No description provided."}</p>
                </div>
                {allCollected && <div className="ml-auto bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2"><span className="material-symbols-outlined text-sm">check_circle</span> Experiment Complete</div>}
            </div>

            {errorMsg && <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center gap-3"><span className="material-symbols-outlined">error</span> {errorMsg}</div>}

            <div className="space-y-4">
                {buckets.map((b, idx) => {
                    const isActive = activeBucketId === b.id;
                    const isCompleted = b.status === "Data Collected";

                    return (
                        <div key={b.id} className={`p-5 rounded-xl border transition-all relative overflow-hidden ${isActive ? "border-brand-gold bg-brand-gold/5" :
                            isCompleted ? "border-green-500/30 bg-green-500/5" :
                                "border-white/5 bg-white/5 hover:border-white/20"
                            }`}>
                            {isActive && <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold animate-pulse"></div>}

                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-lg flex items-center gap-3">
                                        {b.bucket_number}
                                        {isCompleted && <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>}
                                    </h3>
                                    <div className="flex gap-4 mt-2 text-sm text-gray-400">
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">grass</span> {b.plant_type}</span>
                                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">landscape</span> {b.soil_type}</span>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {isCompleted ? (
                                        <div className="text-sm border border-green-500/30 bg-dashboard-card px-4 py-2 rounded-lg text-green-400">
                                            <div>Sensors OK</div>
                                            <div className="font-mono text-xs opacity-80 mt-1">{b.sensor_data}</div>
                                        </div>
                                    ) : isActive ? (
                                        <div className="flex items-center gap-3 text-brand-gold">
                                            <span className="material-symbols-outlined animate-spin">refresh</span>
                                            <span className="font-medium">Waiting for sensor data...</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => startSensorCollection(b)}
                                            disabled={processing}
                                            className="px-6 py-2 bg-white/10 hover:bg-brand-gold hover:text-brand-black disabled:opacity-50 disabled:hover:bg-white/10 disabled:hover:text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">sensors</span>
                                            Collect Data
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}


export default function ExperimentsPage() {
    const [activeTab, setActiveTab] = useState("new");

    return (
        <div className="flex h-screen bg-dashboard-bg text-white overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen relative no-scrollbar">
                <Header />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar scroll-smooth">
                    <div className="max-w-6xl mx-auto space-y-6">
                        <h1 className="text-3xl font-bold">Experiments</h1>

                        {/* Tabs */}
                        <div className="flex gap-4 border-b border-white/10 mb-8">
                            <button
                                className={`py-3 px-6 font-medium flex items-center gap-2 border-b-2 transition-all ${activeTab === "new"
                                    ? "border-brand-gold text-brand-gold bg-brand-gold/5 rounded-t-lg"
                                    : "border-transparent text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg"
                                    }`}
                                onClick={() => setActiveTab("new")}
                            >
                                <TabIcon name="add_circle" active={activeTab === "new"} />
                                New Experiment
                            </button>
                            <button
                                className={`py-3 px-6 font-medium flex items-center gap-2 border-b-2 transition-all ${activeTab === "current"
                                    ? "border-brand-gold text-brand-gold bg-brand-gold/5 rounded-t-lg"
                                    : "border-transparent text-gray-400 hover:text-white hover:bg-white/5 rounded-t-lg"
                                    }`}
                                onClick={() => setActiveTab("current")}
                            >
                                <TabIcon name="list_alt" active={activeTab === "current"} />
                                Current Experiments
                            </button>
                        </div>

                        {/* Content area */}
                        <div className="bg-dashboard-card border border-white/5 rounded-2xl p-8 shadow-xl shadow-black/20 min-h-[500px]">
                            {activeTab === "new" ? (
                                <NewExperimentTab onSuccess={() => setActiveTab("current")} />
                            ) : (
                                <CurrentExperimentsTab />
                            )}
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
