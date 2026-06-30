import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, Plus, TrendingUp, Award, Mail, Loader2, Lock } from "lucide-react";
import { Button } from "../../ui/button";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Badge } from "../../ui/badge";
import { useLanguage } from "@/contexts/useLanguage";
import { AddArtistModal, type Artist } from "./AddArtistModal";
import { toast } from "sonner";
import { ProfileLockedState } from "@/components/dashboard/shared/ProfileLockedState";
import {
  useGetArtistRoasterQuery,
  useCreateArtistRoasterMutation,
  useDeleteArtistRoasterMutation,
  type ArtistRoaster,
} from "@/services/api/dashboardApi";

interface ArtistRosterProps {
  profileCompleted?: boolean;
  onCompleteProfile?: () => void;
}

const content = {
  en: {
    title: "Artist Roster",
    totalArtists: "Total Artists",
    active: "Active",
    emerging: "Emerging",
    established: "Established",
    addArtist: "Add Artist",
    viewProfile: "View Profile",
    contact: "Contact",
    profileLocked: "Complete Your Profile",
    unlockFeature: "Complete your profile to unlock artist roster management",
    completeProfile: "Complete Profile",
    profileRequired: "Please complete your profile to add artists",
    emailCopied: "Email copied",
    emailCopyFailed: "Failed to copy email",
    noEmail: "No email available",
    artists: [
      {
        name: "Sarah Al-Mansouri",
        email: "sarah.almansouri@example.com",
        initials: "SM",
        specialty: "Contemporary Painting",
        status: "established" as const,
        artworks: 24,
        exhibitions: 8,
      },
      {
        name: "Ahmed Hassan",
        email: "ahmed.hassan@example.com",
        initials: "AH",
        specialty: "Digital Art",
        status: "emerging" as const,
        artworks: 12,
        exhibitions: 3,
      },
      {
        name: "Layla Ibrahim",
        email: "layla.ibrahim@example.com",
        initials: "LI",
        specialty: "Sculpture",
        status: "established" as const,
        artworks: 18,
        exhibitions: 6,
      },
    ] as Artist[],
    artworks: "Artworks",
    exhibitions: "Exhibitions",
  },
  ar: {
    title: "قائمة الفنانين",
    totalArtists: "إجمالي الفنانين",
    active: "نشط",
    emerging: "ناشئ",
    established: "راسخ",
    addArtist: "إضافة فنان",
    viewProfile: "عرض الملف الشخصي",
    contact: "تواصل",
    profileLocked: "أكمل ملفك الشخصي",
    unlockFeature: "أكمل ملفك الشخصي لفتح إدارة قائمة الفنانين",
    completeProfile: "إكمال الملف الشخصي",
    profileRequired: "يرجى إكمال ملفك الشخصي لإضافة فنانين",
    emailCopied: "تم نسخ البريد الإلكتروني",
    emailCopyFailed: "فشل نسخ البريد الإلكتروني",
    noEmail: "لا يوجد بريد إلكتروني",
    artists: [
      {
        name: "سارة المنصوري",
        email: "sarah.almansouri@example.com",
        initials: "SM",
        specialty: "الرسم المعاصر",
        status: "established" as const,
        artworks: 24,
        exhibitions: 8,
      },
      {
        name: "أحمد حسن",
        email: "ahmed.hassan@example.com",
        initials: "AH",
        specialty: "الفن الرقمي",
        status: "emerging" as const,
        artworks: 12,
        exhibitions: 3,
      },
      {
        name: "ليلى إبراهيم",
        email: "layla.ibrahim@example.com",
        initials: "LI",
        specialty: "النحت",
        status: "established" as const,
        artworks: 18,
        exhibitions: 6,
      },
    ] as Artist[],
    artworks: "الأعمال الفنية",
    exhibitions: "المعارض",
  },
};

