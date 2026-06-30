import { baseApi } from "./baseApi";

// User Settings Types
export interface UserSettings {
  id: number;
  email_notification: boolean;
  push_notification: boolean;
  referral_update: boolean;
  reward_milestone: boolean;
  artwork_alert: boolean;
  msg_comment: boolean;
  profile_visibility: boolean;
  show_email: boolean;
  show_phone: boolean;
  show_location: boolean;
  language: string | null;
  theme: string | null;
  profile_timezone: string | null;
  preferred_currency: string | null;
  created_at: string;
  user: number;
}

export interface UserSettingsResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: UserSettings;
}

export interface UserSettingsRequest {
  email_notification?: boolean;
  push_notification?: boolean;
  referral_update?: boolean;
  reward_milestone?: boolean;
  artwork_alert?: boolean;
  msg_comment?: boolean;
  profile_visibility?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  show_location?: boolean;
  language?: string;
  theme?: string;
  profile_timezone?: string;
  preferred_currency?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data?: Record<string, unknown>;
}

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get User Settings - GET /api/market_final/user_get_settings
    getUserSettings: builder.query<UserSettingsResponse, void>({
      query: () => ({
        url: "/market_final/user_get_settings",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    // Save User Settings - POST /api/market_final/user_settings
    saveUserSettings: builder.mutation<
      UserSettingsResponse,
      UserSettingsRequest
    >({
      query: (body) => ({
        url: "/market_final/user_settings",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    // Change Password - POST /api/market_final/user_change_password
    changePassword: builder.mutation<
      ChangePasswordResponse,
      ChangePasswordRequest
    >({
      query: (body) => ({
        url: "/market_final/user_change_password",
        method: "POST",
        body,
      }),
    }),
  }),
});

// Export hooks
export const {
  useGetUserSettingsQuery,
  useSaveUserSettingsMutation,
  useChangePasswordMutation,
} = settingsApi;

