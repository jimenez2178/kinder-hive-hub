import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Clean up localStorage if it's near quota to prevent QuotaExceededError
try {
  const testKey = "__storage_test__";
  localStorage.setItem(testKey, "x");
  localStorage.removeItem(testKey);
} catch {
  // Storage is full — clear non-essential items
  const keysToKeep: string[] = [];
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && !key.startsWith("sb-")) {
      localStorage.removeItem(key);
    }
  }
  // If still full, clear everything
  try {
    localStorage.setItem("__storage_test__", "x");
    localStorage.removeItem("__storage_test__");
  } catch {
    localStorage.clear();
  }
}

createRoot(document.getElementById("root")!).render(<App />);
