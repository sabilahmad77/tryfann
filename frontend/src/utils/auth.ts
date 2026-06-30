/**
 * Authentication utility functions
 * Handles token retrieval from Redux store
 * Note: Tokens are stored in Redux store and persisted via redux-persist
 */

import type { AppDispatch } from "@/store/store";
import type { Persistor } from "redux-persist";
import { baseApi } from "@/services/api/baseApi";
import { clearAuth } from "@/store/authSlice";
import { resetOnboarding } from "@/store/onboardingSlice";

// LocalStorage keys
export const REMEMBERED_EMAIL_KEY = "fann_remembered_email";
export const REMEMBERED_PASSWORD_KEY = "fann_remembered_password";
export const EXPIRED_LAST_VISIT_PAGE_KEY = "tryfann_expired_last_visit_page";
export const PERSIST_AUTH_KEY = "persist:auth";
export const PERSIST_ONBOARDING_KEY = "persist:onboarding";

/**
 * Clears all authentication-related state, storage, and cache
 * Use this function for logout, relogin, signup, and token expiration scenarios
 * 
 * Note: REMEMBERED_EMAIL_KEY and REMEMBERED_PASSWORD_KEY are NOT cleared by this function
 * to preserve "remember me" functionality across sessions.
 * 
 * @param dispatch - Redux dispatch function (AppDispatch type)
 * @param persistor - Redux-persist persistor instance
 * @param options - Optional configuration object
 * @param options.clearExpiredPage - Whether to clear expired last visit page (default: true)
 */
export const clearAllAuthState = async (
  dispatch: AppDispatch,
  persistor: Persistor,
  options?: {
    clearExpiredPage?: boolean;
  }
): Promise<void> => {
  const { clearExpiredPage = true } = options || {};

  // 1. Clear RTK Query cache
  dispatch(baseApi.util.resetApiState());

  // 2. Clear Redux auth state
  dispatch(clearAuth());

  // 3. Clear Redux onboarding state
  dispatch(resetOnboarding());

  // 4. Clear localStorage items
  localStorage.removeItem(PERSIST_AUTH_KEY);
  localStorage.removeItem(PERSIST_ONBOARDING_KEY);
  
  // Note: REMEMBERED_EMAIL_KEY and REMEMBERED_PASSWORD_KEY are intentionally NOT cleared
  // to preserve "remember me" functionality
  
  if (clearExpiredPage) {
    localStorage.removeItem(EXPIRED_LAST_VISIT_PAGE_KEY);
  }

  // 5. Purge redux-persist storage
  await persistor.purge();
};

/**
 * Get authentication token from Redux store (via getState callback)
 */
export const getAuthToken = (getState?: () => { auth?: { accessToken: string | null } }): string | null => {
  if (typeof window === 'undefined') return null;
  
  if (getState) {
    try {
      const state = getState();
      return state?.auth?.accessToken || null;
    } catch {
      return null;
    }
  }
  
  return null;
};

/**
 * Get refresh token from Redux store (via getState callback)
 */
export const getRefreshToken = (getState?: () => { auth?: { refreshToken: string | null } }): string | null => {
  if (typeof window === 'undefined') return null;
  
  if (getState) {
    try {
      const state = getState();
      return state?.auth?.refreshToken || null;
    } catch {
      return null;
    }
  }
  
  return null;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (getState?: () => { auth?: { isAuthenticated: boolean } }): boolean => {
  if (typeof window === 'undefined') return false;
  
  if (getState) {
    try {
      const state = getState();
      return state?.auth?.isAuthenticated || false;
    } catch {
      return false;
    }
  }
  
  return false;
};

