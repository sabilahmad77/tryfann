import { baseApi } from "./baseApi";

// API Response Types
export interface ReferralCodeGenerateResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: {
    referral_code: string;
    referral_link: string;
  };
}

export interface ReferralCodeValidateResponse {
  success: boolean;
  status_code: number;
  message: string;
  data: Record<string, unknown>;
}

export interface MarketInsight {
  category: string;
  description: string;
  avg_price: number;
  percentage: number;
}

export interface DashboardStatsResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: {
    total_referral_clicks: number;
    total_points: number;
    referral_link: string;
    influence_points: number;
    provenance_points: number;
    profile_completed: number;
    referral_joined: number;
    first_login: number;
    conversation: number;
    pending: number;
    curator_percentage: number;
    watched_percentage: number;
    total_watch_earn: number;
    user_completed_watch: number;
    referral_count: number;
    artwork_count: number;
    collection_count: number;
    is_referral_code: boolean;
    user_followers: number;
    user_following?: number;
    portfolio_value?: number;
    growth?: number;
    tier_name?: string;
    tier_min_points?: number;
    tier_max_points?: number;
    tier_progress_percentage?: number;
    next_tier_need_points?: number;
    next_tier_name?: string;
    puzzle_completed?: boolean;
    profile_complete?: boolean;
    fann_platform_follower?: number;
    fann_platform_following?: number;
    total_clicks?: number;
    market_insight?: MarketInsight[];
  };
}

// Leaderboard Types
export interface LeaderboardEntry {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  username: string | null;
  profile_image: string | null;
  points: string | null;
  tier: string;
  rank: number;
  is_follow?: boolean; // Only in user leaderboard
  created_at?: string;
}

// User Profile Details - /market_final/view_user_profile/{id}/
export interface UserProfileDetailsResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: {
    id: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string | null;
    role?: string | null;
    profile_image?: string | null;
    points?: string | number | null;
    tier?: string | null;
    // KYC + profile details
    kyc_status?: string | null;
    is_kyc_verified?: boolean;
    bio?: string | null;
    artist_statement?: string | null;
    // Social handles
    instagram_handle?: string | null;
    twitter_handle?: string | null;
    facebook_handle?: string | null;
    linkedin_handle?: string | null;
    // Allow any additional fields without breaking the UI
    [key: string]: unknown;
  };
}

// Public Leaderboard Response (market_final/leaderboard)
export interface LeaderboardResponse {
    all_page: number;
    total_count: number;
    next_page: string | null;
    prev_page: string | null;
    success: boolean;
    data: LeaderboardEntry[];
    last_page: boolean;
}

// Redemption Types
export interface Redemption {
  id: number;
  title: string;
  code: string;
  points: number;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Allow additional fields from API
}

export interface RedemptionListResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: Redemption[] | Redemption;
}

export interface UserRedemptionRequest {
  redeem_id: number;
}

export interface UserRedemptionResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data?: Record<string, unknown>;
}

// Redeem Code Generate Types
export interface RedeemCodeGenerateRequest {
  title: string;
  points: number | string;
}

export interface RedeemCodeGenerateResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: Redemption;
}

// My Redeem List Types
export interface MyRedeemListResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: Redemption[] | Redemption;
}


// WatchEarn Types
export interface WatchEarn {
  id: number;
  title: string;
  link: string;
  points: number;
  is_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  duration?: number; // Optional duration in minutes
  [key: string]: unknown; // Allow additional fields from API
}

export interface WatchEarnListResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: WatchEarn[] | WatchEarn;
}

export interface UserWatchEarnRequest {
  watch_id: number;
}

export interface UserWatchEarnResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data?: Record<string, unknown>;
}

// Progression Types
export interface ProgressionTier {
  id: number;
  name: string;
  points: string;
}

export interface ProgressionResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: ProgressionTier[];
}

// Feedback & Bug Report Types
export interface GeneralFeedbackRequest {
  feedback: string;
  feedback_category: string;
  email?: string;
  feedback_about: string;
  sentiment?: string;
}

export interface IdeasFeedbackRequest {
  title: string;
  describe_idea: string;
  email?: string;
  feedback_category: string;
  feedback_about: string;
}

export type UserFeedbackRequest = GeneralFeedbackRequest | IdeasFeedbackRequest;

export interface UserFeedbackResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data?: Record<string, unknown>;
}

