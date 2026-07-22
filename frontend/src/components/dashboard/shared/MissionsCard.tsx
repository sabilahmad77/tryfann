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
//
// QUIZ-1 (audit BRK-03): missions with a question bank open a real quiz —
// the server validates the answers and only a pass earns readiness. The
// advertised "+N readiness" is the server-computed movement (SCORE-1), so
// the chip, the ledger and the score always agree.
const content = {
  en: {
    title: "Founding missions",
    subtitle: "Knowledge checks that build your readiness",
    readiness: "readiness",
    capped: "component full",
    complete: "Complete",
    startQuiz: "Start quiz",
    submitAnswers: "Submit answers",
    cancel: "Cancel",
    submit: "Submit for review",
    pending: "Pending review",
    done: "Done",
    rejected: "Not approved",
    linkPlaceholder: "Link to your work (URL)",
    completed: (n: number) =>
      n > 0 ? `Passed — +${n} readiness` : "Recorded",
    answerAll: "Answer every question first",
  },
  ar: {
    title: "مهام التأسيس",
    subtitle: "اختبارات معرفية تبني جاهزيتك",
    readiness: "جاهزية",
    capped: "اكتمل هذا المكوّن",
    complete: "إكمال",
    startQuiz: "ابدأ الاختبار",
    submitAnswers: "إرسال الإجابات",
    cancel: "إلغاء",
    submit: "إرسال للمراجعة",
    pending: "قيد المراجعة",
    done: "تم",
    rejected: "لم تتم الموافقة",
    linkPlaceholder: "رابط عملك (URL)",
    completed: (n: number) =>
      n > 0 ? `نجحت — ‎+${n} جاهزية` : "تم التسجيل",
    answerAll: "أجب عن كل الأسئلة أولاً",
  },
};

function MissionRow({ task }: { task: QualificationTask }) {
  const { language } = useLanguage();
  const t = content[language];
  const [completeTask, { isLoading }] = useCompleteTaskMutation();
  const [link, setLink] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const title = language === "ar" && task.title_ar ? task.title_ar : task.title_en;
  const desc =
    language === "ar" && task.description_ar
      ? task.description_ar
      : task.description_en;

  const submitCompletion = async (payload: Record<string, unknown>) => {
    try {
      const res = await completeTask({ key: task.key, payload }).unwrap();
      toast.success(t.completed(res.data.earned));
      setQuizOpen(false);
      setAnswers({});
    } catch {
      // Server failure reasons (wrong answers, cooldown) are surfaced by the
      // shared API error toast — no duplicate generic toast here.
    }
  };

  const handleAction = () => {
    if (task.has_quiz && !quizOpen) {
      setQuizOpen(true);
      return;
    }
    if (task.has_quiz) {
      if (Object.keys(answers).length !== task.questions.length) {
        toast.error(t.answerAll);
        return;
      }
      void submitCompletion({
        answers: task.questions.map((q) => answers[q.id]),
      });
      return;
    }
    void submitCompletion(
      task.verification === "manual" && link ? { submission_url: link } : {}
    );
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
          {task.status === "available" && (
            <span className="inline-flex items-center gap-1 text-xs text-gold tabular-nums">
              <Sparkles className="h-3.5 w-3.5" />
              {task.readiness_delta > 0
                ? `+${task.readiness_delta} ${t.readiness}`
                : t.capped}
            </span>
          )}
          {statusChip}
        </div>
      </div>

      {task.status === "available" && quizOpen && task.has_quiz && (
        <div className="mt-4 space-y-4">
          {task.questions.map((q, qi) => {
            const question = language === "ar" && q.q_ar ? q.q_ar : q.q_en;
            const options =
              language === "ar" && q.options_ar.length
                ? q.options_ar
                : q.options_en;
            return (
              <fieldset key={q.id} className="rounded-lg border border-hairline p-3">
                <legend className="px-1 text-sm text-white">
                  {qi + 1}. {question}
                </legend>
                <div className="mt-2 space-y-2">
                  {options.map((opt, oi) => (
                    <label
                      key={oi}
                      className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white/80 hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name={`${task.key}-q${q.id}`}
                        checked={answers[q.id] === oi}
                        onChange={() =>
                          setAnswers((a) => ({ ...a, [q.id]: oi }))
                        }
                        className="h-4 w-4 accent-[#C9A84C]"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}

      {task.status === "available" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {task.verification === "manual" && !task.has_quiz && (
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t.linkPlaceholder}
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-hairline bg-[#0B0B0D] px-3 py-2 text-sm text-white outline-none focus:border-[#C9A84C]"
            />
          )}
          <button
            onClick={handleAction}
            disabled={isLoading}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90 disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {task.has_quiz
              ? quizOpen
                ? t.submitAnswers
                : t.startQuiz
              : task.verification === "manual"
                ? t.submit
                : t.complete}
          </button>
          {quizOpen && (
            <button
              onClick={() => {
                setQuizOpen(false);
                setAnswers({});
              }}
              className="inline-flex min-h-11 items-center rounded-lg border border-hairline px-4 py-2 text-sm text-white/70 transition hover:bg-white/5"
            >
              {t.cancel}
            </button>
          )}
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
