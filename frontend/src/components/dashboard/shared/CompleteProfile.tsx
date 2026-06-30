import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/useLanguage";
import { ProfileCompletionPrompt } from "./ProfileCompletionPrompt";

interface CompleteProfileProps {
  profileCompleted?: boolean;
  onCompleteProfile?: () => void;
}

const content = {
  en: {
    profileIncomplete: "Complete your profile to unlock all features",
    completeNow: "Complete Now",
  },
  ar: {
    profileIncomplete: "أكمل ملفك الشخصي لفتح جميع الميزات",
    completeNow: "أكمل الآن",
  }
};

export function CompleteProfile({
  profileCompleted = false,
  onCompleteProfile
}: CompleteProfileProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === 'ar';
  
  const [isPromptOpen, setIsPromptOpen] = useState(!profileCompleted);

  useEffect(() => {
    setIsPromptOpen(!profileCompleted);
  }, [profileCompleted]);

  const handleOpenPrompt = () => setIsPromptOpen(true);
  const handleClosePrompt = () => setIsPromptOpen(false);
  const handleCompleteProfile = () => {
    onCompleteProfile?.();
    setIsPromptOpen(false);
  };

  // Don't render if profile is already completed
  // Show component only when profile is NOT completed (profileCompleted === false)
  if (profileCompleted === true) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.6 }}
        className="glass border border-[#C59B48]/30 p-4 rounded-xl mb-6 shadow-2xl"
      >
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <AlertCircle className={`w-5 h-5 text-[#C59B48] flex-shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`} />
          <p className={`text-[#8A8EA0] text-sm flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.profileIncomplete}
          </p>
          <button
          className={`text-[#C59B48] hover:text-[#D6AE5A] underline text-sm transition-colors flex-shrink-0 cursor-pointer ${isRTL ? 'mr-3' : 'ml-3'}`}
            onClick={handleOpenPrompt}
          >
            {t.completeNow}
          </button>
        </div>
      </motion.div>

      <ProfileCompletionPrompt
        language={language}
        isOpen={isPromptOpen}
        onClose={handleClosePrompt}
        onCompleteProfile={handleCompleteProfile}
      />
    </>
  );
}

