import { motion } from "motion/react";
import { AlertCircle, User, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/ui/CustomModal";

interface ProfileCompletionPromptProps {
  language: "en" | "ar";
  isOpen: boolean;
  onClose: () => void;
  onCompleteProfile: () => void;
}

const content = {
  en: {
    title: "Complete Your Profile",
    subtitle: "Strengthen your founding application",
    description:
      "You're almost there. Complete your profile so our team can review your application and advance your standing for early access.",
    benefits: [
      { icon: User, text: "A complete, reviewable profile" },
      { icon: Award, text: "Stronger application standing" },
      { icon: Sparkles, text: "Faster founder review" },
    ],
    completeNow: "Complete Now",
    later: "Remind Me Later",
    progress: "Profile Incomplete",
  },
  ar: {
    title: "أكمل ملفك الشخصي",
    subtitle: "عزّز طلبك التأسيسي",
    description:
      "أنت على وشك الانتهاء. أكمل ملفك ليتمكن فريقنا من مراجعة طلبك وتعزيز مكانتك للوصول المبكر.",
    benefits: [
      { icon: User, text: "ملف مكتمل قابل للمراجعة" },
      { icon: Award, text: "مكانة أقوى لطلبك" },
      { icon: Sparkles, text: "مراجعة أسرع من المؤسّسين" },
    ],
    completeNow: "أكمل الآن",
    later: "ذكرني لاحقاً",
    progress: "الملف الشخصي غير مكتمل",
  },
};

export function ProfileCompletionPrompt({
  language,
  isOpen,
  onClose,
  onCompleteProfile,
}: ProfileCompletionPromptProps) {
  const t = content[language];
  const isRTL = language === "ar";

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={t.title}
      headerIcon={AlertCircle}
      size="md"
      contentClassName="p-6 space-y-6 bg-[#191922]"
      className="border border-[#d4af37]/30"
      zIndex={10000}
    >
      {/* Subtitle */}
      <div className={isRTL ? "text-right" : "text-left"}>
        <p className="text-[#d4af37] text-sm mb-2">{t.subtitle}</p>
        <p className="text-[#cbd5e1]">{t.description}</p>
      </div>

      {/* Benefits */}
      <div className="space-y-3">
        {t.benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <motion.div
              key={benefit.text}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
              className={`flex items-center gap-3 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#d4af37]/20 to-[#fbbf24]/20 border border-[#d4af37]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-[#d4af37]" />
              </div>
              <span
                className={`text-[#fef3c7] ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {benefit.text}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div
        className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <Button
          onClick={() => {
            onCompleteProfile();
            onClose();
          }}
          className="flex-1 bg-gradient-to-r from-[#d4af37] to-[#fbbf24] text-[#0f172a] hover:opacity-90 border-0 cursor-pointer"
        >
          {t.completeNow}
        </Button>
        <Button
          onClick={onClose}
          variant="outline"
          className="border-[#334155] text-[#cbd5e1] hover:bg-[#1e293b]/50 cursor-pointer"
        >
          {t.later}
        </Button>
      </div>
    </CustomModal>
  );
}