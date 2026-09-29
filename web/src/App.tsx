import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import Dashboard from "./views/Dashboard";
import Projects from "./views/Projects";
import ProjectDetail from "./views/ProjectDetail";
import { SidaBar } from "./componants/SidaBar";

export default function App() {
  const [status, setStatus] = useState("hämtar...");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setStatus(`Servern svarade ${d.time}`))
      .catch((e) => setStatus(`Fel: ${e.message}`));
  }, []);

  return (
    <div className="layout">
      <SidaBar status={status} />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/project" element={<Projects />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
        </Routes>
      </main>
    </div>
  );
}
