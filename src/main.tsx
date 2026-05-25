import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { registerArkaneServiceWorker } from "./pwa";
import "./styles.css";

registerArkaneServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
