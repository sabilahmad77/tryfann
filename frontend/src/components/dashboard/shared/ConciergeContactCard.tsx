import { useLanguage } from "@/contexts/useLanguage";
import { API_BASE_URL } from "@/services/api/baseApi";
import { getAuthToken } from "@/utils/auth";
import type { RootState } from "@/store/store";
import { CalendarClock, CheckCircle2, Headset, Loader2, Mail } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useStore } from "react-redux";
import { toast } from "sonner";

// Concierge contact panel (gallery / investor). Gives the applicant a clear
// human point of contact. No points/missions/readiness.
//
// ROLE-3 (plan): "Request a call" is a REAL server request — it is recorded,
// staff are notified, and the card reflects the open-request status. "Email
// your advisor" opens mail and logs the intent so staff see it too.
const CONCIERGE_EMAIL = "concierge@tryfann.com";

const content = {
  en: {
    title: "Your concierge",
    body: "A dedicated FANN advisor guides your founding application end to end — verification, access, and your first steps on the platform.",
    book: "Request a call",
    requested: "Call requested",
    requestedNote: "Your advisor will reach out shortly.",
    email: "Email your advisor",
    hours: "Replies within one business day",
    failed: "Could not send the request — please try again.",
  },
  ar: {
    title: "مستشارك المخصّص",
    body: "يرافقك مستشار من FANN خلال طلب التأسيس من البداية إلى النهاية — التحقق والوصول وخطواتك الأولى على المنصة.",
    book: "اطلب مكالمة",
    requested: "تم طلب المكالمة",
    requestedNote: "سيتواصل معك مستشارك قريبًا.",
    email: "راسل مستشارك",
    hours: "ردّ خلال يوم عمل واحد",
    failed: "تعذّر إرسال الطلب — يرجى المحاولة مرة أخرى.",
  },
};

export function ConciergeContactCard() {
  const { language } = useLanguage();
  const t = content[language];
  const store = useStore<RootState>();
  const [callRequested, setCallRequested] = useState(false);
  const [sending, setSending] = useState(false);

  const authHeaders = (): Record<string, string> => {
    const token = getAuthToken(() => store.getState());
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Reflect an already-open call request so the button shows real state.
  useEffect(() => {
    let cancelled = false;
    void fetch(`${API_BASE_URL}/qualification/concierge/requests`, {
      headers: authHeaders(),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.data?.latest?.status === "new") {
          setCallRequested(true);
        }
      })
      .catch(() => {
        /* best-effort status read */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCall = async () => {
    if (callRequested || sending) return;
    setSending(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/qualification/concierge/requests`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ kind: "call" }),
        }
      );
      const d = await res.json();
      if (d?.success) {
        setCallRequested(true);
        toast.success(t.requestedNote);
      } else {
        toast.error(t.failed);
      }
    } catch {
      toast.error(t.failed);
    } finally {
      setSending(false);
    }
  };

  const logEmailIntent = () => {
    // Fire-and-forget: the mailto opens regardless; staff still see the intent.
    void fetch(`${API_BASE_URL}/qualification/concierge/requests`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ kind: "email" }),
    }).catch(() => {
      /* best-effort */
    });
  };

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
            <button
              type="button"
              onClick={requestCall}
              disabled={sending}
              className={`fann-focus inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                callRequested
                  ? "cursor-default border border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "bg-gradient-to-r from-amber-500 to-yellow-400 text-[#0B0B0D] hover:opacity-90"
              }`}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : callRequested ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              {callRequested ? t.requested : t.book}
            </button>
            <a
              href={`mailto:${CONCIERGE_EMAIL}?subject=Founding%20application`}
              onClick={logEmailIntent}
              className="fann-focus inline-flex min-h-11 items-center gap-2 rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10"
            >
              <Mail className="h-4 w-4" />
              {t.email}
            </a>
          </div>
          <p className="mt-3 text-xs text-white/40">
            {callRequested ? t.requestedNote : t.hours}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
