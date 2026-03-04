import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
    };

    getUserData();

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || "User";
  const displayRole = profile?.company_name || profile?.role || "Member";

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-dashboard-bg/80 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-white">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h2 className="font-sans font-bold text-2xl text-white tracking-tight">
            Executive Dashboard
          </h2>
        </div>

        <div className="hidden md:flex relative w-[400px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-dashboard-text-muted text-lg">
            search
          </span>
          <input
            className="w-full bg-dashboard-surface border border-white/5 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-dashboard-text-muted focus:ring-1 focus:ring-brand-gold focus:border-brand-gold/50 transition-all outline-none"
            placeholder="Search fields, crops or sensors..."
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full border border-brand-accent/20 bg-brand-accent/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
          </span>
          <span className="text-xs font-medium text-brand-accent tracking-wide uppercase">
            Live System Status
          </span>
        </div>

        <div className="h-8 w-[1px] bg-white/10 hidden md:block"></div>

        <button className="relative text-dashboard-text-muted hover:text-white transition">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-0 right-0 size-2 bg-dashboard-danger rounded-full border-2 border-dashboard-bg"></span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-2 focus:outline-none group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white leading-none group-hover:text-brand-gold transition-colors">{displayName}</p>
              <p className="text-xs text-dashboard-text-muted leading-none mt-1">{displayRole}</p>
            </div>
            <div className="size-10 rounded-full bg-brand-gold/20 flex items-center justify-center border border-brand-gold/30 text-brand-gold font-bold group-hover:scale-105 transition-transform">
              {getInitials(displayName)}
            </div>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-[#1A2418] border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] py-3 z-[100] animate-in fade-in zoom-in-95 duration-200">
              <div className="px-5 py-3 border-b border-white/5 mb-2 bg-white/5 mx-2 rounded-xl">
                <p className="text-[10px] font-bold text-dashboard-text-muted uppercase tracking-widest mb-1">Signed in as</p>
                <p className="text-sm font-bold text-white truncate">{user?.email}</p>
              </div>

              <div className="px-2 space-y-1">
                {(profile?.role === 'admin' || user?.email === 'jhonnybhai@example.com') && (
                  <a href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-accent hover:bg-brand-accent/10 hover:text-brand-accent rounded-lg transition-all whitespace-nowrap group mb-1 border border-brand-accent/20">
                    <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
                    <span className="font-bold">Admin Console</span>
                  </a>
                )}

                <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-brand-gold/10 hover:text-brand-gold rounded-lg transition-all whitespace-nowrap group">
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">person</span>
                  <span className="font-medium">Account Profile</span>
                </a>
                <a href="#" className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-all whitespace-nowrap group">
                  <span className="material-symbols-outlined text-xl group-hover:rotate-45 transition-transform">settings</span>
                  <span className="font-medium">System Settings</span>
                </a>
              </div>

              <div className="h-px bg-white/5 my-2 mx-4"></div>

              <div className="px-2">
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-dashboard-danger hover:bg-dashboard-danger/10 rounded-lg transition-all group"
                >
                  <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">logout</span>
                  <span className="font-bold uppercase tracking-wider text-xs">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}