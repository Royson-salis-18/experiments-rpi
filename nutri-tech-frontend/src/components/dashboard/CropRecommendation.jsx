import React from 'react';

export default function CropRecommendation({ bucketRecommendations, loading }) {
    if (loading) {
        return (
            <div className="glass-card p-6 min-h-[400px] flex flex-col justify-center items-center gap-4 animate-pulse">
                <div className="size-16 rounded-3xl bg-white/5"></div>
                <div className="h-6 w-48 bg-white/5 rounded"></div>
                <div className="space-y-3 w-full max-w-sm mt-8">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl w-full"></div>)}
                </div>
            </div>
        );
    }

    const hasRecommendations = bucketRecommendations && bucketRecommendations.some(recs => recs.length > 0);

    if (!hasRecommendations) {
        return (
            <div className="glass-card p-6 min-h-[400px] flex flex-col justify-center items-center text-center">
                <div className="size-20 rounded-full bg-brand-gold/10 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-brand-gold text-5xl">smart_toy</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to Predict</h3>
                <p className="text-dashboard-text-muted text-sm max-w-xs px-4">
                    Adjust the parameters above and click <strong>Predict Crop</strong> to generate AI recommendations.
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card flex flex-col h-[600px] overflow-hidden border-brand-accent/20 p-6">
            <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-brand-accent">grid_view</span>
                <h3 className="text-lg font-bold text-white">Multi-Bucket Predictions</h3>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {bucketRecommendations.map((recommendations, index) => {
                    if (!recommendations || recommendations.length === 0) return null;

                    const topPick = recommendations[0];
                    const alternatives = recommendations.slice(1, 4);

                    return (
                        <div key={index} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-lg p-5 group hover:bg-white/[0.07] transition-all">
                            {/* Bucket Header / Top Pick */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="size-12 rounded-xl bg-brand-accent/20 flex items-center justify-center border border-brand-accent/30 text-brand-accent shadow-[0_0_15px_rgba(61,255,106,0.15)] group-hover:scale-105 transition-transform duration-300">
                                        <span className="font-bold text-lg">{index + 1}</span>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-dashboard-text-muted uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                            Bucket {index + 1} <span className="size-1 rounded-full bg-white/20"></span> Best Match
                                        </div>
                                        <h4 className="text-2xl font-serif font-bold text-white">{topPick.crop}</h4>
                                    </div>
                                </div>
                                <div className="flex gap-4 min-w-[140px]">
                                    <div className="text-right">
                                        <div className="text-[9px] text-dashboard-text-muted uppercase mb-1">Confidence</div>
                                        <div className="text-brand-accent font-bold text-sm">{topPick.confidence}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-dashboard-text-muted uppercase mb-1">Est. Profit</div>
                                        <div className="text-brand-gold font-bold text-sm">{topPick.profit}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {alternatives.map((alt, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-black/20 border border-white/5 rounded-xl">
                                        <div className="truncate pr-2">
                                            <h6 className="font-bold text-white text-xs truncate">{alt.crop}</h6>
                                            <span className="text-[9px] text-dashboard-text-muted uppercase truncate">Yield: {alt.yield}</span>
                                        </div>
                                        <div className="text-xs font-bold text-white/70 flex-shrink-0">{alt.confidence}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
