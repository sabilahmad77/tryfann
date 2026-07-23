// Enh-2 — reusable view-state primitives for the 4-state contract
// (loading / empty / error / success). Loading uses the existing Skeleton;
// these codify the EMPTY and ERROR states so every data view can present them
// consistently in EN + AR (RTL-aware). Success is the view's own content.
import { useLanguage } from "@/contexts/useLanguage";
import { Inbox, RefreshCcw } from "lucide-react";
import type { ReactNode } from "react";

const copy = {
  en: {
    emptyTitle: "Nothing here yet",
    emptyBody: "This will fill in as you make progress.",
    errorTitle: "We couldn't load this",
    errorBody: "Something went wrong on our side. Please try again.",
    retry: "Try again",
  },
  ar: {
    emptyTitle: "لا يوجد شيء هنا بعد",
    emptyBody: "سيمتلئ هذا مع تقدّمك.",
    errorTitle: "تعذّر تحميل هذا",
    errorBody: "حدث خطأ من جانبنا. حاول مرة أخرى.",
    retry: "إعادة المحاولة",
  },
};

interface EmptyStateProps {
  title?: string;
  body?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Neutral, reassuring empty state (no data yet — not an error). */
export function EmptyState({ title, body, icon, action, className }: EmptyStateProps) {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.en;
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-8 text-center ${className ?? ""}`}
      role="status"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/40">
        {icon ?? <Inbox className="h-6 w-6" />}
      </span>
      <p className="text-base text-white">{title ?? t.emptyTitle}</p>
      <p className="max-w-sm text-sm text-white/50">{body ?? t.emptyBody}</p>
      {action}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  body?: string;
  onRetry?: () => void;
  className?: string;
}

/** Error state with an optional retry — used whenever a query `isError`. */
export function ErrorState({ title, body, onRetry, className }: ErrorStateProps) {
  const { language } = useLanguage();
  const t = copy[language] ?? copy.en;
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center ${className ?? ""}`}
      role="alert"
    >
      <p className="text-base text-white">{title ?? t.errorTitle}</p>
      <p className="max-w-sm text-sm text-white/50">{body ?? t.errorBody}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="fann-focus mt-1 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10"
        >
          <RefreshCcw className="h-4 w-4" />
          {t.retry}
        </button>
      )}
    </div>
  );
}
