import { Plus } from 'lucide-react';

interface FaqRedesignProps {
  language: 'en' | 'ar';
}

interface QA {
  q: string;
  a: string;
}

const content: Record<'en' | 'ar', { eyebrow: string; title: string; items: QA[] }> = {
  en: {
    eyebrow: 'FAQ',
    title: 'Questions, answered.',
    items: [
      {
        q: 'Is FANN about NFTs or digital-only art?',
        a: 'No. FANN is dedicated to physical art only — paintings, sculptures, installations, and tangible works. Technology supports authenticity, documentation, and presentation; it never replaces the artwork itself.',
      },
      {
        q: 'What is the Provenance Viewer?',
        a: 'A way to inspect a work before you commit: review the certificate of authenticity, trace the full chain of custody, and examine condition reports digitally — backed by blockchain-backed certification.',
      },
      {
        q: 'How does verification work?',
        a: 'Each work is reviewed by art professionals, matched against artist credentials and documentation, issued a verified record, and secured with tamper-resistant tracking. Collectors buy with confidence; artists sell with credibility.',
      },
      {
        q: 'What are the membership tiers?',
        a: 'Waitlisted → Verified Member → Priority Access → Founder’s Circle. Promotion is quality-gated and reviewed — never purchasable with points, and never automatic for artists, galleries, or investors.',
      },
      {
        q: 'Is it free to join TryFann?',
        a: 'Yes. Founding access is application-based and free to apply. A person reviews each application, usually within seven working days.',
      },
      {
        q: 'How are collectors protected?',
        a: 'Through expert authentication, provenance tracking, verified artist credentials, funds held in escrow, insured logistics, and transparent records — every layer designed to reduce risk and preserve long-term value.',
      },
    ],
  },
  ar: {
    eyebrow: 'الأسئلة الشائعة',
    title: 'إجابات واضحة.',
    items: [
      {
        q: 'هل يركّز FANN على NFTs أو الفن الرقمي فقط؟',
        a: 'لا. FANN مخصّص للفن المادي فقط — اللوحات والمنحوتات والتركيبات والأعمال الملموسة. تُستخدم التكنولوجيا لدعم الأصالة والتوثيق والعرض، ولا تستبدل العمل الفني نفسه.',
      },
      {
        q: 'ما هو عارض المصداقية؟',
        a: 'وسيلة لفحص العمل قبل الالتزام: راجع شهادة الأصالة، وتتبّع سلسلة الحيازة الكاملة، وافحص تقارير الحالة رقميًا — مدعومًا بتصديق عبر سلسلة الكتل.',
      },
      {
        q: 'كيف يعمل التحقق؟',
        a: 'يُراجَع كل عمل من قبل محترفي الفن، ويُطابَق مع أوراق اعتماد الفنان والتوثيق، ويُصدَر له سجل موثّق، ويُؤمَّن بتتبّع مقاوم للعبث. يشتري الجامعون بثقة، ويبيع الفنانون بمصداقية.',
      },
      {
        q: 'ما هي مستويات العضوية؟',
        a: 'مُدرَج ← عضو موثّق ← وصول ذو أولوية ← دائرة المؤسسين. الترقية مشروطة بالجودة وتخضع للمراجعة — لا تُشترى بالنقاط، وليست تلقائية للفنانين أو المعارض أو المستثمرين.',
      },
      {
        q: 'هل الانضمام إلى TryFann مجاني؟',
        a: 'نعم. وصول المؤسسين قائم على التقديم والتقديم مجاني. يراجع شخصٌ كل طلب، عادةً خلال سبعة أيام عمل.',
      },
      {
        q: 'كيف يُحمى الجامعون؟',
        a: 'عبر المصادقة الخبيرة، وتتبّع المصداقية، وأوراق اعتماد موثّقة للفنان، واحتجاز الأموال في الضمان، ولوجستيات مؤمّنة، وسجلات شفافة — كل طبقة مصممة لتقليل المخاطر والحفاظ على القيمة طويلة الأجل.',
      },
    ],
  },
};

export function FaqRedesign({ language }: FaqRedesignProps) {
  const t = content[language];
  const isRTL = language === 'ar';

  return (
    <section
      className="fann-landing relative w-full"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'var(--ink-void)', borderTop: '1px solid var(--hairline)' }}
    >
      <div className="mx-auto max-w-[860px] px-6 py-20 md:px-10 md:py-28">
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <span className="fann-eyebrow" style={{ color: 'var(--gold)' }}>{t.eyebrow}</span>
          <h2 className="fann-display mt-4" style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', color: 'var(--bone)' }}>
            {t.title}
          </h2>
        </div>

        <div className="mt-10" style={{ borderTop: '1px solid var(--hairline)' }}>
          {t.items.map((item) => (
            <details key={item.q} className="fann-faq group" style={{ borderBottom: '1px solid var(--hairline)' }}>
              <summary
                className={`fann-focus flex cursor-pointer list-none items-center justify-between gap-6 py-6 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                style={{ color: 'var(--bone)' }}
              >
                <span className="fann-display" style={{ fontWeight: 600, fontSize: 'clamp(1.05rem, 2vw, 1.35rem)', lineHeight: 1.3 }}>
                  {item.q}
                </span>
                <Plus
                  className="h-5 w-5 shrink-0 transition-transform duration-300 group-open:rotate-45"
                  style={{ color: 'var(--gold)' }}
                  aria-hidden="true"
                />
              </summary>
              <p
                className={`pb-7 text-[15px] leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}
                style={{ color: 'var(--bone-2)', maxWidth: '64ch', marginInlineStart: isRTL ? 'auto' : 0 }}
              >
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
