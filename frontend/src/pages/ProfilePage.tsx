import { DashboardLayout } from "@/components/dashboard/shared/DashboardLayout";
import { ActivityCard } from "@/components/dashboard/shared/ActivityCard";
import { EditKYC } from "@/components/profile/EditKYC";
import { EditProfile } from "@/components/profile/EditProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImagePreviewList } from "@/components/ui/image-preview-list";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/useLanguage";
import { ROUTES } from "@/routes/paths";
import { useGetUserDetailsQuery } from "@/services/api/authApi";
import { useGetQualificationMeQuery } from "@/services/api/qualificationApi";
import { API_BASE_URL } from "@/services/api/baseApi";
import * as csc from "country-state-city";
import {
  useGetDashboardStatsQuery,
  useGetDashboardStatsGalleryQuery,
  useGetDashboardStatsAmbassadorQuery,
} from "@/services/api/dashboardApi";
import { setUser, type UserProfileData } from "@/store/authSlice";
import { selectSubmittedData } from "@/store/onboardingSlice";
import type { RootState } from "@/store/store";
import {
  getFullImageUrl,
  normalizeToPreviewItems,
} from "@/utils/filePreviewHelpers";
import {
  Award,
  Briefcase,
  Calendar,
  Crown,
  Edit2,
  FileText,
  Globe,
  Hash,
  IdCard,
  Link,
  Mail,
  MapPin,
  Phone,
  Share2,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const content = {
  en: {
    profile: "Profile",
    editProfile: "Edit Profile",
    share: "Share Profile",
    about: "About",
    activity: "Activity",
    achievementsTab: "Achievements",
    stats: "Stats",
    tier: "Current Tier",
    memberSince: "Member Since",
    location: "Location",
    email: "Email",
    phone: "Phone",
    website: "Website",
    role: "Role",
    bio: "Bio",
    readinessScore: "Readiness Score",
    referrals: "Referrals",
    followers: "Followers",
    following: "Following",
    artworksSaved: "Artworks Saved",
    collectionsCreated: "Collections",
    progressToNext: "Progress to Next Tier",
    pointsNeeded: "points needed",
    kyc: "KYC Verification",
    idNumber: "ID Number",
    dateOfBirth: "Date of Birth",
    kycCountry: "Country",
    kycState: "State/Province",
    kycCity: "City",
    kycStreetAddress: "Street Address",
    kycIdType: "ID Type",
    postalCode: "Postal Code",
    documents: "Documents",
    idDocument: "Government ID",
    proofOfAddress: "Proof of Address",
    socialLinkHandler: "Social Link Handler",
    socialLinkFollowers: "Social Link Followers",
    verified: "Verified",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    notSubmitted: "Not Submitted",
    editKYC: "Edit KYC",
    addKYC: "Add KYC Information",
    kycNotSubmitted: "KYC verification not completed",
    kycNotSubmittedDesc:
      "Complete your identity verification to enable full platform access",
    recentActivity: [
      { action: "Completed profile setup", points: "+50" },
      { action: "Referred a new member", points: "+100" },
      { action: "First artwork saved", points: "+25" },
      { action: "Joined FANN", points: "+25" },
    ],
    achievementsList: [
      {
        name: "Early Adopter",
        desc: "Joined during pre-launch",
        icon: Star,
        unlocked: true,
      },
      {
        name: "Social Butterfly",
        desc: "Referred 5+ members",
        icon: Share2,
        unlocked: true,
      },
      {
        name: "Curator Novice",
        desc: "Created first collection",
        icon: Award,
        unlocked: true,
      },
      {
        name: "Art Connoisseur",
        desc: "Saved 50+ artworks",
        icon: Crown,
        unlocked: false,
      },
      {
        name: "Master Curator",
        desc: "Created 10+ collections",
        icon: Briefcase,
        unlocked: false,
      },
      {
        name: "Ambassador",
        desc: "Reached Ambassador tier",
        icon: TrendingUp,
        unlocked: false,
      },
    ],
  },
  ar: {
    profile: "الملف الشخصي",
    editProfile: "تعديل الملف",
    share: "مشاركة الملف",
    about: "حول",
    activity: "النشاط",
    achievementsTab: "الإنجازات",
    stats: "الإحصائيات",
    tier: "المستوى الحالي",
    memberSince: "عضو منذ",
    location: "الموقع",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    website: "الموقع الإلكتروني",
    role: "الدور",
    bio: "نبذة",
    readinessScore: "درجة الجاهزية",
    referrals: "الإحالات",
    followers: "المتابعين",
    following: "المتابَعون",
    artworksSaved: "الأعمال المحفوظة",
    collectionsCreated: "المجموعات",
    progressToNext: "التقدم للمستوى التالي",
    pointsNeeded: "نقطة مطلوبة",
    kyc: "التحقق من الهوية",
    idNumber: "رقم الهوية",
    dateOfBirth: "تاريخ الميلاد",
    kycCountry: "البلد",
    kycState: "الولاية/المحافظة",
    kycCity: "المدينة",
    kycStreetAddress: "عنوان الشارع",
    kycIdType: "نوع الهوية",
    postalCode: "الرمز البريدي",
    documents: "المستندات",
    idDocument: "هوية حكومية",
    proofOfAddress: "إثبات العنوان",
    socialLinkHandler: "معرف الرابط الاجتماعي",
    socialLinkFollowers: "متابعي الرابط الاجتماعي",
    verified: "تم التحقق",
    approved: "موافق عليه",
    pending: "قيد الانتظار",
    rejected: "مرفوض",
    notSubmitted: "لم يتم الإرسال",
    editKYC: "تعديل التحقق من الهوية",
    addKYC: "إضافة معلومات التحقق من الهوية",
    kycNotSubmitted: "لم يتم إكمال التحقق من الهوية",
    kycNotSubmittedDesc: "أكمل التحقق من هويتك لتمكين الوصول الكامل إلى المنصة",
    recentActivity: [
      { action: "إكمال إعداد الملف الشخصي", points: "+50" },
      { action: "إحالة عضو جديد", points: "+100" },
      { action: "حفظ أول عمل فني", points: "+25" },
      { action: "الانضمام إلى FANN", points: "+25" },
    ],
    achievementsList: [
      {
        name: "المستخدم المبكر",
        desc: "انضم خلال مرحلة ما قبل الإطلاق",
        icon: Star,
        unlocked: true,
      },
      {
        name: "فراشة اجتماعية",
        desc: "أحال أكثر من 5 أعضاء",
        icon: Share2,
        unlocked: true,
      },
      {
        name: "منسق مبتدئ",
        desc: "أنشأ أول مجموعة",
        icon: Award,
        unlocked: true,
      },
      {
        name: "خبير فني",
        desc: "حفظ أكثر من 50 عمل فني",
        icon: Crown,
        unlocked: false,
      },
      {
        name: "منسق محترف",
        desc: "أنشأ أكثر من 10 مجموعات",
        icon: Briefcase,
        unlocked: false,
      },
      {
        name: "سفير",
        desc: "وصل إلى مستوى السفير",
        icon: TrendingUp,
        unlocked: false,
      },
    ],
  },
};

export function ProfilePage() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";
  const dispatch = useDispatch();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditKYCOpen, setIsEditKYCOpen] = useState(false);
  const persona = useSelector((state: RootState) => state.auth.persona) as
    | string
    | null;
  const storedUser = useSelector((state: RootState) => state.auth.user);

  // Fetch user details from API
  const { data: userDetailsData } = useGetUserDetailsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  // Qualification readiness model — the real source for tier + readiness score
  // (replaces the legacy market_final points/tier names).
  const { data: qualMeData } = useGetQualificationMeQuery();

  // Update Redux store with user and KYC data from API response
  useEffect(() => {
    if (userDetailsData) {
      // Handle the API response structure: { success, status_code, message, data: { user, kyc_verification, ... } }
      // RTK Query might return the raw response or transformed data, so check both structures
      const responseData = userDetailsData as {
        success?: boolean;
        status_code?: number;
        message?: unknown;
        data?: {
          user?: UserProfileData;
          kyc_verification?: {
            id?: number;
            id_number?: string;
            dob?: string;
            country?: string;
            state?: string;
            city?: string;
            postal_code?: string;
            street_address?: string;
            id_type?: string;
            status?: "Pending" | "Approved" | "Rejected" | string | null;
            gov_issued_id?: string | null; // Legacy single file
            gov_issued_id_front?: string | null; // Front of ID
            gov_issued_id_back?: string | null; // Back of ID
            proof_address?: string | null;
            // Artist-specific fields
            social_link_handler?: string | null;
            social_link_followers?: string | null;
          };
          [key: string]: unknown;
        };
        // Fallback: if data is User directly
        id?: number;
        email?: string;
        [key: string]: unknown;
      };

      // Check if response has the wrapped structure with data.user
      if (responseData.data?.user) {
        const userData = responseData.data.user;
        const kycVerification = responseData.data.kyc_verification;

        // Merge KYC data into user object if it exists
        // Combine front and back into array for storage, or use legacy single file
        let govIdUrls: string | string[] | null = null;
        if (kycVerification?.gov_issued_id_front || kycVerification?.gov_issued_id_back) {
          const urls: string[] = [];
          if (kycVerification.gov_issued_id_front) urls.push(kycVerification.gov_issued_id_front);
          if (kycVerification.gov_issued_id_back) urls.push(kycVerification.gov_issued_id_back);
          govIdUrls = urls.length === 1 ? urls[0] : urls;
        } else if (kycVerification?.gov_issued_id) {
          govIdUrls = kycVerification.gov_issued_id;
        }

        const updatedUser: UserProfileData = {
          ...userData,
          // Add KYC fields to user object (using type assertion since they're not in the interface)
          ...({
            kyc_id_number: kycVerification?.id_number,
            kyc_dob: kycVerification?.dob,
            kyc_country: kycVerification?.country,
            kyc_state: kycVerification?.state,
            kyc_city: kycVerification?.city,
            kyc_postal_code: kycVerification?.postal_code,
            kyc_street_address: kycVerification?.street_address,
            kyc_id_type: kycVerification?.id_type,
            kyc_status: kycVerification?.status || null,
            kyc_gov_issued_id: govIdUrls,
            kyc_proof_address: kycVerification?.proof_address || null,
            // Artist-specific fields
            kyc_social_link_handler: kycVerification?.social_link_handler || null,
            kyc_social_link_followers: kycVerification?.social_link_followers || null,
          } as Partial<UserProfileData>),
        };

        dispatch(setUser(updatedUser));
      }
      // Note: If response doesn't match wrapped structure, it might be transformed by RTK Query
      // In that case, userDetailsData should already be the User object directly
    }
  }, [userDetailsData, dispatch]);

  // Get KYC data from user object first, fallback to onboarding slice for backward compatibility
  const kycDataFromUser = storedUser
    ? ({
      id_number: (storedUser as { kyc_id_number?: string }).kyc_id_number,
      dob: (storedUser as { kyc_dob?: string }).kyc_dob,
      country: (storedUser as { kyc_country?: string })
        .kyc_country,
      state: (storedUser as { kyc_state?: string }).kyc_state,
      city: (storedUser as { kyc_city?: string }).kyc_city,
      postal_code: (storedUser as { kyc_postal_code?: string })
        .kyc_postal_code,
      street_address: (storedUser as { kyc_street_address?: string })
        .kyc_street_address,
      id_type: (storedUser as { kyc_id_type?: string }).kyc_id_type,
      status: (storedUser as { kyc_status?: string | null }).kyc_status,
      gov_issued_id: (storedUser as { kyc_gov_issued_id?: string | null })
        .kyc_gov_issued_id,
      proof_address: (storedUser as { kyc_proof_address?: string | null })
        .kyc_proof_address,
      // Artist-specific fields
      social_link_handler: (storedUser as { kyc_social_link_handler?: string | null })
        .kyc_social_link_handler,
      social_link_followers: (storedUser as { kyc_social_link_followers?: string | null })
        .kyc_social_link_followers,
    } as {
      id_number?: string;
      dob?: string;
      country?: string;
      state?: string;
      city?: string;
      postal_code?: string;
      street_address?: string;
      id_type?: string;
      status?: string | null;
      gov_issued_id?: string | null;
      proof_address?: string | null;
      // Artist-specific fields
      social_link_handler?: string | null;
      social_link_followers?: string | null;
    })
    : undefined;
  const kycDataFromOnboarding = useSelector((state: RootState) =>
    selectSubmittedData(state, "kyc")
  ) as
    | {
      id_number?: string;
      dob?: string;
      country?: string;
      state?: string;
      city?: string;
      postal_code?: string;
      street_address?: string;
      id_type?: string;
      status?: string | null;
      gov_issued_id?: string;
      proof_address?: string;
      // Artist-specific fields
      social_link_handler?: string | null;
      social_link_followers?: string | null;
    }
    | undefined;
  // Use KYC data from user object if available, otherwise fallback to onboarding data
  const kycData =
    kycDataFromUser && (kycDataFromUser.id_number || kycDataFromUser.dob)
      ? kycDataFromUser
      : kycDataFromOnboarding;

  // Determine user role for API calls (must be before API calls)
  const userRole = storedUser?.role?.toLowerCase() || persona?.toLowerCase() || "";
  const isArtist = userRole === "artist";
  const isCollector = userRole === "collector";
  const isAmbassador = userRole === "ambassador";
  const isGallery = userRole === "gallery";

  // Fetch dashboard stats from API based on role (must be called before any conditional returns)
  const { data: dashboardStatsData } = useGetDashboardStatsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: isGallery || isAmbassador, // Skip if Gallery or Ambassador
  });

  const { data: dashboardStatsGalleryData } = useGetDashboardStatsGalleryQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !isGallery, // Only call for Gallery
  });

  const { data: dashboardStatsAmbassadorData } = useGetDashboardStatsAmbassadorQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: !isAmbassador, // Only call for Ambassador
  });

  // Map dashboard stats data based on role
  const mappedDashboardStats = useMemo(() => {
    if (isGallery && dashboardStatsGalleryData?.data) {
      // Map Gallery stats
      // Legacy points/tier fields retired (plan TECH-3/SCORE-3); only real
      // counts remain. Tier + readiness come from /qualification below.
      return {
        referral_count: dashboardStatsGalleryData.data.referral_count ?? 0,
        user_followers: dashboardStatsGalleryData.data.user_followers ?? 0,
        user_following: dashboardStatsGalleryData.data.user_following ?? 0,
        artwork_count: 0, // Gallery doesn't have artwork_count
        collection_count: 0, // Gallery doesn't have collection_count
      };
    }
    if (isAmbassador && dashboardStatsAmbassadorData?.data) {
      // Map Ambassador stats
      return {
        referral_count: dashboardStatsAmbassadorData.data.referral_count ?? 0,
        user_followers: dashboardStatsAmbassadorData.data.user_followers ?? 0,
        user_following: dashboardStatsAmbassadorData.data.user_following ?? 0,
        artwork_count: dashboardStatsAmbassadorData.data.artwork_count ?? 0,
        collection_count: dashboardStatsAmbassadorData.data.collection_count ?? 0,
      };
    }
    // Default stats (Collector/Artist)
    if (dashboardStatsData?.data) {
      return {
        referral_count: dashboardStatsData.data.referral_count ?? 0,
        user_followers: dashboardStatsData.data.user_followers ?? 0,
        user_following: dashboardStatsData.data.user_following ?? 0,
        artwork_count: dashboardStatsData.data.artwork_count ?? 0,
        collection_count: dashboardStatsData.data.collection_count ?? 0,
      };
    }
    return null;
  }, [
    isGallery,
    isAmbassador,
    dashboardStatsGalleryData,
    dashboardStatsAmbassadorData,
    dashboardStatsData,
  ]);


  // Tier + score come from the qualification engine ONLY (never the legacy
  // market_final points/tier names like Explorer/Patron, never an arbitrary
  // number). Tiers: Waitlisted → Verified Member → Priority Access → Founder's Circle.
  const qme = qualMeData?.data as
    | { tier?: string; tier_label?: string; tier_order?: string[]; readiness_score?: number; track?: string }
    | undefined;
  const TIER_LABELS: Record<string, string> = {
    waitlisted: language === "ar" ? "قائمة الانتظار" : "Waitlisted",
    verified_member: language === "ar" ? "عضو موثّق" : "Verified Member",
    priority_access: language === "ar" ? "وصول ذو أولوية" : "Priority Access",
    founders_circle: language === "ar" ? "دائرة المؤسّسين" : "Founder's Circle",
  };
  const tierOrder = qme?.tier_order ?? ["waitlisted", "verified_member", "priority_access", "founders_circle"];
  const curTierSlug = qme?.tier ?? "waitlisted";
  const tIdx = tierOrder.indexOf(curTierSlug);
  const isGameTrack = qme?.track === "game";
  const readinessScore: number = qme?.readiness_score ?? 0;
  // Prefer the localized label (TIER_LABELS) over the server's English
  // tier_label so AR never leaks an English tier name.
  const currentTierName: string = TIER_LABELS[curTierSlug] || qme?.tier_label || TIER_LABELS.waitlisted;
  const nextTierName: string | null =
    tIdx >= 0 && tIdx < tierOrder.length - 1 ? TIER_LABELS[tierOrder[tIdx + 1]] || tierOrder[tIdx + 1] : null;
  const progress: number = tierOrder.length > 0 ? Math.round(((tIdx + 1) / tierOrder.length) * 100) : 0;

  // Redirect if profile visibility is disabled
  // This prevents users from accessing the profile page even by manual URL navigation
  if (storedUser?.profile_visibility === false) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Format date helper
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === "en" ? "en-US" : "ar-SA", {
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to get country name from country code
  const getCountryName = (countryCode: string | null | undefined): string => {
    if (!countryCode) return "";
    try {
      const country = csc.Country.getCountryByCode(countryCode);
      return country?.name || countryCode;
    } catch {
      return countryCode;
    }
  };

  // Helper function to get state name from state code and country code
  const getStateName = (
    stateCode: string | null | undefined,
    countryCode: string | null | undefined
  ): string => {
    if (!stateCode || !countryCode) return stateCode || "";
    try {
      const state = csc.State.getStateByCodeAndCountry(stateCode, countryCode);
      return state?.name || stateCode;
    } catch {
      return stateCode;
    }
  };

  // Get KYC status badge with appropriate styling
  const getKYCStatusBadge = (status: string | null | undefined) => {
    if (!status) return null;

    const normalizedStatus = status.trim().toLowerCase();

    if (normalizedStatus === "approved") {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 flex items-center gap-1.5 px-3 py-1 shadow-lg shadow-green-500/20">
          <Shield className="w-3.5 h-3.5" />
          <span className="font-semibold">{t.approved}</span>
        </Badge>
      );
    }

    if (normalizedStatus === "pending") {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 flex items-center gap-1.5 px-3 py-1 shadow-lg shadow-yellow-500/20 animate-pulse">
          <Shield className="w-3.5 h-3.5" />
          <span className="font-semibold">{t.pending}</span>
        </Badge>
      );
    }

    if (normalizedStatus === "rejected") {
      return (
        <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0 flex items-center gap-1.5 px-3 py-1 shadow-lg shadow-red-500/20">
          <Shield className="w-3.5 h-3.5" />
          <span className="font-semibold">{t.rejected}</span>
        </Badge>
      );
    }

    // Fallback for unknown status
    return (
      <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 flex items-center gap-1.5 px-3 py-1">
        <Shield className="w-3.5 h-3.5" />
        <span className="font-semibold">{status.trim()}</span>
      </Badge>
    );
  };

  // Get website URL - handle both string and array formats
  const getWebsite = (website: string[] | string | null | undefined) => {
    if (!website) return "";
    if (Array.isArray(website)) {
      return website.length > 0 ? website[0] : "";
    }
    return website;
  };

  // Get profile image URL - handle null, relative paths, and full URLs
  const getProfileImageUrl = (
    profileImage: string | null | undefined
  ): string | undefined => {
    // Return undefined if profile image is null/empty to trigger Avatar fallback
    if (!profileImage || profileImage.trim() === "") {
      return undefined;
    }

    // If it's already a full URL (starts with http:// or https://), return as is
    if (
      profileImage.startsWith("http://") ||
      profileImage.startsWith("https://")
    ) {
      return profileImage;
    }

    // Get base URL and remove /api suffix if present
    const BASE_URL = API_BASE_URL;
    const baseWithoutApi = BASE_URL.replace(/\/api$/, "");

    // If it's a relative path (starts with /), prepend base URL without /api
    if (profileImage.startsWith("/")) {
      return `${baseWithoutApi}${profileImage}`;
    }

    // Otherwise, treat as relative path and prepend base URL with /
    return `${baseWithoutApi}/${profileImage}`;
  };

  // Use stored user data or fallback to mock data
  const userData = storedUser
    ? {
      name:
        `${storedUser.first_name || ""} ${storedUser.last_name || ""
          }`.trim() ||
        storedUser.title ||
        storedUser.email,
      username: storedUser.email.split("@")[0] || "",
      email: storedUser.email,
      phone: storedUser.phone_number || "",
      location: storedUser.location || "",
      website: getWebsite(storedUser.website),
      role: storedUser.role || "",
      bio: storedUser.bio || "",
      memberSince: formatDate(storedUser.date_joined),
      referrals:
        mappedDashboardStats?.referral_count ??
        storedUser.total_referral_clicks ??
        0,
      followers: mappedDashboardStats?.user_followers ?? 0,
      following: mappedDashboardStats?.user_following ?? 0,
      artworksSaved: mappedDashboardStats?.artwork_count ?? 0,
      collections: mappedDashboardStats?.collection_count ?? 0,
      // Additional fields for edit profile
      title: storedUser.title || "",
      focus: storedUser.focus || "",
      years_of_experience: storedUser.years_of_experience
        ? String(storedUser.years_of_experience)
        : "",
      instagram_handle: storedUser.instagram_handle || "",
      profile_image: storedUser.profile_image,
      // Persona-based fields
      price_range: storedUser.price_range ?? "",
      preferred_commission_rate: storedUser.preferred_commission_rate ?? "",
      shipping_preference: storedUser.shipping_preference ?? "",
      studio_address: storedUser.studio_address ?? "",
      education: storedUser.education ?? "",
      award_artist: storedUser.award_artist ?? "",
      artist_statement: storedUser.artist_statement ?? "",
      organization_email: storedUser.organization_email ?? "",
      organization_main_contact_name:
        storedUser.organization_main_contact_name ?? "",
      organization_name: storedUser.organization_name ?? "",
      organization_type: storedUser.organization_type ?? "",
      founded_year: storedUser.founded_year ?? "",
      exhibition_count:
        storedUser.exhibition_count !== undefined &&
          storedUser.exhibition_count !== null
          ? String(storedUser.exhibition_count)
          : "",
    }
    : {
      // Fallback mock data if user is not loaded
      name: "User",
      username: "@user",
      email: "",
      phone: "",
      location: "",
      website: "",
      role: "",
      bio: "",
      memberSince: "",
      totalPoints: 0,
      influencePoints: 0,
      provenancePoints: 0,
      referrals: 0,
      followers: 0,
      following: 0,
      artworksSaved: 0,
      collections: 0,
      title: "",
      focus: "",
      years_of_experience: "",
      instagram_handle: "",
      profile_image: null,
    };

  return (
    <DashboardLayout currentPage="profile">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 mb-6"
      >
        <div
          className={`flex flex-col md:flex-row gap-6 ${isRTL ? "md:flex-row-reverse" : ""
            }`}
        >
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-32 h-32 border-4 border-[#C59B48]">
              <AvatarImage
                src={getProfileImageUrl(userData.profile_image)}
                alt={userData.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-[#C59B48] to-[#45e3d3] text-[#0B0B0D] text-3xl">
                {userData.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
            <div
              className={`flex items-start justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              <div>
                <h1 className="text-3xl text-[#F2F2F3] mb-1">
                  {userData.name}
                </h1>
                <p className="text-[#8A8EA0] mb-3">
                  {userData.username ? `@${userData.username}` : userData.email}
                </p>
                <Badge className="bg-gradient-to-r from-[#C59B48] to-[#D6AE5A] text-[#0B0B0D] border-0 flex items-center gap-1">
                  <Crown className={`w-3 h-3 ${isRTL ? "ml-1" : "mr-1"}`} />
                  <span className="text-xs font-semibold opacity-80">{t.tier}: {currentTierName}</span>
                </Badge>
              </div>
              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {t.editProfile}
                </Button>
              </div>
            </div>

            <p className="text-[#8A8EA0] mb-4">{userData.bio}</p>

            {/* Quick Stats */}
            <div
              className={`grid grid-cols-2 ${isAmbassador ? "md:grid-cols-4" : isCollector ? "md:grid-cols-6" : "md:grid-cols-5"} gap-4 ${isRTL ? "text-right" : "text-left"
                }`}
            >
              {isGameTrack && (
                <div className="bg-[#0B0B0D] border border-primary/20 rounded-lg p-3">
                  <p className="text-2xl text-[#C9A84C] tabular-nums">
                    {readinessScore}
                    <span className="text-base text-[#8A8EA0]">/100</span>
                  </p>
                  <p className="text-xs text-[#8A8EA0]">{t.readinessScore}</p>
                </div>
              )}
              <div className="bg-[#0B0B0D] border border-primary/20 rounded-lg p-3">
                <p className="text-2xl text-[#F2F2F3]">{userData.followers}</p>
                <p className="text-xs text-[#8A8EA0]">{t.followers}</p>
              </div>
              <div className="bg-[#0B0B0D] border border-primary/20 rounded-lg p-3">
                <p className="text-2xl text-[#F2F2F3]">{userData.following}</p>
                <p className="text-xs text-[#8A8EA0]">{t.following}</p>
              </div>
              <div className="bg-[#0B0B0D] border border-primary/20 rounded-lg p-3">
                <p className="text-2xl text-[#F2F2F3]">{userData.referrals}</p>
                <p className="text-xs text-[#8A8EA0]">{t.referrals}</p>
              </div>
              {!isAmbassador && (
                <div className="bg-[#0B0B0D] border border-primary/20 rounded-lg p-3">
                  <p className="text-2xl text-[#F2F2F3]">
                    {userData.artworksSaved}
                  </p>
                  <p className="text-xs text-[#8A8EA0]">{t.artworksSaved}</p>
                </div>
              )}
              {isCollector && (
                <div className="bg-[#0B0B0D] border border-primary/20 rounded-lg p-3">
                  <p className="text-2xl text-[#F2F2F3]">
                    {userData.collections}
                  </p>
                  <p className="text-xs text-[#8A8EA0]">{t.collectionsCreated}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          {nextTierName ? (
            <>
              <div
                className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <span className="text-sm text-[#8A8EA0]">
                  {t.progressToNext} {nextTierName}
                </span>
                <span className="text-sm text-[#C9A84C] tabular-nums">
                  {tIdx + 1}/{tierOrder.length}
                </span>
              </div>
              <Progress value={progress} className="h-3 bg-[#0B0B0D]" />
            </>
          ) : (
            <>
              <div
                className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <span className="text-sm text-[#8A8EA0]">
                  {language === "en"
                    ? "Maximum tier reached!"
                    : "تم الوصول إلى أعلى مستوى!"}
                </span>
                <span className="text-sm text-[#C59B48]">100%</span>
              </div>
              <Progress value={100} className="h-3 bg-[#0B0B0D]" />
            </>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="about" className="w-full" dir={isRTL ? "rtl" : "ltr"}>
        <TabsList className="glass border border-[#4e4e4e78] mb-6">
          <TabsTrigger value="about">{t.about}</TabsTrigger>
          <TabsTrigger value="activity">{t.activity}</TabsTrigger>
          {/* <TabsTrigger value="achievements">{t.achievementsTab}</TabsTrigger> */}
          <TabsTrigger value="stats">{t.stats}</TabsTrigger>
        </TabsList>

        {/* About Tab */}
        <TabsContent value="about">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email - only show if show_email is true */}
              {storedUser?.show_email === true && (
                <div
                  className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                    }`}
                >
                  <div className="w-12 h-12 bg-[#191922] border border-[#C59B48]/30 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#C59B48]" />
                  </div>
                  <div className={isRTL ? "text-right" : "text-left"}>
                    <p className="text-xs text-[#8A8EA0]">{t.email}</p>
                    <p className="text-[#F2F2F3]">{userData.email}</p>
                  </div>
                </div>
              )}

              {/* Phone - only show if show_phone is true */}
              {storedUser?.show_phone === true && (
                <div
                  className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                    }`}
                >
                  <div className="w-12 h-12 bg-[#191922] border border-[#45e3d3]/30 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#45e3d3]" />
                  </div>
                  <div className={isRTL ? "text-right" : "text-left"}>
                    <p className="text-xs text-[#8A8EA0]">{t.phone}</p>
                    <p className="text-[#F2F2F3]">{userData.phone}</p>
                  </div>
                </div>
              )}

              {/* Location - only show if show_location is true */}
              {storedUser?.show_location === true && (
                <div
                  className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                    }`}
                >
                  <div className="w-12 h-12 bg-[#191922] border border-[#9375b5]/30 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#9375b5]" />
                  </div>
                  <div className={isRTL ? "text-right" : "text-left"}>
                    <p className="text-xs text-[#8A8EA0]">{t.location}</p>
                    <p className="text-[#F2F2F3]">{userData.location}</p>
                  </div>
                </div>
              )}

              <div
                className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <div className="w-12 h-12 bg-[#191922] border border-[#0ea5e9]/30 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-[#0ea5e9]" />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <p className="text-xs text-[#8A8EA0]">{t.website}</p>
                  <p className="text-[#F2F2F3]">{userData.website}</p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <div className="w-12 h-12 bg-[#191922] border border-[#D6AE5A]/30 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-[#D6AE5A]" />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <p className="text-xs text-[#8A8EA0]">{t.role}</p>
                  <p className="text-[#F2F2F3]">{userData.role}</p>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <div className="w-12 h-12 bg-[#191922] border border-[#fface3]/30 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#fface3]" />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <p className="text-xs text-[#8A8EA0]">{t.memberSince}</p>
                  <p className="text-[#F2F2F3]">{userData.memberSince}</p>
                </div>
              </div>
            </div>

            {/* KYC Verification Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-8 border-t border-[#4e4e4e78]"
            >
              <div
                className={`flex items-center justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""
                  }`}
              >
                <div
                  className={`flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""
                    }`}
                >
                  <div className="w-12 h-12 bg-[#191922] border border-[#45e3d3]/30 rounded-xl flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-[#45e3d3]" />
                  </div>
                  <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                    <h3 className="text-lg text-[#F2F2F3] mb-2">{t.kyc}</h3>
                    {kycData && 'status' in kycData && kycData.status ? (
                      <div className={`flex flex-col gap-2 ${isRTL ? "items-end" : "items-start"}`}>
                        {getKYCStatusBadge(kycData.status)}
                      </div>
                    ) : (
                      <p className="text-xs text-[#8A8EA0]">
                        {t.kycNotSubmitted}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditKYCOpen(true)}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {kycData ? t.editKYC : t.addKYC}
                </Button>
              </div>

              {!kycData ? (
                /* Empty State - No KYC Data */
                <div className="p-6 rounded-xl bg-[#0B0B0D] border border-[#4e4e4e78]">
                  <div
                    className={`flex flex-col items-center justify-center text-center ${isRTL ? "text-right" : "text-left"
                      }`}
                  >
                    <div className="w-16 h-16 mb-4 rounded-full bg-[#45e3d3]/10 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-[#45e3d3]" />
                    </div>
                    <h4 className="text-lg text-[#F2F2F3] mb-2">
                      {t.kycNotSubmitted}
                    </h4>
                    <p className="text-sm text-[#8A8EA0] mb-4 max-w-md">
                      {t.kycNotSubmittedDesc}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditKYCOpen(true)}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {t.addKYC}
                    </Button>
                  </div>
                </div>
              ) : kycData && 'status' in kycData && kycData.status?.toLowerCase() === "rejected" ? (
                /* Rejected State - Show message to resubmit */
                <div className="p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border-2 border-red-500/30 mb-6">
                  <div
                    className={`flex flex-col items-center justify-center text-center ${isRTL ? "text-right" : "text-left"
                      }`}
                  >
                    <div className="w-16 h-16 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Shield className="w-8 h-8 text-red-400" />
                    </div>
                    <h4 className="text-lg text-[#F2F2F3] mb-2">
                      {language === "en" ? "Verification Rejected" : "تم رفض التحقق"}
                    </h4>
                    <p className="text-sm text-[#8A8EA0] mb-4 max-w-md">
                      {language === "en"
                        ? "Your KYC verification was rejected. Please review your information and resubmit."
                        : "تم رفض التحقق من هويتك. يرجى مراجعة معلوماتك وإعادة الإرسال."}
                    </p>
                    <Button
                      variant="outline"
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                      onClick={() => setIsEditKYCOpen(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {t.editKYC}
                    </Button>
                  </div>
                </div>
              ) : (
                /* KYC Data Display */
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ID Number */}
                    {kycData.id_number && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#C59B48]/30 rounded-xl flex items-center justify-center">
                          <Hash className="w-6 h-6 text-[#C59B48]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">{t.idNumber}</p>
                          <p className="text-[#F2F2F3]">
                            {kycData.id_number.substring(0, 4)}****
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Date of Birth */}
                    {kycData.dob && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#fface3]/30 rounded-xl flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-[#fface3]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.dateOfBirth}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {(() => {
                              try {
                                const date = new Date(kycData.dob);
                                if (isNaN(date.getTime())) {
                                  return kycData.dob;
                                }
                                return date.toLocaleDateString(
                                  language === "en" ? "en-US" : "ar-SA",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                );
                              } catch {
                                return kycData.dob;
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Country */}
                    {kycData.country && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#0ea5e9]/30 rounded-xl flex items-center justify-center">
                          <Globe className="w-6 h-6 text-[#0ea5e9]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.kycCountry}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {getCountryName(kycData.country)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* State */}
                    {kycData.state && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#0ea5e9]/30 rounded-xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-[#0ea5e9]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.kycState}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {getStateName(kycData.state, kycData.country)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* City */}
                    {kycData.city && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#0ea5e9]/30 rounded-xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-[#0ea5e9]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.kycCity}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {kycData.city}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Postal Code */}
                    {kycData.postal_code && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#9375b5]/30 rounded-xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-[#9375b5]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.postalCode}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {kycData.postal_code}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Street Address */}
                    {kycData.street_address && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#9375b5]/30 rounded-xl flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-[#9375b5]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.kycStreetAddress}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {kycData.street_address}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ID Type */}
                    {kycData.id_type && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#C59B48]/30 rounded-xl flex items-center justify-center">
                          <IdCard className="w-6 h-6 text-[#C59B48]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.kycIdType}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {kycData.id_type}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Artist-specific: Social Link Handler */}
                    {isArtist && kycData.social_link_handler && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#9375b5]/30 rounded-xl flex items-center justify-center">
                          <Link className="w-6 h-6 text-[#9375b5]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.socialLinkHandler}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {kycData.social_link_handler}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Artist-specific: Social Link Followers */}
                    {isArtist && kycData.social_link_followers && (
                      <div
                        className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div className="w-12 h-12 bg-[#191922] border border-[#0ea5e9]/30 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-[#0ea5e9]" />
                        </div>
                        <div className={isRTL ? "text-right" : "text-left"}>
                          <p className="text-xs text-[#8A8EA0]">
                            {t.socialLinkFollowers}
                          </p>
                          <p className="text-[#F2F2F3]">
                            {kycData.social_link_followers}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents Status */}
                  {(kycData.gov_issued_id || kycData.proof_address) && (
                    <div className="mt-6 pt-6 border-t border-[#4e4e4e78]">
                      <h4
                        className={`text-sm text-[#8A8EA0] mb-4 ${isRTL ? "text-right" : "text-left"
                          }`}
                      >
                        {t.documents}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Government ID Documents */}
                        {kycData.gov_issued_id && (
                          <div>
                            <p className={`text-xs text-[#8A8EA0] mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                              {t.idDocument}
                            </p>
                            {(() => {
                              // Normalize to array
                              const idUrls = Array.isArray(kycData.gov_issued_id)
                                ? kycData.gov_issued_id
                                : [kycData.gov_issued_id];
                              const fullUrls = idUrls
                                .filter((url): url is string => typeof url === "string" && !!url)
                                .map((url) => getFullImageUrl(url))
                                .filter((url): url is string => !!url);

                              if (fullUrls.length > 0) {
                                const previews = normalizeToPreviewItems(fullUrls, ["Front", "Back"]);
                                return (
                                  <ImagePreviewList
                                    items={previews}
                                    layout="row"
                                    size="md"
                                    showNames={true}
                                    itemLabels={["Front", "Back"]}
                                    isRTL={isRTL}
                                  />
                                );
                              }
                              return (
                                <div className={`flex items-center gap-3 p-4 bg-[#0B0B0D] rounded-lg ${isRTL ? "flex-row-reverse" : ""}`}>
                                  <div className="w-10 h-10 bg-[#191922] border border-[#45e3d3]/30 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-[#45e3d3]" />
                                  </div>
                                  <div className={isRTL ? "text-right" : "text-left"}>
                                    <p className="text-sm text-[#F2F2F3]">{t.verified}</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                        {/* Proof of Address */}
                        {kycData.proof_address && (
                          <div>
                            <p className={`text-xs text-[#8A8EA0] mb-2 ${isRTL ? "text-right" : "text-left"}`}>
                              {t.proofOfAddress}
                            </p>
                            {(() => {
                              if (typeof kycData.proof_address === "string") {
                                const fullUrl = getFullImageUrl(kycData.proof_address);
                                if (fullUrl) {
                                  const previews = normalizeToPreviewItems(fullUrl);
                                  return (
                                    <ImagePreviewList
                                      items={previews}
                                      size="md"
                                      showNames={true}
                                      isRTL={isRTL}
                                    />
                                  );
                                }
                              }
                              return (
                                <div className={`flex items-center gap-3 p-4 bg-[#0B0B0D] rounded-lg ${isRTL ? "flex-row-reverse" : ""}`}>
                                  <div className="w-10 h-10 bg-[#191922] border border-[#45e3d3]/30 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-[#45e3d3]" />
                                  </div>
                                  <div className={isRTL ? "text-right" : "text-left"}>
                                    <p className="text-sm text-[#F2F2F3]">{t.verified}</p>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        </TabsContent>

        {/* Activity Tab — real readiness ledger from the server (no fabricated activity) */}
        <TabsContent value="activity">
          <ActivityCard />
        </TabsContent>

        {/* Achievements Tab */}
        {/* <TabsContent value="achievements">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {t.achievementsList.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className={`p-6 rounded-xl border transition-all ${achievement.unlocked
                      ? "bg-gradient-to-br from-[#C59B48]/20 to-[#45e3d3]/20 border-[#C59B48]/30"
                      : "bg-[#0B0B0D] border-[#4e4e4e78] opacity-60"
                      }`}
                  >
                    <div
                      className={`flex items-center gap-3 mb-3 ${isRTL ? "flex-row-reverse" : ""
                        }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${achievement.unlocked
                          ? "bg-gradient-to-br from-[#C59B48] to-[#45e3d3]"
                          : "bg-[#4e4e4e78]"
                          }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${achievement.unlocked
                            ? "text-[#0B0B0D]"
                            : "text-[#8A8EA0]"
                            }`}
                        />
                      </div>
                      {achievement.unlocked && (
                        <Badge className="bg-[#45e3d3] text-white border-0">
                          ✓
                        </Badge>
                      )}
                    </div>
                    <h3
                      className={`text-[#F2F2F3] mb-1 ${isRTL ? "text-right" : "text-left"
                        }`}
                    >
                      {achievement.name}
                    </h3>
                    <p
                      className={`text-sm text-[#8A8EA0] ${isRTL ? "text-right" : "text-left"
                        }`}
                    >
                      {achievement.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </TabsContent> */}

        {/* Stats Tab */}
        <TabsContent value="stats">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Readiness — real qualification data only (no fabricated
                  point splits). Game track shows the /100 score + tier;
                  concierge roles see the review note instead. */}
              <div className="bg-[#0B0B0D] border border-hairline rounded-xl p-6">
                <h3
                  className={`text-xl text-[#F2F2F3] mb-4 ${isRTL ? "text-right" : "text-left"
                    }`}
                >
                  {language === "en" ? "Readiness" : "الجاهزية"}
                </h3>
                {isGameTrack ? (
                  <div className="space-y-4">
                    <div>
                      <div
                        className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        <div
                          className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""
                            }`}
                        >
                          <Shield className="w-5 h-5 text-[#C9A84C]" />
                          <span className="text-[#8A8EA0]">
                            {t.readinessScore}
                          </span>
                        </div>
                        <span className="text-[#F2F2F3] tabular-nums">
                          {readinessScore}
                          <span className="text-sm text-[#8A8EA0]">/100</span>
                        </span>
                      </div>
                      <Progress
                        value={readinessScore}
                        className="h-2 bg-[#0B0B0D]"
                      />
                    </div>
                    <div
                      className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""
                        }`}
                    >
                      <span className="text-[#8A8EA0]">{t.tier}</span>
                      <span className="text-[#F2F2F3]">{currentTierName}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#8A8EA0]">
                    {language === "ar"
                      ? "طلبك قيد المراجعة المخصّصة من فريقنا."
                      : "Your application is with our team for concierge review."}
                  </p>
                )}
              </div>

              {/* Engagement Stats */}
              <div className="bg-[#0B0B0D] border border-primary/20 rounded-xl p-6">
                <h3
                  className={`text-xl text-[#F2F2F3] mb-4 ${isRTL ? "text-right" : "text-left"
                    }`}
                >
                  {language === "en" ? "Engagement" : "التفاعل"}
                </h3>
                <div className="space-y-4">
                  <div
                    className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""
                      }`}
                  >
                    <span className="text-[#8A8EA0]">{t.referrals}</span>
                    <span className="text-2xl text-[#C59B48]">
                      {userData.referrals}
                    </span>
                  </div>
                  {!isAmbassador && (
                    <div
                      className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""
                        }`}
                    >
                      <span className="text-[#8A8EA0]">{t.artworksSaved}</span>
                      <span className="text-2xl text-[#45e3d3]">
                        {userData.artworksSaved}
                      </span>
                    </div>
                  )}
                  {isCollector && (
                    <div
                      className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""
                        }`}
                    >
                      <span className="text-[#8A8EA0]">
                        {t.collectionsCreated}
                      </span>
                      <span className="text-2xl text-[#0ea5e9]">
                        {userData.collections}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <EditProfile
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        language={language}
        initialData={{
          title: userData.title,
          bio: userData.bio,
          website:
            userData.website && !userData.website.startsWith("http")
              ? `https://${userData.website}`
              : userData.website,
          instagram_handle: userData.instagram_handle,
          focus: userData.focus,
          years_of_experience: userData.years_of_experience,
          profile_image: userData.profile_image
            ? getProfileImageUrl(userData.profile_image) || null
            : null,
          location: userData.location,
          phone_number: userData.phone,
          persona: persona || storedUser?.role?.toLowerCase() || "collector",
          price_range: userData.price_range,
          preferred_commission_rate: userData.preferred_commission_rate,
          shipping_preference: userData.shipping_preference,
          studio_address: userData.studio_address,
          education: userData.education,
          award_artist: userData.award_artist,
          artist_statement: userData.artist_statement,
          organization_email: userData.organization_email,
          organization_main_contact_name:
            userData.organization_main_contact_name,
          organization_name: userData.organization_name,
          organization_type: userData.organization_type,
          founded_year: userData.founded_year,
          exhibition_count: userData.exhibition_count,
        }}
      />

      {/* Edit KYC Dialog */}
      <EditKYC
        open={isEditKYCOpen}
        onClose={() => setIsEditKYCOpen(false)}
        language={language}
        isArtist={isArtist}
        initialData={
          kycData
            ? {
              id_number: kycData.id_number,
              dob: kycData.dob,
              country: kycData.country,
              state: kycData.state,
              city: kycData.city,
              postal_code: kycData.postal_code,
              street_address: kycData.street_address,
              id_type: kycData.id_type,
              // Support both single string and array of strings for gov_issued_id
              gov_issued_id: kycData.gov_issued_id
                ? (Array.isArray(kycData.gov_issued_id)
                  ? kycData.gov_issued_id
                  : [kycData.gov_issued_id])
                : null,
              proof_address:
                typeof kycData.proof_address === "string"
                  ? kycData.proof_address
                  : kycData.proof_address || null,
              // Artist-specific fields
              social_link_handler: kycData.social_link_handler || undefined,
              social_link_followers: kycData.social_link_followers || undefined,
            }
            : undefined
        }
      />
    </DashboardLayout>
  );
}
