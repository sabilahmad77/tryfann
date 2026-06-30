import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UserProfileData {
  id: number;
  profile_image: string | null;
  last_login: string | null;
  is_superuser: boolean;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
  is_verify: boolean;
  email: string;
  age: number | null;
  about: string | null;
  website: string[] | string | null;
  socials: unknown[];
  interests: unknown[];
  organization_name: string | null;
  admin_contact_name: string | null;
  address: string | null;
  role: string;
  banner: string | null;
  location: string | null;
  timezone: string | null;
  language: string | null;
  phone_number: string | null;
  bio: string | null;
  points: string;
  referral_code: string;
  profile_step: string;
  profile_completed: boolean;
  try_market: boolean;
  title: string | null;
  focus: string | null;
  years_of_experience: number | string | null;
  instagram_handle: string | null;
  total_referral_clicks: number;
  created_at: string;
  updated_at: string;
  organization: unknown | null;
  region: unknown | null;
  groups: unknown[];
  user_permissions: unknown[];
  profile_visibility?: boolean;
  show_email?: boolean;
  show_phone?: boolean;
  show_location?: boolean;
  // Social media fields
  tiktok_handle?: string | null;
  youtube_handle?: string | null;
  twitter_handle?: string | null;
  instagram_follower?: string | null;
  tiktok_follower?: string | null;
  youtube_subscribers?: string | null;
  twitter_follower?: string | null;
  primary_platform?: string | null;
  content_niche?: string | null;
  // Artist-specific fields
  price_range?: string | null;
  preferred_commission_rate?: string | null;
  shipping_preference?: string | null;
  studio_address?: string | null;
  education?: string | null;
  award_artist?: string | null;
  artist_statement?: string | null;
  // Gallery-specific fields
  organization_email?: string | null;
  organization_main_contact_name?: string | null;
  // Other fields
  profile_partial_completed?: boolean;
  influence_points?: number;
  fann_2fa?: boolean;
  fann_2fa_otp?: string | null;
  fann_2fa_otp_created?: string | null;
  is_deleted?: boolean;
  user_contract?: unknown | null;
  // Gallery extended fields
  organization_type?: string | null;
  founded_year?: string | null;
  exhibition_count?: number | null;
  // Ambassador-specific fields
  promotion_plan?: string | null;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  persona: string | null; // Store persona for onboarding redirects
  profileCompleted: boolean | null; // Store profile completion status
  user: UserProfileData | null; // Store user profile data
}

const initialState: AuthState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  persona: null,
  profileCompleted: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        persona?: string;
        profileCompleted?: boolean;
        user?: UserProfileData;
      }>
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      if (action.payload.persona) {
        state.persona = action.payload.persona;
      }
      if (action.payload.profileCompleted !== undefined) {
        state.profileCompleted = action.payload.profileCompleted;
      }
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    setAccessToken: (
      state,
      action: PayloadAction<{
        token: string;
        profileCompleted?: boolean;
        user?: UserProfileData;
      }>
    ) => {
      state.accessToken = action.payload.token;
      state.isAuthenticated = true;
      if (action.payload.profileCompleted !== undefined) {
        state.profileCompleted = action.payload.profileCompleted;
      }
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    setRefreshTokenAction: (state, action: PayloadAction<string>) => {
      state.refreshToken = action.payload;
    },
    setPersona: (state, action: PayloadAction<string>) => {
      state.persona = action.payload;
    },
    setProfileCompleted: (state, action: PayloadAction<boolean>) => {
      state.profileCompleted = action.payload;
    },
    setUser: (state, action: PayloadAction<UserProfileData>) => {
      state.user = action.payload;
      // Sync profileCompleted from user object if available
      if (action.payload.profile_completed !== undefined) {
        state.profileCompleted = action.payload.profile_completed;
      }
    },
    updateUser: (state, action: PayloadAction<Partial<UserProfileData>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Sync profileCompleted from user object if available
        if (action.payload.profile_completed !== undefined) {
          state.profileCompleted = action.payload.profile_completed;
        }
      }
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.persona = null;
      state.profileCompleted = null;
      state.user = null;
    },
  },
});

export const {
  setTokens,
  setAccessToken,
  setRefreshTokenAction,
  setPersona,
  setProfileCompleted,
  setUser,
  updateUser,
  clearAuth,
} = authSlice.actions;

export default authSlice.reducer;
