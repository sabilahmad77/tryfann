import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "@/App";
import "@/index.css";
// FANN design tokens (.fann-landing scope) — imported globally so auth/
// onboarding/dashboard surfaces consume them without the landing chunk.
import "@/styles/landing-tokens.css";
import { store, persistor } from "@/store/store";
import { API_BASE_URL } from "@/services/api/baseApi";

// Google Sign-In client id (Web). Absent until provisioned — the provider is
// only mounted when it exists, so the app runs fine without it.
const GOOGLE_CLIENT_ID =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ||
  "931583651800-6u5490dlihpoc3k44i45tdau2tiooj0a.apps.googleusercontent.com";

// Fire-and-forget API warm-up. The backend host (free tier) sleeps when idle
// and its first request can take ~25s — long enough that authenticated pages
// looked "hung" (audit BRK-01). Pinging /health while the visitor is still on
// the public pages wakes it before any blocking call is made.
void fetch(`${API_BASE_URL}/health`).catch(() => {
  /* best-effort: offline/blocked is fine */
});

const rootElement = document.getElementById("root");
if (rootElement) {
  const tree = (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  );
  createRoot(rootElement).render(
    GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{tree}</GoogleOAuthProvider>
    ) : (
      tree
    )
  );
}
