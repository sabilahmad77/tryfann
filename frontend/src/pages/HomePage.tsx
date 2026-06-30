import { useLanguage } from '@/contexts/useLanguage';
import { SEOHead } from '@/components/SEO/SEOHead';
import { SchemaMarkup } from '@/components/SEO/SchemaMarkup';
import { TfLanding } from '@/components/landing/TfLanding';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { useEffect, useMemo } from 'react';
import { useTrackEventMutation } from '@/services/api/qualificationApi';
import { getSessionId } from '@/utils/analytics';

export function HomePage() {
  const { language } = useLanguage();
  const lang = language as 'en' | 'ar';
  const navigate = useNavigate();
  const [trackEvent] = useTrackEventMutation();

  // Funnel analytics: record the landing view once per mount.
  useEffect(() => {
    trackEvent({ name: 'landing_view', session_id: getSessionId(), props: { lang } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackEvent]);

  const goSignUp = (persona?: string) =>
    navigate(ROUTES.SIGN_UP, persona ? { state: { persona } } : undefined);

  // FAQ data for SEO schema markup (kept broad; tier names aligned to §5.4)
  const faqData = useMemo(() => {
    const faqContent = {
      en: [
        { question: "What is FANN?", answer: "FANN is a next-generation digital ecosystem built exclusively for physical art. It combines expert authentication, a blockchain-backed provenance layer, and a trusted global network to help artists, collectors, galleries, and institutions connect with confidence." },
        { question: "Who is FANN for?", answer: "FANN is designed for every serious participant in the physical art world: Artists seeking credibility, visibility, and protection; Collectors who want verified art with clear provenance; Galleries & Museums expanding globally with digital tools; Ambassadors building influence within a trusted ecosystem." },
        { question: "What are the membership tiers?", answer: "Members move through four whitelist tiers — Waitlisted, Verified Member, Priority Access, and Founder's Circle — earned through verified participation and review, never bought. Each unlocks more: early previews, reduced platform fees, profile boosts, priority support, and exclusive invitations." },
        { question: "How does authentication work on FANN?", answer: "Every artwork on FANN goes through a structured verification process: Reviewed by art professionals and experts, matched with artist credentials and documentation, issued verified records and provenance data, and secured with tamper-resistant digital tracking." },
        { question: "What is the Provenance Viewer and how does it help?", answer: "FANN's Provenance Viewer lets you inspect a work before you commit: review the certificate of authenticity and verification record, trace the full chain of custody and ownership history, examine condition reports and documentation digitally, and confirm provenance before purchase, shipping, or transfer." },
        { question: "Is FANN free to join?", answer: "Yes. Founding access is application-based and free to apply. A person reviews each application, usually within seven working days." },
        { question: "How does FANN protect collectors?", answer: "Collectors are protected through expert authentication, provenance tracking, verified artist credentials, secure insured logistics, and transparent records. Every layer is designed to reduce risk and preserve long-term value." },
        { question: "Is FANN focused on NFTs or digital-only art?", answer: "No. FANN is dedicated to physical art only — paintings, sculptures, installations, and tangible works. Technology is used to support authenticity, documentation, and presentation, not replace the artwork itself." },
      ],
      ar: [
        { question: "ما هو FANN؟", answer: "FANN هو نظام بيئي رقمي من الجيل القادم مبني حصريًا للفن المادي. يجمع بين المصادقة الخبيرة وطبقة مصداقية مدعومة بسلسلة الكتل، وشبكة عالمية موثوقة لمساعدة الفنانين والجامعين والمعارض والمؤسسات على التواصل بثقة." },
        { question: "لمن FANN؟", answer: "FANN مصمم لكل مشارك جاد في عالم الفن المادي: الفنانون الذين يسعون للحصول على المصداقية والرؤية والحماية؛ الجامعون الذين يريدون فنًا موثقًا بمصداقية واضحة؛ المعارض والمتاحف التي تتوسع عالميًا بالأدوات الرقمية؛ السفراء الذين يبنون التأثير داخل نظام بيئي موثوق." },
        { question: "ما هي مستويات العضوية؟", answer: "يتقدم الأعضاء عبر أربعة مستويات للقائمة — مُدرَج، وعضو موثّق، ووصول ذو أولوية، ودائرة المؤسسين — تُكتسب عبر المشاركة الموثّقة والمراجعة، لا تُشترى. كل مستوى يفتح المزيد: معاينات مبكرة ورسوم منصة مخفضة وتعزيز الملف والدعم ذا الأولوية والدعوات الحصرية." },
        { question: "كيف يعمل التحقق على FANN؟", answer: "كل عمل فني على FANN يمر بعملية تحقق منظمة: مراجعة من قبل محترفي الفن والخبراء، مطابقة مع أوراق اعتماد الفنان والتوثيق، إصدار سجلات موثقة وبيانات المصداقية، وتأمين بتتبع رقمي مقاوم للعبث." },
        { question: "ما هو عارض المصداقية وكيف يساعد؟", answer: "يتيح لك عارض المصداقية في FANN فحص العمل قبل الالتزام: مراجعة شهادة الأصالة وسجل التحقق، تتبع سلسلة الحيازة الكاملة وتاريخ الملكية، فحص تقارير الحالة والتوثيق رقميًا، وتأكيد المصداقية قبل الشراء أو الشحن أو النقل." },
        { question: "هل الانضمام إلى FANN مجاني؟", answer: "نعم. وصول المؤسسين قائم على التقديم والتقديم مجاني. يراجع شخصٌ كل طلب، عادةً خلال سبعة أيام عمل." },
        { question: "كيف يحمي FANN الجامعين؟", answer: "يتم حماية الجامعين من خلال المصادقة الخبيرة وتتبع المصداقية وأوراق اعتماد الفنان الموثقة ولوجستيات آمنة ومؤمنة وسجلات شفافة. كل طبقة مصممة لتقليل المخاطر والحفاظ على القيمة طويلة الأجل." },
        { question: "هل يركز FANN على NFTs أو الفن الرقمي فقط؟", answer: "لا. FANN مخصص للفن المادي فقط — اللوحات والمنحوتات والتركيبات والأعمال الملموسة. تُستخدم التكنولوجيا لدعم الأصالة والتوثيق والعرض، وليس لاستبدال العمل الفني نفسه." },
      ],
    };
    return faqContent[language] || faqContent.en;
  }, [language]);

  return (
    <>
      <SEOHead />
      <SchemaMarkup faqData={faqData} />
      <TfLanding
        language={lang}
        onApply={(persona) => goSignUp(persona)}
        onSignIn={() => navigate(ROUTES.SIGN_IN)}
      />
    </>
  );
}
