export default function StatCard({ title, value, unit, status, indicator, color, trend, forecast }) {
    const isWarning = status === "warning";
    const statusColor = isWarning ? "text-dashboard-warning" : "text-brand-accent";
    const barColor = isWarning ? "bg-dashboard-warning" : "bg-brand-accent";
    const statusBg = isWarning ? "bg-dashboard-warning" : "bg-brand-accent";

    return (
        <div className="bg-dashboard-card border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-full hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-dashboard-text-muted uppercase tracking-wider">{title}</span>
                {unit && indicator === 'bar-graph' && (
                    <span className="material-symbols-outlined text-xs text-dashboard-text-muted">science</span>
                )}
                {!unit && !indicator && (
                    <span className="size-2 rounded-full bg-dashboard-surface border border-white/10"></span>
                )}
                {title === "Humidity" && (
                    <span className="material-symbols-outlined text-xs text-dashboard-text-muted">water_drop</span>
                )}
                {title === "Rainfall" && (
                    <span className="material-symbols-outlined text-xs text-dashboard-text-muted">cloud</span>
                )}
            </div>

            <div>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-sans font-bold text-white tracking-tight">{value}</span>
                    {unit && <span className="text-xs text-dashboard-text-muted font-medium">{unit}</span>}
                </div>

                {/* Status Badge */}
                {status && (
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-2 ${statusBg}/10 ${statusColor}`}>
                        {status}
                        {forecast && <span className="ml-1 text-white/50Normal text-[9px] lowercase opacity-80">{forecast}</span>}
                        {trend === "steady" && <span className="ml-2 opacity-60">Steady</span>}
                        {trend && trend !== "steady" && trend !== "flat" && <span className="ml-1 opacity-80">{trend} Trend</span>}
                    </div>
                )}
            </div>

            {/* Visual Indicators */}
            <div className="mt-4 h-8 flex items-end gap-1">
                {indicator === 'bar-graph' && (
                    <>
                        <div className={`w-1/5 h-[40%] rounded-sm ${barColor} opacity-20`}></div>
                        <div className={`w-1/5 h-[60%] rounded-sm ${barColor} opacity-40`}></div>
                        <div className={`w-1/5 h-[30%] rounded-sm ${barColor} opacity-30`}></div>
                        <div className={`w-1/5 h-[80%] rounded-sm ${barColor} opacity-60`}></div>
                        <div className={`w-1/5 h-[100%] rounded-sm ${barColor}`}></div>
                    </>
                )}

                {indicator === 'progress' && (
                    <div className="w-full bg-dashboard-surface rounded-full h-1.5 overflow-hidden flex">
                        <div className="w-1/2 bg-brand-accent h-full rounded-full"></div>
                        {isWarning && <div className="w-1/4 bg-dashboard-warning h-full"></div>}
                    </div>
                )}
            </div>
        </div>
    );
}