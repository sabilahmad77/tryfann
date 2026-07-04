import { useState } from "react";
import { motion } from "motion/react";
import {
  Link2,
  Copy,
  Share2,
  Check,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Loader2,
} from "lucide-react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/useLanguage";
import {
  useLazyGenerateReferralCodeQuery,
} from "@/services/api/dashboardApi";
import QRCode from "react-qr-code";

interface URLEncoderProps {
  profileCompleted?: boolean;
  statsData?: {
    referral_link?: string;
    is_referral_code?: boolean;
    total_referral_clicks?: number;
    conversation?: number;
    pending?: number;
    [key: string]: unknown;
  };
  isLoadingStats?: boolean;
  onRefetchStats?: () => void;
}

const content = {
  en: {
    title: "Referrals",
    description: "Share your invite link — only verified joins count toward your readiness.",
    yourLink: "Your Referral Link",
    generate: "Generate New Link",
    copy: "Copy Link",
    copied: "Copied!",
    shareOn: "Share On",
    stats: {
      clicks: "Total Clicks",
      conversions: "Conversions",
      pending: "Pending",
    },
    copySuccess: "Link copied to clipboard!",
    shareSuccess: "Opening share dialog...",
  },
  ar: {
    title: "الإحالات",
    description: "شارك رابط دعوتك — تُحتسب الإحالات الموثّقة فقط ضمن جاهزيتك.",
    yourLink: "رابط الإحالة الخاص بك",
    generate: "إنشاء رابط جديد",
    copy: "نسخ الرابط",
    copied: "تم النسخ!",
    shareOn: "شارك على",
    stats: {
      clicks: "إجمالي النقرات",
      conversions: "التحويلات",
      pending: "قيد الانتظار",
    },
    copySuccess: "تم نسخ الرابط!",
    shareSuccess: "فتح نافذة المشاركة...",
  },
};

