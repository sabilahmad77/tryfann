import { baseApi } from "./baseApi";

// Staff-only CRM endpoints (backend enforces is_staff; UI guards too).

export interface AdminOverview {
  totals: {
    applicants: number;
    verified: number;
    pending_reviews: number;
    fraud_flags: number;
  };
  by_role: Record<string, number>;
  tiers: Record<string, number>;
  funnel: {
    landing_views: number;
    roles_selected: number;
    signups_submitted: number;
    accounts_created: number;
    verified: number;
  };
  utm_sources: Record<string, number>;
  generated_at: string;
}

export interface AdminApplicant {
  id: number;
  email: string;
  name: string;
  role: string;
  track: string;
  readiness_score: number;
  completion_pct: number;
  tier: string;
  tier_label: string;
  points: number;
  email_verified: boolean;
  profile_completed: boolean;
  pending_tasks: number;
  fraud_flagged: boolean;
  joined: string | null;
}

export interface AdminPendingTask {
  id: number;
  user_id: number;
  email: string;
  role: string;
  task: string;
  task_title: string;
  points: number;
  payload: Record<string, unknown>;
  submitted: string;
}

export interface AdminPendingKyc {
  id: number;
  user_id: number;
  email: string;
  role: string;
  id_type: string;
  id_number: string | null;
  country: string | null;
  city: string | null;
  dob: string | null;
  submitted: string | null;
}

export interface AdminReferrer {
  id: number;
  email: string;
  role: string;
  referees: {
    id: number;
    email: string;
    role: string;
    verified: boolean;
    credited: boolean;
  }[];
}

export interface AdminContentModule {
  id: number;
  key: string;
  title_en: string;
  description_en: string;
  points: number;
  verification: string;
  roles: string[];
  is_active: boolean;
  publish_at: string | null;
  published: boolean;
  completions: number;
}

export interface AdminContentAnnouncement {
  id: number;
  title_en: string;
  body_en: string;
  is_active: boolean;
  publish_at: string | null;
  published: boolean;
}

interface Envelope<T> {
  success: boolean;
  status_code: number;
  message: Record<string, unknown> | string;
  data: T;
}

export interface ApplicantFilters {
  role?: string;
  track?: string;
  tier?: string;
  q?: string;
}

const toQuery = (f?: ApplicantFilters) => {
  const params = new URLSearchParams();
  Object.entries(f ?? {}).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const s = params.toString();
  return s ? `?${s}` : "";
};

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminOverview: builder.query<Envelope<AdminOverview>, void>({
      query: () => ({ url: "/qualification/admin/overview", method: "GET" }),
      providesTags: ["Leaderboard"],
    }),
    getAdminApplicants: builder.query<
      Envelope<{ applicants: AdminApplicant[] }>,
      ApplicantFilters | undefined
    >({
      query: (filters) => ({
        url: `/qualification/admin/applicants${toQuery(filters)}`,
        method: "GET",
      }),
      providesTags: ["Leaderboard"],
    }),
    applicantAction: builder.mutation<
      Envelope<{ id: number; tier: string; tier_label: string; manual_override: boolean }>,
      { userId: number; action: string; tier?: string }
    >({
      query: ({ userId, action, tier }) => ({
        url: `/qualification/admin/applicants/${userId}/action`,
        method: "POST",
        body: tier ? { action, tier } : { action },
      }),
      invalidatesTags: ["Leaderboard"],
    }),
    getAdminPendingTasks: builder.query<
      Envelope<{ pending: AdminPendingTask[] }>,
      void
    >({
      query: () => ({ url: "/qualification/admin/pending-tasks", method: "GET" }),
      providesTags: ["Leaderboard"],
    }),
    reviewUserTask: builder.mutation<
      Envelope<{ id: number; status: string }>,
      { userTaskId: number; decision: "approve" | "reject" }
    >({
      query: ({ userTaskId, decision }) => ({
        url: `/qualification/admin/user-tasks/${userTaskId}/review`,
        method: "POST",
        body: { decision },
      }),
      invalidatesTags: ["Leaderboard"],
    }),
    getAdminReferralTree: builder.query<
      Envelope<{ referrers: AdminReferrer[] }>,
      void
    >({
      query: () => ({ url: "/qualification/admin/referral-tree", method: "GET" }),
      providesTags: ["Leaderboard"],
    }),
    getAdminPendingKyc: builder.query<
      Envelope<{ pending: AdminPendingKyc[] }>,
      void
    >({
      query: () => ({ url: "/qualification/admin/pending-kyc", method: "GET" }),
      providesTags: ["Leaderboard"],
    }),
    reviewKyc: builder.mutation<
      Envelope<{ id: number; status: string }>,
      { kycId: number; decision: "approve" | "reject" }
    >({
      query: ({ kycId, decision }) => ({
        url: `/qualification/admin/kyc/${kycId}/review`,
        method: "POST",
        body: { decision },
      }),
      invalidatesTags: ["Leaderboard"],
    }),
    getAdminContent: builder.query<
      Envelope<{
        modules: AdminContentModule[];
        announcements: AdminContentAnnouncement[];
      }>,
      void
    >({
      query: () => ({ url: "/qualification/admin/content", method: "GET" }),
      providesTags: ["Leaderboard"],
    }),
    saveAdminContent: builder.mutation<
      Envelope<{ id: number; published?: boolean }>,
      Record<string, unknown>
    >({
      query: (body) => ({
        url: "/qualification/admin/content",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Leaderboard"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAdminOverviewQuery,
  useGetAdminApplicantsQuery,
  useApplicantActionMutation,
  useGetAdminPendingTasksQuery,
  useReviewUserTaskMutation,
  useGetAdminReferralTreeQuery,
  useGetAdminPendingKycQuery,
  useReviewKycMutation,
  useGetAdminContentQuery,
  useSaveAdminContentMutation,
} = adminApi;

export const applicantsCsvUrl = (filters?: ApplicantFilters) =>
  `/qualification/admin/applicants.csv${toQuery(filters)}`;
