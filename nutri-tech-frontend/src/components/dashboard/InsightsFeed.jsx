export default function InsightsFeed() {
    return (
        <div className="bg-dashboard-card border border-white/5 rounded-2xl p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-[10px] font-bold text-dashboard-text-muted uppercase tracking-widest">Recent Insights</h3>
                <button className="text-white/40 hover:text-white">
                    <span className="material-symbols-outlined text-sm">more_horiz</span>
                </button>
            </div>

            <div className="space-y-4">
                {/* Insight 1 */}
                <div className="flex gap-4 p-3 rounded-xl bg-dashboard-warning/5 border border-dashboard-warning/10 hover:bg-dashboard-warning/10 transition-colors cursor-pointer group">
                    <div className="size-8 rounded-full bg-dashboard-warning/20 flex items-center justify-center shrink-0 text-dashboard-warning">
                        <span className="material-symbols-outlined text-sm">warning</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white group-hover:text-dashboard-warning transition-colors">Low Potassium Alert</p>
                        <p className="text-xs text-dashboard-text-muted mt-1 leading-relaxed">
                            Field Alpha-7 requires localized fertilization in sector 4.
                        </p>
                        <p className="text-[10px] text-white/20 mt-2 font-mono">14 MINS AGO</p>
                    </div>
                </div>

                {/* Insight 2 */}
                <div className="flex gap-4 p-3 rounded-xl bg-brand-accent/5 border border-brand-accent/10 hover:bg-brand-accent/10 transition-colors cursor-pointer group">
                    <div className="size-8 rounded-full bg-brand-accent/20 flex items-center justify-center shrink-0 text-brand-accent">
                        <span className="material-symbols-outlined text-sm">trending_up</span>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white group-hover:text-brand-accent transition-colors">Yield Prediction Increase</p>
                        <p className="text-xs text-dashboard-text-muted mt-1 leading-relaxed">
                            Forecasted yield improved by 4.2% based on rainfall trends.
                        </p>
                        <p className="text-[10px] text-white/20 mt-2 font-mono">2 HOURS AGO</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
