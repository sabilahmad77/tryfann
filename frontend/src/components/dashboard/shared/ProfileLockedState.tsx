import { AlertCircle, Lock } from "lucide-react";
import { motion } from "motion/react";

export interface ProfileLockedStateProps {
  title: string;
  description: string;
  ctaLabel: string;
  onCta?: () => void;
  isRTL?: boolean;
}

export function ProfileLockedState({
  title,
  description,
  ctaLabel,
  onCta,
  isRTL = false,
}: ProfileLockedStateProps) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="bg-[#0B0B0D] border-2 border-[#D6AE5A]/30 rounded-xl p-8 text-center max-w-sm mx-auto">
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[#D6AE5A]/20 to-[#C59B48]/20 rounded-2xl blur-xl" />
          <div className="relative w-full h-full bg-gradient-to-br from-[#D6AE5A]/10 to-[#C59B48]/10 border-2 border-[#D6AE5A]/30 rounded-2xl flex items-center justify-center">
            <Lock className="w-12 h-12 text-[#D6AE5A]" />
          </div>
        </div>
        <h4 className="text-[#F2F2F3] mb-2">{title}</h4>
        <p className="text-sm text-[#8A8EA0] mb-6">{description}</p>
        <motion.button
          onClick={onCta}
          className="relative overflow-hidden group w-full"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#D6AE5A] to-[#C59B48] rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#D6AE5A]/0 via-white/20 to-[#D6AE5A]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div
            className={`relative px-6 py-3 flex items-center justify-center gap-2 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <AlertCircle className="w-5 h-5 text-[#121217]" />
            <span className="text-[#121217]">{ctaLabel}</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
}