export function URLEncoder({
  profileCompleted = false,
  statsData,
  isLoadingStats = false,
  onRefetchStats
}: URLEncoderProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";
  const [copied, setCopied] = useState(false);

  // Lazy query for generating referral code
  const [generateReferralCode, { isLoading: isGenerating }] =
    useLazyGenerateReferralCodeQuery();

  // Use stats data from props or fallback to empty
  // Check if referral_link contains "ref/None" - if so, treat as empty
  const rawReferralLink = statsData?.referral_link || "";
  const referralLink = rawReferralLink.includes("ref/None") ? "" : rawReferralLink;
  const isReferralCode = statsData?.is_referral_code || false;

  // Handle generate new referral code
  const handleGenerate = async () => {
    try {
      const result = await generateReferralCode().unwrap();
      if (result.success && result.data) {
        toast.success(
          language === "en"
            ? "Referral code generated successfully!"
            : "تم إنشاء رمز الإحالة بنجاح!"
        );
        // Refetch stats to get updated referral link
        onRefetchStats?.();
      }
    } catch (error) {
      console.error("Error generating referral code:", error);
      toast.error(
        language === "en"
          ? "Failed to generate referral code"
          : "فشل إنشاء رمز الإحالة"
      );
    }
  };

  const handleCopy = () => {
    if (!referralLink) {
      toast.error(
        language === "en"
          ? "No referral link available"
          : "لا يوجد رابط إحالة متاح"
      );
      return;
    }
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(t.copySuccess);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (platform: "facebook" | "twitter" | "instagram" | "email") => {
    if (!referralLink) {
      toast.error(
        language === "en"
          ? "No referral link available"
          : "لا يوجد رابط إحالة متاح"
      );
      return;
    }

    const encodedUrl = encodeURIComponent(referralLink);
    const shareText = language === "en" ? "Join me on FANN!" : "انضم إليّ في FANN!";

    // Native Web Share where supported (only for platforms that allow URL sharing)
    if (typeof navigator !== "undefined" && navigator.share && platform !== "instagram") {
      try {
        await navigator.share({
          title: "FANN",
          text: shareText,
          url: referralLink,
        });
        toast.success(t.shareSuccess);
        return;
      } catch {
        // Fall back to manual share below
      }
    }

    const shareUrls: Record<typeof platform, string | null> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(shareText)}`,
      email: `mailto:?subject=${encodeURIComponent("Join FANN")}&body=${encodeURIComponent(
        `${shareText}\n\n${referralLink}`
      )}`,
      instagram: null, // Instagram doesn't support direct URL sharing; fallback to copy
    };

    if (platform === "instagram") {
      navigator.clipboard.writeText(referralLink);
      toast.success(
        language === "en"
          ? "Link copied! Paste it into your Instagram post/story."
          : "تم نسخ الرابط! الصقه في منشورك أو قصتك على إنستغرام."
      );
      return;
    }

    const targetUrl = shareUrls[platform];
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      toast.success(t.shareSuccess);
    }
  };

  // Show loading state
  if (isLoadingStats) {
    return (
      <div className="rounded-2xl border border-hairline bg-surface-1 p-6 h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
          <p className="text-[#8A8EA0]">
            {language === "en"
              ? "Loading referral data..."
              : "جاري تحميل بيانات الإحالة..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-hairline bg-surface-1 p-6 h-full">
      {/* Header */}
      <div
        className={`flex items-center gap-3 mb-4 ${isRTL ? "flex-row-reverse" : ""
          }`}
      >
        <div className="w-12 h-12 bg-[var(--gold-soft)] border border-[var(--gold-hairline)] rounded-xl flex items-center justify-center">
          <Link2 className="w-6 h-6 text-[#C9A84C]" />
        </div>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
          <p className="text-sm text-[#8A8EA0]">{t.description}</p>
        </div>
      </div>

      {/* Referral Link Input */}
      <div className="mb-6">
        <div
          className={`flex items-center justify-between mb-2 ${isRTL ? "flex-row-reverse" : ""
            }`}
        >
          <label
            className={`text-sm text-[#8A8EA0] block ${isRTL ? "text-right" : "text-left"
              }`}
          >
            {t.yourLink}
          </label>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || isReferralCode || !profileCompleted}
            size="sm"
            variant="outline"
            className="text-xs min-h-11 transition-all duration-200 cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {language === "en" ? "Generating..." : "جاري الإنشاء..."}
              </>
            ) : (
              t.generate
            )}
          </Button>
        </div>
        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Input
            value={referralLink}
            readOnly
            placeholder={
              language === "en"
                ? "No referral link yet"
                : "لا يوجد رابط إحالة بعد"
            }
            className="flex-1 bg-[#0B0B0D] border-[#262629] text-[#F2EFE6] focus:border-[#C9A84C]"
          />
          <Button
            onClick={handleCopy}
            disabled={!referralLink}
            className="min-h-11 hover:shadow-lg hover:shadow-primary/50 transition-all disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t.copied}
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                {t.copy}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className={isRTL ? "text-right" : "text-left"}>
        <p className="text-sm text-[#8A8EA0] mb-3">{t.shareOn}</p>
        <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <motion.button
            whileHover={referralLink ? { scale: 1.1, rotate: 5 } : {}}
            whileTap={referralLink ? { scale: 0.95 } : {}}
            onClick={() => handleShare("facebook")}
            disabled={!referralLink}
            className="w-12 h-12 bg-gradient-to-br from-[#1877f2] to-[#0c63d4] hover:from-[#0c63d4] hover:to-[#1877f2] rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#1877f2]/50 transition-all cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
          >
            <Facebook className="w-6 h-6 text-white" />
          </motion.button>
          <motion.button
            whileHover={referralLink ? { scale: 1.1, rotate: 5 } : {}}
            whileTap={referralLink ? { scale: 0.95 } : {}}
            onClick={() => handleShare("twitter")}
            disabled={!referralLink}
            className="w-12 h-12 bg-gradient-to-br from-[#1da1f2] to-[#0c85d0] hover:from-[#0c85d0] hover:to-[#1da1f2] rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#1da1f2]/50 transition-all cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
          >
            <Twitter className="w-6 h-6 text-white" />
          </motion.button>
          <motion.button
            whileHover={referralLink ? { scale: 1.1, rotate: 5 } : {}}
            whileTap={referralLink ? { scale: 0.95 } : {}}
            onClick={() => {
              // Instagram doesn't support direct URL sharing, so copy link instead
              if (referralLink) {
                navigator.clipboard.writeText(referralLink);
                toast.success(
                  language === "en"
                    ? "Link copied! Paste it in your Instagram post."
                    : "تم نسخ الرابط! الصقه في منشورك على إنستغرام."
                );
              } else {
                toast.error(
                  language === "en"
                    ? "No referral link available"
                    : "لا يوجد رابط إحالة متاح"
                );
              }
            }}
            disabled={!referralLink}
            className="w-12 h-12 bg-gradient-to-br from-[#e4405f] to-[#c13584] hover:from-[#c13584] hover:to-[#e4405f] rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-[#e4405f]/50 transition-all cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
          >
            <Instagram className="w-6 h-6 text-white" />
          </motion.button>
          <motion.button
            whileHover={referralLink ? { scale: 1.1, rotate: 5 } : {}}
            whileTap={referralLink ? { scale: 0.95 } : {}}
            onClick={() => handleShare("email")}
            disabled={!referralLink}
            className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-xl flex items-center justify-center hover:shadow-lg hover:shadow-primary/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-6 h-6 text-[#0B0B0D]" />
          </motion.button>
        </div>
      </div>

      {/* QR Code */}
      {referralLink ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="mt-6 flex flex-col items-center"
        >
          <div className="p-4 bg-white rounded-xl shadow-lg">
            <QRCode
              value={referralLink}
              size={128}
              level="H"
              fgColor="#0B0B0D"
              bgColor="#F2F2F3"
            />
          </div>
          <p className="text-xs text-[#8A8EA0] text-center mt-2">
            {language === "en"
              ? "Scan QR Code to share"
              : "امسح رمز QR للمشاركة"}
          </p>
        </motion.div>
      ) : (
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="mt-6 p-4 bg-surface-2 rounded-xl flex items-center justify-center"
        >
          <div className="w-32 h-32 bg-[var(--gold-soft)] rounded-lg flex items-center justify-center border-2 border-dashed border-[#262629]">
            <Share2 className="w-16 h-16 text-[#8A8EA0] opacity-30" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
