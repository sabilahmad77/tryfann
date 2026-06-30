/**
 * TfLanding — landing page rebuilt to the Figma mockups (dark gallery system).
 * Visual layer only. Wiring (apply/sign-in/navigation) is passed in from
 * HomePage; no backend/route/auth logic lives here. Bilingual EN + AR (RTL).
 */
import { useState, type ReactNode } from "react";
import { useLanguage } from "@/contexts/useLanguage";
import {
  Palette, Landmark, User, Search, LineChart, Users, ShieldCheck, Lock, Truck,
  Frame, PenLine, BookOpen, Award, UserCheck, Target, Handshake, Gauge,
  ArrowRight, Check, Plus, Minus, Instagram, Linkedin, Youtube, MapPin, Mail,
} from "lucide-react";

import hero from "@/assets/landing/figma/hero.jpg";
import founder from "@/assets/landing/figma/founder.jpg";
import ledgerArt from "@/assets/landing/figma/ledger-art.jpg";
import rArtist from "@/assets/landing/figma/role-artist.jpg";
import rGallery from "@/assets/landing/figma/role-gallery.jpg";
import rCollector from "@/assets/landing/figma/role-collector.jpg";
import rCurator from "@/assets/landing/figma/role-curator.jpg";
import rInvestor from "@/assets/landing/figma/role-investor.jpg";
import rAmbassador from "@/assets/landing/figma/role-ambassador.jpg";
import step1 from "@/assets/landing/figma/step1.jpg";
import step2 from "@/assets/landing/figma/step2.jpg";
import step3 from "@/assets/landing/figma/step3.jpg";
import step4 from "@/assets/landing/figma/step4.jpg";
import step5 from "@/assets/landing/figma/step5.jpg";
import fannLogo from "@/assets/brand/fann-full-logo.svg";

type Lang = "en" | "ar";
type Props = { language: Lang; onApply: (persona?: string) => void; onSignIn: () => void };

/* ── primitives ─────────────────────────────────────────────────────────── */
const MAXW = 1800;
// One width system for every section: ~95% of the viewport up to MAXW, so the
// whole page sizes consistently (matching the mockup's ~3% gutters) on any screen.
function Container({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={{ width: `min(95%, ${MAXW}px)`, margin: "0 auto", ...style }}>{children}</div>;
}
function Eyebrow({ num, children }: { num?: string; children: ReactNode }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      {num && <span style={{ fontFamily: "var(--font-display)", color: "var(--gold)", fontSize: 22, fontWeight: 500, lineHeight: 1 }} className="tf-tnum">{num}</span>}
      <span className="tf-eyebrow">{children}</span>
    </div>
  );
}
function Diamond({ color = "var(--gold)" }: { color?: string }) {
  return <span style={{ color, fontSize: 9 }}>◆</span>;
}
function DiamondRule() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "0 0 56px" }}>
      <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
      <span style={{ color: "var(--gold)", fontSize: 11 }}>◇</span>
      <span style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
    </div>
  );
}
function Btn({ variant = "primary", onClick, children }: { variant?: "primary" | "ghost" | "forest"; onClick?: () => void; children: ReactNode }) {
  const base: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer",
    fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 12.5, letterSpacing: "0.12em",
    textTransform: "uppercase", padding: "15px 26px", borderRadius: "var(--r-sm)",
    border: "1px solid transparent", transition: "all var(--dur) var(--ease-soft)", whiteSpace: "nowrap",
  };
  const styles: Record<string, React.CSSProperties> = {
    primary: { ...base, background: "var(--gold)", color: "var(--canvas-night)", borderColor: "var(--gold)" },
    ghost: { ...base, background: "transparent", color: "var(--ink-on-dark)", borderColor: "var(--gold-hairline)" },
    forest: { ...base, background: "var(--forest)", color: "#EAF0EA", borderColor: "var(--forest)" },
  };
  return <button style={styles[variant]} onClick={onClick}>{children}<ArrowRight size={15} /></button>;
}
function ArtFrame({ src, alt, ratio = "4 / 3", style }: { src: string; alt: string; ratio?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ aspectRatio: ratio, borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--hairline)", boxShadow: "var(--shadow-artwork)", ...style }}>
      <img src={src} alt={alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </div>
  );
}
const sectionPad = "clamp(72px,10vw,128px) 0";

