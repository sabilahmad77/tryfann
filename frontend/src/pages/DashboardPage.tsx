import { AmbassadorDashboard } from "@/components/dashboard/ambassador/AmbassadorDashboard";
import { AddArtwork } from "@/components/dashboard/artist/AddArtwork";
import { CollectorDashboard } from "@/components/dashboard/collector/CollectorDashboard";
import { GalleryDashboard } from "@/components/dashboard/gallery/GalleryDashboard";
import { CuratorDashboard } from "@/components/dashboard/curator/CuratorDashboard";
import { InvestorDashboard } from "@/components/dashboard/investor/InvestorDashboard";
import { ActivityCard } from "@/components/dashboard/shared/ActivityCard";
import { ConciergePathCard } from "@/components/dashboard/shared/ConciergePathCard";
import { DashboardLayout } from "@/components/dashboard/shared/DashboardLayout";
import { DashboardWelcome } from "@/components/dashboard/shared/DashboardWelcome";
import { MissionsCard } from "@/components/dashboard/shared/MissionsCard";
import { AnnouncementsCard } from "@/components/dashboard/shared/AnnouncementsCard";
import { NextActionCard } from "@/components/dashboard/shared/NextActionCard";
import { ReadinessCard } from "@/components/dashboard/shared/ReadinessCard";
import { ReferralQuality } from "@/components/dashboard/shared/ReferralQuality";
import { isConciergeRole } from "@/utils/roles";
import { URLEncoder } from "@/components/dashboard/shared/URLEncoder";
import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { useGetDashboardStatsQuery } from "@/services/api/dashboardApi";
import type { RootState } from "@/store/store";
import { setProfileCompleted } from "@/store/authSlice";
import { motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const content = {
  en: {
    welcome: "Welcome back",
    subtitles: {
      artist: "Manage your art journey and track your progress",
      collector:
        "Discover and acquire authenticated artwork for your collection",
      gallery: "Manage your gallery and curate exceptional exhibitions",
      ambassador: "Track your performance and grow your influence",
    },
    roles: {
      artist: "Artist",
      collector: "Collector",
      gallery: "Gallery",
      ambassador: "Ambassador",
    },
  },
  ar: {
    welcome: "مرحباً بعودتك",
    subtitles: {
      artist: "إدارة رحلتك الفنية وتتبع تقدمك",
      collector: "اكتشف واقتن الأعمال الفنية الموثقة لمجموعتك",
      gallery: "إدارة معرضك وتنسيق المعارض الاستثنائية",
      ambassador: "تتبع أدائك وزد تأثيرك",
    },
    roles: {
      artist: "فنان",
      collector: "جامع",
      gallery: "معرض",
      ambassador: "سفير",
    },
  },
};

export function DashboardPage() {
  const { language } = useLanguage();
  const t = content[language];
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const storedUser = useSelector((state: RootState) => state.auth.user);

  // Get user role/persona - check role field first, then persona
  const userRole = storedUser?.role?.toLowerCase() || null;
  const persona = useSelector((state: RootState) => state.auth.persona);

  // Read from Redux store first (immediate, no API wait)
  const reduxProfileCompleted = useSelector((state: RootState) => state.auth.profileCompleted);

  // Concierge separation is enforced at the REQUEST level (plan UX-4):
  // Gallery/Investor sessions never call the game-track stats endpoint, so
  // no game payload reaches a concierge user even in data.
  const conciergeSkip = isConciergeRole(userRole || persona?.toLowerCase() || "");

  // Fetch dashboard stats to get profile_complete from API
  const { data: dashboardStatsData, refetch: refetchDashboardStats } = useGetDashboardStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: conciergeSkip,
  });

  // Get profile_complete from API response
  const apiProfileCompleted = dashboardStatsData?.data?.profile_complete ?? false;

  // Use Redux store first, fallback to API if Redux is null
  // This ensures immediate display without waiting for API
  const profileCompleted = reduxProfileCompleted ?? apiProfileCompleted;

  // Sync Redux store when API response comes back with updated value
  useEffect(() => {
    if (dashboardStatsData?.data?.profile_complete !== undefined) {
      const apiValue = dashboardStatsData.data.profile_complete;
      // Only update if different from current Redux value
      if (reduxProfileCompleted !== apiValue) {
        dispatch(setProfileCompleted(apiValue));
      }
    }
  }, [dashboardStatsData?.data?.profile_complete, reduxProfileCompleted, dispatch]);

  // Determine which dashboard to show based on role
  // Role can be: "artist", "gallery", "collector" (case-insensitive)
  const role = userRole || persona?.toLowerCase() || "artist";
  // Concierge roles (investor/gallery/org) never see points/missions widgets.
  const conciergeView = isConciergeRole(role);

  // Render role-based dashboard
  if (role === "collector") {
    return <CollectorDashboard />;
  }

  if (role === "gallery") {
    return <GalleryDashboard />;
  }

  if (role === "ambassador") {
    return <AmbassadorDashboard />;
  }

  if (role === "investor") {
    return <InvestorDashboard />;
  }

  if (role === "curator") {
    return <CuratorDashboard />;
  }

  // Default to Artist Dashboard (existing implementation)
  // Get user name from stored data
  const userName = storedUser
    ? `${storedUser.first_name || ""} ${storedUser.last_name || ""}`.trim() ||
    storedUser.title ||
    storedUser.email ||
    "User"
    : "User";

  // Get user role for display - prioritize storedUser.role, then persona, then default
  // Normalize role to match our content keys (lowercase)
  const displayRoleRaw =
    storedUser?.role?.toLowerCase() || persona?.toLowerCase() || "artist";

  // Validate and map role to our supported roles
  const validRoles: Array<"artist" | "collector" | "gallery" | "ambassador"> = [
    "artist",
    "collector",
    "gallery",
    "ambassador",
  ];
  const displayRole = validRoles.includes(
    displayRoleRaw as "artist" | "collector" | "gallery" | "ambassador"
  )
    ? (displayRoleRaw as "artist" | "collector" | "gallery" | "ambassador")
    : "artist";

  // Get role-based subtitle
  const subtitleKey = displayRole;
  const subtitle = t.subtitles[subtitleKey] || t.subtitles.artist;

  // Handler to navigate to profile completion
  const handleCompleteProfile = () => {
    // Navigate to profile completion page
    navigate(ROUTES.PROFILE_COMPLETION);
  };

  return (
    <DashboardLayout currentPage="dashboard">
      {/* Welcome Section */}
      <DashboardWelcome
        userName={userName}
        subtitle={subtitle}
      />

      {/* IA order (artist/curator game): verification+readiness w/ breakdown ->
          ONE next action -> concierge path (top tier) -> missions -> portfolio
          -> referral (quality) -> activity. */}
      <ReadinessCard showLedger={false} />
      <AnnouncementsCard />
      <NextActionCard />
      <ConciergePathCard />
      <MissionsCard />

      {/* Portfolio + referral + activity (game widgets; hidden for any concierge fallthrough) */}
      {!conciergeView && (
      <>
        {/* My Artworks / portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <AddArtwork
            profileCompleted={profileCompleted}
            onCompleteProfile={handleCompleteProfile}
            onRefetchStats={refetchDashboardStats}
          />
        </motion.div>

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

        {/* Readiness ledger — every entry comes from the server ledger */}
        <ActivityCard />
      </>
      )}
    </DashboardLayout>
  );
}
