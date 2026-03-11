import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./styles/global.css";
import ExperimentsPage from "./pages/ExperimentsPage";
import Login from "./pages/Login";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import VirtualKeyboard from "./components/VirtualKeyboard";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500 font-medium">
        <span className="material-symbols-outlined animate-spin text-4xl mb-4">refresh</span>
        Loading...
      </div>
    );
  }

  return (
    <HashRouter>
      <VirtualKeyboard />
      <Routes>
        <Route 
          path="/" 
          element={session ? <ExperimentsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/login" 
          element={!session ? <Login /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </HashRouter>
  )
}

export default App;
