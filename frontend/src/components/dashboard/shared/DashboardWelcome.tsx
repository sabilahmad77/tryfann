import { motion } from "motion/react";
import { Instagram, Twitter, Linkedin, Facebook } from "lucide-react";
import { useLanguage } from "@/contexts/useLanguage";

interface DashboardWelcomeProps {
  userName: string;
  subtitle: string;
}

const content = {
  en: {
    welcome: "Welcome back",
  },
  ar: {
    welcome: "مرحباً بعودتك",
  },
};

export function DashboardWelcome({
  userName,
  subtitle,
}: DashboardWelcomeProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8"
    >
      <div
        className={`flex items-start justify-between gap-4 flex-wrap ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <div className={isRTL ? "text-right" : "text-left"}>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-4xl md:text-5xl">
              <span className="text-[#F2F2F3] font-family-heading">{t.welcome}, </span>
              <span className="bg-gradient-to-r from-[#C59B48] font-family-heading  via-[#fbbf24] to-[#C59B48] bg-clip-text text-transparent animate-gradient">
                {userName}
              </span>
            </h1>
          </div>
          <p className="text-[#8A8EA0] text-lg">{subtitle}</p>
        </div>

        {/* Social Media Links */}
        <div
          className={`flex items-center gap-3 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <a
            href="https://instagram.com/tryfann"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-[#191922] rounded-lg flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/10 hover:text-[#fbbf24] transition-all border border-[#d4af37]/20"
            aria-label="Instagram"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://twitter.com/tryfann"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-[#191922] rounded-lg flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/10 hover:text-[#fbbf24] transition-all border border-[#d4af37]/20"
            aria-label="Twitter"
          >
            <Twitter className="w-5 h-5" />
          </a>
          <a
            href="https://linkedin.com/company/tryfann"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-[#191922] rounded-lg flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/10 hover:text-[#fbbf24] transition-all border border-[#d4af37]/20"
            aria-label="LinkedIn"
          >
            <Linkedin className="w-5 h-5" />
          </a>
          <a
            href="https://facebook.com/tryfann"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 bg-[#191922] rounded-lg flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37]/10 hover:text-[#fbbf24] transition-all border border-[#d4af37]/20"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

