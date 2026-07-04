import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import App from "@/App";
import "@/index.css";
// FANN design tokens (.fann-landing scope) — imported globally so auth/
// onboarding/dashboard surfaces consume them without the landing chunk.
import "@/styles/landing-tokens.css";
import { store, persistor } from "@/store/store";
import { API_BASE_URL } from "@/services/api/baseApi";

// Fire-and-forget API warm-up. The backend host (free tier) sleeps when idle
// and its first request can take ~25s — long enough that authenticated pages
// looked "hung" (audit BRK-01). Pinging /health while the visitor is still on
// the public pages wakes it before any blocking call is made.
void fetch(`${API_BASE_URL}/health`).catch(() => {
  /* best-effort: offline/blocked is fine */
});

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  );
}