/* ── content ────────────────────────────────────────────────────────────── */
const T = {
  en: {
    nav: { links: ["About", "Roles", "How It Works", "Founder's Circle", "FAQ"], cta: "Apply for Early Access" },
    tagline: "A FANN Pre-Launch Gateway",
    hero: {
      eyebrow: "A FANN Pre-Launch Gateway",
      lead: "Apply to join FANN’s founding network of artists, galleries, collectors, curators, ambassadors, and investors.",
      sub: "Built for physical art, trusted provenance, secure escrow, and curated marketplace access.",
      apply: "Apply for Early Access", how: "See How It Works",
      strip: ["TryFANN Verified", "Physical Art Only", "GCC / MENA First"],
    },
    trust: [
      { icon: Frame, label: "Provenance", d: "Track artwork origin, authorship, and ownership context." },
      { icon: ShieldCheck, label: "Verification", d: "Reviewed member profiles and artwork preparation standards." },
      { icon: Lock, label: "Escrow", d: "Secure transaction flow designed to protect artists, galleries, and collectors." },
      { icon: Truck, label: "Logistics", d: "Prepared for real-world movement and handling of physical works." },
      { icon: Users, label: "Curated Access", d: "Early access is reviewed by quality, readiness, and role fit." },
    ],
    scroll: "Scroll to explore",
    roles: {
      desc: "Your role determines your application path, required information, and review process. Access is based on readiness, quality, and role fit — not speed.",
      reviewPath: "Review Path",
      items: [
        { key: "artist", icon: Palette, name: "Artist", d: "Submit your portfolio, medium, and available works for review.", path: "Auto + Review", img: rArtist },
        { key: "gallery", icon: Landmark, name: "Gallery", d: "Introduce your roster, inventory, and curation focus for founder review.", path: "Founder Review (Concierge)", img: rGallery },
        { key: "collector", icon: User, name: "Collector", d: "Share your collecting interests, preferred categories, and budget range.", path: "Auto + Review", img: rCollector },
        { key: "curator", icon: Search, name: "Curator", d: "Apply to support discovery, context, and trusted art-market review.", path: "Auto + Review", img: rCurator },
        { key: "investor", icon: LineChart, name: "Investor", d: "Request a founder-led briefing on FANN’s marketplace opportunity.", path: "Founder Review (Concierge)", img: rInvestor },
        { key: "ambassador", icon: Users, name: "Ambassador", d: "Introduce qualified artists, collectors, galleries, and cultural partners.", path: "Auto + Review", img: rAmbassador },
      ],
    },
    how: {
      desc: "TryFANN qualifies members through meaningful steps that build trust, verify identity, and ensure a strong fit for FANN’s marketplace. Quality matters more than speed.",
      steps: [
        { icon: PenLine, t: "Apply", d: "Choose your role and complete your profile.", img: step1 },
        { icon: ShieldCheck, t: "Verify", d: "Confirm your email and submit role-specific information.", img: step2 },
        { icon: BookOpen, t: "Learn", d: "Complete short trust modules on provenance, escrow, and authenticity.", img: step3 },
        { icon: Search, t: "Review", d: "High-value roles and supplier profiles are manually reviewed by our team.", img: step4 },
        { icon: Award, t: "Access", d: "Qualified members may receive Verified Member, Priority Access, or Founder’s Circle status.", img: step5 },
      ],
      manifestoEyebrow: "Quality over quantity",
      manifestoTitle: "We build a trusted founding network.",
      manifestoBody: "Our goal is to curate the right community across supply, demand, and strategic value.",
      checklist: ["No public leaderboard", "No points farming", "No NFT or crypto language", "No fake metrics or counters", "Real review. Real access."],
      journeyEyebrow: "Your journey starts here",
      journeyBody: "Begin your application and take the first step toward early access to FANN.",
      journeyCta: "Apply for Early Access",
    },
    ledger: {
      title: ["Your ", "Readiness", " Ledger"],
      sub: "The Readiness Ledger tracks meaningful actions that prepare you for early access. It is not a public ranking system.",
      tags: ["Transparent", "Verified", "Purposeful"],
      progress: "Completed", statusLabel: "Status", status: "Profile Started",
      nextLabel: "Next Action", next: "Complete your portfolio details or continue your profile.",
      cta: "Continue Application",
      cols: ["Action", "Description", "Status", "Date"],
      rows: [
        ["Email verified", "Your email address has been confirmed.", "completed", "May 20, 2025"],
        ["Profile completed", "Basic profile and role information completed.", "completed", "May 20, 2025"],
        ["Provenance module", "Completed the provenance & authenticity module.", "completed", "May 21, 2025"],
        ["Portfolio under review", "Your portfolio is being reviewed by our team.", "review", "May 22, 2025"],
        ["Reference verification", "We are verifying your references.", "pending", "—"],
        ["Referral pending verification", "Your referral(s) are under verification.", "pending", "—"],
        ["Founder review", "Final review for early access consideration.", "pending", "—"],
      ] as [string, string, string, string][],
      sealTitle: ["Quality.", "Verification.", "Trust."],
      sealSub: "These are the foundations of FANN.",
      stats: [
        { n: "6", l: "Role Paths", d: "Tailored application flows for every role." },
        { icon: ShieldCheck, l: "Manual Review", d: "High-value applications reviewed by our team." },
        { icon: Lock, l: "Private & Secure", d: "Your information is safe and never shared." },
      ],
    },
    founder: {
      title: ["A capped ", "founding", " cohort."],
      body: "FANN’s first launch cohort will be carefully curated across supply, demand, and strategic value. Selected members may receive Priority Access or Founder’s Circle status before the marketplace launches.",
      tags: ["Curated", "Invitational", "Trusted Access"],
      cta: "Apply for Founder Review",
      sealName: "Founder’s Circle",
      sealDesc: "A select group of high-quality members invited into FANN’s first launch cohort.",
      benefits: ["Priority marketplace access", "Early feature access", "Founder updates & briefings", "Private community", "Invitation-only events"],
      sealFoot: "Access is earned. Quality over quantity.",
      lookEyebrow: "What we look for",
      look: [
        { icon: UserCheck, t: "Profile Quality", d: "Complete, accurate, and well-presented profiles." },
        { icon: ShieldCheck, t: "Verification", d: "Identity and role verification complete." },
        { icon: Gauge, t: "Readiness", d: "Meaningful actions in your Readiness Ledger." },
        { icon: Target, t: "Strategic Fit", d: "Aligned with FANN’s mission and marketplace vision." },
        { icon: Handshake, t: "Referral Quality", d: "Verified introductions and trusted network." },
        { icon: Award, t: "Founder Review", d: "Final review by our founding team." },
      ],
    },
    faq: {
      title: ["Frequently asked ", "questions", "."],
      items: [
        { q: "What is FANN?", a: "FANN is a verified marketplace built exclusively for physical art — combining expert authentication, a provenance-first record layer, and a trusted global network so artists, collectors, galleries, and institutions can transact with confidence." },
        { q: "Is FANN free to join?", a: "Yes. Founding access is application-based and free to apply. A person reviews each application, usually within seven working days." },
        { q: "What are the membership tiers?", a: "Members move through four tiers — Waitlisted, Verified Member, Priority Access, and Founder’s Circle — earned through verified participation and review, never bought." },
        { q: "Does FANN deal in NFTs or digital-only art?", a: "No. FANN is dedicated to physical art only — paintings, sculptures, installations, and tangible works. Technology supports authenticity and documentation; it never replaces the artwork." },
        { q: "How does FANN protect collectors?", a: "Through expert authentication, provenance tracking, verified credentials, secure insured logistics, and transparent records — every layer reduces risk and preserves long-term value." },
      ],
    },
    finalTitle: "The future of art commerce begins with the right circle.",
    finalCta: "Apply for Early Access",
    ticker: ["TryFANN Verified", "Physical Art Only", "GCC / MENA First", "Curated Access"],
    footer: {
      tagline: "A FANN Pre-Launch Gateway",
      blurb: "Curated access to verified art commerce. Built for physical art, trusted provenance, secure escrow, and curated marketplace access.",
      cols: [
        { h: "Explore", links: ["About", "How It Works", "Roles", "Founder’s Circle", "FAQ"] },
        { h: "Legal", links: ["Privacy Policy", "Terms of Use", "Cookies Policy"] },
      ],
      connect: "Connect", follow: "Follow", email: "hello@tryfann.com", region: "GCC / MENA First",
      rights: "© 2025 TryFANN. All rights reserved.",
    },
  },
  ar: {
    nav: { links: ["نبذة", "الأدوار", "آلية العمل", "دائرة المؤسّسين", "الأسئلة"], cta: "قدّم للوصول المبكر" },
    tagline: "بوابة ما قبل إطلاق FANN",
    hero: {
      eyebrow: "بوابة ما قبل إطلاق FANN",
      lead: "قدّم للانضمام إلى شبكة FANN التأسيسية من الفنانين والمعارض والجامعين والقيّمين والسفراء والمستثمرين.",
      sub: "مبني للفن المادي، وإثبات الأصل الموثوق، والضمان الآمن، والوصول المُنسَّق إلى السوق.",
      apply: "قدّم للوصول المبكر", how: "اطّلع على آلية العمل",
      strip: ["موثَّق من TryFANN", "فن مادي فقط", "الخليج/مينا أولًا"],
    },
    trust: [
      { icon: Frame, label: "المصداقية", d: "تتبّع أصل العمل الفني ونسبه وسياق ملكيته." },
      { icon: ShieldCheck, label: "التحقق", d: "مراجعة ملفات الأعضاء ومعايير تجهيز الأعمال." },
      { icon: Lock, label: "الضمان", d: "تدفّق معاملات آمن مصمَّم لحماية الفنانين والمعارض والجامعين." },
      { icon: Truck, label: "اللوجستيات", d: "جاهزية لنقل ومناولة الأعمال المادية في العالم الحقيقي." },
      { icon: Users, label: "وصول مُنسَّق", d: "يُراجَع الوصول المبكر وفق الجودة والجاهزية وملاءمة الدور." },
    ],
    scroll: "مرّر للاستكشاف",
    roles: {
      desc: "يحدّد دورك مسار طلبك والمعلومات المطلوبة وعملية المراجعة. الوصول قائم على الجاهزية والجودة وملاءمة الدور — لا السرعة.",
      reviewPath: "مسار المراجعة",
      items: [
        { key: "artist", icon: Palette, name: "الفنان", d: "قدّم أعمالك ووسيطك الفني والأعمال المتاحة للمراجعة.", path: "تلقائي + مراجعة", img: rArtist },
        { key: "gallery", icon: Landmark, name: "المعرض", d: "عرّفنا بقائمة فنانيك ومخزونك ومحور تنسيقك لمراجعة المؤسّسين.", path: "مراجعة المؤسّسين", img: rGallery },
        { key: "collector", icon: User, name: "الجامِع", d: "شارك اهتماماتك في الاقتناء وفئاتك المفضّلة ونطاق ميزانيتك.", path: "تلقائي + مراجعة", img: rCollector },
        { key: "curator", icon: Search, name: "القيّم", d: "تقدّم لدعم الاكتشاف والسياق ومراجعة سوق الفن الموثوقة.", path: "تلقائي + مراجعة", img: rCurator },
        { key: "investor", icon: LineChart, name: "المستثمر", d: "اطلب إحاطة بقيادة المؤسّسين حول فرصة سوق FANN.", path: "مراجعة المؤسّسين", img: rInvestor },
        { key: "ambassador", icon: Users, name: "السفير", d: "عرّفنا بفنانين وجامعين ومعارض وشركاء ثقافيين مؤهّلين.", path: "تلقائي + مراجعة", img: rAmbassador },
      ],
    },
    how: {
      desc: "يؤهّل TryFANN الأعضاء عبر خطوات هادفة تبني الثقة وتتحقق من الهوية وتضمن الملاءمة لسوق FANN. الجودة أهم من السرعة.",
      steps: [
        { icon: PenLine, t: "قدّم", d: "اختر دورك وأكمل ملفك الشخصي.", img: step1 },
        { icon: ShieldCheck, t: "تحقّق", d: "أكّد بريدك وقدّم المعلومات الخاصة بدورك.", img: step2 },
        { icon: BookOpen, t: "تعلّم", d: "أكمل وحدات الثقة حول المصداقية والضمان والأصالة.", img: step3 },
        { icon: Search, t: "مراجعة", d: "تُراجَع الأدوار العالية القيمة وملفات المورّدين يدويًا من فريقنا.", img: step4 },
        { icon: Award, t: "الوصول", d: "قد يحصل الأعضاء المؤهّلون على عضو موثّق أو وصول ذي أولوية أو دائرة المؤسّسين.", img: step5 },
      ],
      manifestoEyebrow: "الجودة قبل الكمية",
      manifestoTitle: "نبني شبكة تأسيسية موثوقة.",
      manifestoBody: "هدفنا تنسيق المجتمع الصحيح عبر العرض والطلب والقيمة الاستراتيجية.",
      checklist: ["بلا لوحة صدارة عامة", "بلا جمع نقاط", "بلا لغة NFT أو عملات", "بلا مقاييس أو عدّادات زائفة", "مراجعة حقيقية. وصول حقيقي."],
      journeyEyebrow: "رحلتك تبدأ هنا",
      journeyBody: "ابدأ طلبك واتخذ الخطوة الأولى نحو الوصول المبكر إلى FANN.",
      journeyCta: "قدّم للوصول المبكر",
    },
    ledger: {
      title: ["سجل ", "الجاهزية", " الخاص بك"],
      sub: "يتتبّع سجل الجاهزية الإجراءات الهادفة التي تُعدّك للوصول المبكر. وهو ليس نظام ترتيب عام.",
      tags: ["شفّاف", "موثَّق", "هادف"],
      progress: "مكتمل", statusLabel: "الحالة", status: "بدأ الملف",
      nextLabel: "الإجراء التالي", next: "أكمل تفاصيل أعمالك أو تابع ملفك الشخصي.",
      cta: "متابعة الطلب",
      cols: ["الإجراء", "الوصف", "الحالة", "التاريخ"],
      rows: [
        ["تم التحقق من البريد", "تم تأكيد عنوان بريدك الإلكتروني.", "completed", "٢٠ مايو ٢٠٢٥"],
        ["اكتمل الملف", "اكتملت معلومات الملف والدور الأساسية.", "completed", "٢٠ مايو ٢٠٢٥"],
        ["وحدة المصداقية", "أكملت وحدة المصداقية والأصالة.", "completed", "٢١ مايو ٢٠٢٥"],
        ["الأعمال قيد المراجعة", "تتم مراجعة أعمالك من فريقنا.", "review", "٢٢ مايو ٢٠٢٥"],
        ["التحقق من المراجع", "نتحقق من مراجعك.", "pending", "—"],
        ["إحالة قيد التحقق", "إحالاتك قيد التحقق.", "pending", "—"],
        ["مراجعة المؤسّسين", "المراجعة النهائية للنظر في الوصول المبكر.", "pending", "—"],
      ] as [string, string, string, string][],
      sealTitle: ["جودة.", "تحقّق.", "ثقة."],
      sealSub: "هذه هي أسس FANN.",
      stats: [
        { n: "٦", l: "مسارات الأدوار", d: "مسارات طلب مخصّصة لكل دور." },
        { icon: ShieldCheck, l: "مراجعة يدوية", d: "تُراجع الطلبات العالية القيمة من فريقنا." },
        { icon: Lock, l: "خاص وآمن", d: "معلوماتك آمنة ولا تُشارك أبدًا." },
      ],
    },
    founder: {
      title: ["مجموعة ", "تأسيسية", " محدودة."],
      body: "ستُنسَّق أول مجموعة إطلاق لـ FANN بعناية عبر العرض والطلب والقيمة الاستراتيجية. قد يحصل الأعضاء المختارون على وصول ذي أولوية أو دائرة المؤسّسين قبل إطلاق السوق.",
      tags: ["مُنسَّق", "بالدعوة", "وصول موثوق"],
      cta: "قدّم لمراجعة المؤسّسين",
      sealName: "دائرة المؤسّسين",
      sealDesc: "مجموعة مختارة من الأعضاء عاليي الجودة مدعوّون إلى أول مجموعة إطلاق لـ FANN.",
      benefits: ["وصول ذو أولوية للسوق", "وصول مبكر للميزات", "تحديثات وإحاطات المؤسّسين", "مجتمع خاص", "فعاليات بالدعوة فقط"],
      sealFoot: "الوصول يُكتسب. الجودة قبل الكمية.",
      lookEyebrow: "ما الذي نبحث عنه",
      look: [
        { icon: UserCheck, t: "جودة الملف", d: "ملفات كاملة ودقيقة ومعروضة جيدًا." },
        { icon: ShieldCheck, t: "التحقق", d: "اكتمال التحقق من الهوية والدور." },
        { icon: Gauge, t: "الجاهزية", d: "إجراءات هادفة في سجل جاهزيتك." },
        { icon: Target, t: "الملاءمة الاستراتيجية", d: "متوافق مع رسالة FANN ورؤية السوق." },
        { icon: Handshake, t: "جودة الإحالة", d: "تعريفات موثَّقة وشبكة موثوقة." },
        { icon: Award, t: "مراجعة المؤسّسين", d: "مراجعة نهائية من فريقنا التأسيسي." },
      ],
    },
    faq: {
      title: ["الأسئلة ", "الشائعة", "."],
      items: [
        { q: "ما هو FANN؟", a: "FANN سوق موثَّق مبني حصريًا للفن المادي — يجمع المصادقة الخبيرة وطبقة سجل تعتمد المصداقية أولًا وشبكة عالمية موثوقة ليتعامل الفنانون والجامعون والمعارض والمؤسسات بثقة." },
        { q: "هل الانضمام مجاني؟", a: "نعم. الوصول التأسيسي قائم على التقديم والتقديم مجاني. يراجع شخصٌ كل طلب، عادةً خلال سبعة أيام عمل." },
        { q: "ما هي مستويات العضوية؟", a: "يتقدم الأعضاء عبر أربعة مستويات — مُدرَج، وعضو موثّق، ووصول ذو أولوية، ودائرة المؤسّسين — تُكتسب بالمشاركة الموثّقة والمراجعة، لا تُشترى." },
        { q: "هل يتعامل FANN مع NFT أو الفن الرقمي؟", a: "لا. FANN مخصّص للفن المادي فقط — اللوحات والمنحوتات والتركيبات والأعمال الملموسة. التقنية تدعم الأصالة والتوثيق ولا تستبدل العمل." },
        { q: "كيف يحمي FANN الجامعين؟", a: "عبر المصادقة الخبيرة وتتبّع المصداقية والأوراق الموثَّقة واللوجستيات المؤمَّنة والسجلات الشفافة — كل طبقة تقلّل المخاطر وتحافظ على القيمة." },
      ],
    },
    finalTitle: "مستقبل تجارة الفن يبدأ بالدائرة الصحيحة.",
    finalCta: "قدّم للوصول المبكر",
    ticker: ["موثَّق من TryFANN", "فن مادي فقط", "الخليج/مينا أولًا", "وصول مُنسَّق"],
    footer: {
      tagline: "بوابة ما قبل إطلاق FANN",
      blurb: "وصول مُنسَّق إلى تجارة فنية موثَّقة. مبني للفن المادي وإثبات الأصل الموثوق والضمان الآمن والوصول المُنسَّق إلى السوق.",
      cols: [
        { h: "استكشف", links: ["نبذة", "آلية العمل", "الأدوار", "دائرة المؤسّسين", "الأسئلة"] },
        { h: "قانوني", links: ["سياسة الخصوصية", "شروط الاستخدام", "سياسة الكوكيز"] },
      ],
      connect: "تواصل", follow: "تابِعنا", email: "hello@tryfann.com", region: "الخليج/مينا أولًا",
      rights: "© ٢٠٢٥ TryFANN. جميع الحقوق محفوظة.",
    },
  },
} as const;

