import { baseApi } from "./baseApi";

// Server-computed qualification snapshot. Points / readiness_score / ledger are
// present ONLY for the game track — the backend omits them for concierge
// (gallery / investor) roles, so they are optional here.
export interface QualificationMe {
  role: string;
  track: "game" | "concierge";
  completion_pct: number;
  tier: string;
  tier_label: string;
  tier_order: string[];
  verification: {
    email_verified: boolean;
    profile_completed: boolean;
    kyc_approved: boolean;
  };
  points?: number;
  readiness_score?: number;
  verified_referrals?: number;
  // Server-computed verification signals (game track only).
  signals?: {
    email_verified: boolean;
    profile_completed: boolean;
    kyc_approved: boolean;
    verified_referrals: number;
    approved_tasks: number;
  };
  // The six §3.1 Readiness Score components (game track only): the only honest
  // source for the "what's earning / what's missing" Readiness Ledger.
  components?: { key: string; earned: number; max: number }[];
  score_weights?: Record<string, number>;
  ledger?: { delta: number; reason: string; source: string; created_at: string }[];
  // §3 FANN updates — announcements published/scheduled by the super admin.
  announcements?: {
    title: string;
    title_ar?: string;
    body: string;
    published_at: string;
  }[];
}

export interface QualificationMeResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: QualificationMe;
}

export interface AnalyticsEventBody {
  name: string;
  props?: Record<string, unknown>;
  session_id?: string;
}

export interface QualificationTask {
  key: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  points: number;
  verification: "instant" | "manual";
  status: "available" | "pending" | "approved" | "rejected";
}

export interface MyTasksResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: { tasks: QualificationTask[] };
}

export interface CompleteTaskResponse {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: { task: string; status: string; me: QualificationMe };
}

export const qualificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQualificationMe: builder.query<QualificationMeResponse, void>({
      query: () => ({ url: "/qualification/me", method: "GET" }),
      // Reuse the existing "User" tag so role-profile updates refetch this.
      providesTags: ["User"],
    }),
    updateRoleProfile: builder.mutation<
      QualificationMeResponse,
      { details?: Record<string, unknown>; role?: string }
    >({
      query: (body) => ({
        url: "/qualification/role-profile",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),
    trackEvent: builder.mutation<{ success: boolean }, AnalyticsEventBody>({
      query: (body) => ({
        url: "/qualification/analytics/events",
        method: "POST",
        body,
      }),
    }),
    getMyTasks: builder.query<MyTasksResponse, void>({
      query: () => ({ url: "/qualification/me/tasks", method: "GET" }),
      providesTags: ["User"],
    }),
    completeTask: builder.mutation<
      CompleteTaskResponse,
      { key: string; payload?: Record<string, unknown> }
    >({
      query: ({ key, payload }) => ({
        url: `/qualification/me/tasks/${key}/complete`,
        method: "POST",
        body: payload ?? {},
      }),
      // Refresh /me (points, score, tier) and the task list together.
      invalidatesTags: ["User"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetQualificationMeQuery,
  useUpdateRoleProfileMutation,
  useTrackEventMutation,
  useGetMyTasksQuery,
  useCompleteTaskMutation,
} = qualificationApi;
