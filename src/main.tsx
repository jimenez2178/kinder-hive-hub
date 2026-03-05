import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Aggressively clean localStorage to prevent QuotaExceededError
try {
  // Remove all non-supabase-auth items first
  const authKey = Object.keys(localStorage).find(k => k.includes("-auth-token"));
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key !== authKey) {
      localStorage.removeItem(key);
    }
  }
} catch {
  localStorage.clear();
}

createRoot(document.getElementById("root")!).render(<App />);
