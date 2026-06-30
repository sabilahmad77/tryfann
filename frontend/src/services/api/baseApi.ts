import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import type { RootState, AppDispatch } from "@/store/store";
import { persistor } from "@/store/store";
import { toast } from "sonner";
import { clearAllAuthState, getAuthToken, getRefreshToken } from "@/utils/auth";
import { extractErrorMessage } from "@/utils/errorMessages";

// Get base URL from environment variable or use default.
// Vite requires the VITE_ prefix to expose env vars to the client.
// Local dev points this at the local Django backend via tryfann/.env.local
// (VITE_API_BASE_URL=/api, proxied to http://localhost:8000 by vite.config).
// Production (Vercel) MUST set VITE_API_BASE_URL=https://api.trifan.com/api at
// build time. The fallback is the standalone Trifan API — never the old FANN.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.trifan.com/api";
export const FE_BASE_URL = "https://trifan.com";
const BASE_URL = API_BASE_URL;


// Create base query with automatic authentication
const baseQueryConfig = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Get token from Redux store (persisted via redux-persist)
    const state = getState() as RootState;
    const token =
      state?.auth?.accessToken || getAuthToken(getState as () => RootState);

    if (token) {
      // API uses Bearer token (as per Postman collection)
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Only set Content-Type for JSON requests (not FormData)
    // FormData requests should let the browser set the Content-Type with boundary
    const contentType = headers.get("content-type");
    if (!contentType) {
      headers.set("Content-Type", "application/json");
    }

    return headers;
  },
});

// Flag to prevent multiple token expiration handlers from running simultaneously
let isHandlingTokenExpiration = false;

// Shared refresh promise to avoid multiple parallel refresh calls
let refreshPromise: Promise<string | null> | null = null;

/**
 * Check if the error response indicates token expiration
 * ONLY checks for the specific API response format:
 * {
 *   "detail": "Given token not valid for any token type",
 *   "code": "token_not_valid",
 *   "messages": [
 *     {
 *       "token_class": "AccessToken",
 *       "token_type": "access",
 *       "message": "Token is expired"
 *     }
 *   ]
 * }
 */
const isTokenExpiredError = (errorData: unknown): boolean => {
  if (!errorData || typeof errorData !== "object") {
    return false;
  }

  const data = errorData as {
    code?: string;
    detail?: string;
    messages?: Array<{
      token_class?: string;
      token_type?: string;
      message?: string;
    }>;
    [key: string]: unknown;
  };

  // Primary check: token_not_valid code (required)
  if (data.code !== "token_not_valid") {
    return false;
  }

  // Secondary validation: Check messages array for access token expiration
  if (data.messages && Array.isArray(data.messages)) {
    const hasExpiredAccessToken = data.messages.some(
      (msg) =>
        msg.token_type === "access" &&
        (msg.message?.toLowerCase().includes("expired") ||
          msg.message?.toLowerCase().includes("token is expired"))
    );
    if (hasExpiredAccessToken) {
      return true;
    }
  }

  // Also check detail message as additional validation
  if (data.detail && typeof data.detail === "string") {
    const detailLower = data.detail.toLowerCase();
    if (
      detailLower.includes("token") &&
      (detailLower.includes("not valid") || detailLower.includes("invalid"))
    ) {
      return true;
    }
  }

  // If code is token_not_valid but no other validation matches, still return true
  // (code is the primary indicator)
  return true;
};

/**
 * Handle token expiration - clear auth and show dialog
 */
const handleTokenExpiration = async (
  api: Parameters<
    BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>
  >[1]
) => {
  if (isHandlingTokenExpiration) {
    return; // Already handling, skip
  }

  isHandlingTokenExpiration = true;

  try {
    // Set flag in window to prevent PrivateRoute from redirecting immediately
    // This flag will be checked by PrivateRoute before redirecting
    if (typeof window !== "undefined") {
      // Set flag BEFORE clearing auth to prevent immediate redirect
      window.__tryfann_handling_token_expiration__ = true;

      // Store the current page before redirecting (optional)
      localStorage.setItem(
        "tryfann_expired_last_visit_page",
        JSON.stringify(window.location.pathname)
      );

      // Trigger token expired dialog using custom event
      // This avoids circular dependencies and allows the dialog to be shown
      // even when API calls fail outside of component context
      // Dispatch event immediately so dialog can show before any navigation
      const event = new CustomEvent("token-expired");
      window.dispatchEvent(event);
    }

    // Clear all auth state, storage, and cache
    // Note: clearExpiredPage is set to false because we want to preserve the expired page
    // for redirect after login (it's set above before clearing)
    await clearAllAuthState(api.dispatch as AppDispatch, persistor, {
      clearExpiredPage: false,   // Keep expired page for redirect after login
    });

    // Reset flag after a short delay to allow for future token expiration handling
    if (typeof window !== "undefined") {
      setTimeout(() => {
        isHandlingTokenExpiration = false;
      }, 1000);
    } else {
      isHandlingTokenExpiration = false;
    }
  } catch (error) {
    console.error("Error handling token expiration:", error);
    isHandlingTokenExpiration = false;
    if (typeof window !== "undefined") {
      window.__tryfann_handling_token_expiration__ = false;
    }
  }
};

