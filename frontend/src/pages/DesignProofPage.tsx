/**
 * Design Token Proof  (Step 1)
 * ---------------------------------------------------------------------------
 * A read-only surface at /design-proof that renders every token from
 * src/styles/tokens.css so the foundation can be verified visually in the
 * browser before any component or screen work begins. Pure presentation —
 * no backend calls, no app logic.
 */

type Swatch = { name: string; value: string; varName: string; note?: string; onLight?: boolean };

const darkSurfaces: Swatch[] = [
  { name: "canvas-night", value: "#0B0B0D", varName: "--canvas-night", note: "page bg" },
  { name: "canvas-deep", value: "#05080F", varName: "--canvas-deep", note: "deepest inset" },
  { name: "surface-1", value: "#141417", varName: "--surface-1", note: "cards" },
  { name: "surface-2", value: "#1A1A1F", varName: "--surface-2", note: "hover" },
  { name: "hairline", value: "#262629", varName: "--hairline", note: "1px edges" },
  { name: "hairline-2", value: "#34343A", varName: "--hairline-2", note: "stronger" },
];
const gold: Swatch[] = [
  { name: "gold", value: "#C9A84C", varName: "--gold", note: "primary CTA / accent" },
  { name: "gold-hover", value: "#D6B85C", varName: "--gold-hover" },
  { name: "gold-pressed", value: "#A98237", varName: "--gold-pressed" },
  { name: "gold-deep", value: "#8B6F2C", varName: "--gold-deep", note: "eyebrow on cream" },
  { name: "gold-soft", value: "rgba(201,168,76,.12)", varName: "--gold-soft", note: "chip fill" },
  { name: "gold-hairline", value: "rgba(201,168,76,.32)", varName: "--gold-hairline", note: "gold border" },
];
const greens: Swatch[] = [
  { name: "sage", value: "#6B8A7B", varName: "--sage", note: "eyebrows / trust — sampled" },
  { name: "sage-bright", value: "#8FB29E", varName: "--sage-bright" },
  { name: "forest", value: "#2D493A", varName: "--forest", note: "cream-panel CTA — sampled" },
  { name: "forest-hover", value: "#365A47", varName: "--forest-hover" },
];
const creams: Swatch[] = [
  { name: "canvas-cream", value: "#F5F0E8", varName: "--canvas-cream", onLight: true, note: "interlude band" },
  { name: "canvas-cream-2", value: "#ECE4D7", varName: "--canvas-cream-2", onLight: true },
  { name: "canvas", value: "#FFFFFF", varName: "--canvas", onLight: true },
];
const textOnDark: Swatch[] = [
  { name: "ink-on-dark", value: "#F5F0E8", varName: "--ink-on-dark", note: "headlines" },
  { name: "ink-on-dark-2", value: "rgba(245,240,232,.65)", varName: "--ink-on-dark-2", note: "body" },
  { name: "ink-on-dark-3", value: "rgba(245,240,232,.40)", varName: "--ink-on-dark-3", note: "meta" },
];
const textOnLight: Swatch[] = [
  { name: "ink", value: "#0B0B0D", varName: "--ink", onLight: true },
  { name: "ink-mute", value: "#5B5854", varName: "--ink-mute", onLight: true },
  { name: "ink-faint", value: "#8B847D", varName: "--ink-faint", onLight: true },
];

const statusPills = [
  { label: "COMPLETED", fg: "--status-completed-fg", bg: "--status-completed-bg", bd: "--status-completed-border" },
  { label: "UNDER REVIEW", fg: "--status-review-fg", bg: "--status-review-bg", bd: "--status-review-border" },
  { label: "PENDING", fg: "--status-pending-fg", bg: "--status-pending-bg", bd: "--status-pending-border" },
  { label: "REJECTED", fg: "--status-rejected-fg", bg: "--status-rejected-bg", bd: "--status-rejected-border" },
  { label: "FLAGGED", fg: "--status-flagged-fg", bg: "--status-flagged-bg", bd: "--status-flagged-border" },
];

const radii = [
  { name: "sm", v: "8px", var: "--r-sm" },
  { name: "md", v: "12px", var: "--r-md" },
  { name: "lg", v: "16px", var: "--r-lg" },
  { name: "xl", v: "20px", var: "--r-xl" },
  { name: "pill", v: "9999px", var: "--r-pill" },
];
const spaces = [
  { name: "4", v: "4px" }, { name: "8", v: "8px" }, { name: "12", v: "12px" },
  { name: "16", v: "16px" }, { name: "24", v: "24px" }, { name: "32", v: "32px" },
  { name: "48", v: "48px" }, { name: "64", v: "64px" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="tf-eyebrow" style={{ marginBottom: 16 }}>{children}</div>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 72, borderTop: "1px solid var(--hairline)", paddingTop: 32 }}>
      <h2 style={{ fontSize: "var(--text-display-sm)", marginBottom: 24 }}>{title}</h2>
      {children}
    </section>
  );
}

