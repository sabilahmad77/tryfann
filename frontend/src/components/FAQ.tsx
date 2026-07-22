import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/paths";

interface FAQProps {
  language: "en" | "ar";
  onNavigateToSignUp?: () => void;
  showAll?: boolean; // If true, show all FAQs instead of just 5
  showViewAllCTA?: boolean; // If true, show "View All FAQs" button
}

const faqContent = {
  en: {
    title: { white: "Frequently Asked", gold: " Questions" },
    subtitle: "Everything you need to know about FANN",
    faqs: [
      {
        question: "What is FANN?",
        answer: (
          <>
            FANN is a next-generation digital ecosystem built exclusively for <span className="font-bold text-white">physical art</span>. It combines expert authentication, a <span className="font-bold text-white">blockchain-backed provenance layer</span>, and a trusted global network to help artists, collectors, galleries, and institutions connect with confidence. FANN is not a marketplace chasing trends, it&apos;s infrastructure designed to protect artistic value, credibility, and long-term growth.
          </>
        ),
      },
      {
        question: "Who is FANN for?",
        answer: (
          <>
            FANN is designed for every serious participant in the physical art world:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li><span className="font-bold text-white">Artists</span> seeking credibility, visibility, and protection</li>
              <li><span className="font-bold text-white">Collectors</span> who want verified art with clear provenance</li>
              <li><span className="font-bold text-white">Galleries & Museums</span> expanding globally with digital tools</li>
              <li><span className="font-bold text-white">Ambassadors</span> building influence within a trusted ecosystem</li>
            </ul>
            <p className="mt-4">Each role unlocks tailored features, rewards, and experiences.</p>
          </>
        ),
      },
      {
        question: "Why FANN?",
        answer: {
          intro: "FANN isn't just a platform; it's a movement. Combining artistic integrity with trusted provenance, FANN gives you a premium art experience designed to empower, connect, and elevate. Here's why you'll love being part of this ecosystem:",
          benefits: [
            {
              title: "Authenticate & Elevate:",
              description: "Experience verified, authentic art that stands the test of time, powered by blockchain for trusted provenance.",
            },
            {
              title: "Provenance Viewer:",
              description: "Inspect every work's certificate of authenticity, chain of custody, and condition reports digitally before you commit.",
            },
            {
              title: "Global Art Community:",
              description: "Connect with art lovers, collectors, and influencers from all over the world. Share, discover, and engage in real-time.",
            },
            {
              title: "Exclusive Rewards:",
              description: "Progress through our tiered rewards system and unlock exclusive perks from early access to new art collections to VIP support.",
            },
          ],
        },
      },
      {
        question: "How is my Readiness Score calculated?",
        answer: (
          <>
            Your Readiness Score is a private score out of 100 that reflects how
            ready you are for the founding cohort — your own progress, never a
            ranking against other people. It grows through real, server-verified
            steps:
            <ul className="list-disc list-inside space-y-1 mt-4 ml-4">
              <li>Verifying your email and identity (KYC)</li>
              <li>Completing your profile and role details</li>
              <li>Inviting collectors and artists you trust — only verified joins count</li>
              <li>Completing reviewed founding missions</li>
            </ul>
            <p className="mt-4">Every credit is a meaningful action, reviewed by people — it rewards trust, not noise.</p>
          </>
        ),
      },
      {
        question: "What are the tiers and how do they work?",
        answer: (
          <>
            Members move through <span className="font-bold text-white">four whitelist tiers</span> — Waitlisted, Verified Member, Priority Access, and Founder&apos;s Circle — each unlocking more:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Early previews and feature access</li>
              <li>Reduced platform fees</li>
              <li>Profile boosts and visibility</li>
              <li>Priority support</li>
              <li>Exclusive invitations and recognition</li>
            </ul>
            <p className="mt-4">Tiers are earned through verified participation and review — never bought. The top tier, <span className="font-bold text-white">Founder&apos;s Circle</span>, carries lifetime founding-member standing.</p>
          </>
        ),
      },
      {
        question: "How does authentication work on FANN?",
        answer: (
          <>
            Every artwork on FANN goes through a structured verification process:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Reviewed by art professionals and experts</li>
              <li>Matched with artist credentials and documentation</li>
              <li>Issued verified records and provenance data</li>
              <li>Secured with tamper-resistant digital tracking</li>
            </ul>
            <p className="mt-4">This ensures collectors buy with confidence and artists sell with credibility.</p>
          </>
        ),
      },
      {
        question: "What is the Provenance Viewer and how does it help?",
        answer: (
          <>
            FANN&apos;s Provenance Viewer lets you inspect a work before you commit:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Review the certificate of authenticity and verification record</li>
              <li>Trace the full chain of custody and ownership history</li>
              <li>Examine condition reports and documentation digitally</li>
              <li>Confirm provenance before purchase, shipping, or transfer</li>
            </ul>
            <p className="mt-4">This brings transparency to physical art without ever putting the work at risk.</p>
          </>
        ),
      },
      {
        question: "Is FANN free to join?",
        answer: (
          <>
            Yes.
            <p className="mt-2">Registration is free, allowing users to explore the platform, community, and features.</p>
            <p className="mt-2">Additional benefits unlock through participation, verification, and tier progression.</p>
          </>
        ),
      },
      {
        question: "How does FANN protect collectors?",
        answer: (
          <>
            Collectors are protected through:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Expert authentication</li>
              <li>Provenance tracking</li>
              <li>Verified artist credentials</li>
              <li>Secure, insured logistics</li>
              <li>Transparent records</li>
            </ul>
            <p className="mt-4">Every layer is designed to reduce risk and preserve long-term value.</p>
          </>
        ),
      },
      {
        question: "How does FANN support artists?",
        answer: (
          <>
            FANN empowers artists by:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>Providing verified status</li>
              <li>Offering global exposure without gatekeeping</li>
              <li>Protecting work through authentication</li>
              <li>Supporting logistics and documentation</li>
              <li>Building long-term credibility, not short-term hype</li>
            </ul>
            <p className="mt-4">Artists focus on creation. FANN handles trust.</p>
          </>
        ),
      },
      {
        question: "What makes FANN different from traditional platforms?",
        answer: (
          <>
            Traditional platforms focus on visibility.
            <br />
            FANN focuses on <span className="font-bold text-white">trust</span>, <span className="font-bold text-white">structure</span>, and <span className="font-bold text-white">sustainability</span>.
            <br />
            <br />
            It&apos;s not about selling fast
            <br />
            it&apos;s about building value that lasts.
          </>
        ),
      },
      {
        question: "Is FANN focused on NFTs or digital-only art?",
        answer: (
          <>
            No.
            <p className="mt-2">FANN is dedicated to <span className="font-bold text-white">physical art only</span> — paintings, sculptures, installations, and tangible works.</p>
            <p className="mt-2">Technology is used to <span className="font-bold text-white">support authenticity, documentation, and presentation</span>, not replace the artwork itself.</p>
          </>
        ),
      },
      {
        question: "What blockchain is used for verification?",
        answer: (
          <>
            FANN uses a blockchain-backed provenance layer to record verification events and ownership history in a tamper-resistant way. The specific chain and architecture may evolve by phase to optimize cost, reliability, and compliance, while keeping records verifiable.
          </>
        ),
      },
      {
        question: "How is artwork custody/storage handled?",
        answer: (
          <>
            For verified pieces, artworks may pass through our hub or custody partners for intake, scanning, and secure tagging before shipping to the buyer. We follow structured handling procedures and use trackable logistics. High-value pieces may include optional third-party authentication and enhanced handling.
          </>
        ),
      },
      {
        question: "What happens if FANN shuts down?",
        answer: (
          <>
            If we discontinue service, we will provide notice and a reasonable window for users to export key records. We will also take commercially reasonable steps to complete or unwind any in-process custody/shipping. Certain records may be retained for legal/compliance purposes.
          </>
        ),
      },
    ],
  },
  ar: {
    title: { white: "الأسئلة", gold: " الشائعة" },
    subtitle: "كل ما تحتاج لمعرفته حول FANN",
    faqs: [
      {
        question: "ما هو FANN؟",
        answer: (
          <>
            FANN هو نظام بيئي رقمي من الجيل القادم مبني حصريًا لـ <span className="font-bold text-white">الفن المادي</span>. يجمع بين المصادقة الخبيرة و<span className="font-bold text-white">طبقة مصداقية مدعومة بسلسلة الكتل</span>، وشبكة عالمية موثوقة لمساعدة الفنانين والجامعين والمعارض والمؤسسات على التواصل بثقة. FANN ليست سوقًا تطارد الاتجاهات، إنها بنية تحتية مصممة لحماية القيمة الفنية والمصداقية والنمو طويل الأجل.
          </>
        ),
      },
      {
        question: "لمن FANN؟",
        answer: (
          <>
            FANN مصمم لكل مشارك جاد في عالم الفن المادي:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li><span className="font-bold text-white">الفنانون</span> الذين يسعون للحصول على المصداقية والرؤية والحماية</li>
              <li><span className="font-bold text-white">الجامعون</span> الذين يريدون فنًا موثقًا بمصداقية واضحة</li>
              <li><span className="font-bold text-white">المعارض والمتاحف</span> التي تتوسع عالميًا بالأدوات الرقمية</li>
              <li><span className="font-bold text-white">السفراء</span> الذين يبنون التأثير داخل نظام بيئي موثوق</li>
            </ul>
            <p className="mt-4">كل دور يفتح ميزات ومكافآت وتجارب مخصصة.</p>
          </>
        ),
      },
      {
        question: "لماذا FANN؟",
        answer: {
          intro: "FANN ليست مجرد منصة؛ إنها حركة. بدمج النزاهة الفنية مع المصداقية الموثوقة، تمنحك FANN تجربة فنية مميزة مصممة لتمكينك وربطك ورفعك. إليك لماذا ستحب أن تكون جزءًا من هذا النظام البيئي:",
          benefits: [
            {
              title: "المصادقة والارتقاء:",
              description: "اختبر فنًا موثقًا وأصيلًا يثبت أمام اختبار الزمن، مدعومًا بتقنية البلوك تشين لضمان المصداقية الموثوقة.",
            },
            {
              title: "عارض المصداقية:",
              description: "افحص شهادة الأصالة وسلسلة الحيازة وتقارير الحالة لكل عمل رقميًا قبل الالتزام.",
            },
            {
              title: "مجتمع الفن العالمي:",
              description: "تواصل مع عشاق الفن والجامعين والمؤثرين من جميع أنحاء العالم. شارك واكتشف وتفاعل في الوقت الفعلي.",
            },
            {
              title: "مكافآت حصرية:",
              description: "تقدم عبر نظام المكافآت المتدرج لدينا وافتح امتيازات حصرية من الوصول المبكر إلى مجموعات الفن الجديدة إلى دعم VIP.",
            },
          ],
        },
      },
      {
        question: "كيف تُحتسب درجة الجاهزية الخاصة بي؟",
        answer: (
          <>
            درجة الجاهزية هي درجة خاصة بك من 100 تعكس مدى جاهزيتك لمجموعة
            المؤسّسين — تقدّمك أنت، لا ترتيب بينك وبين الآخرين. وتنمو عبر خطوات
            حقيقية يتحقق منها الخادم:
            <ul className="list-disc list-inside space-y-1 mt-4 ml-4">
              <li>التحقق من بريدك وهويتك</li>
              <li>إكمال ملفك الشخصي وتفاصيل دورك</li>
              <li>دعوة جامعين وفنانين تثق بهم — تُحتسب الانضمامات الموثّقة فقط</li>
              <li>إكمال مهام تأسيسية تخضع للمراجعة</li>
            </ul>
            <p className="mt-4">كل قيد هو إجراء هادف يراجعه بشر — يكافئ الثقة، لا الضوضاء.</p>
          </>
        ),
      },
      {
        question: "ما هي المستويات وكيف تعمل؟",
        answer: (
          <>
            يتقدم الأعضاء عبر <span className="font-bold text-white">أربعة مستويات للقائمة</span> — مُدرَج، وعضو موثّق، ووصول ذو أولوية، ودائرة المؤسسين — كل مستوى يفتح المزيد:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>معاينات مبكرة ووصول للميزات</li>
              <li>رسوم منصة مخفضة</li>
              <li>تعزيز الملف الشخصي والرؤية</li>
              <li>دعم ذو أولوية</li>
              <li>دعوات حصرية والاعتراف</li>
            </ul>
            <p className="mt-4">تُكتسب المستويات عبر المشاركة الموثّقة والمراجعة — لا تُشترى. المستوى الأعلى، <span className="font-bold text-white">دائرة المؤسسين</span>، يمنح مكانة عضو مؤسس مدى الحياة.</p>
          </>
        ),
      },
      {
        question: "كيف يعمل التحقق على FANN؟",
        answer: (
          <>
            كل عمل فني على FANN يمر بعملية تحقق منظمة:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>مراجعة من قبل محترفي الفن والخبراء</li>
              <li>مطابقة مع أوراق اعتماد الفنان والتوثيق</li>
              <li>إصدار سجلات موثقة وبيانات المصداقية</li>
              <li>تأمين بتتبع رقمي مقاوم للعبث</li>
            </ul>
            <p className="mt-4">هذا يضمن أن الجامعين يشترون بثقة والفنانين يبيعون بمصداقية.</p>
          </>
        ),
      },
      {
        question: "ما هو عارض المصداقية وكيف يساعد؟",
        answer: (
          <>
            يتيح لك عارض المصداقية في FANN فحص العمل قبل الالتزام:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>مراجعة شهادة الأصالة وسجل التحقق</li>
              <li>تتبع سلسلة الحيازة الكاملة وتاريخ الملكية</li>
              <li>فحص تقارير الحالة والتوثيق رقميًا</li>
              <li>تأكيد المصداقية قبل الشراء أو الشحن أو النقل</li>
            </ul>
            <p className="mt-4">هذا يجلب الشفافية للفن المادي دون تعريض العمل للخطر.</p>
          </>
        ),
      },
      {
        question: "هل الانضمام إلى FANN مجاني؟",
        answer: (
          <>
            نعم.
            <p className="mt-2">التسجيل مجاني، مما يسمح للمستخدمين باستكشاف المنصة والمجتمع والميزات.</p>
            <p className="mt-2">تفتح الفوائد الإضافية من خلال المشاركة والتحقق وتقدم المستويات.</p>
          </>
        ),
      },
      {
        question: "كيف يحمي FANN الجامعين؟",
        answer: (
          <>
            يتم حماية الجامعين من خلال:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>المصادقة الخبيرة</li>
              <li>تتبع المصداقية</li>
              <li>أوراق اعتماد الفنان الموثقة</li>
              <li>لوجستيات آمنة ومؤمنة</li>
              <li>سجلات شفافة</li>
            </ul>
            <p className="mt-4">كل طبقة مصممة لتقليل المخاطر والحفاظ على القيمة طويلة الأجل.</p>
          </>
        ),
      },
      {
        question: "كيف يدعم FANN الفنانين؟",
        answer: (
          <>
            FANN يمكّن الفنانين من خلال:
            <ul className="list-disc list-inside space-y-2 mt-4 ml-4">
              <li>توفير حالة موثقة</li>
              <li>تقديم التعرض العالمي دون بوابات</li>
              <li>حماية العمل من خلال المصادقة</li>
              <li>دعم اللوجستيات والتوثيق</li>
              <li>بناء المصداقية طويلة الأجل، وليس الضجة قصيرة الأجل</li>
            </ul>
            <p className="mt-4">الفنانون يركزون على الإبداع. FANN يتعامل مع الثقة.</p>
          </>
        ),
      },
      {
        question: "ما الذي يجعل FANN مختلفًا عن المنصات التقليدية؟",
        answer: (
          <>
            المنصات التقليدية تركز على الرؤية.
            <br />
            FANN تركز على <span className="font-bold text-white">الثقة</span> و<span className="font-bold text-white">الهيكل</span> و<span className="font-bold text-white">الاستدامة</span>.
            <br />
            <br />
            الأمر ليس حول البيع السريع
            <br />
            بل حول بناء قيمة تدوم.
          </>
        ),
      },
      {
        question: "هل يركز FANN على NFTs أو الفن الرقمي فقط؟",
        answer: (
          <>
            لا.
            <p className="mt-2">FANN مخصص لـ <span className="font-bold text-white">الفن المادي فقط</span> — اللوحات والمنحوتات والتركيبات والأعمال الملموسة.</p>
            <p className="mt-2">تُستخدم التكنولوجيا لدعم <span className="font-bold text-white">الأصالة والتوثيق والعرض</span>، وليس لاستبدال العمل الفني نفسه.</p>
          </>
        ),
      },
      {
        question: "ما هي تقنية البلوك تشين المستخدمة للتحقق؟",
        answer: (
          <>
            يستخدم FANN طبقة مصداقية مدعومة بتقنية البلوك تشين لتسجيل أحداث التحقق وتاريخ الملكية بطريقة مقاومة للعبث. قد تتطور السلسلة المحددة والهندسة المعمارية حسب المرحلة لتحسين التكلفة والموثوقية والامتثال، مع الحفاظ على قابلية التحقق من السجلات.
          </>
        ),
      },
      {
        question: "كيف يتم التعامل مع الحفظ/التخزين للأعمال الفنية؟",
        answer: (
          <>
            بالنسبة للقطع الموثقة، قد تمر الأعمال الفنية عبر مركزنا أو شركاء الحفظ لدينا للاستلام والمسح والوسم الآمن قبل الشحن إلى المشتري. نتبع إجراءات معالجة منظمة ونستخدم لوجستيات قابلة للتتبع. قد تشمل القطع عالية القيمة مصادقة اختيارية من طرف ثالث ومعالجة محسّنة.
          </>
        ),
      },
      {
        question: "ماذا يحدث إذا توقف FANN عن العمل؟",
        answer: (
          <>
            إذا توقفنا عن الخدمة، سنقدم إشعارًا ونافذة معقولة للمستخدمين لتصدير السجلات الرئيسية. سنتخذ أيضًا خطوات معقولة تجاريًا لإكمال أو حل أي حفظ/شحن قيد المعالجة. قد يتم الاحتفاظ ببعض السجلات لأغراض قانونية/امتثال.
          </>
        ),
      },
    ],
  },
};

