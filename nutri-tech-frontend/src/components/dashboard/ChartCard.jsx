import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
} from "recharts";

export default function ChartCard({ data }) {
    return (
        <div className="bg-dashboard-card border border-white/5 rounded-2xl p-6 h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h3 className="font-bold text-xl text-white tracking-tight">
                        Field Condition Prediction
                    </h3>
                    <p className="text-sm text-dashboard-text-muted mt-1">
                        Forecasted yield vs. actual health index performance
                    </p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 text-xs font-medium">
                    <span className="flex items-center gap-2 text-white">
                        <span className="w-3 h-[2px] bg-brand-accent" />
                        Actual Health
                    </span>

                    <span className="flex items-center gap-2 text-dashboard-text-muted">
                        <span className="w-3 h-[2px] border-t border-dashed border-brand-accent" />
                        Predicted Yield
                    </span>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                            <linearGradient id="healthGradient" x1={0} y1={0} x2={0} y2={1}>
                                <stop offset="0%" stopColor="#3DFF6A" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#3DFF6A" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            opacity={0.5}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />

                        <YAxis
                            stroke="#64748b"
                            opacity={0.5}
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1A2418",
                                border: "1px solid rgba(255,255,255,0.1)",
                                borderRadius: "12px",
                                fontSize: "12px",
                                color: "#fff",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)"
                            }}
                            itemStyle={{ color: "#fff" }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />

                        { /* Actual health */}
                        <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#3DFF6A"
                            fill="url(#healthGradient)"
                            strokeWidth={3}
                            shadow="0 0 20px rgba(61, 255, 106, 0.5)" // CSS filter approach needed for real glow, but simple here
                        />

                        { /* Predicted yield */}
                        <Line
                            type="monotone"
                            dataKey="predicted"
                            stroke="#3DFF6A"
                            strokeDasharray="4 4"
                            strokeWidth={2}
                            opacity={0.5}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}