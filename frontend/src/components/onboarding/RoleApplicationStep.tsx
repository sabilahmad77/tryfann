import { ROUTES } from "@/routes/paths";
import { useSaveRoleApplicationMutation } from "@/services/api/onboardingApi";
import {
  getRoleSchema,
  type SchemaField,
  type RoleSchema,
} from "@/config/roleApplicationSchema";
import type { OnboardingData } from "./OnboardingFlow";
import type { RootState } from "@/store/store";
import { ArrowRight, Check, ChevronLeft, Loader2, X } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface RoleApplicationStepProps {
  language: "en" | "ar";
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
  data: OnboardingData;
}

type Values = Record<string, unknown>;

const copy = {
  en: {
    fallback: "We couldn't find an application for this role.",
    groupOf: "Question group {current} of {total}",
    back: "Back",
    continue: "Continue",
    review: "Review & submit",
    saveLater: "Save & continue later",
    saved: "Progress saved — you can finish later.",
    required: "Please complete the required fields.",
    selectUpTo: "Select up to {n}",
    addHint: "Type and press Enter",
  },
  ar: {
    fallback: "تعذّر العثور على نموذج لهذا الدور.",
    groupOf: "مجموعة الأسئلة {current} من {total}",
    back: "رجوع",
    continue: "متابعة",
    review: "مراجعة وإرسال",
    saveLater: "احفظ وأكمل لاحقاً",
    saved: "تم حفظ تقدّمك — يمكنك الإكمال لاحقاً.",
    required: "يرجى إكمال الحقول المطلوبة.",
    selectUpTo: "اختر حتى {n}",
    addHint: "اكتب واضغط Enter",
  },
};

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "string") return v.trim() === "";
  return false;
}

