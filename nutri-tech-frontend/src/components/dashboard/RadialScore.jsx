export default function RadialScore() {
    return (
        <div className="bg-dashboard-card border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
            <h3 className="text-[10px] font-bold text-dashboard-text-muted uppercase tracking-widest mb-4">Crop Health Score</h3>

            <div className="flex items-center gap-6">
                {/* Radial Chart Simulated */}
                <div className="relative size-24 shrink-0">
                    <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            className="text-white/5 stroke-current"
                            strokeWidth="8"
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                        ></circle>
                        <circle
                            className="text-brand-accent stroke-current"
                            strokeWidth="8"
                            strokeLinecap="round"
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            strokeDasharray="251.2"
                            strokeDashoffset="30.14" // 88% filled
                        ></circle>
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                        <span className="text-2xl font-bold text-white block leading-none">88</span>
                        <span className="text-[9px] text-white/40 block leading-none mt-1">/100</span>
                    </div>
                </div>

                <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-white">Growth Rate</span>
                        <span className="text-brand-accent font-bold">+12%</span>
                    </div>
                    {/* Progress Bar for Growth */}
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-brand-accent h-full w-[80%] rounded-full"></div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-white">Pest Probability</span>
                        <span className="text-dashboard-text-muted opacity-80 font-bold text-brand-accent">4%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-brand-accent h-full w-[8%] rounded-full opacity-50"></div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-white">Soil Quality Index</span>
                        <span className="text-brand-accent font-bold">92%</span>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                        <div className="bg-brand-accent h-full w-[92%] rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
