import { useLanguage } from "@/contexts/useLanguage";
import { useGetDashboardStatsGalleryQuery } from "@/services/api/dashboardApi";
import type { RootState } from "@/store/store";
import { setProfileCompleted } from "@/store/authSlice";
import { motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ApplicationStatusCard } from "../shared/ApplicationStatusCard";
import { ConciergeContactCard } from "../shared/ConciergeContactCard";
import { DashboardLayout } from "../shared/DashboardLayout";
import { DashboardWelcome } from "../shared/DashboardWelcome";
import { CompleteProfile } from "../shared/CompleteProfile";
import { FannUpdatesCard } from "../shared/FannUpdatesCard";
import { ArtistRoster } from "./ArtistRoster";
import { AddArtwork } from "../artist/AddArtwork";
import { ROUTES } from "@/routes/paths";

// Gallery is a CONCIERGE role (mandate §2): no points / missions / leaderboard.
// This dashboard shows verification-led readiness + genuine gallery tools only.
const content = {
  en: {
    subtitle: "Curate your gallery and connect with verified collectors",
    conciergeTitle: "Concierge onboarding",
    conciergeBody:
      "Galleries join on our concierge track — a dedicated advisor guides your verification and roster setup. No points, no missions: a curated path to founding access.",
    toolsTitle: "Gallery tools",
  },
  ar: {
    subtitle: "نسّق معرضك وتواصل مع جامعين موثوقين",
    conciergeTitle: "إعداد مخصّص",
    conciergeBody:
      "تنضم المعارض على المسار المخصّص — يرشدك مستشار مخصّص خلال التحقق وإعداد قائمة الفنانين. بلا نقاط أو مهام: مسار منسّق نحو وصول المؤسسين.",
    toolsTitle: "أدوات المعرض",
  },
};

export function GalleryDashboard() {
  const { language } = useLanguage();
  const t = content[language];
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const storedUser = useSelector((state: RootState) => state.auth.user);

  const handleCompleteProfile = () => {
    navigate(ROUTES.PROFILE_COMPLETION);
  };

  const reduxProfileCompleted = useSelector(
    (state: RootState) => state.auth.profileCompleted
  );

  const { data: galleryStatsData, refetch: refetchGalleryStats } =
    useGetDashboardStatsGalleryQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  const apiProfileCompleted = galleryStatsData?.data?.profile_complete ?? false;
  const profileCompleted = reduxProfileCompleted ?? apiProfileCompleted;

  useEffect(() => {
    if (galleryStatsData?.data?.profile_complete !== undefined) {
      const apiValue = galleryStatsData.data.profile_complete;
      if (reduxProfileCompleted !== apiValue) {
        dispatch(setProfileCompleted(apiValue));
      }
    }
  }, [galleryStatsData?.data?.profile_complete, reduxProfileCompleted, dispatch]);

  const galleryName = storedUser
    ? (() => {
        if (storedUser.organization_name?.trim()) {
          return storedUser.organization_name.trim();
        }
        const fullName = `${storedUser.first_name || ""} ${storedUser.last_name || ""}`.trim();
        if (fullName) {
          return fullName;
        }
        return storedUser.title?.trim() || storedUser.email?.trim() || "Art Gallery";
      })()
    : "Art Gallery";

  return (
    <DashboardLayout currentPage="dashboard">
      <DashboardWelcome userName={galleryName} subtitle={t.subtitle} />

      <CompleteProfile
        profileCompleted={profileCompleted}
        onCompleteProfile={handleCompleteProfile}
      />

      {/* Concierge IA: application status + what's next -> concierge contact
          -> gallery tools -> relevant FANN updates. NO points / missions /
          readiness / leaderboard anywhere. */}
      <ApplicationStatusCard />
      <ConciergeContactCard />

      {/* Genuine gallery tools (not points/missions) */}
      <h2 className="mb-4 text-xl text-white">{t.toolsTitle}</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <ArtistRoster
            profileCompleted={profileCompleted}
            onCompleteProfile={handleCompleteProfile}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <AddArtwork
            profileCompleted={profileCompleted}
            onCompleteProfile={handleCompleteProfile}
            userType="Gallery"
            onRefetchStats={refetchGalleryStats}
          />
        </motion.div>
      </div>

      {/* Relevant FANN updates */}
      <FannUpdatesCard />
    </DashboardLayout>
  );
}
