import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { primeTheme } from "./lib/theme";

// Paint the theme before first render so there is no flash of the wrong one.
primeTheme();
import App from "./App";
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
