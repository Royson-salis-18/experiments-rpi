import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: "dashboard", path: "/", label: "Dashboard" },
    { icon: "science", path: "/experiments", label: "Experiments" },
    { icon: "potted_plant", path: "/my-farm", label: "My Buckets" },
    { icon: "eco", path: "#", label: "Crops" }, // using 'eco' for leaf
    { icon: "sensors", path: "#", label: "Sensors" },
    { icon: "description", path: "#", label: "Reports" },
  ];

  return (
    <aside className="w-20 border-r border-white/5 flex flex-col h-screen sticky top-0 bg-dashboard-surface shrink-0 z-30">
      <div className="h-20 flex items-center justify-center border-b border-white/5">
        <div className="size-10 bg-brand-gold rounded-xl flex items-center justify-center text-brand-black shadow-lg shadow-brand-gold/20 hover:scale-105 transition-transform cursor-pointer">
          <span className="material-symbols-outlined text-2xl">spa</span>
        </div>
      </div>

      <nav className="flex-1 w-full flex flex-col gap-4 py-6 px-2 items-center overflow-y-auto no-scrollbar">
        {navItems.map(({ icon, path, label }) => (
          <Link
            key={label}
            to={path}
            className={`size-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative ${isActive(path)
              ? "bg-white/10 text-brand-gold shadow-inner border border-white/5"
              : "text-dashboard-text-muted hover:bg-white/5 hover:text-white"
              }`}
            title={label}
          >
            <span className={`material-symbols-outlined text-xl ${isActive(path) ? "filled" : ""}`}>{icon}</span>

            {/* Tooltip */}
            <span className="absolute left-14 bg-dashboard-card border border-white/10 px-3 py-1 rounded-md text-xs font-medium text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {label}
            </span>

            {isActive(path) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-gold rounded-r-full"></div>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 flex justify-center">
        <button className="size-12 rounded-full bg-brand-gold text-brand-black flex items-center justify-center hover:brightness-110 transition shadow-lg shadow-brand-gold/10">
          <span className="material-symbols-outlined text-xl">sync</span>
        </button>
      </div>
    </aside>
  );
}