/* ── logo ──────────────────────────────────────────────────────────────── */
function Logo({ tagline }: { tagline: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <img src={fannLogo} alt="FANN" style={{ height: 36, width: "auto", display: "block", flexShrink: 0 }} />
      <span style={{ width: 1, height: 30, background: "var(--hairline)", flexShrink: 0 }} />
      <span className="tf-eyebrow" style={{ fontSize: 9, color: "var(--gold-deep)", maxWidth: 132, lineHeight: 1.4 }}>{tagline}</span>
    </div>
  );
}

/* ── status pill ───────────────────────────────────────────────────────── */
function Pill({ kind, label }: { kind: string; label: string }) {
  const map: Record<string, [string, string, string]> = {
    completed: ["--status-completed-fg", "--status-completed-bg", "--status-completed-border"],
    review: ["--status-review-fg", "--status-review-bg", "--status-review-border"],
    pending: ["--status-pending-fg", "--status-pending-bg", "--status-pending-border"],
  };
  const [fg, bg, bd] = map[kind] || map.pending;
  return <span style={{ fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: `var(${fg})`, background: `var(${bg})`, border: `1px solid var(${bd})`, borderRadius: "var(--r-pill)", padding: "4px 12px", whiteSpace: "nowrap" }}>{label}</span>;
}

