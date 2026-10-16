import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@/core/i18n";
import { startSync } from "@/core/sync";
import { registerPWA } from "@/core/pwa";
import "./index.css";

startSync();
void registerPWA();

createRoot(document.getElementById("root")!).render(<App />);
