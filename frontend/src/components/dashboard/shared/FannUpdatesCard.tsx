import { useLanguage } from "@/contexts/useLanguage";
import { BadgeCheck, Newspaper, ScrollText, Users } from "lucide-react";
import { motion } from "motion/react";

// Curated, evergreen FANN updates for concierge applicants. Editorial copy
// only — no fabricated metrics, no NFT/crypto/AR-VR language, no points.
const content = {
  en: {
    title: "From FANN",
    subtitle: "What the founding cohort is building toward",
    items: [
      {
        icon: BadgeCheck,
        title: "Provenance-first marketplace",
        body: "Every work carries a certificate of authenticity and a clear chain of custody.",
      },
      {
        icon: ScrollText,
        title: "Provenance Viewer",
        body: "Trace a work's history and verification record before you ever commit.",
      },
      {
        icon: Users,
        title: "Founding cohort, capped",
        body: "Access opens in waves; concierge applicants are reviewed individually.",
      },
    ],
  },
  ar: {
    title: "من FANN",
    subtitle: "ما الذي تبني نحوه مجموعة المؤسسين",
    items: [
      {
        icon: BadgeCheck,
        title: "سوق يضع المصداقية أولًا",
        body: "كل عمل يحمل شهادة أصالة وسلسلة حيازة واضحة.",
      },
      {
        icon: ScrollText,
        title: "عارض المصداقية",
        body: "تتبّع تاريخ العمل وسجل التحقق قبل أن تلتزم.",
      },
      {
        icon: Users,
        title: "مجموعة مؤسّسين محدودة",
        body: "يُفتح الوصول على دفعات؛ تُراجَع طلبات المسار المخصّص فرديًا.",
      },
    ],
  },
};

export function FannUpdatesCard() {
  const { language } = useLanguage();
  const t = content[language];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <div className="flex items-center gap-2 text-amber-400">
        <Newspaper className="h-5 w-5" />
        <h3 className="text-lg text-white">{t.title}</h3>
      </div>
      <p className="mt-1 text-sm text-white/60">{t.subtitle}</p>

      <ul className="mt-4 space-y-4">
        {t.items.map((item, i) => {
          const Icon = item.icon;
          return (
            <li key={i} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-300">
                <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm text-white">{item.title}</p>
                <p className="mt-0.5 text-xs text-white/50">{item.body}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
