import { baseApi } from "./baseApi";

// ============================================================================
// Profile Setup API Types
// ============================================================================

export interface ProfileSetupRequest {
  title: string;
  bio: string;
  website?: string;
  profile_image?: File;
  focus?: string;
  content_niche?: string;
  years_of_experience?: number | string;
  instagram_handle?: string;
  instagram_follower?: string;
  tiktok_handle?: string;
  tiktok_follower?: string;
  youtube_handle?: string;
  youtube_subscribers?: string;
  twitter_handle?: string;
  twitter_follower?: string;
  primary_platform?: string;
  location?: string;
  phone_number?: string;
  // Artist / Collector shared
  price_range?: string;
  // Artist-specific
  preferred_commission_rate?: string;
  shipping_preference?: string;
  studio_address?: string;
  education?: string;
  award_artist?: string;
  artist_statement?: string;
  // Gallery-specific
  organization_type?: string;
  organization_email?: string;
  organization_main_contact_name?: string;
  organization_name?: string;
  founded_year?: string | number;
  exhibition_count?: string | number;
  // Ambassador-specific
  promotion_plan?: string;
}

export interface ProfileSetupResponse {
  success: boolean;
  status_code: number;
  message: string | Record<string, unknown>;
  data?: unknown;
}

// ============================================================================
// Interests API Types
// ============================================================================

export interface InterestsRequest {
  art_style: string[];
  geographic_interset: string[];
  preferred_time_periods: string[];
  price_interset: string;
}

export interface InterestsResponse {
  success: boolean;
  status_code: number;
  message: string | Record<string, unknown>;
  data?: unknown;
}

// ============================================================================
// KYC Verification API Types
// ============================================================================

export interface KYCVerificationRequest {
  id_number: string;
  dob: string; // Format: YYYY-MM-DD
  country: string;
  state: string;
  city: string;
  postal_code: string;
  street_address?: string;
  id_type?: string;
  gov_issued_id?: File; // Legacy single file
  gov_issued_id_front?: File; // Front of ID
  gov_issued_id_back?: File; // Back of ID
  proof_address?: File;
  // Artist-specific fields
  social_link_handler?: string;
  social_link_followers?: string;
}

export interface KYCVerificationResponse {
  success: boolean;
  status_code: number;
  message: string | Record<string, unknown>;
  data?: unknown;
}

// ============================================================================
// Rewards/Gamification API Types
// ============================================================================

export interface RewardsRequest {
  goal_type: string | string[];
  points_reward?: string | string[];
}

export interface RewardsResponse {
  success: boolean;
  status_code: number;
  message: string | Record<string, unknown>;
  data?: unknown;
}

// ============================================================================
// Dropdown Options API Types
// ============================================================================

export interface DropdownOption {
  id?: number;
  name?: string;
  range?: string;
  value?: string;
  label?: string;
  [key: string]: unknown;
}

export interface DropdownOptionsResponse {
  success: boolean;
  status_code: number;
  message: string | Record<string, unknown>;
  data?: DropdownOption[] | DropdownOption | string[];
}

// ============================================================================
// Onboarding API Endpoints
// ============================================================================

