// P0-4 — Analytics & conversion funnel.
//
// Fires funnel events to BOTH (a) GA4 (loaded lazily from the
// VITE_GA_MEASUREMENT_ID env var, IP-anonymized, only after consent) and
// (b) the app's own server-side event store (/qualification/analytics/events),
// which is the durable source of truth for the admin funnel.
//
// All GA firing is gated behind a minimal consent flag (localStorage). The full
// GDPR consent model arrives in P1; this slots into it via setAnalyticsConsent().

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "https://api.tryfann.com/api";
const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined) || "";
const CONSENT_KEY = "tryfann_analytics_consent";

// Canonical funnel event names (keep in sync with the growth plan).
export const EVENTS = {
  PAGE_VIEW: "page_view",
  SIGNUP_STARTED: "signup_started",
  SIGNUP_SUBMITTED: "signup_submitted",
  SIGNUP_COMPLETED: "signup_completed",
  EMAIL_VERIFIED: "email_verified",
  ROLE_SELECTED: "role_selected",
  APPLICATION_SUBMITTED: "application_submitted",
  REFERRAL_SHARED: "referral_shared",
  REFERRAL_CONVERTED: "referral_converted",
} as const;

export type AnalyticsEventName = (typeof EVENTS)[keyof typeof EVENTS];

// Stable per-browser session id (also used as AnalyticsEvent.session_id).
export function getSessionId(): string {
  try {
    let sid = localStorage.getItem("tryfann_sid");
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("tryfann_sid", sid);
    }
    return sid;
  } catch {
    return "sid-anon";
  }
}

// ---- consent -------------------------------------------------------------
export function hasAnalyticsConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function consentDecisionMade(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) !== null;
  } catch {
    return true; // if storage is unavailable, don't nag
  }
}

export function setAnalyticsConsent(granted: boolean): void {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
  } catch {
    /* ignore */
  }
  // P1-d: record the decision server-side as provable, versioned consent.
  try {
    const body = JSON.stringify({
      consent_type: "analytics",
      granted,
      session_id: getSessionId(),
      source: "consent_banner",
    });
    void fetch(`${API_BASE}/qualification/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never block on consent logging */
  }
  if (granted) initGA();
}

// ---- GA4 loader ----------------------------------------------------------
let gaLoaded = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function initGA(): void {
  if (gaLoaded || !GA_ID || typeof document === "undefined") return; // no-op without an id
  gaLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // anonymize_ip keeps GA from storing the full visitor IP.
  window.gtag("config", GA_ID, { anonymize_ip: true, send_page_view: false });
}

/** Call once on app start; wires GA only if consent was already granted. */
export function initAnalytics(): void {
  if (hasAnalyticsConsent()) initGA();
}

// ---- unified track() -----------------------------------------------------
/**
 * Record a funnel event. Always writes to the server-side store (best-effort,
 * non-blocking); mirrors to GA4 only when consent is granted and an id is set.
 */
export function track(
  name: AnalyticsEventName,
  props: Record<string, unknown> = {},
): void {
  // (a) server-side durable store — the admin funnel's source of truth.
  try {
    const body = JSON.stringify({ name, props, session_id: getSessionId() });
    const url = `${API_BASE}/qualification/analytics/events`;
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* never let analytics break the app */
  }

  // (b) GA4 mirror — consent-gated.
  gaEvent(name, props);
}

/**
 * GA4-only mirror (consent-gated). Use next to an existing server-side
 * tracker (e.g. the RTK trackEvent mutation) to avoid double server writes.
 */
export function gaEvent(name: string, props: Record<string, unknown> = {}): void {
  if (hasAnalyticsConsent() && GA_ID && window.gtag) {
    window.gtag("event", name, props);
  }
}