export function ArtistRoster({
  profileCompleted = true,
  onCompleteProfile,
}: ArtistRosterProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  const [artists, setArtists] = useState<Artist[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch artists from API
  const {
    data: artistsData,
    isLoading: isLoadingArtists,
    error: artistsError,
  } = useGetArtistRoasterQuery(undefined, { skip: !profileCompleted });

  const [createArtist, { isLoading: isCreating }] = useCreateArtistRoasterMutation();
  const [_deleteArtist] = useDeleteArtistRoasterMutation();

  // Transform API data to component format
  useEffect(() => {
    if (!profileCompleted) {
      return;
    }

    if (artistsData?.data) {
      const apiArtists = Array.isArray(artistsData.data)
        ? artistsData.data
        : [artistsData.data];

      const transformedArtists: Artist[] = apiArtists.map((artist: ArtistRoaster) => ({
        name: artist.name,
        email: artist.email || "",
        initials: generateInitials(artist.name),
        specialty: artist.specialty,
        status: (artist.status === "established" || artist.status === "emerging"
          ? artist.status
          : "emerging") as "emerging" | "established",
        artworks: artist.artwork_count || 0,
        exhibitions: artist.exhibition_count || 0,
      }));

      setArtists(transformedArtists);
    } else if (!artistsData && !isLoadingArtists && !artistsError) {
      // Fallback to default data if API returns no data
      setArtists(t.artists);
    }
  }, [profileCompleted, artistsData, isLoadingArtists, artistsError, t.artists]);

  const generateInitials = (name: string) => {
    const names = name.trim().split(" ");
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0].substring(0, 2).toUpperCase();
  };

  const handleAddArtist = async (artistData: Omit<Artist, "initials">) => {
    try {
      await createArtist({
        name: artistData.name,
        email: artistData.email,
        specialty: artistData.specialty,
        status: artistData.status,
        artwork_count: artistData.artworks,
        exhibition_count: artistData.exhibitions,
      }).unwrap();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create artist:", error);
      // Still add to local state for UI feedback, but API will refetch
      const newArtist: Artist = {
        ...artistData,
        initials: generateInitials(artistData.name),
      };
      setArtists([...artists, newArtist]);
      setIsModalOpen(false);
    }
  };

  const handleAddArtistClick = () => {
    if (!profileCompleted) {
      toast.error(t.profileRequired);
      return;
    }
    setIsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    if (status === "established") {
      return {
        label: t.established,
        className: "bg-[#C59B48]/20 text-[#C59B48] border-[#C59B48]/30",
      };
    }
    return {
      label: t.emerging,
      className: "bg-[#45e3d3]/20 text-[#45e3d3] border-[#45e3d3]/30",
    };
  };

  const copyToClipboard = async (text: string) => {
    // Modern clipboard API (requires secure context)
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) throw new Error("Copy command failed");
  };

  const handleCopyEmail = async (email: string) => {
    if (!email) {
      toast.error(t.noEmail);
      return;
    }

    try {
      await copyToClipboard(email);
      toast.success(t.emailCopied);
    } catch {
      toast.error(t.emailCopyFailed);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 h-full">
      {/* Header */}
      <div
        className={`flex items-center justify-between mb-6 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-[#C59B48] to-[#D6AE5A] rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-[#0B0B0D]" />
            </div>
            {/* Subtle pulsing glow (match AddArtwork) */}
            <motion.div
              className="absolute inset-0 bg-[#C59B48]/30 rounded-xl blur-xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Lock overlay if profile not completed */}
            {!profileCompleted && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#D6AE5A] to-[#C59B48] rounded-full flex items-center justify-center border-2 border-[#0B0B0D]">
                <Lock className="w-3 h-3 text-[#0B0B0D]" />
              </div>
            )}
          </div>
          <div className={isRTL ? "text-right" : "text-left"}>
            <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
            <p className="text-sm text-[#8A8EA0]">
              {t.totalArtists}: {artists.length}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleAddArtistClick}
          disabled={!profileCompleted}
          className="hover:shadow-lg hover:shadow-primary/50 border-0 transition-all duration-200 cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
        >
          {!profileCompleted && <Lock className={`w-3 h-3 ${isRTL ? "ml-2" : "mr-2"}`} />}
          <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {t.addArtist}
        </Button>
      </div>

      {/* Artists List */}
      <div className="space-y-4">
        {!profileCompleted ? (
          <ProfileLockedState
            title={t.profileLocked}
            description={t.unlockFeature}
            ctaLabel={t.completeProfile}
            onCta={onCompleteProfile}
            isRTL={isRTL}
          />
        ) : isLoadingArtists ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#45e3d3] animate-spin" />
          </div>
        ) : artistsError ? (
          <div className="text-center py-8 text-[#8A8EA0]">
            <p className="text-sm">
              {language === "en"
                ? "Failed to load artists. Showing default data."
                : "فشل تحميل الفنانين. عرض البيانات الافتراضية."}
            </p>
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-8 text-[#8A8EA0]">
            <p className="text-sm">
              {language === "en"
                ? "No artists found. Add your first artist!"
                : "لم يتم العثور على فنانين. أضف أول فنان!"}
            </p>
          </div>
        ) : (
          artists.map((artist, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-[#0B0B0D] rounded-xl p-4 border border-[#4e4e4e78] hover:border-[#45e3d3]/50 transition-all"
          >
            <div
              className={`flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <Avatar className="w-12 h-12 bg-gradient-to-br from-[#C59B48] to-[#45e3d3] border-2 border-[#C59B48]/30">
                <AvatarFallback className="bg-transparent text-[#0B0B0D]">
                  {artist.initials}
                </AvatarFallback>
              </Avatar>

              {/* Artist Info */}
              <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                <div
                  className={`flex items-center gap-2 mb-1 ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <h3 className="text-[#F2F2F3]">{artist.name}</h3>
                  <Badge
                    className={`${getStatusBadge(artist.status).className} border text-xs`}
                  >
                    {getStatusBadge(artist.status).label}
                  </Badge>
                </div>
                <p className="text-sm text-[#8A8EA0] mb-1">{artist.specialty}</p>
                {artist.email && (
                  <p className="text-xs text-[#94a3b8] mb-3">{artist.email}</p>
                )}

                {/* Stats */}
                <div
                  className={`flex items-center gap-6 text-sm ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex items-center gap-1 ${
                      isRTL ? "flex-row-reverse" : ""
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-[#9375b5]" />
                    <span className="text-[#8A8EA0]">
                      {artist.artworks} {t.artworks}
                    </span>
                  </div>
                  <div
                    className={`flex items-center gap-1 ${
                      isRTL ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Award className="w-4 h-4 text-[#C59B48]" />
                    <span className="text-[#8A8EA0]">
                      {artist.exhibitions} {t.exhibitions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:scale-110 transition-all duration-200 cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
                  onClick={() => void handleCopyEmail(artist.email)}
                  disabled={!artist.email}
                  aria-label={
                    language === "en"
                      ? "Copy email to clipboard"
                      : "نسخ البريد الإلكتروني"
                  }
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
          ))
        )}
      </div>

      {/* Add Artist Modal */}
      <AddArtistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddArtist}
        isLoading={isCreating}
      />
    </div>
  );
}

