import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { icon: "science", path: "/", label: "Experiments" },
  ];

  return (
    <aside className="w-20 border-r border-white/10 flex flex-col h-screen sticky top-0 bg-gradient-to-b from-slate-900 to-slate-950 shrink-0 z-30">
      <div className="h-20 flex items-center justify-center border-b border-white/10">
        <div className="size-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-transform cursor-pointer font-bold">
          NT
        </div>
      </div>

      <nav className="flex-1 w-full flex flex-col gap-4 py-6 px-2 items-center overflow-y-auto no-scrollbar">
        {navItems.map(({ icon, path, label }) => (
          <Link
            key={label}
            to={path}
            className={`size-12 rounded-lg flex items-center justify-center transition-all duration-300 group relative ${isActive(path)
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
              : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            title={label}
          >
            <span className={`material-symbols-outlined text-xl ${isActive(path) ? "filled" : ""}`}>{icon}</span>

            {/* Tooltip */}
            <span className="absolute left-16 bg-slate-800 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {label}
            </span>

            {isActive(path) && (
              <div className="absolute -right-[9px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-500 rounded-l-full"></div>
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 flex justify-center">
        <button className="size-12 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-gray-400 hover:text-white flex items-center justify-center hover:bg-slate-800 transition shadow-inner border border-white/5">
          <span className="material-symbols-outlined text-xl">settings</span>
        </button>
      </div>
    </aside>
  );
}
