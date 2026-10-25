import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./styles.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";

registerSW({ immediate: true });

// L'app només guarda logos d'equip: allibera la cache antiga d'imatges.
if (typeof caches !== "undefined") {
  void caches.delete("espn-images");
}

const container = document.getElementById("root");

if (container) {
  createRoot(container).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
