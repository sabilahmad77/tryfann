import { useLanguage } from "@/contexts/useLanguage";
import {
  useCompleteTaskMutation,
  useGetMyTasksQuery,
  type QualificationTask,
} from "@/services/api/qualificationApi";
import { CheckCircle2, Clock3, Loader2, Sparkles, Target } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// GAME-track missions list. The backend returns an empty list for concierge
// roles (they never see missions), in which case this renders nothing.
const content = {
  en: {
    title: "Founding missions",
    subtitle: "Server-verified steps that build your readiness",
    pts: "pts",
    complete: "Complete",
    submit: "Submit for review",
    pending: "Pending review",
    done: "Done",
    rejected: "Not approved",
    linkPlaceholder: "Link to your work (URL)",
    completed: "Mission recorded",
    failed: "Could not record — please try again",
  },
  ar: {
    title: "مهام التأسيس",
    subtitle: "خطوات يتحقق منها الخادم وتبني جاهزيتك",
    pts: "نقطة",
    complete: "إكمال",
    submit: "إرسال للمراجعة",
    pending: "قيد المراجعة",
    done: "تم",
    rejected: "لم تتم الموافقة",
    linkPlaceholder: "رابط عملك (URL)",
    completed: "تم تسجيل المهمة",
    failed: "تعذّر التسجيل — يرجى المحاولة مرة أخرى",
  },
};

function MissionRow({ task }: { task: QualificationTask }) {
  const { language } = useLanguage();
  const t = content[language];
  const [completeTask, { isLoading }] = useCompleteTaskMutation();
  const [link, setLink] = useState("");

  const title = language === "ar" && task.title_ar ? task.title_ar : task.title_en;
  const desc =
    language === "ar" && task.description_ar
      ? task.description_ar
      : task.description_en;

  const handleComplete = async () => {
    try {
      const payload =
        task.verification === "manual" && link ? { submission_url: link } : {};
      await completeTask({ key: task.key, payload }).unwrap();
      toast.success(t.completed);
    } catch {
      toast.error(t.failed);
    }
  };

  const statusChip = (() => {
    if (task.status === "approved")
      return (
        <span className="inline-flex items-center gap-1 text-xs text-[#8FB29E]">
          <CheckCircle2 className="h-4 w-4" /> {t.done}
        </span>
      );
    if (task.status === "pending")
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gold">
          <Clock3 className="h-4 w-4" /> {t.pending}
        </span>
      );
    if (task.status === "rejected")
      return <span className="text-xs text-red-400">{t.rejected}</span>;
    return null;
  })();

  return (
    <li className="rounded-xl border border-hairline bg-surface-1 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-white">{title}</p>
          {desc && <p className="mt-0.5 text-xs text-white/50">{desc}</p>}
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-gold tabular-nums">
            <Sparkles className="h-3.5 w-3.5" /> +{task.points} {t.pts}
          </span>
          {statusChip}
        </div>
      </div>

      {task.status === "available" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {task.verification === "manual" && (
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t.linkPlaceholder}
              className="min-w-0 flex-1 rounded-lg border border-hairline bg-[#0B0B0D] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A84C]"
            />
          )}
          <button
            onClick={handleComplete}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90 disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {task.verification === "manual" ? t.submit : t.complete}
          </button>
        </div>
      )}
    </li>
  );
}

export function MissionsCard() {
  const { language } = useLanguage();
  const t = content[language];
  const { data, isLoading } = useGetMyTasksQuery();

  if (isLoading) {
    return (
      <div className="mb-6 h-28 animate-pulse rounded-2xl border border-hairline bg-surface-1" />
    );
  }

  const tasks = data?.data?.tasks ?? [];
  // Concierge roles get an empty list from the server — render nothing.
  if (tasks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6 rounded-2xl border border-hairline bg-surface-1 p-6"
    >
      <div className="flex items-center gap-2 text-gold">
        <Target className="h-5 w-5" />
        <h3 className="text-lg text-white">{t.title}</h3>
      </div>
      <p className="mt-1 text-sm text-white/60">{t.subtitle}</p>

      <ul className="mt-4 space-y-3">
        {tasks.map((task) => (
          <MissionRow key={task.key} task={task} />
        ))}
      </ul>
    </motion.div>
  );
}