/* ── the page ──────────────────────────────────────────────────────────── */
export function TfLanding({ language, onApply, onSignIn }: Props) {
  const c = T[language];
  const { setLanguage } = useLanguage();
  const [open, setOpen] = useState<number>(0);

  return (
    <div className="tf-root" style={{ minHeight: "100vh" }}>
      {/* NAV */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(11,11,13,0.82)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--hairline)" }}>
        <Container style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo tagline={c.tagline} />
          <nav style={{ display: "flex", gap: 32 }}>
            {c.nav.links.map((l, i) => {
              const anchor = ["top", "roles", "how", "founder", "faq"][i];
              const go = () => {
                if (anchor === "top") window.scrollTo({ top: 0, behavior: "smooth" });
                else document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
              };
              return (
                <span key={l} onClick={go} style={{ fontSize: 14, color: "var(--ink-on-dark-2)", cursor: "pointer", transition: "color var(--dur)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink-on-dark)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-on-dark-2)")}>{l}</span>
              );
            })}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setLanguage(language === "ar" ? "en" : "ar")} style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: "var(--ink-on-dark-2)", background: "none", border: "1px solid var(--hairline)", borderRadius: "var(--r-pill)", padding: "6px 14px", cursor: "pointer" }}>
              {language === "ar" ? "EN" : "ع"}
            </button>
            <span onClick={onSignIn} style={{ fontSize: 13, color: "var(--ink-on-dark-2)", cursor: "pointer" }}>{language === "ar" ? "تسجيل الدخول" : "Sign In"}</span>
            <Btn onClick={() => onApply()}>{c.nav.cta}</Btn>
          </div>
        </Container>
      </header>

      {/* HERO — full-bleed gallery photo on the inline-end, text on inline-start */}
      <section className="tf-hero" style={{ position: "relative", overflow: "hidden" }}>
        <Container style={{ position: "relative", zIndex: 2 }}>
          <div className="tf-hero-text" style={{ maxWidth: 640, padding: "clamp(28px,4vw,56px) 0 clamp(28px,4vw,56px)" }}>
            <Eyebrow><Diamond /> &nbsp;{c.hero.eyebrow}</Eyebrow>
            <h1 style={{ fontSize: "var(--text-display-xl)", lineHeight: 1.02, margin: 0 }}>
              {language === "ar" ? <>وصول مُنسَّق إلى <em className="tf-display-accent">تجارة فنية</em> موثَّقة.</> : <>Curated access to verified <em className="tf-display-accent">art commerce.</em></>}
            </h1>
            <p style={{ color: "var(--ink-on-dark-2)", fontSize: "var(--text-body-lg)", marginTop: 18, maxWidth: "40ch" }}>{c.hero.lead}</p>
            <div style={{ width: 64, height: 1, background: "var(--gold)", margin: "22px 0" }} />
            <p style={{ color: "var(--ink-on-dark-2)", fontSize: 15, maxWidth: "38ch" }}>{c.hero.sub}</p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28 }}>
              <Btn onClick={() => onApply()}>{c.hero.apply}</Btn>
              <Btn variant="ghost" onClick={() => document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })}>{c.hero.how}</Btn>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 30 }}>
              {c.hero.strip.map((s) => <span key={s} className="tf-eyebrow" style={{ color: "var(--sage)" }}><Diamond color="var(--sage)" /> {s}</span>)}
            </div>
          </div>
        </Container>
        <div className="tf-hero-img" style={{ position: "absolute", top: 0, bottom: 0, insetInlineEnd: 0, width: "min(56%, 1180px)" }}>
          <img src={hero} alt="Gallery interior — a visitor before a framed landscape" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "60% center" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(${language === "ar" ? "to left" : "to right"}, var(--canvas-night) 0%, rgba(11,11,13,0.62) 15%, transparent 44%)` }} />
        </div>
      </section>

      {/* TRUST STRIP — same width system as every section */}
      <Container style={{ paddingBottom: "clamp(48px,6vw,80px)" }}>
        <div style={{ border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", background: "var(--surface-1)", display: "grid", gridTemplateColumns: "repeat(5,1fr)" }} className="tf-trust-grid">
          {c.trust.map((t, i) => (
            <div key={t.label} style={{ padding: "32px 24px", textAlign: "center", borderInlineStart: i === 0 ? "none" : "1px solid var(--hairline)" }}>
              <t.icon size={26} color="var(--gold)" strokeWidth={1.4} style={{ margin: "0 auto 16px" }} />
              <div className="tf-eyebrow" style={{ color: "var(--sage)", marginBottom: 10 }}>{t.label}</div>
              <p style={{ fontSize: 13, color: "var(--ink-on-dark-2)", lineHeight: 1.55 }}>{t.d}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <span className="tf-eyebrow" style={{ color: "var(--ink-on-dark-3)" }}><Diamond color="var(--gold)" /> &nbsp;{c.scroll}</span>
        </div>
      </Container>

      {/* ROLES 02 */}
      <section id="roles" style={{ padding: sectionPad, borderTop: "1px solid var(--hairline)" }}>
        <Container>
          <Eyebrow num="02">{language === "ar" ? "اختر دورك" : "Choose Your Role"}</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "end", marginBottom: 32 }} className="tf-head-grid">
            <h2 style={{ fontSize: "var(--text-display-lg)", margin: 0 }}>
              {language === "ar" ? <>اختر دورك لتبدأ <em className="tf-display-accent">طلبك.</em></> : <>Select your role to begin your <em className="tf-display-accent">application.</em></>}
            </h2>
            <p style={{ color: "var(--ink-on-dark-2)", fontSize: 15 }}>{c.roles.desc}</p>
          </div>
          <DiamondRule />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }} className="tf-roles-grid">
            {c.roles.items.map((r) => (
              <button key={r.key} onClick={() => onApply(r.key)} style={{ textAlign: "start", cursor: "pointer", background: "var(--surface-1)", border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden", display: "flex", transition: "all var(--dur) var(--ease-soft)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--gold-hairline)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--hairline)")}>
                <div style={{ padding: 24, flex: 1 }}>
                  <r.icon size={26} color="var(--gold)" strokeWidth={1.4} />
                  <h3 style={{ fontSize: 27, margin: "16px 0 10px" }}>{r.name}</h3>
                  <p style={{ fontSize: 13.5, color: "var(--ink-on-dark-2)", lineHeight: 1.55, minHeight: 58 }}>{r.d}</p>
                  <div style={{ borderTop: "1px solid var(--hairline)", margin: "16px 0 14px", paddingTop: 14 }}>
                    <div className="tf-eyebrow" style={{ color: "var(--sage)", fontSize: 9.5 }}>{c.roles.reviewPath}</div>
                    <div style={{ fontSize: 13, color: "var(--ink-on-dark)", marginTop: 4 }}>{r.path}</div>
                  </div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--gold)", fontWeight: 600, fontSize: 11.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    {language === "ar" ? `قدّم كـ${r.name}` : `Apply as ${r.name}`} <ArrowRight size={14} />
                  </span>
                </div>
                <div style={{ width: 116, flexShrink: 0, backgroundImage: `url(${r.img})`, backgroundSize: "cover", backgroundPosition: "center" }} />
              </button>
            ))}
          </div>
        </Container>
      </section>

      {/* HOW IT WORKS 03 */}
      <section id="how" style={{ padding: sectionPad, borderTop: "1px solid var(--hairline)" }}>
        <Container>
          <Eyebrow num="03">{language === "ar" ? "آلية الوصول" : "How Access Works"}</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "end", marginBottom: 32 }} className="tf-head-grid">
            <h2 style={{ fontSize: "var(--text-display-lg)", margin: 0 }}>
              {language === "ar" ? <>الوصول يُكتسب <em className="tf-display-accent">بالجاهزية، لا بالسرعة.</em></> : <>Access is earned <em className="tf-display-accent">by readiness, not speed.</em></>}
            </h2>
            <p style={{ color: "var(--ink-on-dark-2)", fontSize: 15 }}>{c.how.desc}</p>
          </div>
          <DiamondRule />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16 }} className="tf-steps-grid">
            {c.how.steps.map((s, i) => (
              <div key={s.t}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid var(--gold-hairline)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <s.icon size={22} color="var(--gold)" strokeWidth={1.4} />
                  </div>
                  {i < c.how.steps.length - 1 && <div style={{ flex: 1, borderTop: "1px dashed var(--hairline-2)" }} />}
                </div>
                <div className="tf-tnum" style={{ color: "var(--gold)", fontSize: 12, fontWeight: 600 }}>{`0${i + 1}`}</div>
                <h3 style={{ fontSize: 22, margin: "4px 0 8px" }}>{s.t}</h3>
                <p style={{ fontSize: 12.5, color: "var(--ink-on-dark-2)", lineHeight: 1.5, marginBottom: 16 }}>{s.d}</p>
                <div style={{ aspectRatio: "3/2", borderRadius: "var(--r-md)", overflow: "hidden", border: "1px solid var(--hairline)" }}>
                  <img src={s.img} alt={s.t} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              </div>
            ))}
          </div>

          {/* CREAM MANIFESTO */}
          <div style={{ background: "var(--canvas-cream)", color: "var(--ink)", borderRadius: "var(--r-lg)", padding: "clamp(32px,5vw,56px)", marginTop: 56, display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 40 }} className="tf-manifesto-grid">
            <div>
              <div className="tf-eyebrow" style={{ color: "var(--gold-deep)", marginBottom: 16 }}>{c.how.manifestoEyebrow}</div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 34, lineHeight: 1.1, color: "var(--ink)", margin: 0 }}>{c.how.manifestoTitle}</h3>
              <p style={{ color: "var(--ink-mute)", fontSize: 14.5, marginTop: 16, maxWidth: "34ch" }}>{c.how.manifestoBody}</p>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14, alignSelf: "center" }}>
              {c.how.checklist.map((it) => (
                <li key={it} style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--ink)", fontSize: 14 }}>
                  <span style={{ color: "var(--forest)", fontSize: 9 }}>◆</span> {it}
                </li>
              ))}
            </ul>
            <div style={{ alignSelf: "center" }}>
              <div className="tf-eyebrow" style={{ color: "var(--gold-deep)", marginBottom: 12 }}>{c.how.journeyEyebrow}</div>
              <p style={{ color: "var(--ink-mute)", fontSize: 14, marginBottom: 20 }}>{c.how.journeyBody}</p>
              <Btn variant="forest" onClick={() => onApply()}>{c.how.journeyCta}</Btn>
            </div>
          </div>
        </Container>
      </section>

      {/* READINESS LEDGER 04 */}
      <section style={{ padding: sectionPad, borderTop: "1px solid var(--hairline)" }}>
        <Container>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center", marginBottom: 48 }} className="tf-head-grid">
            <div>
              <Eyebrow num="04">{language === "ar" ? "سجل الجاهزية" : "Readiness Ledger"}</Eyebrow>
              <h2 style={{ fontSize: "var(--text-display-lg)", margin: 0 }}>{c.ledger.title[0]}<em className="tf-display-accent">{c.ledger.title[1]}</em>{c.ledger.title[2]}</h2>
              <p style={{ color: "var(--ink-on-dark-2)", fontSize: 15, marginTop: 16, maxWidth: "48ch" }}>{c.ledger.sub}</p>
              <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
                {c.ledger.tags.map((t) => <span key={t} className="tf-eyebrow" style={{ color: "var(--sage)" }}><Diamond color="var(--sage)" /> {t}</span>)}
              </div>
            </div>
            <ArtFrame src={ledgerArt} alt="Framed artwork and bust" ratio="16 / 7" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 0, border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", overflow: "hidden", background: "var(--surface-1)" }} className="tf-ledger-grid">
            {/* progress */}
            <div style={{ padding: 32, borderInlineEnd: "1px solid var(--hairline)" }}>
              <div className="tf-eyebrow" style={{ color: "var(--ink-on-dark-3)", marginBottom: 20 }}>{language === "ar" ? "تقدّمك" : "Your Progress"}</div>
              <div style={{ position: "relative", width: 150, height: 150, margin: "0 auto" }}>
                <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="var(--hairline-2)" strokeWidth="5" />
                  <circle cx="50" cy="50" r="44" fill="none" stroke="var(--gold)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(4 / 7) * 276} 276`} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span className="tf-tnum" style={{ fontFamily: "var(--font-display)", fontSize: 34, color: "var(--ink-on-dark)" }}>4/7</span>
                  <span style={{ fontSize: 11, color: "var(--ink-on-dark-3)" }}>{c.ledger.progress}</span>
                </div>
              </div>
              <div style={{ marginTop: 24 }}>
                <span className="tf-eyebrow" style={{ color: "var(--ink-on-dark-3)" }}>{c.ledger.statusLabel}</span>
                <div style={{ marginTop: 8 }}><Pill kind="review" label={c.ledger.status} /></div>
              </div>
              <div style={{ marginTop: 20 }}>
                <span className="tf-eyebrow" style={{ color: "var(--ink-on-dark-3)" }}>{c.ledger.nextLabel}</span>
                <p style={{ fontSize: 13, color: "var(--ink-on-dark-2)", margin: "8px 0 18px", lineHeight: 1.5 }}>{c.ledger.next}</p>
                <Btn onClick={() => onApply()}>{c.ledger.cta}</Btn>
              </div>
            </div>
            {/* table */}
            <div style={{ padding: "8px 0" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 2fr 1fr 1fr", padding: "16px 28px", borderBottom: "1px solid var(--hairline)" }}>
                {c.ledger.cols.map((h) => <span key={h} className="tf-eyebrow" style={{ color: "var(--ink-on-dark-3)", fontSize: 9.5 }}>{h}</span>)}
              </div>
              {c.ledger.rows.map((row, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 2fr 1fr 1fr", padding: "16px 28px", borderBottom: i < c.ledger.rows.length - 1 ? "1px solid var(--hairline)" : "none", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-on-dark)" }}>
                    {row[2] === "completed" ? <Check size={15} color="var(--status-completed-fg)" /> : <span style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid var(${row[2] === "review" ? "--status-review-fg" : "--ink-on-dark-3"})`, display: "inline-block" }} />}
                    {row[0]}
                  </span>
                  <span style={{ fontSize: 12.5, color: "var(--ink-on-dark-2)" }}>{row[1]}</span>
                  <span><Pill kind={row[2]} label={c.ledger.cols && (row[2] === "completed" ? (language === "ar" ? "مكتمل" : "Completed") : row[2] === "review" ? (language === "ar" ? "قيد المراجعة" : "Under Review") : (language === "ar" ? "معلّق" : "Pending"))} /></span>
                  <span className="tf-tnum" style={{ fontSize: 12.5, color: "var(--ink-on-dark-3)" }}>{row[3]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* seal band */}
          <div style={{ marginTop: 24, border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", background: "var(--surface-1)", padding: "32px clamp(24px,4vw,40px)", display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1.2fr", gap: 28, alignItems: "center" }} className="tf-seal-grid">
            <div style={{ width: 92, height: 92, borderRadius: "50%", border: "1px solid var(--gold-hairline)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", color: "var(--gold)", fontSize: 30, fontWeight: 600 }}>TF</span>
            </div>
            <div>
              {c.ledger.sealTitle.map((s) => <div key={s} style={{ fontFamily: "var(--font-display)", fontSize: 19, color: "var(--ink-on-dark)", lineHeight: 1.25 }}>{s}</div>)}
              <p style={{ fontSize: 12, color: "var(--ink-on-dark-3)", marginTop: 8 }}>{c.ledger.sealSub}</p>
            </div>
            {c.ledger.stats.map((st) => (
              <div key={st.l} style={{ textAlign: "center" }}>
                {"n" in st && st.n ? <div className="tf-tnum" style={{ fontFamily: "var(--font-display)", fontSize: 30, color: "var(--gold)" }}>{st.n}</div> : st.icon ? <st.icon size={24} color="var(--gold)" strokeWidth={1.4} style={{ margin: "0 auto" }} /> : null}
                <div className="tf-eyebrow" style={{ color: "var(--sage)", fontSize: 9.5, margin: "8px 0 6px" }}>{st.l}</div>
                <p style={{ fontSize: 11.5, color: "var(--ink-on-dark-2)", lineHeight: 1.45 }}>{st.d}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FOUNDER'S CIRCLE 05 */}
      <section id="founder" style={{ padding: sectionPad, borderTop: "1px solid var(--hairline)" }}>
        <Container>
          <Eyebrow num="05">{language === "ar" ? "دائرة المؤسّسين" : "Founder's Circle"}</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 0.9fr", gap: 32, alignItems: "stretch" }} className="tf-founder-grid">
            <div style={{ alignSelf: "center" }}>
              <h2 style={{ fontSize: "var(--text-display-lg)", margin: 0 }}>{c.founder.title[0]}<em className="tf-display-accent">{c.founder.title[1]}</em>{c.founder.title[2]}</h2>
              <p style={{ color: "var(--ink-on-dark-2)", fontSize: 14.5, marginTop: 20, lineHeight: 1.6 }}>{c.founder.body}</p>
              <div style={{ width: 64, height: 1, background: "var(--gold)", margin: "24px 0" }} />
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                {c.founder.tags.map((t) => <span key={t} className="tf-eyebrow" style={{ color: "var(--sage)" }}><Diamond color="var(--sage)" /> {t}</span>)}
              </div>
              <Btn variant="ghost" onClick={() => onApply()}>{c.founder.cta}</Btn>
            </div>
            <ArtFrame src={founder} alt="Founder's circle private interior" ratio="3 / 4" style={{ height: "100%" }} />
            <div style={{ background: "var(--surface-1)", border: "1px solid var(--gold-hairline)", borderRadius: "var(--r-lg)", padding: 28 }}>
              <div style={{ width: 78, height: 78, borderRadius: "50%", border: "1px solid var(--gold-hairline)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <span style={{ fontFamily: "var(--font-display)", color: "var(--gold)", fontSize: 26, fontWeight: 600 }}>TF</span>
              </div>
              <h3 style={{ fontSize: 22, textAlign: "center", marginBottom: 12 }}>{c.founder.sealName}</h3>
              <p style={{ fontSize: 13, color: "var(--ink-on-dark-2)", textAlign: "center", lineHeight: 1.55, marginBottom: 20 }}>{c.founder.sealDesc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {c.founder.benefits.map((b) => (
                  <li key={b} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: "var(--ink-on-dark)" }}>
                    <Check size={15} color="var(--gold)" /> {b}
                  </li>
                ))}
              </ul>
              <div className="tf-eyebrow" style={{ color: "var(--ink-on-dark-3)", fontSize: 9, marginTop: 22, textAlign: "center", lineHeight: 1.6 }}>{c.founder.sealFoot}</div>
            </div>
          </div>

          {/* what we look for */}
          <div style={{ marginTop: 56, border: "1px solid var(--hairline)", borderRadius: "var(--r-lg)", background: "var(--surface-1)", padding: "36px clamp(24px,4vw,40px)" }}>
            <div className="tf-eyebrow" style={{ color: "var(--sage)", marginBottom: 28 }}>{c.founder.lookEyebrow}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 24 }} className="tf-look-grid">
              {c.founder.look.map((l) => (
                <div key={l.t} style={{ textAlign: "center" }}>
                  <l.icon size={24} color="var(--gold)" strokeWidth={1.4} style={{ margin: "0 auto 12px" }} />
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 16, color: "var(--ink-on-dark)", marginBottom: 6 }}>{l.t}</div>
                  <p style={{ fontSize: 11.5, color: "var(--ink-on-dark-2)", lineHeight: 1.45 }}>{l.d}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ 07 */}
      <section id="faq" style={{ padding: sectionPad, borderTop: "1px solid var(--hairline)" }}>
        <Container style={{ maxWidth: 860 }}>
          <Eyebrow num="07">FAQ</Eyebrow>
          <h2 style={{ fontSize: "var(--text-display-lg)", marginBottom: 40 }}>{c.faq.title[0]}<em className="tf-display-accent">{c.faq.title[1]}</em>{c.faq.title[2]}</h2>
          <div style={{ borderTop: "1px solid var(--hairline)" }}>
            {c.faq.items.map((f, i) => (
              <div key={i} style={{ borderBottom: "1px solid var(--hairline)" }}>
                <button onClick={() => setOpen(open === i ? -1 : i)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "22px 0", cursor: "pointer", background: "none", border: "none", textAlign: "start" }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 21, color: "var(--ink-on-dark)" }}>{f.q}</span>
                  {open === i ? <Minus size={18} color="var(--gold)" /> : <Plus size={18} color="var(--gold)" />}
                </button>
                {open === i && <p style={{ fontSize: 14.5, color: "var(--ink-on-dark-2)", lineHeight: 1.65, padding: "0 0 24px", maxWidth: "68ch" }}>{f.a}</p>}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: "clamp(48px,6vw,80px) 0", borderTop: "1px solid var(--hairline)" }}>
        <Container>
          <div style={{ background: "var(--canvas-cream)", borderRadius: "var(--r-lg)", padding: "clamp(36px,5vw,64px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "clamp(28px,3.4vw,42px)", color: "var(--ink)", margin: 0, maxWidth: "20ch", lineHeight: 1.12 }}>{c.finalTitle}</h2>
            <Btn variant="forest" onClick={() => onApply()}>{c.finalCta}</Btn>
          </div>
        </Container>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--hairline)", padding: "clamp(48px,6vw,72px) 0 0" }}>
        <Container>
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1.2fr", gap: 40 }} className="tf-footer-grid">
            <div>
              <Logo tagline={c.footer.tagline} />
              <p style={{ fontSize: 13, color: "var(--ink-on-dark-2)", marginTop: 20, maxWidth: "38ch", lineHeight: 1.6 }}>{c.footer.blurb}</p>
            </div>
            {c.footer.cols.map((col) => (
              <div key={col.h}>
                <div className="tf-eyebrow" style={{ color: "var(--sage)", marginBottom: 18 }}>{col.h}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                  {col.links.map((l) => <li key={l} style={{ fontSize: 13.5, color: "var(--ink-on-dark-2)", cursor: "pointer" }}>{l}</li>)}
                </ul>
              </div>
            ))}
            <div>
              <div className="tf-eyebrow" style={{ color: "var(--sage)", marginBottom: 18 }}>{c.footer.connect}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13.5, color: "var(--ink-on-dark-2)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={15} color="var(--gold)" /> {c.footer.email}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MapPin size={15} color="var(--gold)" /> {c.footer.region}</span>
              </div>
              <div className="tf-eyebrow" style={{ color: "var(--sage)", margin: "22px 0 14px" }}>{c.footer.follow}</div>
              <div style={{ display: "flex", gap: 12 }}>
                {[Linkedin, Instagram, Youtube].map((Ic, i) => (
                  <span key={i} style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid var(--hairline)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Ic size={16} color="var(--ink-on-dark-2)" /></span>
                ))}
              </div>
            </div>
          </div>
          {/* ticker */}
          <div style={{ marginTop: 48, borderTop: "1px solid var(--hairline)", padding: "22px 0", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <span style={{ fontSize: 12, color: "var(--ink-on-dark-3)" }}>{c.footer.rights}</span>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {c.ticker.map((t, i) => <span key={t} className="tf-ticker">{i === 0 && <Diamond color="var(--gold)" />} {t}</span>)}
            </div>
          </div>
        </Container>
      </footer>

      {/* responsive */}
      <style>{`
        @media (max-width: 980px) {
          .tf-head-grid, .tf-manifesto-grid, .tf-founder-grid, .tf-ledger-grid, .tf-footer-grid { grid-template-columns: 1fr !important; }
          .tf-hero-img { position: static !important; width: 100% !important; height: 300px; margin-top: 8px; }
          .tf-hero-img > div { background: linear-gradient(to top, var(--canvas-night), transparent 65%) !important; }
          .tf-hero-text { max-width: 100% !important; }
          .tf-roles-grid { grid-template-columns: 1fr 1fr !important; }
          .tf-steps-grid, .tf-look-grid { grid-template-columns: 1fr 1fr 1fr !important; }
          .tf-trust-grid { grid-template-columns: 1fr 1fr !important; }
          .tf-seal-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .tf-roles-grid, .tf-steps-grid, .tf-look-grid, .tf-trust-grid, .tf-seal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
