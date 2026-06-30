import { motion } from "motion/react";
import {
  Sparkles,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/routes/paths";
import type { OnboardingData } from "./OnboardingFlow";

interface CompletionStepProps {
  language: "en" | "ar";
  onNext: (data: Record<string, unknown>) => void;
  data: OnboardingData;
}

export function CompletionStep({ language, data }: CompletionStepProps) {
  const navigate = useNavigate();
  const isRTL = language === "ar";
  
  // Get persona from data
  const persona = (data?.persona as string)?.toLowerCase() || "artist";
  const isConcierge = persona === "gallery" || persona === "investor";

  const t = {
    en: {
      title: "Welcome to FANN! 🎉",
      subtitle: "Your account is ready — you're in the founding cohort",
      foundingNote:
        "You've joined a curated founding network of artists, galleries and collectors. Pre-launch, application-based, founder-first — your standing grows as you complete real verification steps.",
      nextSteps: {
        title: "Your next steps",
        steps: [
          {
            icon: Sparkles,
            title: "Complete your profile",
            desc: "Add your details so we can review your founding application.",
          },
          {
            icon: CheckCircle,
            title: "Verify your identity",
            desc: "Identity verification is the foundation of provenance and trust.",
          },
          {
            icon: Users,
            title: "Invite people you trust",
            desc: "Invite collectors and artists you trust — only verified joins count toward your readiness.",
          },
          {
            icon: Star,
            title: "Explore the platform",
            desc: "Discover verified artworks, artists and galleries.",
          },
        ],
      },
      cta: "Enter FANN Platform",
      explore: "Start Exploring",
    },
    ar: {
      title: "مرحباً بك في FANN! 🎉",
      subtitle: "حسابك جاهز — أنت الآن ضمن مجموعة المؤسّسين",
      foundingNote:
        "لقد انضممت إلى شبكة تأسيسية منتقاة من الفنانين والمعارض والجامعين. ما قبل الإطلاق، قائمة على الطلبات، تعطي الأولوية للمؤسّسين — وتنمو مكانتك بإكمال خطوات تحقق حقيقية.",
      nextSteps: {
        title: "خطواتك التالية",
        steps: [
          {
            icon: Sparkles,
            title: "أكمل ملفك الشخصي",
            desc: "أضف تفاصيلك حتى نتمكن من مراجعة طلب انضمامك.",
          },
          {
            icon: CheckCircle,
            title: "تحقّق من هويتك",
            desc: "التحقق من الهوية هو أساس الأصالة والثقة.",
          },
          {
            icon: Users,
            title: "ادعُ من تثق بهم",
            desc: "ادعُ الجامعين والفنانين الذين تثق بهم — تُحتسب الانضمامات الموثّقة فقط في جاهزيتك.",
          },
          {
            icon: Star,
            title: "استكشف المنصة",
            desc: "اكتشف الأعمال والفنانين والمعارض الموثّقة.",
          },
        ],
      },
      cta: "ادخل منصة FANN",
      explore: "ابدأ الاستكشاف",
    },
  };

  const content = t[language];

  const handleComplete = () => {
    // Navigate to dashboard page
    navigate(ROUTES.DASHBOARD);
  };

  // Concierge roles (gallery / investor): clean application-received view —
  // no points, tiers, or leaderboard (mandate: investor never sees points UI).
  if (isConcierge) {
    return (
      <div className="glass border border-white/10 rounded-3xl p-8 md:p-12">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#C59B48]/20 to-[#C59B48]/10 border border-[#C59B48]/40 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-[#C59B48]" />
          </motion.div>
          <h1 className="fann-display text-3xl md:text-4xl text-white mb-4">
            {isRTL ? "تم استلام طلبك" : "Your application is in"}
          </h1>
          <p className="text-[#B9BBC6] text-lg mb-8 leading-relaxed">
            {isRTL
              ? "سيتواصل معك مسؤول مخصّص من FANN لإكمال التحقق وترتيب وصولك المؤسس. لا مهام ولا نقاط — فقط مراجعة بشرية."
              : "A dedicated FANN concierge will reach out to complete verification and arrange your founding access. No missions, no points — just a human review."}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-10 rounded-full bg-[#C59B48]/15 border border-[#C59B48]/30">
            <span className="w-2 h-2 rounded-full bg-[#C59B48]" />
            <span className="text-[#C59B48] text-sm">
              {isRTL ? "الحالة: قيد المراجعة" : "Status: In review"}
            </span>
          </div>
          <div>
            <Button
              onClick={handleComplete}
              className="px-8 py-6 bg-[#C59B48] hover:bg-[#D6AE5A] text-[#0B0B0D] font-medium"
            >
              <span className="flex items-center gap-2">
                {isRTL ? "الذهاب إلى لوحة الحالة" : "Go to your status portal"}
                <ArrowRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
              </span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass border border-white/10 rounded-3xl p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Celebration Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          {/* Animated Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="relative w-32 h-32 mx-auto mb-6"
          >
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity },
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-500/30 blur-xl"
            />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 flex items-center justify-center">
              <Sparkles className="w-16 h-16 text-amber-400" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="fann-display text-4xl md:text-5xl text-white mb-4"
          >
            {content.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white/70 text-lg"
          >
            {content.subtitle}
          </motion.p>
        </motion.div>

        {/* Founding cohort note — honest framing, no points or fabricated counts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-10 p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 text-center"
        >
          <p className="text-white/80 leading-relaxed">{content.foundingNote}</p>
        </motion.div>

        {/* Next Steps — real actions, no point bait, no leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-10"
        >
          <h2 className="text-2xl text-white mb-6 text-center">
            {content.nextSteps.title}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {content.nextSteps.steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="p-6 rounded-xl glass border border-white/10 hover:border-amber-500/30 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                      <Icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white mb-2">{step.title}</h3>
                      <p className="text-[#B9BBC6] text-sm">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
        >
          <Button
            onClick={handleComplete}
            className="w-full h-16 shadow-lg shadow-primary/50 transition-all group relative overflow-hidden text-lg cursor-pointer"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6" />
              {content.cta}
              <ArrowRight
                className={`w-6 h-6 group-hover:translate-x-1 transition-transform ${
                  isRTL ? "rotate-180" : ""
                }`}
              />
            </span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
          </Button>
        </motion.div>

        {/* Confetti Effect (visual indicator) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-amber-400 rounded-full"
              initial={{
                top: "50%",
                left: "50%",
                opacity: 1,
                scale: 0,
              }}
              animate={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0,
                scale: 1,
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
