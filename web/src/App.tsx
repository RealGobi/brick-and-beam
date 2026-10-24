import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router";
import Dashboard from "./views/Dashboard";
import Projects from "./views/Projects";
import ProjectDetail from "./views/ProjectDetail";
import Service from "./views/Service";
import ProductDetail from "./views/ProductDetail";
import { SidaBar } from "./componants/SidaBar";
import { useNotifications } from "./hooks/useNotifications";

export default function App() {
  const [status, setStatus] = useState("Ansluter…");
  const notifications = useNotifications();

  useEffect(() => {
    fetch("/api/health")
      .then((response) => setStatus(response.ok ? "● Ansluten" : "Ingen kontakt med servern"))
      .catch(() => setStatus("Ingen kontakt med servern"));
  }, []);

  return (
    <div className="layout">
      <SidaBar status={status} notifications={notifications} />
      <main className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/project" element={<Projects />} />
          <Route path="/project/:projectId" element={<ProjectDetail />} />
          <Route path="/service" element={<Service />} />
          <Route path="/service/:productId" element={<ProductDetail />} />
        </Routes>
      </main>
    </div>
  );
}
