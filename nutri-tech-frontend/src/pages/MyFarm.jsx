import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default function MyFarm() {
    const [loading, setLoading] = useState(true);
    const [buckets, setBuckets] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newBucketName, setNewBucketName] = useState('');

    useEffect(() => {
        fetchBuckets();
    }, []);

    const fetchBuckets = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const { data, error } = await supabase
                    .from('buckets')
                    .select('*, sensors(*)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true });

                if (error) throw error;
                setBuckets(data || []);
            }
        } catch (error) {
            console.error("Error fetching buckets:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBucket = async (e) => {
        e.preventDefault();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('buckets')
                .insert([{ user_id: user.id, name: newBucketName, status: 'active' }])
                .select()
                .single();

            if (error) throw error;

            // Add default sensors for simulation
            const bucketId = data.id;
            const sensorTypes = ['Nitrogen', 'Phosphorus', 'Potassium', 'pH', 'Temperature', 'Humidity', 'Rainfall'];
            const sensorInserts = sensorTypes.map(type => ({
                bucket_id: bucketId,
                type: type,
                value: 0,
                status: 'active'
            }));

            await supabase.from('sensors').insert(sensorInserts);

            setBuckets([...buckets, { ...data, sensors: sensorInserts }]);
            setNewBucketName('');
            setIsCreating(false);

        } catch (error) {
            console.error("Error creating bucket:", error);
            alert("Failed to create bucket");
        }
    };

    return (
        <div className="flex min-h-screen bg-dashboard-bg text-white font-sans selection:bg-brand-accent/30 overflow-hidden">
            <Sidebar />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />

                <div className="flex-1 p-8 space-y-8 overflow-y-auto">

                    {/* Page Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">My Connected Farm</h1>
                            <p className="text-dashboard-text-muted text-sm">Manage your sensor buckets and hardware connections.</p>
                        </div>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent text-brand-black font-bold shadow-lg shadow-brand-accent/20 hover:scale-105 transition-transform"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Add New Bucket
                        </button>
                    </div>

                    {/* Create Modal (Simple Inline for now) */}
                    {isCreating && (
                        <div className="bg-dashboard-card border border-brand-accent rounded-2xl p-6 animate-in fade-in zoom-in-95">
                            <h3 className="text-lg font-bold text-white mb-4">Register New System</h3>
                            <form onSubmit={handleCreateBucket} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="Enter Bucket Name (e.g. Tomato Bed 1)"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-dashboard-text-muted focus:border-brand-accent outline-none transition-colors"
                                    value={newBucketName}
                                    onChange={(e) => setNewBucketName(e.target.value)}
                                    autoFocus
                                    required
                                />
                                <button type="submit" className="px-6 py-3 bg-brand-accent text-brand-black font-bold rounded-xl hover:bg-white transition-colors">
                                    Register
                                </button>
                                <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 bg-white/5 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                                    Cancel
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Buckets Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {buckets.map((bucket) => (
                            <div key={bucket.id} className="bg-dashboard-card border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all group">
                                <div className="p-6 border-b border-white/5 flex items-start justify-between bg-gradient-to-br from-white/[0.02] to-transparent">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-2xl bg-brand-green/20 flex items-center justify-center text-brand-accent border border-brand-accent/20">
                                            <span className="material-symbols-outlined text-2xl">potted_plant</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-brand-accent transition-colors">{bucket.name}</h3>
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-[10px] font-bold text-brand-accent uppercase tracking-wide">
                                                <span className="size-1.5 rounded-full bg-brand-accent animate-pulse"></span>
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                    <button className="text-dashboard-text-muted hover:text-white transition-colors">
                                        <span className="material-symbols-outlined">more_horiz</span>
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Preview some key sensors */}
                                        {bucket.sensors?.slice(0, 4).map((sensor, idx) => (
                                            <div key={idx} className="bg-white/5 rounded-xl p-3 border border-white/5">
                                                <p className="text-[9px] font-bold text-dashboard-text-muted uppercase tracking-widest truncate">{sensor.type}</p>
                                                <p className="text-sm font-bold text-white mt-1">
                                                    {sensor.value || '--'} <span className="text-[10px] text-dashboard-text-muted font-normal">{sensor.unit || ''}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full mt-4 py-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                                        View Analytics
                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Empty State */}
                        {!loading && buckets.length === 0 && !isCreating && (
                            <div onClick={() => setIsCreating(true)} className="border-2 border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-accent/50 hover:bg-brand-accent/[0.02] transition-all group min-h-[300px]">
                                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center text-dashboard-text-muted mb-4 group-hover:text-brand-accent group-hover:scale-110 transition-all">
                                    <span className="material-symbols-outlined text-3xl">add</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Add Your First Bucket</h3>
                                <p className="text-dashboard-text-muted text-sm max-w-xs">Register a new sensor container to start tracking real-time data.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