export function FAQ({ language, showAll = false, showViewAllCTA = true }: FAQProps) {
  const t = faqContent[language];
  const isRTL = language === "ar";
  const navigate = useNavigate();
  // Show all FAQs if showAll is true, otherwise show only first 5
  const displayedFaqs = showAll ? t.faqs : t.faqs.slice(0, 5);
  const hasMoreFaqs = !showAll && t.faqs.length > 5;

  return (
    <section
      className="relative py-16 overflow-hidden w-full"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Subtle background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#C59B48]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-3 sm:mb-4 font-heading font-semibold px-2 sm:px-0">
            <span className="text-[#F2F2F3] font-heading font-semibold">{t.title.white}</span>
            <span className="text-[#C59B48] font-heading font-semibold">{t.title.gold}</span>
          </h2>
          <p className="text-[#B9BBC6] max-w-2xl mx-auto text-sm sm:text-base md:text-lg font-body font-normal px-4 sm:px-0">
            {t.subtitle}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {displayedFaqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <AccordionItem
                  value={`item-${index}`}
                  className="rounded-2xl bg-[#191922] border border-[#2A2A3A] px-4 sm:px-6 hover:border-[rgba(197,155,72,0.22)] transition-all overflow-hidden group"
                >
                  <AccordionTrigger className="text-[#F2F2F3] hover:text-[#C59B48] text-left py-4 sm:py-5 md:py-6 no-underline font-body font-medium text-sm sm:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#B9BBC6] leading-relaxed pb-4 sm:pb-5 md:pb-6 font-body font-normal text-sm sm:text-base">
                    {typeof faq.answer === "string" ? (
                      <p>{faq.answer}</p>
                    ) : faq.answer && typeof faq.answer === "object" && "intro" in faq.answer ? (
                      <div className="space-y-4">
                        <p className="mb-4">{faq.answer.intro}</p>
                        <ul className="space-y-3 list-none">
                          {faq.answer.benefits.map((benefit: { title: string; description: string }, idx: number) => (
                            <li key={idx} className="flex flex-col gap-1">
                              <span className="font-semibold text-white/90">
                                {benefit.title}
                              </span>
                              <span className="text-[#B9BBC6] pl-4">
                                {benefit.description}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div>{faq.answer}</div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          {/* View All FAQs CTA */}
          {hasMoreFaqs && showViewAllCTA && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 text-center"
            >
              <motion.button
                onClick={() => navigate(ROUTES.CONTACT_US)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-[#C59B48] hover:bg-[#D6AE5A] active:bg-[#A98237] text-[#0B0B0D] shadow-xl shadow-[#C59B48]/30 hover:shadow-2xl hover:shadow-[#C59B48]/50 transition-all duration-300 inline-flex items-center gap-2 cursor-pointer font-body font-medium text-sm sm:text-base"
              >
                <span>{language === "en" ? "View All FAQs" : "عرض جميع الأسئلة الشائعة"}</span>
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
