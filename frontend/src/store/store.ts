import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { baseApi } from "@/services/api/baseApi";
// Import API services to ensure they're initialized and hooks are available
import "@/services/api/onboardingApi";
import "@/services/api/dashboardApi";
import "@/services/api/settingsApi";
import authReducer from "./authSlice";
import onboardingReducer from "./onboardingSlice";

// Redux persist configuration for auth slice
const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: [
    "accessToken",
    "refreshToken",
    "isAuthenticated",
    "persona",
    "profileCompleted",
    "user",
  ], // Persist these fields
};

// Redux persist configuration for onboarding slice
const onboardingPersistConfig = {
  key: "onboarding",
  storage,
  whitelist: [
    "currentStep",
    "onboardingData",
    "submittedSteps",
    "submittedData",
  ], // Persist all onboarding state
};

// Create persisted reducers
const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedOnboardingReducer = persistReducer(
  onboardingPersistConfig,
  onboardingReducer
);

export const store = configureStore({
  reducer: {
    // Add the generated reducer as a specific top-level slice
    [baseApi.reducerPath]: baseApi.reducer,
    // Auth reducer with persistence
    auth: persistedAuthReducer,
    // Onboarding reducer with persistence
    onboarding: persistedOnboardingReducer,
  },
  // Adding the api middleware enables caching, invalidation, polling,
  // and other useful features of `rtk-query`.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
});

// Create persistor for the store
export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
