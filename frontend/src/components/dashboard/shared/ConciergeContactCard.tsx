import { useLanguage } from "@/contexts/useLanguage";
import { CalendarClock, Headset, Mail } from "lucide-react";
import { motion } from "motion/react";

// Concierge contact panel (gallery / investor). Static, premium — gives the
// applicant a clear human point of contact. No points/missions/readiness.
const CONCIERGE_EMAIL = "concierge@tryfann.com";

const content = {
  en: {
    title: "Your concierge",
    body: "A dedicated FANN advisor guides your founding application end to end — verification, access, and your first steps on the platform.",
    book: "Request a call",
    email: "Email your advisor",
    hours: "Replies within one business day",
  },
  ar: {
    title: "مستشارك المخصّص",
    body: "يرافقك مستشار من FANN خلال طلب التأسيس من البداية إلى النهاية — التحقق والوصول وخطواتك الأولى على المنصة.",
    book: "اطلب مكالمة",
    email: "راسل مستشارك",
    hours: "ردّ خلال يوم عمل واحد",
  },
};

export function ConciergeContactCard() {
  const { language } = useLanguage();
  const t = content[language];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
          <Headset className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg text-white">{t.title}</h3>
          <p className="mt-1 max-w-2xl text-sm text-white/60">{t.body}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${CONCIERGE_EMAIL}?subject=Founding%20application`}
              className="fann-focus inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90"
            >
              <CalendarClock className="h-4 w-4" />
              {t.book}
            </a>
            <a
              href={`mailto:${CONCIERGE_EMAIL}`}
              className="fann-focus inline-flex items-center gap-2 rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10"
            >
              <Mail className="h-4 w-4" />
              {t.email}
            </a>
          </div>
          <p className="mt-3 text-xs text-white/40">{t.hours}</p>
        </div>
      </div>
    </motion.div>
  );
}
