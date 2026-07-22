// P0-4 — minimal analytics-consent banner. Gates GA firing until the visitor
// decides. The full GDPR consent model (versioned, logged, withdrawable) lands
// in P1; setAnalyticsConsent() is the seam it will plug into.
import { useEffect, useState } from "react";
import {
  consentDecisionMade,
  setAnalyticsConsent,
} from "@/utils/analytics";

const COPY = {
  en: {
    text: "We use privacy-friendly analytics to improve TryFANN. No ads, no selling data.",
    accept: "Accept",
    decline: "Decline",
  },
  ar: {
    text: "نستخدم تحليلات تحترم الخصوصية لتحسين TryFANN. بدون إعلانات ولا بيع للبيانات.",
    accept: "موافق",
    decline: "رفض",
  },
};

export function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!consentDecisionMade()) setShow(true);
  }, []);

  if (!show) return null;

  const lang = (() => {
    try {
      return localStorage.getItem("tryfann_lang") === "ar" ? "ar" : "en";
    } catch {
      return "en";
    }
  })();
  const t = COPY[lang];
  const isRTL = lang === "ar";

  const decide = (granted: boolean) => {
    setAnalyticsConsent(granted);
    setShow(false);
  };

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      role="dialog"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#262629] bg-[#0B0B0D]/95 px-4 py-3 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-white/80">{t.text}</p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => decide(false)}
            className="min-h-11 rounded-lg border border-[#262629] px-4 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            {t.decline}
          </button>
          <button
            onClick={() => decide(true)}
            className="min-h-11 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2 text-sm font-medium text-[#0B0B0D]"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
