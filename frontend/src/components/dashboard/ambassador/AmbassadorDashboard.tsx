import { useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  Heart,
  Share2,
  Instagram,
  Video,
  Youtube,
  Twitter,
  Target,
  BarChart3,
  UserPlus,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { DashboardLayout } from "../shared/DashboardLayout";
import { DashboardWelcome } from "../shared/DashboardWelcome";
import { ActivityCard } from "../shared/ActivityCard";
import { AnnouncementsCard } from "../shared/AnnouncementsCard";
import { MissionsCard } from "../shared/MissionsCard";
import { NextActionCard } from "../shared/NextActionCard";
import { ReadinessCard } from "../shared/ReadinessCard";
import { ReferralQuality } from "../shared/ReferralQuality";
import { URLEncoder } from "../shared/URLEncoder";
import { useLanguage } from "@/contexts/useLanguage";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { setProfileCompleted } from "@/store/authSlice";
import {
  useGetDashboardStatsAmbassadorQuery,
  useGenerateReferralCodeQuery,
} from "@/services/api/dashboardApi";
import { FE_BASE_URL } from "@/services/api/baseApi";
import { useEffect } from "react";

const content = {
  en: {
    welcome: "Welcome back",
    subtitle: "Track your performance and grow your influence",
    stats: {
      linkClicks: "Link Clicks",
      verifiedJoins: "Verified Joins",
      pendingInvites: "Pending Invites",
      totalReferrals: "Total Referrals",
      followers: "Followers",
    },
    socialMetrics: {
      title: "Your Declared Channels",
      subtitle: "Follower ranges you shared during onboarding",
      empty: "No channels declared yet — add them from your profile.",
      engagement: "Engagement",
      posts: "Posts",
    },
    referrals: {
      title: "Referral Stats",
      total: "Total Referrals",
      active: "Active",
      thisWeek: "This Week",
      inviteFriends: "Invite Friends",
      linkCopied: "Link Copied!",
      rewards: "Rewards Points",
    },
  },
  ar: {
    welcome: "مرحباً بعودتك",
    subtitle: "تتبع أدائك وزد تأثيرك",
    roles: {
      artist: "فنان",
      collector: "جامع",
      gallery: "معرض",
      ambassador: "سفير",
    },
    stats: {
      linkClicks: "نقرات الرابط",
      verifiedJoins: "انضمامات موثّقة",
      pendingInvites: "دعوات معلّقة",
      totalReferrals: "إجمالي الإحالات",
      followers: "المتابعون",
    },
    socialMetrics: {
      title: "قنواتك المعلنة",
      subtitle: "نطاقات المتابعين التي شاركتها أثناء التسجيل",
      empty: "لم تُعلن أي قنوات بعد — أضفها من ملفك الشخصي.",
      engagement: "التفاعل",
      posts: "المنشورات",
    },
    referrals: {
      title: "إحصائيات الإحالة",
      total: "إجمالي الإحالات",
      active: "نشط",
      thisWeek: "هذا الأسبوع",
      inviteFriends: "دعوة الأصدقاء",
      linkCopied: "تم نسخ الرابط!",
      rewards: "نقاط المكافأة",
    },
  },
};

export function AmbassadorDashboard() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";
  const dispatch = useDispatch();
  const storedUser = useSelector((state: RootState) => state.auth.user);

  // Get user name from stored data
  const userName = storedUser
    ? (() => {
        // Use first_name + last_name
        const fullName = `${storedUser.first_name || ""} ${storedUser.last_name || ""}`.trim();
        if (fullName) {
          return fullName;
        }
        // Fallbacks
        return storedUser.title?.trim() || storedUser.email?.trim() || "Ambassador";
      })()
    : "Ambassador";

  const [referralLinkCopied, setReferralLinkCopied] = useState(false);

  // Read from Redux store first (immediate, no API wait)
  const reduxProfileCompleted = useSelector((state: RootState) => state.auth.profileCompleted);

  // Fetch API data
  const { data: ambassadorStatsData, isLoading: isLoadingAmbassadorStats, refetch: refetchAmbassadorStats } =
    useGetDashboardStatsAmbassadorQuery(undefined, {
      refetchOnMountOrArgChange: true,
    });

  // Get profile_complete from API response
  const apiProfileCompleted = ambassadorStatsData?.data?.profile_complete ?? false;

  // Use Redux store first, fallback to API if Redux is null
  // This ensures immediate display without waiting for API
  const profileCompleted = reduxProfileCompleted ?? apiProfileCompleted;

  // Sync Redux store when API response comes back with updated value
  useEffect(() => {
    if (ambassadorStatsData?.data?.profile_complete !== undefined) {
      const apiValue = ambassadorStatsData.data.profile_complete;
      // Only update if different from current Redux value
      if (reduxProfileCompleted !== apiValue) {
        dispatch(setProfileCompleted(apiValue));
      }
    }
  }, [ambassadorStatsData?.data?.profile_complete, reduxProfileCompleted, dispatch]);

  const { data: referralCodeData } = useGenerateReferralCodeQuery();

  // Extract data from API response
  const apiData = ambassadorStatsData?.data || {};

  // Real, earned referral funnel only — reach/engagement/rewards fabrications
  // were retired with the legacy API (audit FAKE-02 / plan ROLE-2).
  const totalReferrals = apiData.referral_count || 0;
  const activeReferrals = apiData.active_referral_count || 0;
  // A5: the payload key is now correctly spelled `conversion`; fall back to the
  // deprecated `conversation` alias for any stale cached response.
  const conversions = apiData.conversion ?? apiData.conversation ?? 0;

  // Get referral link: prefer the stats payload (real code, self-healed
  // server-side), then the user record.
  const referralLink =
    apiData.referral_link ||
    referralCodeData?.data?.referral_link ||
    (storedUser?.referral_code
      ? `${FE_BASE_URL}/ref/${storedUser.referral_code}`
      : FE_BASE_URL);

  // Handle copying referral link
  const handleCopyReferralLink = () => {
    // Fallback method for clipboard copy
    const textArea = document.createElement("textarea");
    textArea.value = referralLink;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      setReferralLinkCopied(true);
      setTimeout(() => setReferralLinkCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }

    document.body.removeChild(textArea);
  };

  // Channels the user DECLARED at onboarding (follower ranges only).
  // Engagement %, post counts and trends were fabricated by the legacy API
  // and are gone (audit FAKE-02); only real integrations may reintroduce
  // per-network analytics.
  const socialStatsData = apiData.social_stats;
  const socialStats = [
    {
      platform: "Instagram",
      icon: Instagram,
      bgClass: "bg-gradient-to-br from-[#8134af] via-[#dd2a7b] via-[#f58529] to-[#feda75]",
      iconColor: "text-white",
      followers: socialStatsData?.instagram_follower || null,
    },
    {
      platform: "TikTok",
      icon: Video,
      bgClass: "bg-[#000000]",
      iconColor: "text-white",
      followers: socialStatsData?.tiktok_follower || null,
    },
    {
      platform: "YouTube",
      icon: Youtube,
      bgClass: "bg-[#FF0000]",
      iconColor: "text-white",
      followers: socialStatsData?.youtube_subscriber || null,
    },
    {
      platform: "Twitter",
      icon: Twitter,
      bgClass: "bg-[#1DA1F2]",
      iconColor: "text-white",
      followers: socialStatsData?.twitter_follower || null,
    },
  ].filter((stat) => Boolean(stat.followers)); // only declared channels

  return (
    <DashboardLayout currentPage="dashboard">
      {/* Welcome Section */}
      <DashboardWelcome
        userName={userName}
        subtitle={t.subtitle}
      />

      {/* IA order (game): readiness w/ score breakdown -> ONE next action ->
          missions -> reach stats -> referral (quality-first) -> activity. */}
      <ReadinessCard showLedger={false} />
      <AnnouncementsCard />
      <NextActionCard />
      <MissionsCard />

      {/* Key Stats — real referral funnel only (audit FAKE-02 / plan ROLE-2).
          Every number below is earned: link clicks, referrals, verified
          joins, pending invites. No invented reach/engagement/trends. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        <Card className="glass border-[#C59B48]/20 p-6 bg-gradient-to-br from-[#191922]/80 to-[#0B0B0D]/80">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex-1">
              <p className="text-[#8A8EA0] text-sm">{t.stats.linkClicks}</p>
              {isLoadingAmbassadorStats ? (
                <Loader2 className="w-5 h-5 text-[#C59B48] animate-spin mt-1" />
              ) : (
                <p className="text-2xl text-[#F2F2F3]">
                  {apiData.total_referral_clicks ?? 0}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="glass border-[#C59B48]/20 p-6 bg-gradient-to-br from-[#191922]/80 to-[#0B0B0D]/80">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-[#8A8EA0] text-sm">{t.stats.totalReferrals}</p>
              {isLoadingAmbassadorStats ? (
                <Loader2 className="w-5 h-5 text-[#C59B48] animate-spin mt-1" />
              ) : (
                <p className="text-2xl text-[#F2F2F3]">{totalReferrals}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="glass border-[#C59B48]/20 p-6 bg-gradient-to-br from-[#191922]/80 to-[#0B0B0D]/80">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-[#8A8EA0] text-sm">{t.stats.verifiedJoins}</p>
              {isLoadingAmbassadorStats ? (
                <Loader2 className="w-5 h-5 text-[#C59B48] animate-spin mt-1" />
              ) : (
                <p className="text-2xl text-[#F2F2F3]">{conversions || 0}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="glass border-[#C59B48]/20 p-6 bg-gradient-to-br from-[#191922]/80 to-[#0B0B0D]/80">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-[#8A8EA0] text-sm">{t.stats.pendingInvites}</p>
              {isLoadingAmbassadorStats ? (
                <Loader2 className="w-5 h-5 text-[#C59B48] animate-spin mt-1" />
              ) : (
                <p className="text-2xl text-[#F2F2F3]">
                  {apiData.pending ?? 0}
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Referral — verified-quality strip above the link widget */}
      <div className="mb-8">
        <ReferralQuality clicks={ambassadorStatsData?.data?.total_referral_clicks} />
        <URLEncoder
          profileCompleted={profileCompleted}
          statsData={ambassadorStatsData?.data}
          isLoadingStats={isLoadingAmbassadorStats}
          onRefetchStats={refetchAmbassadorStats}
        />
      </div>

      {/* Points ledger / activity */}
      <ActivityCard />

      {/* Social Media Performance */}
      <div className="mb-8">
        {/* Social Media Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="glass border-[#C59B48]/20 p-6 bg-gradient-to-br from-[#191922]/80 to-[#0B0B0D]/80 h-full">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
              <h3 className="text-2xl text-[#F2F2F3]">{t.socialMetrics.title}</h3>
            </div>
            {/* Honest framing (audit FAKE-02): these are the follower ranges
                the user declared at onboarding — not live analytics. No
                engagement %, post counts or "last updated" claims. */}
            <p className="text-[#8A8EA0] text-sm mb-6">
              {t.socialMetrics.subtitle}
            </p>

            <div className="grid grid-cols-1 gap-4">
              {socialStats.length === 0 && (
                <p className="text-[#8A8EA0] text-sm py-4 text-center">
                  {t.socialMetrics.empty}
                </p>
              )}
              {socialStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.platform}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="p-5 rounded-lg glass border border-[#C59B48]/10 hover:border-[#C59B48]/30 transition-all bg-gradient-to-br from-[#0B0B0D]/50 to-[#191922]/50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl ${stat.bgClass} flex items-center justify-center`}
                      >
                        <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#F2F2F3] text-lg">
                          {stat.platform}
                        </h4>
                        <p className="text-[#8A8EA0] text-xs">
                          {t.stats.followers}: {stat.followers}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Tier Progress & Referral Stats */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Referral Stats (tier now shown by the Founding Readiness card) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <Card className="glass border-[#C59B48]/20 p-6 bg-gradient-to-br from-[#191922]/80 to-[#0B0B0D]/80 h-full">
            {/* Header */}
            <div
              className={`flex items-center gap-2 mb-6 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              <Share2 className="w-6 h-6 text-purple-400" />
              <h2 className="text-2xl text-[#F2F2F3]">{t.referrals.title}</h2>
            </div>

            <div className="space-y-4">
              {isLoadingAmbassadorStats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#C59B48] animate-spin" />
                </div>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                    <p className="text-[#8A8EA0] text-sm mb-1">
                      {t.referrals.total}
                    </p>
                    <p className="text-4xl text-[#F2F2F3] mb-2">
                      {totalReferrals}
                    </p>
                    {/* No invented "+N this week" delta — only real counts
                        render here (audit FAKE-02/FAKE-05). */}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[#0B0B0D] border border-[#C59B48]/10">
                      <p className="text-[#8A8EA0] text-xs mb-1">
                        {t.referrals.active}
                      </p>
                      <p className="text-2xl text-[#F2F2F3]">
                        {activeReferrals}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0B0B0D] border border-[#C59B48]/10">
                      <p className="text-[#8A8EA0] text-xs mb-1">
                        {t.stats.verifiedJoins}
                      </p>
                      <p className="text-2xl text-primary">
                        {conversions || 0}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <Button
                className="w-full cursor-pointer"
                onClick={handleCopyReferralLink}
              >
                {referralLinkCopied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t.referrals.linkCopied}
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    {t.referrals.inviteFriends}
                  </>
                )}
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>

    </DashboardLayout>
  );
}
