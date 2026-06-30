// Stable per-browser session id for funnel analytics (AnalyticsEvent.session_id).
export function getSessionId(): string {
  try {
    let sid = localStorage.getItem("tryfann_sid");
    if (!sid) {
      sid =
        (typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sid-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      localStorage.setItem("tryfann_sid", sid);
    }
    return sid;
  } catch {
    return "sid-anon";
  }
}
