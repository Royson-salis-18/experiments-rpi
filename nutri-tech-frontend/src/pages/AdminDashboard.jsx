import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalBuckets: 0,
        activeSensors: 0,
        alerts: 0
    });
    const [buckets, setBuckets] = useState([]);

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Users (Profiles)
            const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // 2. Fetch Buckets with User info
            const { data: bucketsData, error: bucketError } = await supabase
                .from('buckets')
                .select('*, profiles(full_name, email), sensors(*)');

            if (bucketError) throw bucketError;

            // Calculate stats
            let sensorCount = 0;
            let alertCount = 0;

            bucketsData.forEach(bucket => {
                sensorCount += bucket.sensors.length;
                // Simple logic: if any sensor is 'warning' or 'error', add to alerts
                const hasAlert = bucket.sensors.some(s => s.status === 'warning' || s.status === 'error');
                if (hasAlert) alertCount++;
            });

            setStats({
                totalUsers: userCount || 0,
                totalBuckets: bucketsData.length,
                activeSensors: sensorCount,
                alerts: alertCount
            });

            setBuckets(bucketsData);

        } catch (error) {
            console.error("Error fetching admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-dashboard-bg text-white font-sans selection:bg-brand-accent/30 overflow-hidden">
            <Sidebar isAdmin={true} />

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <Header />

                <div className="flex-1 p-8 space-y-8 overflow-y-auto">

                    {/* Admin Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-white mb-2">Admin Console</h1>
                            <p className="text-dashboard-text-muted text-sm">System-wide monitoring and hardware management.</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-brand-accent/10 rounded-full border border-brand-accent/20">
                            <span className="size-2 rounded-full bg-brand-accent animate-pulse"></span>
                            <span className="text-xs font-bold text-brand-accent uppercase tracking-widest">System Operational</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AdminStatCard title="Total Users" value={stats.totalUsers} icon="group" color="text-white" />
                        <AdminStatCard title="Active Buckets" value={stats.totalBuckets} icon="potted_plant" color="text-brand-gold" />
                        <AdminStatCard title="Online Sensors" value={stats.activeSensors} icon="sensors" color="text-brand-accent" />
                        <AdminStatCard title="System Alerts" value={stats.alerts} icon="warning" color="text-dashboard-danger" />
                    </div>

                    {/* Master Bucket List */}
                    <div className="bg-dashboard-card border border-white/5 rounded-3xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-white">Master Bucket Registry</h3>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-dashboard-text-muted">filter_list</span>
                                <span className="text-xs font-bold text-dashboard-text-muted uppercase tracking-widest">Filter</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-dashboard-text-muted">
                                <thead className="bg-white/5 text-xs uppercase font-bold text-white">
                                    <tr>
                                        <th className="px-6 py-4">Bucket Name</th>
                                        <th className="px-6 py-4">Owner</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Sensors</th>
                                        <th className="px-6 py-4">Last Sync</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {buckets.map((bucket) => (
                                        <tr key={bucket.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 font-medium text-white">{bucket.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-white text-xs">{bucket.profiles?.full_name || 'Unknown'}</span>
                                                    <span className="text-[10px]">{bucket.profiles?.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${bucket.status === 'active' ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/20' : 'bg-white/5 text-dashboard-text-muted border-white/10'
                                                    }`}>
                                                    {bucket.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-2">
                                                    {bucket.sensors.map((sensor, idx) => (
                                                        <div key={idx} className="size-6 rounded-full bg-dashboard-surface border border-white/10 flex items-center justify-center text-[10px] text-white" title={`${sensor.type}: ${sensor.value}`}>
                                                            {sensor.type[0]}
                                                        </div>
                                                    )).slice(0, 4)}
                                                    {bucket.sensors.length > 4 && (
                                                        <div className="size-6 rounded-full bg-dashboard-surface border border-white/10 flex items-center justify-center text-[8px] text-dashboard-text-muted">
                                                            +{bucket.sensors.length - 4}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs">
                                                {new Date(bucket.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-dashboard-text-muted hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-lg">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {buckets.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-dashboard-text-muted italic">
                                                No buckets found in the registry.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

function AdminStatCard({ title, value, icon, color }) {
    return (
        <div className="bg-dashboard-card border border-white/5 rounded-2xl p-6 flex items-center gap-4">
            <div className={`size-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 ${color}`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <p className="text-[10px] font-bold text-dashboard-text-muted uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-white leading-none">{value}</h3>
            </div>
        </div>
    );
}
