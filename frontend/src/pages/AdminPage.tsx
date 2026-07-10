import { API_BASE_URL } from "@/services/api/baseApi";
import {
  applicantsCsvUrl,
  useApplicantActionMutation,
  useGetAdminApplicantsQuery,
  useGetAdminOverviewQuery,
  useGetAdminPendingTasksQuery,
  useGetAdminReferralTreeQuery,
  useGetAdminPendingKycQuery,
  useReviewKycMutation,
  useGetAdminContentQuery,
  useSaveAdminContentMutation,
  useReviewUserTaskMutation,
  type ApplicantFilters,
} from "@/services/api/adminApi";
import { ROUTES } from "@/routes/paths";
import type { RootState } from "@/store/store";
import {
  CheckCircle2,
  Download,
  Flag,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

// Internal operator console (staff-only). English-only by design — this is
// back-office tooling, not user-facing copy.

const TIER_LABELS: Record<string, string> = {
  waitlisted: "Waitlisted",
  verified_member: "Verified Member",
  priority_access: "Priority Access",
  founders_circle: "Founder's Circle",
};

const TABS = ["Overview", "Pipelines", "Applicants", "Reviews", "KYC", "Content", "Referrals"] as const;
type Tab = (typeof TABS)[number];

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 text-2xl text-white tabular-nums">{value}</p>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="text-white tabular-nums">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OverviewTab() {
  const { data, isLoading } = useGetAdminOverviewQuery();
  if (isLoading) return <p className="text-white/50">Loading…</p>;
  const d = data?.data;
  if (!d) return <p className="text-white/50">No data.</p>;
  const funnelMax = Math.max(d.funnel.landing_views, 1);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Applicants" value={d.totals.applicants} />
        <Kpi label="Verified" value={d.totals.verified} />
        <Kpi label="Pending reviews" value={d.totals.pending_reviews} />
        <Kpi label="Fraud flags" value={d.totals.fraud_flags} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 text-white">Whitelist tiers</h3>
          {Object.entries(d.tiers).map(([tier, n]) => (
            <Bar
              key={tier}
              label={TIER_LABELS[tier] ?? tier}
              value={n}
              max={d.totals.applicants}
            />
          ))}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h3 className="mb-3 text-white">Funnel</h3>
          <Bar label="Landing views" value={d.funnel.landing_views} max={funnelMax} />
          <Bar label="Role selected" value={d.funnel.roles_selected} max={funnelMax} />
          <Bar label="Signup submitted" value={d.funnel.signups_submitted} max={funnelMax} />
          <Bar label="Accounts created" value={d.funnel.accounts_created} max={funnelMax} />
          <Bar label="Verified" value={d.funnel.verified} max={funnelMax} />
          <h3 className="mb-2 mt-5 text-white">UTM sources</h3>
          {Object.entries(d.utm_sources).map(([src, n]) => (
            <div key={src} className="flex justify-between text-sm text-white/60">
              <span>{src}</span>
              <span className="tabular-nums">{n}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PipelinesTab() {
  const { data, isLoading } = useGetAdminApplicantsQuery(undefined);
  if (isLoading) return <p className="text-white/50">Loading…</p>;
  const rows = data?.data.applicants ?? [];
  const roles = [...new Set(rows.map((r) => r.role))];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {roles.map((role) => {
        const inRole = rows.filter((r) => r.role === role);
        return (
          <div key={role} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-white">{role}</h3>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300 tabular-nums">
                {inRole.length}
              </span>
            </div>
            <ul className="space-y-2">
              {inRole.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <span className="truncate text-white/70">{a.email}</span>
                  <span className="ml-2 shrink-0 text-xs text-white/40 tabular-nums">
                    {a.readiness_score} · {TIER_LABELS[a.tier] ?? a.tier}
                  </span>
                </li>
              ))}
              {inRole.length > 6 && (
                <li className="text-xs text-white/40">+{inRole.length - 6} more…</li>
              )}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function ApplicantsTab() {
  const [filters, setFilters] = useState<ApplicantFilters>({});
  const { data, isLoading } = useGetAdminApplicantsQuery(filters);
  const [act, { isLoading: acting }] = useApplicantActionMutation();
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const rows = data?.data.applicants ?? [];

  const run = async (userId: number, action: string) => {
    try {
      await act({ userId, action }).unwrap();
      toast.success(`${action} done`);
    } catch {
      toast.error(`${action} failed`);
    }
  };

  const downloadCsv = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${applicantsCsvUrl(filters)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "applicants.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("CSV export failed");
    }
  };

  const sel =
    "rounded-lg border border-white/10 bg-[#0B0B0D] px-2 py-1.5 text-sm text-white outline-none focus:border-amber-500/50";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className={`${sel} w-52`}
          placeholder="Search email…"
          value={filters.q ?? ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined })}
        />
        <select
          className={sel}
          value={filters.role ?? ""}
          onChange={(e) => setFilters({ ...filters, role: e.target.value || undefined })}
        >
          <option value="">All roles</option>
          {["Artist", "Collector", "Curator", "Ambassador", "Gallery", "Investor"].map(
            (r) => (
              <option key={r}>{r}</option>
            )
          )}
        </select>
        <select
          className={sel}
          value={filters.tier ?? ""}
          onChange={(e) => setFilters({ ...filters, tier: e.target.value || undefined })}
        >
          <option value="">All tiers</option>
          {Object.entries(TIER_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button
          onClick={downloadCsv}
          className="ml-auto inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-500/20"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      {isLoading ? (
        <p className="text-white/50">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/40">
              <tr>
                {["Email", "Role", "Score", "Done %", "Tier", "Points", "Flags", "Actions"].map(
                  (h) => (
                    <th key={h} className="px-3 py-2 font-normal">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-white/5 text-white/80">
                  <td className="px-3 py-2">
                    {a.email}
                    {a.fraud_flagged && (
                      <Flag className="ml-1 inline h-3.5 w-3.5 text-red-400" />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {a.role}
                    <span className="ml-1 text-xs text-white/40">({a.track})</span>
                  </td>
                  <td className="px-3 py-2 tabular-nums">{a.readiness_score}</td>
                  <td className="px-3 py-2 tabular-nums">{a.completion_pct}%</td>
                  <td className="px-3 py-2">{a.tier_label}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {a.track === "game" ? a.points : "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {a.email_verified ? "✉✓" : "✉✗"} {a.profile_completed ? "👤✓" : "👤✗"}
                    {a.pending_tasks > 0 && (
                      <span className="ml-1 text-amber-300">{a.pending_tasks} pending</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        title="Approve (clears the hard-role gate; auto-tiers by quality)"
                        disabled={acting}
                        onClick={() => run(a.id, "approve")}
                        className="rounded bg-emerald-500/15 p-1.5 text-emerald-300 hover:bg-emerald-500/30"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <button
                        title="Prioritize (Priority Access)"
                        disabled={acting}
                        onClick={() => run(a.id, "prioritize")}
                        className="rounded bg-amber-500/15 p-1.5 text-amber-300 hover:bg-amber-500/30"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                      <button
                        title="Flag"
                        disabled={acting}
                        onClick={() => run(a.id, "flag")}
                        className="rounded bg-red-500/15 p-1.5 text-red-300 hover:bg-red-500/30"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                      <button
                        title="Clear override + recompute"
                        disabled={acting}
                        onClick={() => run(a.id, "clear_override")}
                        className="rounded bg-white/10 p-1.5 text-white/70 hover:bg-white/20"
                      >
                        <RefreshCcw className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ReviewsTab() {
  const { data, isLoading } = useGetAdminPendingTasksQuery();
  const [review, { isLoading: reviewing }] = useReviewUserTaskMutation();
  const pending = data?.data.pending ?? [];

  const decide = async (id: number, decision: "approve" | "reject") => {
    try {
      await review({ userTaskId: id, decision }).unwrap();
      toast.success(`${decision}d`);
    } catch {
      toast.error("Review failed");
    }
  };

  if (isLoading) return <p className="text-white/50">Loading…</p>;
  if (pending.length === 0)
    return <p className="text-white/50">No submissions waiting for review. 🎉</p>;

  return (
    <ul className="space-y-3">
      {pending.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="min-w-0">
            <p className="text-sm text-white">
              {p.task_title} <span className="text-amber-300">+{p.points} pts</span>
            </p>
            <p className="text-xs text-white/50">
              {p.email} · {p.role} ·{" "}
              {String((p.payload as Record<string, unknown>)?.submission_url ?? "")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              disabled={reviewing}
              onClick={() => decide(p.id, "approve")}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/30"
            >
              {reviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </button>
            <button
              disabled={reviewing}
              onClick={() => decide(p.id, "reject")}
              className="rounded-lg bg-red-500/15 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/30"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function KycTab() {
  const { data, isLoading } = useGetAdminPendingKycQuery();
  const [review, { isLoading: reviewing }] = useReviewKycMutation();
  const pending = data?.data.pending ?? [];

  const decide = async (kycId: number, decision: "approve" | "reject") => {
    try {
      await review({ kycId, decision }).unwrap();
      toast.success(`KYC ${decision}d`);
    } catch {
      toast.error("KYC review failed");
    }
  };

  if (isLoading) return <p className="text-white/50">Loading…</p>;
  if (pending.length === 0)
    return <p className="text-white/50">No KYC submissions waiting for review. 🎉</p>;

  return (
    <ul className="space-y-3">
      {pending.map((k) => (
        <li
          key={k.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
        >
          <div className="min-w-0">
            <p className="text-sm text-white">
              {k.email} <span className="text-xs text-white/40">({k.role})</span>
            </p>
            <p className="text-xs text-white/50">
              {k.id_type} {k.id_number ? `· ${k.id_number}` : ""}
              {k.country ? ` · ${k.country}` : ""}
              {k.city ? `, ${k.city}` : ""}
              {k.dob ? ` · DOB ${k.dob}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              disabled={reviewing}
              onClick={() => decide(k.id, "approve")}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-sm text-emerald-300 hover:bg-emerald-500/30"
            >
              {reviewing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve KYC
            </button>
            <button
              disabled={reviewing}
              onClick={() => decide(k.id, "reject")}
              className="rounded-lg bg-red-500/15 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/30"
            >
              Reject
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ContentTab() {
  const { data, isLoading } = useGetAdminContentQuery();
  const [save, { isLoading: saving }] = useSaveAdminContentMutation();
  const modules = data?.data.modules ?? [];
  const announcements = data?.data.announcements ?? [];

  const GAME_ROLES = ["Artist", "Collector", "Curator", "Ambassador"];
  const inp =
    "w-full rounded-lg border border-white/10 bg-[#0B0B0D] px-3 py-2 text-sm text-white outline-none focus:border-amber-500/50";

  // trust module form
  const [m, setM] = useState({
    title_en: "",
    description_en: "",
    points: 10,
    verification: "instant",
    roles: [] as string[],
    publish_at: "",
  });
  // announcement form
  const [a, setA] = useState({ title_en: "", body_en: "", publish_at: "" });

  const saveModule = async () => {
    if (!m.title_en.trim()) return toast.error("Title required");
    try {
      const res = await save({ type: "module", ...m }).unwrap();
      toast.success(
        res.data?.published ? "Module published — live now" : "Module scheduled"
      );
      setM({ ...m, title_en: "", description_en: "", publish_at: "" });
    } catch {
      toast.error("Save failed");
    }
  };
  const saveAnnouncement = async () => {
    if (!a.title_en.trim()) return toast.error("Title required");
    try {
      const res = await save({ type: "announcement", ...a }).unwrap();
      toast.success(res.data?.published ? "Update published" : "Update scheduled");
      setA({ title_en: "", body_en: "", publish_at: "" });
    } catch {
      toast.error("Save failed");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Trust modules */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-1 text-lg text-white">Trust module (Q&amp;A)</h3>
        <p className="mb-4 text-xs text-white/40">
          Publish or schedule a trust-education module. Game users complete it →
          their Readiness Score updates.
        </p>
        <div className="space-y-3">
          <input
            className={inp}
            placeholder="Question / title (e.g. What would you verify before buying?)"
            value={m.title_en}
            onChange={(e) => setM({ ...m, title_en: e.target.value })}
          />
          <textarea
            className={inp}
            rows={2}
            placeholder="Description / guidance (optional)"
            value={m.description_en}
            onChange={(e) => setM({ ...m, description_en: e.target.value })}
          />
          <div className="flex flex-wrap gap-3">
            <label className="text-xs text-white/50">
              Points
              <input
                type="number"
                className={`${inp} mt-1 w-24`}
                value={m.points}
                onChange={(e) => setM({ ...m, points: Number(e.target.value) })}
              />
            </label>
            <label className="text-xs text-white/50">
              Verification
              <select
                className={`${inp} mt-1 w-36`}
                value={m.verification}
                onChange={(e) => setM({ ...m, verification: e.target.value })}
              >
                <option value="instant">Instant</option>
                <option value="manual">Manual review</option>
              </select>
            </label>
            <label className="text-xs text-white/50">
              Publish at (blank = now)
              <input
                type="datetime-local"
                className={`${inp} mt-1`}
                value={m.publish_at}
                onChange={(e) => setM({ ...m, publish_at: e.target.value })}
              />
            </label>
          </div>
          <div>
            <p className="mb-1 text-xs text-white/50">Roles (none = all game roles)</p>
            <div className="flex flex-wrap gap-2">
              {GAME_ROLES.map((r) => {
                const on = m.roles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      setM({
                        ...m,
                        roles: on
                          ? m.roles.filter((x) => x !== r)
                          : [...m.roles, r],
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      on
                        ? "border-amber-500 bg-amber-500/20 text-amber-200"
                        : "border-white/10 text-white/60"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            disabled={saving}
            onClick={saveModule}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2 text-sm font-medium text-[#0B0B0D]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish / schedule module
          </button>
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
            Existing modules
          </p>
          {isLoading ? (
            <p className="text-white/50">Loading…</p>
          ) : (
            <ul className="space-y-2">
              {modules.map((md) => (
                <li
                  key={md.id}
                  className="flex items-center justify-between gap-2 text-sm text-white/70"
                >
                  <span className="min-w-0 truncate">
                    {md.title_en}{" "}
                    <span className="text-xs text-amber-300">+{md.points}</span>
                  </span>
                  <span className="shrink-0 text-xs">
                    {md.published ? (
                      <span className="text-emerald-300">live</span>
                    ) : (
                      <span className="text-amber-300">
                        scheduled{md.publish_at ? ` · ${new Date(md.publish_at).toLocaleString()}` : ""}
                      </span>
                    )}{" "}
                    · {md.completions} done
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* FANN updates */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-1 text-lg text-white">FANN update</h3>
        <p className="mb-4 text-xs text-white/40">
          Publish or schedule an announcement shown to game users on their dashboard.
        </p>
        <div className="space-y-3">
          <input
            className={inp}
            placeholder="Update title"
            value={a.title_en}
            onChange={(e) => setA({ ...a, title_en: e.target.value })}
          />
          <textarea
            className={inp}
            rows={3}
            placeholder="Update body"
            value={a.body_en}
            onChange={(e) => setA({ ...a, body_en: e.target.value })}
          />
          <label className="block text-xs text-white/50">
            Publish at (blank = now)
            <input
              type="datetime-local"
              className={`${inp} mt-1`}
              value={a.publish_at}
              onChange={(e) => setA({ ...a, publish_at: e.target.value })}
            />
          </label>
          <button
            disabled={saving}
            onClick={saveAnnouncement}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2 text-sm font-medium text-[#0B0B0D]"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Publish / schedule update
          </button>
        </div>
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
            Existing updates
          </p>
          <ul className="space-y-2">
            {announcements.map((an) => (
              <li
                key={an.id}
                className="flex items-center justify-between gap-2 text-sm text-white/70"
              >
                <span className="min-w-0 truncate">{an.title_en}</span>
                <span className="shrink-0 text-xs">
                  {an.published ? (
                    <span className="text-emerald-300">live</span>
                  ) : (
                    <span className="text-amber-300">scheduled</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReferralsTab() {
  const { data, isLoading } = useGetAdminReferralTreeQuery();
  if (isLoading) return <p className="text-white/50">Loading…</p>;
  const referrers = data?.data.referrers ?? [];
  if (referrers.length === 0)
    return <p className="text-white/50">No referrals recorded yet.</p>;
  return (
    <ul className="space-y-4">
      {referrers.map((r) => (
        <li key={r.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="flex items-center gap-2 text-sm text-white">
            <Users className="h-4 w-4 text-amber-300" />
            {r.email} <span className="text-xs text-white/40">({r.role})</span>
            <span className="ml-auto text-xs text-white/40">
              {r.referees.length} referee(s)
            </span>
          </p>
          <ul className="ml-6 mt-2 space-y-1 border-l border-white/10 pl-4">
            {r.referees.map((ref) => (
              <li key={ref.id} className="text-sm text-white/70">
                {ref.email}{" "}
                <span className="text-xs text-white/40">({ref.role})</span>{" "}
                {ref.credited ? (
                  <span className="text-xs text-emerald-300">credited</span>
                ) : ref.verified ? (
                  <span className="text-xs text-amber-300">verified, not credited</span>
                ) : (
                  <span className="text-xs text-white/40">unverified</span>
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

export function AdminPage() {
  const storedUser = useSelector((s: RootState) => s.auth.user);
  const [tab, setTab] = useState<Tab>("Overview");

  // Admin guard — non-admins are bounced to their dashboard. The server sends
  // an intentional `is_admin` hint (SEC-03); the raw is_staff/is_superuser
  // Django flags are never shipped. Real authorization is enforced server-side.
  if (!storedUser?.is_admin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B0B0D] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl text-white">
          TryFann <span className="text-amber-400">CRM</span>
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Founding-cohort qualification console — staff only.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm transition ${
                tab === t
                  ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-[#0B0B0D]"
                  : "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tab === "Overview" && <OverviewTab />}
          {tab === "Pipelines" && <PipelinesTab />}
          {tab === "Applicants" && <ApplicantsTab />}
          {tab === "Reviews" && <ReviewsTab />}
          {tab === "KYC" && <KycTab />}
          {tab === "Content" && <ContentTab />}
          {tab === "Referrals" && <ReferralsTab />}
        </div>
      </div>
    </div>
  );
}