function SwatchGrid({ items }: { items: Swatch[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 }}>
      {items.map((s) => (
        <div key={s.name} style={{
          border: "1px solid var(--hairline)", borderRadius: "var(--r-md)",
          overflow: "hidden", background: "var(--surface-1)",
        }}>
          <div style={{
            height: 72, background: s.value,
            // checker backing so translucent tokens read honestly
            backgroundImage: s.value.includes("rgba")
              ? "linear-gradient(45deg,#1a1a1f 25%,transparent 25%),linear-gradient(-45deg,#1a1a1f 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#1a1a1f 75%),linear-gradient(-45deg,transparent 75%,#1a1a1f 75%)"
              : undefined,
            backgroundSize: "16px 16px",
            borderBottom: "1px solid var(--hairline)",
          }}>
            <div style={{ width: "100%", height: "100%", background: s.value }} />
          </div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "var(--ink-on-dark)" }}>{s.name}</div>
            <div className="tf-tnum" style={{ fontSize: 12, color: "var(--ink-on-dark-3)", marginTop: 2 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--ink-on-dark-3)", marginTop: 4, fontFamily: "ui-monospace,monospace" }}>{s.varName}</div>
            {s.note && <div style={{ fontSize: 12, color: "var(--sage)", marginTop: 6 }}>{s.note}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DesignProofPage() {
  return (
    <div className="tf-root" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px var(--container-pad) 120px" }}>
        {/* Header */}
        <Eyebrow>◆&nbsp;&nbsp;TryFANN · Design System</Eyebrow>
        <h1 style={{ fontSize: "var(--text-display-xl)", maxWidth: "16ch" }}>
          Token <span className="tf-display-accent">foundation</span> proof.
        </h1>
        <p style={{ color: "var(--ink-on-dark-2)", fontSize: "var(--text-body-lg)", maxWidth: "60ch", marginTop: 20 }}>
          Every value below is defined once in <code style={{ color: "var(--gold)" }}>src/styles/tokens.css</code> and
          consumed everywhere. Colors are pixel-sampled from the Figma mockups; the single source of truth for the rebuild.
        </p>

        {/* Tailwind bridge proof */}
        <Block title="Tailwind utility bridge">
          <p style={{ color: "var(--ink-on-dark-2)", marginBottom: 16, fontSize: 14 }}>
            These use <em>only</em> Tailwind classes (<code style={{ color: "var(--gold)" }}>bg-gold</code>,{" "}
            <code style={{ color: "var(--gold)" }}>bg-surface-1</code>, <code style={{ color: "var(--gold)" }}>font-display</code>) — proves <code style={{ color: "var(--gold)" }}>@theme inline</code> generated them.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div className="bg-canvas-night border border-hairline" style={{ width: 80, height: 48, borderRadius: 8 }} />
            <div className="bg-surface-1 border border-hairline" style={{ width: 80, height: 48, borderRadius: 8 }} />
            <div className="bg-gold" style={{ width: 80, height: 48, borderRadius: 8 }} />
            <div className="bg-forest" style={{ width: 80, height: 48, borderRadius: 8 }} />
            <span className="text-sage" style={{ fontWeight: 600 }}>text-sage</span>
            <span className="text-gold font-display" style={{ fontSize: 28 }}>font-display · text-gold</span>
            <span className="rounded-pill bg-gold text-canvas-night" style={{ padding: "8px 18px", fontWeight: 600, fontSize: 13 }}>rounded-pill</span>
          </div>
        </Block>

        {/* Type faces */}
        <Block title="Type faces">
          <div style={{ display: "grid", gap: 28 }}>
            <div>
              <div className="tf-eyebrow" style={{ marginBottom: 8 }}>Display — Cormorant Garamond</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 500, lineHeight: 1.1 }}>
                Curated access to verified <span className="tf-display-accent">art commerce.</span>
              </div>
            </div>
            <div>
              <div className="tf-eyebrow" style={{ marginBottom: 8 }}>Body — DM Sans</div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: 17, color: "var(--ink-on-dark-2)", maxWidth: "62ch" }}>
                Apply to join FANN’s founding network of artists, galleries, collectors, curators, ambassadors, and investors. Built for physical art, trusted provenance, secure escrow, and curated marketplace access.
              </div>
            </div>
            <div dir="rtl">
              <div className="tf-eyebrow" style={{ marginBottom: 8 }}>Arabic — IBM Plex Sans Arabic (RTL)</div>
              <div style={{ fontFamily: "var(--font-arabic)", fontSize: 30, fontWeight: 500 }}>
                وصول مُنسَّق إلى <span style={{ color: "var(--gold)" }}>تجارة فنية</span> موثَّقة.
              </div>
              <div style={{ fontFamily: "var(--font-arabic)", fontSize: 16, color: "var(--ink-on-dark-2)", marginTop: 8 }}>
                مبني للفن المادي، وإثبات الأصل الموثوق، والضمان الآمن، والوصول المُنسَّق إلى السوق.
              </div>
            </div>
          </div>
        </Block>

        {/* Type scale */}
        <Block title="Display & text scale">
          <div style={{ display: "grid", gap: 20 }}>
            {[
              ["display-xl", "var(--text-display-xl)", "Access is earned by readiness."],
              ["display-lg", "var(--text-display-lg)", "A capped founding cohort."],
              ["display-md", "var(--text-display-md)", "Your Readiness Ledger"],
              ["display-sm", "var(--text-display-sm)", "Choose your role"],
            ].map(([tok, size, sample]) => (
              <div key={tok} style={{ display: "flex", alignItems: "baseline", gap: 20, borderBottom: "1px solid var(--hairline)", paddingBottom: 16 }}>
                <span className="tf-tnum" style={{ minWidth: 110, fontSize: 12, color: "var(--ink-on-dark-3)", fontFamily: "ui-monospace,monospace" }}>{tok}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: size as string, lineHeight: 1.05 }}>{sample}</span>
              </div>
            ))}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center", paddingTop: 4 }}>
              <span style={{ fontSize: "var(--text-body-lg)" }}>body-lg 18px</span>
              <span style={{ fontSize: "var(--text-body)", color: "var(--ink-on-dark-2)" }}>body 16px</span>
              <span style={{ fontSize: "var(--text-body-sm)", color: "var(--ink-on-dark-3)" }}>body-sm 14px</span>
              <span className="tf-eyebrow">◆&nbsp; Eyebrow label 11px</span>
              <span className="tf-tnum" style={{ fontSize: 18, color: "var(--gold)" }}>tabular nums 0123456789 · 4/7</span>
            </div>
          </div>
        </Block>

        {/* Colors */}
        <Block title="Dark surface ladder"><SwatchGrid items={darkSurfaces} /></Block>
        <Block title="Gold — primary voltage"><SwatchGrid items={gold} /></Block>
        <Block title="Green — secondary voltage (pixel-sampled)"><SwatchGrid items={greens} /></Block>
        <Block title="Cream / light surfaces"><SwatchGrid items={creams} /></Block>
        <Block title="Text on dark"><SwatchGrid items={textOnDark} /></Block>
        <Block title="Text on cream"><SwatchGrid items={textOnLight} /></Block>

        {/* Status pills */}
        <Block title="Status pills">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {statusPills.map((p) => (
              <span key={p.label} style={{
                fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 11, letterSpacing: "0.14em",
                color: `var(${p.fg})`, background: `var(${p.bg})`, border: `1px solid var(${p.bd})`,
                borderRadius: "var(--r-pill)", padding: "6px 14px",
              }}>{p.label}</span>
            ))}
          </div>
        </Block>

        {/* Radius */}
        <Block title="Radius scale">
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {radii.map((r) => (
              <div key={r.name} style={{ textAlign: "center" }}>
                <div style={{ width: 88, height: 64, background: "var(--surface-2)", border: "1px solid var(--gold-hairline)", borderRadius: `var(${r.var})` }} />
                <div style={{ fontSize: 12, marginTop: 8, color: "var(--ink-on-dark-2)" }}>{r.name}</div>
                <div className="tf-tnum" style={{ fontSize: 11, color: "var(--ink-on-dark-3)" }}>{r.v}</div>
              </div>
            ))}
          </div>
        </Block>

        {/* Spacing */}
        <Block title="Spacing rhythm (4px base)">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
            {spaces.map((s) => (
              <div key={s.name} style={{ textAlign: "center" }}>
                <div style={{ width: s.v, height: s.v, background: "var(--gold)", borderRadius: 2 }} />
                <div className="tf-tnum" style={{ fontSize: 11, color: "var(--ink-on-dark-3)", marginTop: 8 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </Block>

        {/* Elevation */}
        <Block title="Elevation — the one shadow (beneath artwork only)">
          <div style={{
            maxWidth: 520, aspectRatio: "16/10", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-artwork)",
            background: "radial-gradient(ellipse at 35% 30%, rgba(201,168,76,.18) 0%, transparent 55%), linear-gradient(145deg,#2a241c 0%,#1a1612 45%,#0e0c0a 100%)",
            display: "flex", alignItems: "flex-end", padding: 20,
          }}>
            <div style={{ background: "rgba(11,11,13,.72)", backdropFilter: "blur(12px)", border: "1px solid var(--hairline)", borderRadius: "var(--r-sm)", padding: "10px 14px" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 18 }}>Untitled, 1894</div>
              <div className="tf-ticker" style={{ marginTop: 2 }}>Provenance verified</div>
            </div>
          </div>
          <p style={{ color: "var(--ink-on-dark-3)", fontSize: 13, marginTop: 12 }}>Everything else uses hairline-only depth — no drop shadows on chrome.</p>
        </Block>

        {/* Ticker */}
        <div style={{ borderTop: "1px solid var(--hairline)", paddingTop: 24, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {["◆ TryFANN Verified", "Physical Art Only", "GCC / MENA First", "Curated Access"].map((t) => (
            <span key={t} className="tf-ticker">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
