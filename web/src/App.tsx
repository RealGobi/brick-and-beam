import { useEffect, useState } from "react";

export default function App() {
  const [status, setStatus] = useState("hämtar...");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setStatus(`OK — servern svarade ${d.time}`))
      .catch((e) => setStatus(`Fel: ${e.message}`));
  }, []);

  return (
    <main>
      <h1>Brick & Beam</h1>
      <p>{status}</p>
    </main>
  );
}
