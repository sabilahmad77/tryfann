import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import App from "@/App";
import "@/index.css";
// FANN design tokens (.fann-landing scope) — imported globally so auth/
// onboarding/dashboard surfaces consume them without the landing chunk.
import "@/styles/landing-tokens.css";
import { store, persistor } from "@/store/store";

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