export function RoleApplicationStep({
  language,
  onNext,
  onBack,
  data,
}: RoleApplicationStepProps) {
  const t = copy[language];
  const isRTL = language === "ar";
  const navigate = useNavigate();
  const [saveRoleApplication, { isLoading }] = useSaveRoleApplicationMutation();

  const schema: RoleSchema | null = useMemo(
    () => getRoleSchema(data?.persona as string),
    [data?.persona]
  );

  // Prefill for save-and-continue: server-stored application_data (cross-session)
  // overlaid with anything edited this session.
  const storedUser = useSelector(
    (s: RootState) => s.auth.user as { application_data?: Values } | null
  );
  const initial: Values = {
    ...(storedUser?.application_data || {}),
    ...((data?.personaDetails as Values) || {}),
  };
  const [values, setValues] = useState<Values>(initial);
  const [subStep, setSubStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  if (!schema) {
    return (
      <div className="rounded-3xl border border-hairline bg-surface-1 p-10 text-center">
        <p className="text-[#B9BBC6]">{t.fallback}</p>
      </div>
    );
  }

  const steps = schema.steps;
  const step = steps[subStep];
  const totalGroups = steps.length;

  const setField = (key: string, val: unknown) => {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key] && !isEmpty(val)) {
      setErrors((prev) => ({ ...prev, [key]: false }));
    }
  };

  const validateStep = (): boolean => {
    const next: Record<string, boolean> = {};
    let ok = true;
    for (const f of step.fields) {
      if (!f.optional && isEmpty(values[f.key])) {
        next[f.key] = true;
        ok = false;
      }
    }
    setErrors((prev) => ({ ...prev, ...next }));
    if (!ok) toast.error(t.required);
    return ok;
  };

  const persist = async (completed: boolean) => {
    try {
      await saveRoleApplication({
        application_data: { ...values, role: schema.role, track: schema.track },
        profile_step: subStep + 1,
        ...(completed ? { profile_completed: false } : {}),
      }).unwrap();
    } catch {
      // Non-fatal: keep the user moving; data stays in Redux for this session.
    }
  };

  const handleContinue = async () => {
    if (!validateStep()) return;
    await persist(false);
    if (subStep < steps.length - 1) {
      setSubStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Application complete → hand control back to the outer funnel.
      onNext({ ...values, role: schema.role, track: schema.track });
    }
  };

  const handleBack = () => {
    if (subStep > 0) {
      setSubStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onBack?.();
    }
  };

  const handleSaveLater = async () => {
    await persist(false);
    toast.success(t.saved);
    navigate(ROUTES.DASHBOARD);
  };

  const isLast = subStep === steps.length - 1;

  return (
    <div
      className="mx-auto max-w-2xl rounded-3xl border border-hairline bg-surface-1 p-6 md:p-10"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Sub-progress */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="fann-eyebrow" style={{ color: "var(--gold)" }}>
            {t.groupOf
              .replace("{current}", String(subStep + 1))
              .replace("{total}", String(totalGroups))}
          </span>
          <span className="text-xs tabular-nums text-[#8A8EA0]">
            {subStep + 1}/{totalGroups}
          </span>
        </div>
        <div className="flex gap-1.5">
          {steps.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= subStep ? "bg-gold" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      <motion.div
        key={step.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2
          className="font-display text-3xl text-white"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {step.title[language]}
        </h2>
        {step.subtitle && (
          <p className="mt-2 text-sm text-[#B9BBC6]">{step.subtitle[language]}</p>
        )}

        <div className="mt-8 space-y-6">
          {step.fields.map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              language={language}
              isRTL={isRTL}
              value={values[f.key]}
              error={!!errors[f.key]}
              onChange={(v) => setField(f.key, v)}
            />
          ))}
        </div>
      </motion.div>

      {/* Actions */}
      <div className="mt-10 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-hairline px-5 py-3 text-sm text-white transition hover:bg-white/5 disabled:opacity-60"
        >
          <ChevronLeft className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
          {t.back}
        </button>

        <button
          type="button"
          onClick={handleContinue}
          disabled={isLoading}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90 disabled:opacity-60"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLast ? t.review : t.continue}
          {!isLoading && (
            <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
          )}
        </button>

        <button
          type="button"
          onClick={handleSaveLater}
          disabled={isLoading}
          className="text-xs text-[#8A8EA0] underline-offset-4 transition hover:text-white hover:underline disabled:opacity-60"
        >
          {t.saveLater}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------- field input ------------------------------ */

function FieldInput({
  field,
  language,
  isRTL,
  value,
  error,
  onChange,
}: {
  field: SchemaField;
  language: "en" | "ar";
  isRTL: boolean;
  value: unknown;
  error: boolean;
  onChange: (v: unknown) => void;
}) {
  const t = copy[language];
  const label = field.label[language];
  const placeholder = field.placeholder?.[language] ?? "";
  const ring = error ? "border-red-400/70" : "border-hairline focus:border-[#C9A84C]";

  const labelEl = (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <label className="text-sm text-white">
        {label}
        {!field.optional && <span className="ml-1 text-[#C9A84C]">*</span>}
      </label>
      {field.help && (
        <span className="text-xs text-[#8A8EA0]">{field.help[language]}</span>
      )}
    </div>
  );

  if (field.type === "textarea") {
    return (
      <div>
        {labelEl}
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`w-full resize-y rounded-xl border bg-[#0B0B0D] px-4 py-3 text-sm text-white outline-none transition ${ring}`}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        {labelEl}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {field.options?.map((o) => {
            const active = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                className={`rounded-xl border px-4 py-3 text-start text-sm transition ${
                  active
                    ? "border-[#C9A84C] bg-[var(--gold-soft)] text-white"
                    : "border-hairline bg-[#0B0B0D] text-[#B9BBC6] hover:border-[#C9A84C]/50"
                }`}
              >
                {o[language]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <div>
        {labelEl}
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => {
            const active = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-[#C9A84C] bg-[var(--gold-soft)] text-white"
                    : "border-hairline bg-[#0B0B0D] text-[#B9BBC6] hover:border-[#C9A84C]/50"
                }`}
              >
                {o[language]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "multiselect") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    const toggle = (v: string) => {
      if (arr.includes(v)) {
        onChange(arr.filter((x) => x !== v));
      } else {
        if (field.max && arr.length >= field.max) return;
        onChange([...arr, v]);
      }
    };
    return (
      <div>
        {labelEl}
        <div className="flex flex-wrap gap-2">
          {field.options?.map((o) => {
            const active = arr.includes(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${
                  active
                    ? "border-[#C9A84C] bg-[var(--gold-soft)] text-white"
                    : "border-hairline bg-[#0B0B0D] text-[#B9BBC6] hover:border-[#C9A84C]/50"
                }`}
              >
                {active && <Check className="h-3.5 w-3.5 text-[#C9A84C]" />}
                {o[language]}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "tags") {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    const add = (raw: string) => {
      const v = raw.trim();
      if (v && !arr.includes(v)) onChange([...arr, v]);
    };
    return (
      <div>
        {labelEl}
        <div
          className={`flex flex-wrap items-center gap-2 rounded-xl border bg-[#0B0B0D] px-3 py-2 ${ring}`}
        >
          {arr.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-soft)] px-3 py-1 text-xs text-white"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(arr.filter((x) => x !== tag))}
                aria-label="remove"
                className="text-[#C9A84C] hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder={placeholder || t.addHint}
            dir={isRTL ? "rtl" : "ltr"}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                add((e.target as HTMLInputElement).value);
                (e.target as HTMLInputElement).value = "";
              }
            }}
            onBlur={(e) => {
              add(e.target.value);
              e.target.value = "";
            }}
            className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm text-white outline-none"
          />
        </div>
      </div>
    );
  }

  // text | url
  return (
    <div>
      {labelEl}
      <input
        type={field.type === "url" ? "url" : "text"}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={isRTL ? "rtl" : "ltr"}
        className={`w-full rounded-xl border bg-[#0B0B0D] px-4 py-3 text-sm text-white outline-none transition ${ring}`}
      />
    </div>
  );
}
