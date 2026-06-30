import { useLanguage } from "@/contexts/useLanguage";
import { useGetQualificationMeQuery } from "@/services/api/qualificationApi";
import { Megaphone } from "lucide-react";
import { motion } from "motion/react";

// FANN updates — announcements the super admin publishes/schedules (§3).
// Game track only; renders nothing if there are no published updates.
const content = {
  en: { title: "FANN updates", subtitle: "News from the founding team" },
  ar: { title: "تحديثات فن", subtitle: "أخبار من الفريق المؤسّس" },
};

export function AnnouncementsCard() {
  const { language } = useLanguage();
  const t = content[language];
  const { data } = useGetQualificationMeQuery();
  const me = data?.data;
  const items = me?.announcements ?? [];
  if (!me || me.track !== "game" || items.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl border border-hairline bg-surface-1 p-6"
    >
      <div className="flex items-center gap-2 text-gold">
        <Megaphone className="h-5 w-5" />
        <h3 className="text-lg text-white">{t.title}</h3>
      </div>
      <p className="mt-1 text-sm text-white/60">{t.subtitle}</p>

      <ul className="mt-4 space-y-3">
        {items.map((a, i) => (
          <li
            key={i}
            className="rounded-xl border border-hairline bg-[#0B0B0D] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">
                {language === "ar" && a.title_ar ? a.title_ar : a.title}
              </p>
              <span className="shrink-0 text-xs text-white/30">
                {new Date(a.published_at).toLocaleDateString(
                  language === "ar" ? "ar" : "en-GB",
                  { day: "numeric", month: "short" }
                )}
              </span>
            </div>
            {a.body && <p className="mt-1 text-sm text-white/60">{a.body}</p>}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
