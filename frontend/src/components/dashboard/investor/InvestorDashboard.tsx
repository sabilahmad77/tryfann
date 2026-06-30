import { useLanguage } from "@/contexts/useLanguage";
import {
  useGetQualificationMeQuery,
  useUpdateRoleProfileMutation,
} from "@/services/api/qualificationApi";
import type { RootState } from "@/store/store";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { ApplicationStatusCard } from "../shared/ApplicationStatusCard";
import { ConciergeContactCard } from "../shared/ConciergeContactCard";
import { DashboardLayout } from "../shared/DashboardLayout";
import { DashboardWelcome } from "../shared/DashboardWelcome";
import { FannUpdatesCard } from "../shared/FannUpdatesCard";

const content = {
  en: {
    subtitle: "Your private path into the founding collector circle",
    conciergeTitle: "Concierge onboarding",
    conciergeBody:
      "As an investor you're on our concierge track — a dedicated advisor guides your application. No points, no missions: just a curated, verification-led path to founding access.",
    focusTitle: "Investment focus",
    focusBody: "Share your interests so your advisor can tailor your shortlist.",
    focusArea: "Primary interest",
    budget: "Typical allocation",
    notes: "Notes for your advisor (optional)",
    save: "Save preferences",
    saved: "Preferences saved",
    saveErr: "Could not save — please try again",
    focusOptions: {
      "": "Select…",
      paintings: "Paintings",
      sculpture: "Sculpture",
      photography: "Photography",
      mixed_media: "Mixed media",
      blue_chip: "Blue-chip / established",
      emerging: "Emerging artists",
    },
    budgetOptions: {
      "": "Select…",
      under_5k: "Under $5,000",
      "5k_25k": "$5,000 – $25,000",
      "25k_100k": "$25,000 – $100,000",
      over_100k: "$100,000+",
    },
  },
  ar: {
    subtitle: "مسارك الخاص إلى دائرة الجامعين المؤسسين",
    conciergeTitle: "إعداد مخصّص",
    conciergeBody:
      "بصفتك مستثمرًا، أنت على المسار المخصّص — يرشدك مستشار مخصّص خلال طلبك. بلا نقاط أو مهام: مسار منسّق قائم على التحقق نحو وصول المؤسسين.",
    focusTitle: "اهتمامات الاستثمار",
    focusBody: "شارك اهتماماتك ليصمّم مستشارك قائمتك المختارة.",
    focusArea: "الاهتمام الأساسي",
    budget: "المخصّص المعتاد",
    notes: "ملاحظات لمستشارك (اختياري)",
    save: "حفظ التفضيلات",
    saved: "تم حفظ التفضيلات",
    saveErr: "تعذّر الحفظ — يرجى المحاولة مرة أخرى",
    focusOptions: {
      "": "اختر…",
      paintings: "لوحات",
      sculpture: "نحت",
      photography: "تصوير",
      mixed_media: "وسائط مختلطة",
      blue_chip: "راسخون / مرموقون",
      emerging: "فنانون صاعدون",
    },
    budgetOptions: {
      "": "اختر…",
      under_5k: "أقل من 5,000$",
      "5k_25k": "5,000$ – 25,000$",
      "25k_100k": "25,000$ – 100,000$",
      over_100k: "+100,000$",
    },
  },
};

export function InvestorDashboard() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";
  const storedUser = useSelector((s: RootState) => s.auth.user);
  const userName =
    [storedUser?.first_name, storedUser?.last_name].filter(Boolean).join(" ") ||
    storedUser?.email ||
    "Investor";

  const { data: meResp } = useGetQualificationMeQuery();
  const [updateRoleProfile, { isLoading: saving }] = useUpdateRoleProfileMutation();

  const [focusArea, setFocusArea] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");

  // Hydrate the form from any previously-saved details.
  useEffect(() => {
    const d = (meResp?.data as { details?: Record<string, string> } | undefined)?.details;
    // /me doesn't return details; only hydrate if present (forward-compatible).
    if (d) {
      setFocusArea(d.investment_focus || "");
      setBudget(d.budget_band || "");
      setNotes(d.advisor_notes || "");
    }
  }, [meResp]);

  const handleSave = async () => {
    try {
      await updateRoleProfile({
        details: {
          investment_focus: focusArea,
          budget_band: budget,
          advisor_notes: notes,
        },
      }).unwrap();
      toast.success(t.saved);
    } catch {
      toast.error(t.saveErr);
    }
  };

  const selectClass =
    "w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500/50";

  return (
    <DashboardLayout currentPage="dashboard">
      <DashboardWelcome userName={userName} subtitle={t.subtitle} />

      {/* Concierge IA: application status + what's next -> concierge contact
          -> investment focus -> relevant FANN updates. NO points / missions /
          readiness / leaderboard anywhere in this flow. */}
      <ApplicationStatusCard />
      <ConciergeContactCard />

      {/* Investment focus form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <h3 className="text-lg text-white">{t.focusTitle}</h3>
        <p className="mt-1 text-sm text-white/60">{t.focusBody}</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">{t.focusArea}</span>
            <select
              className={selectClass}
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value)}
            >
              {Object.entries(t.focusOptions).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-white/70">{t.budget}</span>
            <select
              className={selectClass}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            >
              {Object.entries(t.budgetOptions).map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm text-white/70">{t.notes}</span>
          <textarea
            className={`${selectClass} min-h-[88px] resize-y`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t.save}
        </button>
      </motion.div>

      {/* Relevant FANN updates */}
      <FannUpdatesCard />
    </DashboardLayout>
  );
}
