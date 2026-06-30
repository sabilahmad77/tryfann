import { useLanguage } from "@/contexts/useLanguage";
import { useGetDashboardStatsQuery } from "@/services/api/dashboardApi";
import type { RootState } from "@/store/store";
import { setProfileCompleted } from "@/store/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { ActivityCard } from "../shared/ActivityCard";
import { AnnouncementsCard } from "../shared/AnnouncementsCard";
import { ConciergePathCard } from "../shared/ConciergePathCard";
import { DashboardLayout } from "../shared/DashboardLayout";
import { DashboardWelcome } from "../shared/DashboardWelcome";
import { MissionsCard } from "../shared/MissionsCard";
import { NextActionCard } from "../shared/NextActionCard";
import { ReadinessCard } from "../shared/ReadinessCard";
import { ReferralQuality } from "../shared/ReferralQuality";
import { URLEncoder } from "../shared/URLEncoder";

// Curator: GAME-track role. Points/referrals/videos apply; no artwork upload
// (curators critique and curate — they don't list works).
const content = {
  en: {
    subtitle: "Shape the conversation around verified physical art",
  },
  ar: {
    subtitle: "شارك في صياغة الحوار حول الفن المادي الموثّق",
  },
};

export function CuratorDashboard() {
  const { language } = useLanguage();
  const t = content[language];
  const dispatch = useDispatch();
  const storedUser = useSelector((state: RootState) => state.auth.user);

  const reduxProfileCompleted = useSelector(
    (state: RootState) => state.auth.profileCompleted
  );

  const { data: dashboardStatsData, refetch: refetchDashboardStats } =
    useGetDashboardStatsQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  const apiProfileCompleted = dashboardStatsData?.data?.profile_complete ?? false;
  const profileCompleted = reduxProfileCompleted ?? apiProfileCompleted;

  useEffect(() => {
    if (dashboardStatsData?.data?.profile_complete !== undefined) {
      const apiValue = dashboardStatsData.data.profile_complete;
      if (reduxProfileCompleted !== apiValue) {
        dispatch(setProfileCompleted(apiValue));
      }
    }
  }, [dashboardStatsData?.data?.profile_complete, reduxProfileCompleted, dispatch]);

  const curatorName = storedUser
    ? `${storedUser.first_name || ""} ${storedUser.last_name || ""}`.trim() ||
      storedUser.title ||
      storedUser.email ||
      "Curator"
    : "Curator";

  return (
    <DashboardLayout currentPage="dashboard">
      <DashboardWelcome userName={curatorName} subtitle={t.subtitle} />

      {/* IA order (game): readiness w/ breakdown -> ONE next action ->
          concierge path (top tier) -> missions -> referral (quality) ->
          activity -> learning. No artwork upload for curators. */}
      <ReadinessCard showLedger={false} />
      <AnnouncementsCard />
      <NextActionCard />
      <ConciergePathCard />
      <MissionsCard />

      {/* Referral — verified-quality strip above the link widget */}
      <div className="mb-6">
        <ReferralQuality clicks={dashboardStatsData?.data?.total_referral_clicks} />
        <URLEncoder
          profileCompleted={profileCompleted}
          statsData={dashboardStatsData?.data}
          isLoadingStats={!dashboardStatsData}
          onRefetchStats={refetchDashboardStats}
        />
      </div>

      {/* Points activity */}
      <ActivityCard />
    </DashboardLayout>
  );
}