export interface UserReportBugRequest {
  title: string;
  severity: string;
  description: string;
  bug_category: string;
  device_info?: string;
  email?: string;
  bug_image?: File;
}

export interface UserReportBugResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data?: Record<string, unknown>;
}

// Artist Roaster Types
export interface ArtistRoaster {
  id?: number;
  name: string;
  email: string;
  specialty: string;
  status: string;
  artwork_count?: number;
  exhibition_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ArtistRoasterListResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: ArtistRoaster[] | ArtistRoaster;
}

export interface ArtistRoasterCreateRequest {
  name: string;
  email: string;
  specialty: string;
  status: string;
  artwork_count?: number;
  exhibition_count?: number;
}

export interface ArtistRoasterUpdateRequest {
  name?: string;
  email?: string;
  specialty?: string;
  status?: string;
  artwork_count?: number;
  exhibition_count?: number;
}

export interface ArtistRoasterResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: ArtistRoaster;
}

// Artwork Collection Types
export interface ArtworkCollection {
  id?: number;
  title: string;
  artist_name: string;
  year: string;
  description?: string;
  dimensions?: string;
  image?: string;
  medium: string;
  category: string;
  acquisition_date?: string;
  purchase_value?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ArtworkCollectionListResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: ArtworkCollection[] | ArtworkCollection;
}

export interface ArtworkCollectionCreateRequest {
  title: string;
  artist_name: string;
  year: string;
  description?: string;
  dimensions?: string;
  image?: File;
  medium: string;
  category: string;
  acquisition_date?: string;
  purchase_value?: number | string;
}

export interface ArtworkCollectionUpdateRequest {
  title?: string;
  artist_name?: string;
  year?: string;
  description?: string;
  dimensions?: string;
  image?: File;
  medium?: string;
  category?: string;
  acquisition_date?: string;
  purchase_value?: number | string;
}

export interface ArtworkCollectionResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: ArtworkCollection;
}

// Dashboard Stats Gallery Types
export interface DashboardStatsGalleryResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: {
    total_points?: number;
    influence_points?: number;
    provenance_points?: number;
    fann_platform_follower?: number;
    user_followers?: number;
    user_following?: number;
    profile_completed?: number;
    profile_complete?: boolean;
    referral_joined?: number;
    referral_count?: number;
    first_login?: number;
    tier_name?: string;
    tier_min_points?: number;
    tier_max_points?: number;
    tier_progress_percentage?: number;
    referral_link?: string;
    is_referral_code?: boolean;
    total_referral_clicks?: number;
    conversation?: number;
    pending?: number;
    [key: string]: unknown;
  };
}

// Dashboard Stats Ambassador Types
export interface SocialStats {
  instagram_follower?: string | null;
  instagram_engagement?: number;
  instagram_post?: number;
  tiktok_follower?: string | null;
  tiktok_engagement?: number;
  tiktok_post?: number;
  youtube_subscriber?: string | null;
  youtube_engagement?: number;
  youtube_post?: number;
  twitter_follower?: string | null;
  twitter_engagement?: number;
  twitter_post?: number;
}

export interface DashboardStatsAmbassadorResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: {
    your_rank?: number;
    rank_out_of?: number;
    total_reach?: number;
    engagement_rate?: number;
    total_referral_clicks?: number;
    total_points?: number;
    referral_link?: string;
    influence_points?: number;
    provenance_points?: number;
    profile_completed?: number;
    profile_complete?: boolean;
    referral_joined?: number;
    first_login?: number;
    conversation?: number;
    pending?: number;
    curator_percentage?: number;
    watched_percentage?: number;
    total_watch_earn?: number;
    user_completed_watch?: number;
    referral_count?: number;
    artwork_count?: number;
    collection_count?: number;
    is_referral_code?: boolean;
    rewards_point?: number;
    active_referral_count?: number;
    fann_platform_follower?: number;
    user_followers?: number;
    user_following?: number;
    social_stats?: SocialStats;
    [key: string]: unknown;
  };
}

// User Leaderboard Response (market_final/user_leaderboard)
export interface UserLeaderboardResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: {
    all_page: number;
    total_count: number;
    next_page: string | null;
    prev_page: string | null;
    success: boolean;
    data: LeaderboardEntry[];
    last_page: boolean;
    your_rank: number | null;
    total_users: number;
    total_founding_patron: number;
    average_points: number;
  };
}

