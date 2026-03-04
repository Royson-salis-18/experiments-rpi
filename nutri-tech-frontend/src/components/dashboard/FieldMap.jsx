export default function FieldMap() {
    return (
        <div className="bg-dashboard-card border border-white/5 rounded-2xl p-0 overflow-hidden relative group h-[280px]">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent">
                <div>
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Selected Field: Alpha-7</p>
                </div>
                <button className="text-xs font-bold text-white hover:text-brand-accent transition-colors">Change</button>
            </div>

            {/* Map Image (Simulated) */}
            <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyVU0ETROxW2lbe9PdxjJkYiZ036FAfiK9Vf4jz1p9-ljqebe1az-TrMGUs1hcmkx_MxG0pztGC7nWQlkYUnMB25iC2uxiHiRowui472RKyoGz148qgIzFMx0Nv80TOTb7Qd6fkTHqHATcHEBZU_byi-VzHvzwFkkY-O6byBZiOepnn6EJrcmTjOAsRur3zb6m7wWITAhAIJryPhqDgff9zW2k913cGzNI0AEioIjdzm01LgSdbc6qlkmP3JKDygvHQTk9uy-rQIs"
                alt="Field Map"
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
            />

            {/* Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                <button className="size-8 bg-black/50 backdrop-blur-md rounded border border-white/10 flex items-center justify-center text-white hover:bg-brand-accent hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-sm">add</span>
                </button>
                <button className="size-8 bg-black/50 backdrop-blur-md rounded border border-white/10 flex items-center justify-center text-white hover:bg-brand-accent hover:text-black transition-colors">
                    <span className="material-symbols-outlined text-sm">remove</span>
                </button>
            </div>

            {/* Footer Coordinate Tag */}
            <div className="absolute bottom-4 left-4">
                <span className="bg-brand-surface/90 backdrop-blur border border-white/10 px-2 py-1 rounded text-[10px] font-mono text-white">42.5° N, 120.4° W</span>
            </div>
        </div>
    );
}