export const onboardingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Profile Setup - matches Postman: POST /api/market_final/profile_setup
    profileSetup: builder.mutation<ProfileSetupResponse, ProfileSetupRequest>({
      query: (formData) => {
        // Create FormData for file upload
        const body = new FormData();
        body.append("title", formData.title);
        body.append("bio", formData.bio);

        if (formData.website) {
          body.append("website", formData.website);
        }
        if (formData.profile_image) {
          body.append("profile_image", formData.profile_image);
        }
        if (formData.focus) {
          body.append("focus", formData.focus);
        }
        if (formData.content_niche) {
          body.append("content_niche", formData.content_niche);
        }
        if (
          formData.years_of_experience !== undefined &&
          formData.years_of_experience !== null &&
          formData.years_of_experience !== ""
        ) {
          body.append(
            "years_of_experience",
            String(formData.years_of_experience)
          );
        }
        if (formData.instagram_handle) {
          body.append("instagram_handle", formData.instagram_handle);
        }
        if (formData.instagram_follower) {
          body.append("instagram_follower", formData.instagram_follower);
        }
        if (formData.tiktok_handle) {
          body.append("tiktok_handle", formData.tiktok_handle);
        }
        if (formData.tiktok_follower) {
          body.append("tiktok_follower", formData.tiktok_follower);
        }
        if (formData.youtube_handle) {
          body.append("youtube_handle", formData.youtube_handle);
        }
        if (formData.youtube_subscribers) {
          body.append("youtube_subscribers", formData.youtube_subscribers);
        }
        if (formData.twitter_handle) {
          body.append("twitter_handle", formData.twitter_handle);
        }
        if (formData.twitter_follower) {
          body.append("twitter_follower", formData.twitter_follower);
        }
        if (formData.content_niche) {
          body.append("content_niche", formData.content_niche);
        }
        if (formData.primary_platform) {
          body.append("primary_platform", formData.primary_platform);
        }
        if (formData.location) {
          body.append("location", formData.location);
        }
        if (formData.phone_number) {
          body.append("phone_number", formData.phone_number);
        }
        // Artist / Collector shared
        if (formData.price_range) {
          body.append("price_range", formData.price_range);
        }
        // Artist-specific
        if (formData.preferred_commission_rate) {
          body.append(
            "preferred_commission_rate",
            formData.preferred_commission_rate
          );
        }
        if (formData.shipping_preference) {
          body.append("shipping_preference", formData.shipping_preference);
        }
        if (formData.studio_address) {
          body.append("studio_address", formData.studio_address);
        }
        if (formData.education) {
          body.append("education", formData.education);
        }
        if (formData.award_artist) {
          body.append("award_artist", formData.award_artist);
        }
        if (formData.artist_statement) {
          body.append("artist_statement", formData.artist_statement);
        }
        // Gallery-specific
        if (formData.organization_type) {
          body.append("organization_type", formData.organization_type);
        }
        if (formData.organization_email) {
          body.append("organization_email", formData.organization_email);
        }
        if (formData.organization_main_contact_name) {
          body.append(
            "organization_main_contact_name",
            formData.organization_main_contact_name
          );
        }
        if (formData.organization_name) {
          body.append("organization_name", formData.organization_name);
        }
        if (formData.founded_year !== undefined && formData.founded_year !== null && formData.founded_year !== "") {
          body.append("founded_year", String(formData.founded_year));
        }
        if (formData.exhibition_count !== undefined && formData.exhibition_count !== null && formData.exhibition_count !== "") {
          body.append("exhibition_count", String(formData.exhibition_count));
        }
        // Ambassador-specific
        if (formData.promotion_plan) {
          body.append("promotion_plan", formData.promotion_plan);
        }
        return {
          url: "/market_final/profile_setup",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["User"],
    }),

    // User Interests - matches Postman: POST /api/market_final/user_interest
    userInterests: builder.mutation<InterestsResponse, InterestsRequest>({
      query: (data) => ({
        url: "/market_final/user_interest",
        method: "POST",
        body: {
          art_style: data.art_style,
          geographic_interset: data.geographic_interset,
          preferred_time_periods: data.preferred_time_periods,
          price_interset: data.price_interset,
        },
      }),
      invalidatesTags: ["User"],
    }),

    // KYC Verification - matches Postman: POST /api/market_final/kyc_verification
    kycVerification: builder.mutation<
      KYCVerificationResponse,
      KYCVerificationRequest
    >({
      query: (formData) => {
        // Create FormData for file uploads
        const body = new FormData();
        body.append("id_number", formData.id_number);
        body.append("dob", formData.dob);
        body.append("country", formData.country);
        body.append("state", formData.state);
        body.append("city", formData.city);
        body.append("postal_code", formData.postal_code);
        if (formData.street_address) {
          body.append("street_address", formData.street_address);
        }
        if (formData.id_type) {
          body.append("id_type", formData.id_type);
        }

        // Only append files if they are provided
        // Support both legacy single file and new front/back format
        if (formData.gov_issued_id) {
          body.append("gov_issued_id", formData.gov_issued_id);
        }
        if (formData.gov_issued_id_front) {
          body.append("gov_issued_id_front", formData.gov_issued_id_front);
        }
        if (formData.gov_issued_id_back) {
          body.append("gov_issued_id_back", formData.gov_issued_id_back);
        }
        if (formData.proof_address) {
          body.append("proof_address", formData.proof_address);
        }

        // Artist-specific fields
        if (formData.social_link_handler) {
          body.append("social_link_handler", formData.social_link_handler);
        }
        if (formData.social_link_followers) {
          body.append("social_link_followers", formData.social_link_followers);
        }

        return {
          url: "/market_final/kyc_verification",
          method: "POST",
          body,
        };
      },
      invalidatesTags: ["User"],
    }),

    // Rewards/Gamification - matches Postman: POST /api/market_final/reward
    // Supports both single goal and multiple goals (array)
    rewards: builder.mutation<RewardsResponse, RewardsRequest>({
      query: (data) => ({
        url: "/market_final/reward",
        method: "POST",
        body: {
          goal_type: data.goal_type,
          ...(data.points_reward && { points_reward: data.points_reward }),
        },
      }),
      invalidatesTags: ["User"],
    }),

    // TryFann Point 2: persist a role's schema-driven application answers.
    // Merges application_data and (optionally) advances profile_step.
    saveRoleApplication: builder.mutation<
      ProfileSetupResponse,
      {
        application_data: Record<string, unknown>;
        profile_step?: number | string;
        profile_completed?: boolean;
      }
    >({
      query: (data) => ({
        url: "/market_final/role_application",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),

    // Get Instagram Follower Options - matches Postman: GET /api/market_final/instagram_follower
    getInstagramFollowerOptions: builder.query<DropdownOptionsResponse, void>({
      query: () => ({
        url: "/market_final/instagram_follower",
        method: "GET",
      }),
    }),

    // Get Twitter Follower Options - matches Postman: GET /api/market_final/twitter_follower
    getTwitterFollowerOptions: builder.query<DropdownOptionsResponse, void>({
      query: () => ({
        url: "/market_final/twitter_follower",
        method: "GET",
      }),
    }),

    // Get YouTube Subscriber Options - matches Postman: GET /api/market_final/youtube_subscriber
    getYoutubeSubscriberOptions: builder.query<DropdownOptionsResponse, void>({
      query: () => ({
        url: "/market_final/youtube_subscriber",
        method: "GET",
      }),
    }),

    // Get Primary Platform Options - matches Postman: GET /api/market_final/primary_platform
    getPrimaryPlatformOptions: builder.query<DropdownOptionsResponse, void>({
      query: () => ({
        url: "/market_final/primary_platform",
        method: "GET",
      }),
    }),

    // Get Artist Price Range Options - matches Postman: GET /api/market_final/artist_price_range
    // Expected API shape (per collection):
    // { success, status_code, message, data: [{ id, range, ... }] }
    getArtistPriceRangeOptions: builder.query<DropdownOptionsResponse, void>({
      query: () => ({
        url: "/market_final/artist_price_range",
        method: "GET",
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useProfileSetupMutation,
  useUserInterestsMutation,
  useKycVerificationMutation,
  useRewardsMutation,
  useSaveRoleApplicationMutation,
  useGetInstagramFollowerOptionsQuery,
  useGetTwitterFollowerOptionsQuery,
  useGetYoutubeSubscriberOptionsQuery,
  useGetPrimaryPlatformOptionsQuery,
  useGetArtistPriceRangeOptionsQuery,
} = onboardingApi;
