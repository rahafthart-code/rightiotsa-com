import React from "react"; // demo
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Toaster } from "sonner";
import "./index.css";
import "./i18n";
import "mapbox-gl/dist/mapbox-gl.css";

// Auto-recover from stale lazy-chunk references after a new deploy.
// If a dynamic import fails (old hashed file missing), unregister SW,
// drop caches, then hard reload once.
const RELOAD_FLAG = "right_chunk_reloaded";
function isChunkLoadError(err) {
  const msg = (err && (err.message || String(err))) || "";
  return (
    /Importing a module script failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /ChunkLoadError/i.test(msg)
  );
}
async function recoverFromStaleChunks() {
  if (sessionStorage.getItem(RELOAD_FLAG)) return;
  sessionStorage.setItem(RELOAD_FLAG, "1");
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch {}
  window.location.reload();
}
window.addEventListener("error", (e) => {
  if (isChunkLoadError(e.error || e.message)) recoverFromStaleChunks();
});
window.addEventListener("unhandledrejection", (e) => {
  if (isChunkLoadError(e.reason)) recoverFromStaleChunks();
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  </React.StrictMode>
);

