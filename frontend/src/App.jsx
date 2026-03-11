import "./styles/global.css";
import ExperimentsPage from "./pages/ExperimentsPage";
import { HashRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ExperimentsPage />} />
        <Route path="/login" element={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full text-center text-white">
              <h1 className="text-2xl font-bold mb-4">NutriTech</h1>
              <p className="text-gray-400 mb-8">You have been signed out.</p>
              <a href="#" className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-medium transition-colors inline-block">
                Return to App
              </a>
            </div>
          </div>
        } />
      </Routes>
    </HashRouter>
  )
}

export default App;
