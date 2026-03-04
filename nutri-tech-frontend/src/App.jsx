import "./styles/global.css";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MyFarm from "./pages/MyFarm";
import AdminDashboard from "./pages/AdminDashboard";
import ExperimentsPage from "./pages/ExperimentsPage";
import Protected from "./components/Protected";
import AdminRoute from "./components/auth/AdminRoute";
import { HashRouter, Routes, Route } from "react-router-dom";
import VirtualKeyboard from "./components/VirtualKeyboard";

function App() {
  return (
    <HashRouter>
      <VirtualKeyboard />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/my-farm" element={<MyFarm />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/experiments" element={<ExperimentsPage />} />
      </Routes>
    </HashRouter>
  )
}

export default App;