/**
 * Try to refresh the access token using the stored refresh token.
 *
 * Uses a shared promise so that multiple failing requests don't trigger
 * parallel refresh calls. Returns the new access token on success, or null
 * if refresh fails for any reason.
 */
const refreshAccessToken = async (
  api: Parameters<
    BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>
  >[1]
): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = getRefreshToken(api.getState as () => RootState);
      if (!refreshToken) {
        return null;
      }

      // Call backend refresh endpoint directly to avoid RTK circular deps
      const response = await fetch(`${BASE_URL}/market_final/token/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const responseData = (await response.json()) as {
        success?: boolean;
        status_code?: number;
        message?: unknown;
        data?: {
          access_token?: string;
          refresh_token?: string;
          access?: string;
          token?: string;
          refresh?: string;
          [key: string]: unknown;
        };
        // Fallback for different response formats
        access?: string;
        token?: string;
        refresh?: string;
        [key: string]: unknown;
      };

      // Extract access token from nested data structure
      // Response format: { success: true, status_code: 200, data: { access_token: "..." } }
      const newAccessToken =
        responseData.data?.access_token ||
        responseData.data?.access ||
        responseData.data?.token ||
        responseData.access ||
        responseData.token;

      if (!newAccessToken || typeof newAccessToken !== "string") {
        return null;
      }

      // Update access token in Redux store
      const { setAccessToken } = await import("@/store/authSlice");
      api.dispatch(
        setAccessToken({
          token: newAccessToken,
        })
      );

      // If backend returns a new refresh token, store it as well
      const newRefreshToken =
        responseData.data?.refresh_token ||
        responseData.data?.refresh ||
        responseData.refresh;

      if (newRefreshToken && typeof newRefreshToken === "string") {
        const { setRefreshTokenAction } = await import("@/store/authSlice");
        api.dispatch(setRefreshTokenAction(newRefreshToken));
      }

      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Intercept base query with error handling and token management
const interceptBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // First attempt with current access token
  let response = await baseQueryConfig(args, api, extraOptions);

  // Get error data from response
  // Check both error.data and response.data (RTK Query may put error in either location)
  let errorData = response.error?.data || (response.data as unknown);

  // Handle token expiration - ONLY check for specific error response format
  // No status code check - only rely on the error response structure
  if (isTokenExpiredError(errorData)) {
    // Avoid trying to refresh when we are already calling the refresh endpoint
    const requestUrl =
      typeof args === "string" ? args : (args as FetchArgs)?.url ?? "";

    const isRefreshRequest =
      typeof requestUrl === "string" && requestUrl.includes("token/refresh");

    if (!isRefreshRequest) {
      // Try to refresh the access token once
      const newAccessToken = await refreshAccessToken(api);

      if (newAccessToken) {
        // Retry the original request with the new token
        response = await baseQueryConfig(args, api, extraOptions);
        errorData = response.error?.data || (response.data as unknown);

        // If retry still indicates token issues, fall back to expiration handling
        if (isTokenExpiredError(errorData)) {
          await handleTokenExpiration(api);
        }
      } else {
        // Refresh failed - clear auth and show dialog
        await handleTokenExpiration(api);
      }
    } else {
      // If the refresh request itself fails with token error, clear auth
      await handleTokenExpiration(api);
    }
  }

  // Handle errors and show toast notifications
  const { meta } = response;
  if (meta?.response?.status && meta.response.status >= 400) {
    // Don't show error toast for token expiration errors (handled by dialog)
    if (!isTokenExpiredError(errorData)) {
      // Pass the full error object to extractErrorMessage
      const errorMessage = extractErrorMessage(
        {
          status: meta.response.status,
          data: response.error?.data || response.data,
        },
        "en" // Default to English, can be made dynamic based on user preference
      );
      toast.error(errorMessage);
    }
  }

  return response;
};

// Create base API slice
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: interceptBaseQuery,
  tagTypes: [
    "User",
    "Auth",
    "Artwork",
    "Gallery",
    "Collection",
    "Region",
    "Redemption",
    "WatchEarn",
    "Leaderboard",
  ],
  endpoints: () => ({}),
});
