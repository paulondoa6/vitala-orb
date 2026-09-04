import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { startSync } from "@/core/sync";
import "./index.css";

startSync();

createRoot(document.getElementById("root")!).render(<App />);
