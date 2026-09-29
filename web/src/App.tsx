import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import Dashboard from "./views/Dashboard";
import Projects from "./views/Projects";
import ProjectDetail from "./views/ProjectDetail";
import { SidaBar } from "./componants/SidaBar";

export default function App() {
  const [status, setStatus] = useState("Ansluter…");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => setStatus(response.ok ? "● Ansluten" : "Ingen kontakt med servern"))
      .catch(() => setStatus("Ingen kontakt med servern"));
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
