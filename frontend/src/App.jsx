import "./styles/global.css";
import ExperimentsPage from "./pages/ExperimentsPage";
import { HashRouter, Routes, Route } from "react-router-dom";
import VirtualKeyboard from "./components/VirtualKeyboard";

function App() {
  return (
    <HashRouter>
      <VirtualKeyboard />
      <Routes>
        <Route path="/" element={<ExperimentsPage />} />
      </Routes>
    </HashRouter>
  )
}

export default App;
