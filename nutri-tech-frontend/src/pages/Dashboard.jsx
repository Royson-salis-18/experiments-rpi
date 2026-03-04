import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import StatCard from "../components/dashboard/StatCard";
import ChartCard from "../components/dashboard/ChartCard";
import FieldMap from "../components/dashboard/FieldMap";
import RadialScore from "../components/dashboard/RadialScore";
import InsightsFeed from "../components/dashboard/InsightsFeed";
import CropRecommendation from "../components/dashboard/CropRecommendation";

export default function Dashboard() {
  // State for 5 buckets metrics and AI results
  const defaultMetrics = { N: 45, P: 30, K: 15, ph: 6.5, temperature: 22, humidity: 65, rainfall: 12 };
  const [bucketMetrics, setBucketMetrics] = useState(
    Array(5).fill(null).map(() => ({ ...defaultMetrics }))
  );
  const [activeBucketIndex, setActiveBucketIndex] = useState(0);

  const [bucketRecommendations, setBucketRecommendations] = useState(Array(5).fill([]));
  const [loading, setLoading] = useState(false);

  const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:5001';

  const fetchRecommendationsForAllBuckets = async (allMetrics) => {
    setLoading(true);
    try {
      // MOCK IMPLEMENTATION for frontend-only deployment
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      const newRecommendations = allMetrics.map(metrics => {
        // Simple mock logic based on parameters
        let crop = "Tomato";
        if (metrics.temperature < 20) crop = "Lettuce";
        if (metrics.N > 60) crop = "Corn";
        if (metrics.ph < 6) crop = "Potato";

        return [
          { Crop: crop, Confidence: Math.floor(Math.random() * 10) + 85 },
          { Crop: crop === "Tomato" ? "Pepper" : "Radish", Confidence: Math.floor(Math.random() * 10) + 70 }
        ];
      });

      setBucketRecommendations(newRecommendations);
    } catch (error) {
      console.error("AI API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMetricChange = (key, val) => {
    const newBucketMetrics = [...bucketMetrics];
    newBucketMetrics[activeBucketIndex] = { ...newBucketMetrics[activeBucketIndex], [key]: val };
    setBucketMetrics(newBucketMetrics);
  };

  const handleManualPredict = () => {
    fetchRecommendationsForAllBuckets(bucketMetrics);
  };

  const handleSync = async () => {
    setLoading(true);
    // Placeholder for future sensor sync logic
    setTimeout(() => {
      setLoading(false);
      alert("Syncing with field sensors... (Simulation: Data Updated)");
      // In real implementation, this would fetch from Supabase 'sensor_readings'
    }, 1500);
  };

  const currentMetrics = bucketMetrics[activeBucketIndex];

  const stats = [
    { title: "Nitrogen (N)", value: currentMetrics.N.toString(), unit: "mg/kg", status: currentMetrics.N > 40 ? "optimal" : "warning", indicator: "bar-graph", id: "N" },
    { title: "Phosphorus (P)", value: currentMetrics.P.toString(), unit: "mg/kg", status: currentMetrics.P > 25 ? "optimal" : "warning", indicator: "bar-graph", id: "P" },
    { title: "Potassium (K)", value: currentMetrics.K.toString(), unit: "mg/kg", status: currentMetrics.K > 20 ? "optimal" : "warning", indicator: "bar-graph", id: "K" },
    { title: "pH Level", value: currentMetrics.ph.toString(), unit: "pH", status: (currentMetrics.ph >= 6 && currentMetrics.ph <= 7) ? "stable" : "warning", indicator: "progress", trend: "flat", id: "ph" },
    { title: "Temp", value: `${currentMetrics.temperature}°`, unit: "C", status: "optimal", id: "temperature" },
    { title: "Humidity", value: `${currentMetrics.humidity}%`, status: "ideal", id: "humidity" },
    { title: "Rainfall", value: currentMetrics.rainfall.toString(), unit: "mm", status: "expected", id: "rainfall" },
  ];

  const chartData = [
    { date: "Oct 01", actual: 15, predicted: 18 },
    { date: "Oct 08", actual: 30, predicted: 35 },
    { date: "Oct 15", actual: 25, predicted: 28 },
    { date: "Oct 22", actual: 45, predicted: 42 },
    { date: "Oct 29", actual: 35, predicted: 40 },
    { date: "Nov 05", actual: null, predicted: 60 },
  ];

  return (
    <div className="flex min-h-screen bg-dashboard-bg text-white font-sans selection:bg-brand-accent/30 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />

        <div className="flex-1 p-8 space-y-8 overflow-y-auto">

          {/* Top Row: The Simulation Controllers */}
          <section>
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-brand-accent/10 flex items-center justify-center text-brand-accent border border-brand-accent/20">
                  <span className="material-symbols-outlined text-md">tune</span>
                </div>
                <div>
                  <h3 className="font-bold text-white leading-none">Simulation Parameters</h3>
                  <p className="text-[10px] text-dashboard-text-muted uppercase tracking-widest mt-1 italic">Real-time AI Influence Matrix</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSync}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-white/10 bg-white/5 text-dashboard-text-muted hover:bg-white/10 hover:text-white transition-all whitespace-nowrap group"
                >
                  <span className="material-symbols-outlined text-md group-hover:rotate-180 transition-transform duration-700">sync</span>
                  Sync Sensors
                </button>

                <button
                  onClick={handleManualPredict}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider border border-brand-accent bg-brand-accent text-brand-black shadow-lg shadow-brand-accent/20 hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-md">psychology</span>
                  Predict Crop
                </button>
              </div>
            </div>

            {/* Bucket Navigation Tabs */}
            <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
              {bucketMetrics.map((metrics, index) => (
                <button
                  key={index}
                  onClick={() => setActiveBucketIndex(index)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl min-w-[150px] border transition-all text-left ${activeBucketIndex === index
                    ? 'bg-brand-accent/20 border-brand-accent shadow-[0_0_15px_rgba(61,255,106,0.15)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${activeBucketIndex === index ? 'text-white' : 'text-dashboard-text-muted'}`}>
                    Bucket {index + 1}
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-dashboard-text-muted">
                    <div>N: <span className={activeBucketIndex === index ? 'text-brand-accent font-bold' : 'text-white'}>{metrics.N}</span></div>
                    <div>P: <span className={activeBucketIndex === index ? 'text-brand-accent font-bold' : 'text-white'}>{metrics.P}</span></div>
                    <div>K: <span className={activeBucketIndex === index ? 'text-brand-accent font-bold' : 'text-white'}>{metrics.K}</span></div>
                    <div>pH: <span className={activeBucketIndex === index ? 'text-brand-accent font-bold' : 'text-white'}>{metrics.ph}</span></div>
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
              {stats.map((item, idx) => (
                <div key={idx} className="relative group">
                  <StatCard {...item} />
                  <div className="absolute inset-x-0 -bottom-3 px-4 py-3 bg-dashboard-card border border-white/10 rounded-2xl shadow-2xl z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                    <div className="flex justify-between mb-2">
                      <span className="text-[8px] font-bold text-dashboard-text-muted uppercase">Adjust</span>
                      <span className="text-[8px] font-bold text-brand-accent">{currentMetrics[item.id]}</span>
                    </div>
                    <input
                      type="range"
                      min={item.id === 'ph' ? 0 : 0}
                      max={item.id === 'ph' ? 14 : item.id === 'humidity' ? 100 : item.id === 'temperature' ? 50 : item.id === 'rainfall' ? 300 : 150}
                      step={item.id === 'ph' ? 0.1 : 1}
                      value={currentMetrics[item.id]}
                      onChange={(e) => handleMetricChange(item.id, parseFloat(e.target.value))}
                      className="w-full accent-brand-accent bg-white/10 h-1.5 rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Main Action Grid */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">

            {/* HERO: AI Recommendation Engine */}
            <div className="xl:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="material-symbols-outlined text-brand-accent text-lg">psychology</span>
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Crop Intelligence Engine</h4>
              </div>
              <CropRecommendation bucketRecommendations={bucketRecommendations} loading={loading} />
            </div>

            {/* SECONDARY: Supporting Data */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="material-symbols-outlined text-brand-gold text-lg">query_stats</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Efficiency Trends</h4>
                </div>
                <ChartCard data={chartData} />
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="material-symbols-outlined text-dashboard-warning text-lg">bolt</span>
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">System Insights</h4>
                </div>
                <InsightsFeed />
              </div>
            </div>

          </section>
        </div>
      </main>
    </div>
  )
}