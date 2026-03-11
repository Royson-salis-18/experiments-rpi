export default function Header() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-gradient-to-r from-slate-900 to-slate-950 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="size-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">NT</div>
        <h2 className="font-bold text-lg text-white tracking-tight">NutriTech</h2>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleReload}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all text-sm font-medium"
          title="Reload Data"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Reload
        </button>
        <a
          href="https://nutritech-dashboard.onrender.com/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
        >
          <span className="material-symbols-outlined text-lg">dashboard</span>
          Dashboard
        </a>
      </div>
    </header>
  );
}