// Leaderboard Query Parameters
export interface LeaderboardQueryParams {
  filter?: "week" | "month" | "allTime";
  page?: number;
  page_size?: number;
  role?: "Artist" | "Gallery" | "Collector" | "Ambassador";
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Generate Referral Code - GET /api/market_final/referral_code_generate
    generateReferralCode: builder.query<ReferralCodeGenerateResponse, void>({
      query: () => {
        const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
        return {
          url: `/market_final/referral_code_generate${currentUrl ? `?url=${encodeURIComponent(currentUrl)}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["User"],
    }),

    // Validate Referral Code - GET /api/market_final/ref/{code}
    validateReferralCode: builder.query<ReferralCodeValidateResponse, string>({
      query: (code) => ({
        url: `/market_final/ref/${code}`,
        method: "GET",
      }),
    }),

    // Get Dashboard Stats - GET /api/market_final/dashboard_stats
    getDashboardStats: builder.query<DashboardStatsResponse, void>({
      query: () => {
        const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
        return {
          url: `/market_final/dashboard_stats${currentUrl ? `?url=${encodeURIComponent(currentUrl)}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["User"],
    }),

    // Get Leaderboard - GET /api/market_final/leaderboard (public, before login)
    getLeaderboard: builder.query<LeaderboardResponse, LeaderboardQueryParams | undefined>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.filter && params.filter !== "allTime") {
          // Filter is already mapped to "week" or "month" from UI
          queryParams.append("filter", params.filter);
        }
        if (params?.role) {
          queryParams.append("role", params.role);
        }
        if (params?.page) {
          queryParams.append("page", params.page.toString());
        }
        if (params?.page_size) {
          queryParams.append("page_size", params.page_size.toString());
        }
        const queryString = queryParams.toString();
        return {
          url: `/market_final/leaderboard${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["Leaderboard"],
    }),

    // Get Redemption List - GET /api/market_final/redemption
    getRedemptions: builder.query<RedemptionListResponse, void>({
      query: () => ({
        url: "/market_final/redemption",
        method: "GET",
      }),
      providesTags: ["Redemption"],
    }),

    // Get My Redeem List - GET /api/market_final/my_redeem_list
    getMyRedeemList: builder.query<MyRedeemListResponse, void>({
      query: () => ({
        url: "/market_final/my_redeem_list",
        method: "GET",
      }),
      providesTags: ["Redemption"],
    }),

    // User Redemption - POST /api/market_final/user_redemption
    userRedemption: builder.mutation<
      UserRedemptionResponse,
      UserRedemptionRequest
    >({
      query: (body) => ({
        url: "/market_final/user_redemption",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Redemption", "User"], // Only invalidate Redemption and User (for dashboard stats)
    }),

    // Get WatchEarn List - GET /api/market_final/watch_earn
    getWatchEarn: builder.query<WatchEarnListResponse, void>({
      query: () => ({
        url: "/market_final/watch_earn",
        method: "GET",
      }),
      providesTags: ["WatchEarn"],
    }),

    // Get Progression - GET /api/market_final/progression
    getProgression: builder.query<ProgressionResponse, void>({
      query: () => ({
        url: "/market_final/progression",
        method: "GET",
      }),
    }),

    // User WatchEarn - POST /api/market_final/user_watch_earn
    userWatchEarn: builder.mutation<
      UserWatchEarnResponse,
      UserWatchEarnRequest
    >({
      query: (body) => ({
        url: "/market_final/user_watch_earn",
        method: "POST",
        body,
      }),
      invalidatesTags: ["WatchEarn", "User"], // Only invalidate WatchEarn and User (for dashboard stats)
    }),

    // Generate Redeem Code - POST /api/market_final/redeem_code_generate
    generateRedeemCode: builder.mutation<
      RedeemCodeGenerateResponse,
      RedeemCodeGenerateRequest
    >({
      query: (body) => ({
        url: "/market_final/redeem_code_generate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Redemption"],
    }),

    // Get Dashboard Stats Gallery - GET /api/market_final/dashboard_stats_gallery
    getDashboardStatsGallery: builder.query<DashboardStatsGalleryResponse, void>({
      query: () => {
        const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
        return {
          url: `/market_final/dashboard_stats_gallery${currentUrl ? `?url=${encodeURIComponent(currentUrl)}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["User", "Gallery"],
    }),

    // Get Dashboard Stats Ambassador - GET /api/market_final/dashboard_stats_ambassador
    getDashboardStatsAmbassador: builder.query<DashboardStatsAmbassadorResponse, void>({
      query: () => {
        const currentUrl = typeof window !== "undefined" ? window.location.origin : "";
        return {
          url: `/market_final/dashboard_stats_ambassador${currentUrl ? `?url=${encodeURIComponent(currentUrl)}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["User"],
    }),

    // Get User Profile Details - GET /api/market_final/view_user_profile/{id}/
    getUserProfileDetails: builder.query<UserProfileDetailsResponse, number>({
      query: (userId) => ({
        url: `/market_final/view_user_profile/${userId}/`,
        method: "GET",
      }),
      providesTags: (_result, _error, userId) => [{ type: "User", id: userId }],
    }),

    // Get User Leaderboard - GET /api/market_final/user_leaderboard (authenticated, after login)
    getUserLeaderboard: builder.query<UserLeaderboardResponse, LeaderboardQueryParams | undefined>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.filter && params.filter !== "allTime") {
          // Filter is already mapped to "week" or "month" from UI
          queryParams.append("filter", params.filter);
        }
        if (params?.role) {
          queryParams.append("role", params.role);
        }
        if (params?.page) {
          queryParams.append("page", params.page.toString());
        }
        if (params?.page_size) {
          queryParams.append("page_size", params.page_size.toString());
        }
        const queryString = queryParams.toString();
        return {
          url: `/market_final/user_leaderboard${queryString ? `?${queryString}` : ""}`,
          method: "GET",
        };
      },
      providesTags: ["User", "Leaderboard"],
    }),

    // Artist Roaster APIs
    // Get Artist Roaster List - GET /api/market_final/artist_roaster
    getArtistRoaster: builder.query<ArtistRoasterListResponse, void>({
      query: () => ({
        url: "/market_final/artist_roaster",
        method: "GET",
      }),
      providesTags: ["Gallery"],
    }),

    // Get Single Artist Roaster - GET /api/market_final/artist_roaster/{id}
    getArtistRoasterById: builder.query<ArtistRoasterResponse, number>({
      query: (id) => ({
        url: `/market_final/artist_roaster/${id}/`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Gallery", id }],
    }),

    // Create Artist Roaster - POST /api/market_final/artist_roaster/
    createArtistRoaster: builder.mutation<
      ArtistRoasterResponse,
      ArtistRoasterCreateRequest
    >({
      query: (body) => ({
        url: "/market_final/artist_roaster/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Gallery"],
    }),

    // Update Artist Roaster - PUT /api/market_final/artist_roaster/{id}
    updateArtistRoaster: builder.mutation<
      ArtistRoasterResponse,
      { id: number; data: ArtistRoasterUpdateRequest }
    >({
      query: ({ id, data }) => ({
        url: `/market_final/artist_roaster/${id}/`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Gallery", id },
        "Gallery",
      ],
    }),

    // Delete Artist Roaster - DELETE /api/market_final/artist_roaster/{id}
    deleteArtistRoaster: builder.mutation<
      { success: boolean; status_code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/market_final/artist_roaster/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Gallery"],
    }),

    // Artwork Collection APIs
    // Get Artwork Collection List - GET /api/market_final/artwork_collection
    getArtworkCollection: builder.query<ArtworkCollectionListResponse, void>({
      query: () => ({
        url: "/market_final/artwork_collection",
        method: "GET",
      }),
      providesTags: ["Gallery"],
    }),

    // Get Single Artwork Collection - GET /api/market_final/artwork_collection/{id}
    getArtworkCollectionById: builder.query<
      ArtworkCollectionResponse,
      number
    >({
      query: (id) => ({
        url: `/market_final/artwork_collection/${id}/`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Gallery", id }],
    }),

    // Create Artwork Collection - POST /api/market_final/artwork_collection/
    createArtworkCollection: builder.mutation<
      ArtworkCollectionResponse,
      ArtworkCollectionCreateRequest
    >({
      query: (body) => {
        const formData = new FormData();
        formData.append("title", body.title);
        formData.append("artist_name", body.artist_name);
        formData.append("year", body.year);
        formData.append("medium", body.medium);
        formData.append("category", body.category);
        if (body.description) formData.append("description", body.description);
        if (body.dimensions) formData.append("dimensions", body.dimensions);
        if (body.image) formData.append("image", body.image);
        if (body.acquisition_date) formData.append("acquisition_date", body.acquisition_date);
        if (body.purchase_value !== undefined) {
          formData.append("purchase_value", String(body.purchase_value));
        }
        return {
          url: "/market_final/artwork_collection/",
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": undefined as unknown as string,
          },
        };
      },
      invalidatesTags: ["Gallery"],
    }),

    // Update Artwork Collection - PUT /api/market_final/artwork_collection/{id}
    updateArtworkCollection: builder.mutation<
      ArtworkCollectionResponse,
      { id: number; data: ArtworkCollectionUpdateRequest }
    >({
      query: ({ id, data }) => {
        const formData = new FormData();
        if (data.title !== undefined) formData.append("title", data.title);
        if (data.artist_name !== undefined) formData.append("artist_name", data.artist_name);
        if (data.year !== undefined) formData.append("year", data.year);
        if (data.medium !== undefined) formData.append("medium", data.medium);
        if (data.category !== undefined) formData.append("category", data.category);
        if (data.description !== undefined) formData.append("description", data.description);
        if (data.dimensions !== undefined) formData.append("dimensions", data.dimensions);
        if (data.image) formData.append("image", data.image);
        if (data.acquisition_date !== undefined) {
          formData.append("acquisition_date", data.acquisition_date);
        }
        if (data.purchase_value !== undefined) {
          formData.append("purchase_value", String(data.purchase_value));
        }
        return {
          url: `/market_final/artwork_collection/${id}/`,
          method: "PUT",
          body: formData,
          headers: {
            "Content-Type": undefined as unknown as string,
          },
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Gallery", id },
        "Gallery",
      ],
    }),

    // Delete Artwork Collection - DELETE /api/market_final/artwork_collection/{id}
    deleteArtworkCollection: builder.mutation<
      { success: boolean; status_code: number; message: string },
      number
    >({
      query: (id) => ({
        url: `/market_final/artwork_collection/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: ["Gallery"],
    }),

    // Follow User - POST /api/market_final/follow_user
    followUser: builder.mutation<
      {
        success: boolean;
        status_code: number;
        message: Record<string, unknown> | string;
        data?: Record<string, unknown>;
      },
      { follow_to: number }
    >({
      query: (body) => ({
        url: "/market_final/follow_user",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Leaderboard"],
    }),

    // Send User Feedback - POST /api/market_final/user_feedback
    sendFeedback: builder.mutation<UserFeedbackResponse, UserFeedbackRequest>({
      query: (body) => ({
        url: "/market_final/user_feedback",
        method: "POST",
        body,
      }),
    }),

    // Report Bug - POST /api/market_final/user_report_bug
    reportBug: builder.mutation<UserReportBugResponse, UserReportBugRequest>({
      query: (body) => {
        const formData = new FormData();
        formData.append("title", body.title);
        formData.append("severity", body.severity);
        formData.append("description", body.description);
        formData.append("bug_category", body.bug_category);
        if (body.device_info) {
          formData.append("device_info", body.device_info);
        }
        if (body.email) {
          formData.append("email", body.email);
        }
        if (body.bug_image) {
          formData.append("bug_image", body.bug_image);
        }

        return {
          url: "/market_final/user_report_bug",
          method: "POST",
          body: formData,
        };
      },
    }),

  }),
});

// Export hooks
export const {
  useGenerateReferralCodeQuery,
  useLazyGenerateReferralCodeQuery,
  useValidateReferralCodeQuery,
  useLazyValidateReferralCodeQuery,
  useGetDashboardStatsQuery,
  useGetLeaderboardQuery,
  useGetRedemptionsQuery,
  useGetMyRedeemListQuery,
  useUserRedemptionMutation,
  useGetWatchEarnQuery,
  useUserWatchEarnMutation,
  useGenerateRedeemCodeMutation,
  useGetProgressionQuery,
  useGetDashboardStatsGalleryQuery,
  useGetDashboardStatsAmbassadorQuery,
  useGetUserProfileDetailsQuery,
  useGetUserLeaderboardQuery,
  useGetArtistRoasterQuery,
  useGetArtistRoasterByIdQuery,
  useCreateArtistRoasterMutation,
  useUpdateArtistRoasterMutation,
  useDeleteArtistRoasterMutation,
  useGetArtworkCollectionQuery,
  useGetArtworkCollectionByIdQuery,
  useCreateArtworkCollectionMutation,
  useUpdateArtworkCollectionMutation,
    useDeleteArtworkCollectionMutation,
    useFollowUserMutation,
  useSendFeedbackMutation,
  useReportBugMutation,
} = dashboardApi;
