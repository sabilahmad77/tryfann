import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '@/contexts/useLanguage';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import bgImage from 'figma:asset/3fa9b9de7e4b1421a708a7c88cd0672cee3504e2.png';
import { Shield, FileText } from 'lucide-react';

interface InformationCategory {
  title: string;
  items: string[];
}

const content = {
  en: {
    title: "Privacy Policy & Terms of Service",
    lastUpdated: "Last Updated: January 2026",
    privacy: {
      title: "Privacy Policy",
      intro: "This Privacy Policy explains how FANN and TryFANN (\"we,\" \"us,\" \"our\") collect, use, disclose, and protect your information when you use our websites, apps, and services (the \"Services\").",
      whoWeAre: {
        title: "1. Who We Are",
        content: [
          "TryFANN is a founder-access and rewards experience.",
          "FANN.art is a verified art marketplace for physical art with provenance-first records and resale royalty support.",
          "If you have questions, contact us at: privacy@fannarttech.com"
        ]
      },
      informationWeCollect: {
        title: "2. Information We Collect",
        content: "We collect information in these categories:",
        categories: [
          {
            title: "A) Information You Provide",
            items: [
              "Account details: name, username, email, phone, password",
              "Profile details: role (artist/collector/gallery), bio, social links",
              "Verification/KYC: government ID, selfie/liveness check, address, date of birth (as required), verification status",
              "Artist & listing details: artwork info, images, certificates, provenance documents, pricing inputs",
              "Support requests: messages, attachments, feedback",
              "Events/marketing: survey responses, newsletter preferences, referrals"
            ]
          },
          {
            title: "B) Information Collected Automatically",
            items: [
              "Device & usage: IP address, browser type, device identifiers, pages viewed, clicks, session duration",
              "Cookies & similar tech: to remember preferences, measure performance, reduce fraud, and improve experience"
            ]
          },
          {
            title: "C) Information from Third Parties",
            items: [
              "Verification providers: identity/KYC outcome, risk signals, liveness result",
              "Payment providers: payment confirmation, payout status (we typically do not store full card details)",
              "Shipping/logistics: shipment status, delivery confirmation",
              "Authenticators (optional): authentication outcome and related metadata when requested"
            ]
          }
        ]
      },
      howWeUse: {
        title: "3. How We Use Your Information",
        content: "We use information to:",
        items: [
          "Provide and improve the Services",
          "Create and manage accounts",
          "Run verification and risk checks (fraud prevention, trust & safety)",
          "Enable listing, buying, selling, shipping, and custody workflows",
          "Provide provenance and ownership records (where applicable)",
          "Operate rewards, tiers, leaderboards, referrals (TryFANN)",
          "Communicate updates, support, and security notices",
          "Comply with legal obligations and enforce our Terms",
          "Develop and operate AI models (only as described below)"
        ]
      },
      aiModelTraining: {
        title: "4. AI & Model Training (Transparency)",
        content: "FANN uses AI to enhance trust and user experience, including:",
        uses: [
          "Forgery detection and risk scoring",
          "Pricing recommendations for artists (based on comparable works + the artist's own history when available)",
          "Search & buyer recommendations (personalized discovery)"
        ],
        trainingData: {
          title: "How training data is sourced:",
          items: [
            "Public/third-party datasets and licensed sources",
            "Data provided by artists and galleries (e.g., listings and documentation)",
            "Data captured in our verification flow (e.g., scans and metadata)",
            "Marketplace behavior signals (views, saves, purchases), aggregated where possible"
          ]
        },
        note: "We do not use private messages for model training unless you explicitly submit them for support/troubleshooting. Where feasible, we use aggregation, minimization, and access controls to protect sensitive information."
      },
      howWeShare: {
        title: "5. How We Share Information",
        content: "We may share information with:",
        items: [
          "Service providers (hosting, analytics, customer support tools)",
          "Verification/KYC partners (identity checks, fraud screening)",
          "Payment processors (payments, payouts)",
          "Logistics/custody partners (shipping, storage, delivery)",
          "Authentication partners (only when requested for high-end pieces)",
          "Legal/compliance (if required by law, to protect rights/safety, or prevent fraud)",
          "Business transfers (merger, acquisition, or asset sale — with appropriate protections)"
        ],
        note: "We do not sell your personal data."
      },
      cookies: {
        title: "6. Cookies",
        content: "We use cookies for essential functions, performance, analytics, and security. You can control cookies through your browser settings. Some features may not work without essential cookies."
      },
      dataRetention: {
        title: "7. Data Retention",
        content: "We keep data only as long as needed to:",
        items: [
          "Provide Services and comply with legal obligations",
          "Resolve disputes and enforce agreements",
          "Maintain provenance/ownership records (where applicable)"
        ],
        note: "Retention periods may be longer for verified transactions and compliance records."
      },
      security: {
        title: "8. Security",
        content: "We use administrative, technical, and physical safeguards designed to protect your information. No system is 100% secure; you use the Services at your own risk."
      },
      yourRights: {
        title: "9. Your Rights & Choices",
        content: "Depending on your location, you may have rights to:",
        items: [
          "Access, correct, or delete your information",
          "Object to or restrict certain processing",
          "Withdraw consent (where consent is the basis)",
          "Request a copy of your data"
        ],
        contact: "To submit requests: privacy@fannarttech.com"
      },
      internationalTransfers: {
        title: "10. International Transfers",
        content: "Your information may be processed in countries outside your own. We apply safeguards appropriate to the transfer."
      },
      children: {
        title: "11. Children",
        content: "The Services are not intended for children under the age required by applicable law. We do not knowingly collect children's data."
      },
      changes: {
        title: "12. Changes to this Policy",
        content: "We may update this Privacy Policy. We will post the updated version with a new effective date."
      },
      contact: {
        title: "13. Contact",
        email: "Email: privacy@fannarttech.com",
        address: "Address: [Company Address]"
      }
    },
    terms: {
      title: "Terms & Conditions",
      intro: "These Terms govern your access to and use of TryFANN and FANN.art (\"Services\"). By using the Services, you agree to these Terms.",
      definitions: {
        title: "1. Definitions",
        items: [
          "TryFANN: founder access, rewards, referrals, and community participation.",
          "FANN.art: verified marketplace for physical artworks with provenance-first records.",
          "User: any visitor or account holder.",
          "Artist/Gallery/Collector: roles as defined in onboarding."
        ]
      },
      eligibility: {
        title: "2. Eligibility & Accounts",
        content: "You must be legally able to form a contract in your jurisdiction. You agree to provide accurate information and keep your account secure. We may suspend accounts for fraud, abuse, or violations."
      },
      verification: {
        title: "3. Verification & Trust",
        content: [
          "We may require KYC/identity verification and additional checks for higher activity.",
          "You consent to verification checks through third-party providers. Verification outcomes may affect access to features."
        ]
      },
      listings: {
        title: "4. Listings, Sales, and Marketplace Rules (FANN.art)",
        content: [
          "Artists/Galleries are responsible for accurate listing details, provenance documents, and authenticity claims.",
          "We may review listings and remove content that violates policy, law, or quality requirements."
        ]
      },
      authentication: {
        title: "5. Authentication Process (AI + Hub + Optional Third Parties)",
        content: "Our authenticity approach may include:",
        methods: [
          "AI-based forgery detection using scans, images, metadata, and patterns",
          "Physical hub workflow: artwork may be received, scanned, and assigned tamper-resistant tagging/IoT identifiers",
          "Optional third-party authentication for high-end art when requested/required (museums, galleries, institutions, or professional authenticators)"
        ],
        important: "Important: While we apply strict controls, no method can guarantee 100% certainty. We provide a verification process and records, not an absolute promise."
      },
      custody: {
        title: "6. Custody, Storage, and Shipping",
        content: [
          "If an artwork is routed through our hub or custody partners:",
          "• Handling and storage follow documented procedures",
          "• Shipping timelines and insurance depend on carrier options and declared value",
          "• Users must provide accurate shipping information",
          "We are not responsible for delays outside our reasonable control (e.g., customs, carrier disruptions)."
        ]
      },
      fees: {
        title: "7. Fees, Payments, and Payouts",
        content: [
          "Fees may include: marketplace commission, verification fees, shipping, custody, and optional authentication.",
          "Payment processing is handled via third parties. Payouts to sellers are subject to verification, fraud checks, and payout policies.",
          "Refunds/chargebacks may pause payouts pending investigation."
        ]
      },
      resale: {
        title: "8. Resale & Royalties",
        content: "Where supported, resale royalties may be applied according to artist terms, platform rules, and applicable laws. Implementation may vary by region and phase."
      },
      rewards: {
        title: "9. TryFANN Rewards, Referrals, and Leaderboards",
        content: "TryFANN includes points, tiers, missions, and referrals:",
        items: [
          "Points have no cash value unless explicitly stated",
          "We may adjust rules, rewards, or tier thresholds to prevent abuse",
          "Fraudulent referral activity can result in forfeiture of points and suspension"
        ]
      },
      prohibited: {
        title: "10. Prohibited Activities",
        content: "You may not:",
        items: [
          "Submit fake identities, forged documents, or stolen content",
          "List counterfeit or stolen artworks",
          "Manipulate referrals/leaderboards, exploit bugs, or attempt unauthorized access",
          "Harass users or violate applicable laws"
        ],
        note: "Violations may lead to suspension, removal, and legal action."
      },
      intellectualProperty: {
        title: "11. Intellectual Property",
        content: "All platform UI, branding, and content we create are owned by us or our licensors. Users retain ownership of their uploaded content but grant us a license to display, distribute, and use it to operate the Services (including verification and safety)."
      },
      userContent: {
        title: "12. User Content & Takedowns",
        content: "You are responsible for content you upload. We may remove content that violates policy or law. Repeat offenders may be banned."
      },
      disclaimers: {
        title: "13. Disclaimers",
        content: "Services are provided \"as is\" to the maximum extent permitted by law. We do not guarantee uninterrupted service or error-free operation."
      },
      liability: {
        title: "14. Limitation of Liability",
        content: "To the fullest extent permitted by law, we are not liable for indirect, incidental, or consequential damages. Our total liability is limited to the amount you paid us in the prior [3/6/12] months, unless law requires otherwise."
      },
      termination: {
        title: "15. Termination",
        content: "You may stop using the Services anytime. We may suspend/terminate access for violations, fraud risk, or legal reasons."
      },
      continuity: {
        title: "16. What Happens If FANN Shuts Down? (Continuity)",
        content: "If we discontinue the Services, we will take commercially reasonable steps to:",
        items: [
          "Provide notice where possible",
          "Allow users to access/export essential account and transaction records for a defined period",
          "Coordinate completion/return of any in-process custody/shipping when feasible. Some records may need to be retained for legal/compliance reasons."
        ]
      },
      regulatory: {
        title: "17. Regulatory / Compliance Note (Kuwait & Others)",
        content: "FANN/TryFANN are technology platforms for verified commerce and provenance. We do not provide investment advice. Features are not intended as securities offerings. If any feature becomes subject to regulation (e.g., financial promotion, custody rules, or tokenized assets), we will adapt the product and onboarding accordingly."
      },
      changes: {
        title: "18. Changes to Terms",
        content: "We may update these Terms. Continued use after changes means you accept the new Terms."
      },
      governingLaw: {
        title: "19. Governing Law",
        content: "Governing law and venue: [Kuwait / or your chosen jurisdiction]."
      },
      contact: {
        title: "20. Contact",
        email: "Email: support@fannarttech.com",
        address: "Address: [Company Address]"
      }
    },
  },
  ar: {
    title: "سياسة الخصوصية وشروط الخدمة",
    lastUpdated: "آخر تحديث: يناير 2025",
    privacy: {
      title: "سياسة الخصوصية",
      intro: "توضح سياسة الخصوصية هذه كيفية جمع FANN و TryFANN (\"نحن\"، \"لنا\"، \"خاصتنا\") واستخدامها والكشف عنها وحماية معلوماتك عند استخدام مواقعنا وتطبيقاتنا وخدماتنا (\"الخدمات\").",
      whoWeAre: {
        title: "1. من نحن",
        content: [
          "TryFANN هي تجربة وصول المؤسسين والمكافآت.",
          "FANN.art هو سوق فني موثق للأعمال الفنية المادية مع سجلات تركز على الإثبات ودعم إتاوات إعادة البيع.",
          "إذا كان لديك أسئلة، اتصل بنا على: privacy@fannarttech.com"
        ]
      },
      informationWeCollect: {
        title: "2. المعلومات التي نجمعها",
        content: "نجمع المعلومات في هذه الفئات:",
        categories: [
          {
            title: "أ) المعلومات التي تقدمها",
            items: [
              "تفاصيل الحساب: الاسم، اسم المستخدم، البريد الإلكتروني، الهاتف، كلمة المرور",
              "تفاصيل الملف الشخصي: الدور (فنان/جامع/معرض)، السيرة الذاتية، روابط التواصل الاجتماعي",
              "التحقق/اعرف عميلك: بطاقة الهوية الحكومية، صورة شخصية/فحص الحيوية، العنوان، تاريخ الميلاد (حسب الحاجة)، حالة التحقق",
              "تفاصيل الفنان والقائمة: معلومات العمل الفني، الصور، الشهادات، مستندات الإثبات، مدخلات التسعير",
              "طلبات الدعم: الرسائل، المرفقات، الملاحظات",
              "الأحداث/التسويق: ردود الاستطلاع، تفضيلات النشرة الإخبارية، الإحالات"
            ]
          },
          {
            title: "ب) المعلومات المجمعة تلقائيًا",
            items: [
              "الجهاز والاستخدام: عنوان IP، نوع المتصفح، معرفات الجهاز، الصفحات المعروضة، النقرات، مدة الجلسة",
              "ملفات تعريف الارتباط والتقنيات المماثلة: لتذكر التفضيلات، قياس الأداء، تقليل الاحتيال، وتحسين التجربة"
            ]
          },
          {
            title: "ج) المعلومات من الأطراف الثالثة",
            items: [
              "مقدمي التحقق: نتيجة الهوية/اعرف عميلك، إشارات المخاطر، نتيجة الحيوية",
              "مقدمي الدفع: تأكيد الدفع، حالة الدفع (عادة لا نخزن تفاصيل البطاقة الكاملة)",
              "الشحن/اللوجستيات: حالة الشحنة، تأكيد التسليم",
              "المصادقون (اختياري): نتيجة المصادقة والبيانات الوصفية ذات الصلة عند الطلب"
            ]
          }
        ]
      },
      howWeUse: {
        title: "3. كيفية استخدام معلوماتك",
        content: "نستخدم المعلومات لـ:",
        items: [
          "توفير وتحسين الخدمات",
          "إنشاء وإدارة الحسابات",
          "تشغيل عمليات التحقق وفحوصات المخاطر (منع الاحتيال، الثقة والسلامة)",
          "تمكين سير عمل القوائم والشراء والبيع والشحن والحفظ",
          "توفير سجلات الإثبات والملكية (حيث ينطبق)",
          "تشغيل المكافآت والمستويات ولوحات المتصدرين والإحالات (TryFANN)",
          "التواصل مع التحديثات والدعم وإشعارات الأمان",
          "الامتثال للالتزامات القانونية وإنفاذ شروطنا",
          "تطوير وتشغيل نماذج الذكاء الاصطناعي (فقط كما هو موضح أدناه)"
        ]
      },
      aiModelTraining: {
        title: "4. الذكاء الاصطناعي وتدريب النماذج (الشفافية)",
        content: "يستخدم FANN الذكاء الاصطناعي لتعزيز الثقة وتجربة المستخدم، بما في ذلك:",
        uses: [
          "اكتشاف التزوير وتسجيل المخاطر",
          "توصيات التسعير للفنانين (بناءً على أعمال مماثلة + تاريخ الفنان الخاص عند التوفر)",
          "البحث وتوصيات المشترين (اكتشاف مخصص)"
        ],
        trainingData: {
          title: "كيف يتم الحصول على بيانات التدريب:",
          items: [
            "مجموعات البيانات العامة/الأطراف الثالثة والمصادر المرخصة",
            "البيانات المقدمة من الفنانين والمعارض (مثل القوائم والوثائق)",
            "البيانات التي تم التقاطها في تدفق التحقق الخاص بنا (مثل المسوحات والبيانات الوصفية)",
            "إشارات سلوك السوق (المشاهدات، الحفظ، المشتريات)، مجمعة حيثما أمكن"
          ]
        },
        note: "لا نستخدم الرسائل الخاصة لتدريب النماذج إلا إذا قدمتها صراحة للدعم/استكشاف الأخطاء. حيثما أمكن، نستخدم التجميع والتصغير وضوابط الوصول لحماية المعلومات الحساسة."
      },
      howWeShare: {
        title: "5. كيفية مشاركة المعلومات",
        content: "قد نشارك المعلومات مع:",
        items: [
          "مقدمي الخدمات (الاستضافة، التحليلات، أدوات دعم العملاء)",
          "شركاء التحقق/اعرف عميلك (فحوصات الهوية، فحص الاحتيال)",
          "معالجات الدفع (المدفوعات، المدفوعات)",
          "شركاء اللوجستيات/الحفظ (الشحن، التخزين، التسليم)",
          "شركاء المصادقة (فقط عند الطلب للقطع عالية الجودة)",
          "القانون/الامتثال (إذا كان مطلوبًا بموجب القانون، لحماية الحقوق/السلامة، أو منع الاحتيال)",
          "التحويلات التجارية (الاندماج، الاستحواذ، أو بيع الأصول — مع الحماية المناسبة)"
        ],
        note: "نحن لا نبيع بياناتك الشخصية."
      },
      cookies: {
        title: "6. ملفات تعريف الارتباط",
        content: "نستخدم ملفات تعريف الارتباط للوظائف الأساسية والأداء والتحليلات والأمان. يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح. قد لا تعمل بعض الميزات بدون ملفات تعريف الارتباط الأساسية."
      },
      dataRetention: {
        title: "7. الاحتفاظ بالبيانات",
        content: "نحتفظ بالبيانات فقط طالما كان ذلك ضروريًا لـ:",
        items: [
          "توفير الخدمات والامتثال للالتزامات القانونية",
          "حل النزاعات وإنفاذ الاتفاقيات",
          "الحفاظ على سجلات الإثبات/الملكية (حيث ينطبق)"
        ],
        note: "قد تكون فترات الاحتفاظ أطول للمعاملات الموثقة وسجلات الامتثال."
      },
      security: {
        title: "8. الأمان",
        content: "نستخدم ضمانات إدارية وتقنية ومادية مصممة لحماية معلوماتك. لا يوجد نظام آمن بنسبة 100٪؛ أنت تستخدم الخدمات على مسؤوليتك الخاصة."
      },
      yourRights: {
        title: "9. حقوقك وخياراتك",
        content: "اعتمادًا على موقعك، قد يكون لديك حقوق لـ:",
        items: [
          "الوصول إلى معلوماتك أو تصحيحها أو حذفها",
          "الاعتراض على أو تقييد معالجة معينة",
          "سحب الموافقة (حيث تكون الموافقة هي الأساس)",
          "طلب نسخة من بياناتك"
        ],
        contact: "لتقديم الطلبات: privacy@fannarttech.com"
      },
      internationalTransfers: {
        title: "10. التحويلات الدولية",
        content: "قد تتم معالجة معلوماتك في بلدان خارج بلدك. نطبق ضمانات مناسبة للتحويل."
      },
      children: {
        title: "11. الأطفال",
        content: "الخدمات غير مخصصة للأطفال دون السن المطلوبة بموجب القانون المعمول به. نحن لا نجمع بيانات الأطفال عن علم."
      },
      changes: {
        title: "12. التغييرات على هذه السياسة",
        content: "قد نحدث سياسة الخصوصية هذه. سننشر النسخة المحدثة مع تاريخ سريان جديد."
      },
      contact: {
        title: "13. الاتصال",
        email: "البريد الإلكتروني: privacy@fannarttech.com",
        address: "العنوان: [عنوان الشركة]"
      }
    },
    terms: {
      title: "شروط الخدمة",
      intro: "تحكم هذه الشروط في الوصول إلى TryFANN و FANN.art (\"الخدمات\") واستخدامها. باستخدام الخدمات، أنت توافق على هذه الشروط.",
      definitions: {
        title: "1. التعريفات",
        items: [
          "TryFANN: وصول المؤسسين، المكافآت، الإحالات، والمشاركة المجتمعية.",
          "FANN.art: سوق فني موثق للأعمال الفنية المادية مع سجلات تركز على الإثبات.",
          "المستخدم: أي زائر أو حامل حساب.",
          "الفنان/المعرض/الجامع: الأدوار كما هو محدد في الإعداد."
        ]
      },
      eligibility: {
        title: "2. الأهلية والحسابات",
        content: "يجب أن تكون قادرًا قانونيًا على إبرام عقد في ولايتك القضائية. أنت توافق على تقديم معلومات دقيقة والحفاظ على أمان حسابك. قد نعلق الحسابات بسبب الاحتيال أو إساءة الاستخدام أو الانتهاكات."
      },
      verification: {
        title: "3. التحقق والثقة",
        content: [
          "قد نطلب التحقق من الهوية/اعرف عميلك وفحوصات إضافية للنشاط الأعلى.",
          "أنت توافق على فحوصات التحقق من خلال مقدمي الأطراف الثالثة. قد تؤثر نتائج التحقق على الوصول إلى الميزات."
        ]
      },
      listings: {
        title: "4. القوائم والمبيعات وقواعد السوق (FANN.art)",
        content: [
          "الفنانون/المعارض مسؤولون عن تفاصيل القائمة الدقيقة ومستندات الإثبات ومطالبات الأصالة.",
          "قد نراجع القوائم ونزيل المحتوى الذي ينتهك السياسة أو القانون أو متطلبات الجودة."
        ]
      },
      authentication: {
        title: "5. عملية المصادقة (الذكاء الاصطناعي + المركز + الأطراف الثالثة الاختيارية)",
        content: "قد تتضمن نهج الأصالة لدينا:",
        methods: [
          "اكتشاف التزوير القائم على الذكاء الاصطناعي باستخدام المسوحات والصور والبيانات الوصفية والأنماط",
          "سير عمل المركز المادي: قد يتم استلام العمل الفني ومسحه وتعيين علامات مقاومة للعبث/معرفات إنترنت الأشياء",
          "المصادقة الاختيارية من طرف ثالث للأعمال الفنية عالية الجودة عند الطلب/المطلوبة (المتاحف، المعارض، المؤسسات، أو المصادقين المحترفين)"
        ],
        important: "مهم: بينما نطبق ضوابط صارمة، لا يمكن لأي طريقة ضمان اليقين بنسبة 100٪. نقدم عملية تحقق وسجلات، وليس وعدًا مطلقًا."
      },
      custody: {
        title: "6. الحفظ والتخزين والشحن",
        content: [
          "إذا تم توجيه عمل فني عبر مركزنا أو شركاء الحفظ:",
          "• تتبع المعالجة والتخزين إجراءات موثقة",
          "• تعتمد جداول الشحن والتأمين على خيارات الناقل والقيمة المعلنة",
          "• يجب على المستخدمين تقديم معلومات شحن دقيقة",
          "نحن لسنا مسؤولين عن التأخيرات خارج سيطرتنا المعقولة (مثل الجمارك، اضطرابات الناقل)."
        ]
      },
      fees: {
        title: "7. الرسوم والمدفوعات والمدفوعات",
        content: [
          "قد تشمل الرسوم: عمولة السوق، رسوم التحقق، الشحن، الحفظ، والمصادقة الاختيارية.",
          "يتم التعامل مع معالجة الدفع عبر أطراف ثالثة. تخضع المدفوعات للبائعين للتحقق وفحوصات الاحتيال وسياسات الدفع.",
          "قد توقف المدفوعات المستردة/الاستردادات المدفوعات المعلقة التحقيق."
        ]
      },
      resale: {
        title: "8. إعادة البيع والإتاوات",
        content: "حيثما يتم دعمها، قد يتم تطبيق إتاوات إعادة البيع وفقًا لشروط الفنان وقواعد المنصة والقوانين المعمول بها. قد يختلف التنفيذ حسب المنطقة والمرحلة."
      },
      rewards: {
        title: "9. مكافآت TryFANN والإحالات ولوحات المتصدرين",
        content: "يتضمن TryFANN النقاط والمستويات والمهام والإحالات:",
        items: [
          "النقاط ليس لها قيمة نقدية ما لم يُذكر صراحة",
          "قد نعدل القواعد أو المكافآت أو عتبات المستوى لمنع إساءة الاستخدام",
          "يمكن أن يؤدي نشاط الإحالة الاحتيالي إلى مصادرة النقاط والتعليق"
        ]
      },
      prohibited: {
        title: "10. الأنشطة المحظورة",
        content: "لا يجوز لك:",
        items: [
          "تقديم هويات مزيفة أو مستندات مزورة أو محتوى مسروق",
          "إدراج أعمال فنية مقلدة أو مسروقة",
          "التلاعب بالإحالات/لوحات المتصدرين، استغلال الأخطاء، أو محاولة الوصول غير المصرح به",
          "مضايقة المستخدمين أو انتهاك القوانين المعمول بها"
        ],
        note: "قد تؤدي الانتهاكات إلى التعليق والإزالة والإجراءات القانونية."
      },
      intellectualProperty: {
        title: "11. الملكية الفكرية",
        content: "جميع واجهة المستخدم للمنصة والعلامات التجارية والمحتوى الذي ننشئه مملوك لنا أو لمرخصينا. يحتفظ المستخدمون بملكية المحتوى الذي يرفعونه ولكن يمنحوننا ترخيصًا لعرضه وتوزيعه واستخدامه لتشغيل الخدمات (بما في ذلك التحقق والسلامة)."
      },
      userContent: {
        title: "12. محتوى المستخدم والإزالة",
        content: "أنت مسؤول عن المحتوى الذي ترفعه. قد نزيل المحتوى الذي ينتهك السياسة أو القانون. قد يتم حظر المخالفين المتكررين."
      },
      disclaimers: {
        title: "13. إخلاء المسؤولية",
        content: "يتم توفير الخدمات \"كما هي\" إلى أقصى حد يسمح به القانون. لا نضمن خدمة غير منقطعة أو تشغيلًا خاليًا من الأخطاء."
      },
      liability: {
        title: "14. الحد من المسؤولية",
        content: "إلى أقصى حد يسمح به القانون، نحن لسنا مسؤولين عن الأضرار غير المباشرة أو العرضية أو التبعية. مسؤوليتنا الإجمالية محدودة بالمبلغ الذي دفعته لنا في [3/6/12] أشهر السابقة، ما لم يتطلب القانون خلاف ذلك."
      },
      termination: {
        title: "15. الإنهاء",
        content: "يمكنك التوقف عن استخدام الخدمات في أي وقت. قد نعلق/ننهي الوصول بسبب الانتهاكات أو مخاطر الاحتيال أو الأسباب القانونية."
      },
      continuity: {
        title: "16. ماذا يحدث إذا توقف FANN عن العمل؟ (الاستمرارية)",
        content: "إذا أوقفنا الخدمات، سنتخذ خطوات معقولة تجاريًا لـ:",
        items: [
          "تقديم إشعار حيثما أمكن",
          "السماح للمستخدمين بالوصول/تصدير سجلات الحساب والمعاملات الأساسية لفترة محددة",
          "تنسيق إكمال/إرجاع أي حفظ/شحن قيد المعالجة عندما يكون ذلك ممكنًا. قد تحتاج بعض السجلات إلى الاحتفاظ بها لأسباب قانونية/امتثال."
        ]
      },
      regulatory: {
        title: "17. ملاحظة تنظيمية / امتثال (الكويت وغيرها)",
        content: "FANN/TryFANN هي منصات تقنية للتجارة الموثقة والإثبات. نحن لا نقدم نصيحة استثمارية. الميزات ليست مخصصة كعروض أوراق مالية. إذا أصبحت أي ميزة خاضعة للتنظيم (مثل الترويج المالي، قواعد الحفظ، أو الأصول المميزة)، فسنقوم بتعديل المنتج والإعداد accordingly."
      },
      changes: {
        title: "18. التغييرات على الشروط",
        content: "قد نحدث هذه الشروط. الاستمرار في الاستخدام بعد التغييرات يعني أنك تقبل الشروط الجديدة."
      },
      governingLaw: {
        title: "19. القانون الحاكم",
        content: "القانون الحاكم والموقع: [الكويت / أو ولايتك القضائية المختارة]."
      },
      contact: {
        title: "20. الاتصال",
        email: "البريد الإلكتروني: support@fannarttech.com",
        address: "العنوان: [عنوان الشركة]"
      }
    },
  },
};

// Helper function to format text with bold key terms
function formatTextWithBold(text: string): React.ReactNode {
  // Terms that should be bold (before colons or as standalone terms)
  const boldTerms = [
    'TryFANN',
    'FANN.art',
    'Account details',
    'Profile details',
    'Verification/KYC',
    'Artist & listing details',
    'Support requests',
    'Events/marketing',
    'Device & usage',
    'Cookies & similar tech',
    'Verification providers',
    'Payment providers',
    'Shipping/logistics',
    'Authenticators (optional)',
    'Service providers',
    'Verification/KYC partners',
    'Payment processors',
    'Logistics/custody partners',
    'Authentication partners',
    'Legal/compliance',
    'Business transfers'
  ];

  // Split by colon and bold the part before colon if it matches a term
  if (text.includes(':')) {
    const parts = text.split(':');
    const beforeColon = parts[0].trim();
    const afterColon = parts.slice(1).join(':').trim();
    
    if (boldTerms.some(term => beforeColon.includes(term) || beforeColon === term)) {
      return (
        <>
          <span className="font-bold text-white/90 font-body">{beforeColon}:</span>
          {afterColon && <span className="font-body"> {afterColon}</span>}
        </>
      );
    }
  }

  // Check if text contains TryFANN or FANN.art
  if (text.includes('TryFANN') || text.includes('FANN.art')) {
    const parts = text.split(/(TryFANN|FANN\.art)/g);
    return (
      <>
        {parts.map((part, idx) => 
          part === 'TryFANN' || part === 'FANN.art' ? (
            <span key={idx} className="font-bold text-white/90 font-body">{part}</span>
          ) : (
            <span key={idx} className="font-body">{part}</span>
          )
        )}
      </>
    );
  }

  return text;
}

// Helper component to render list items
function ListItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <li className={`flex items-start gap-2 ${className}`}>
      <span className="text-[#C59B48]">•</span>
      <span className="flex-1 text-white/70 leading-relaxed font-body">
        {typeof children === 'string' ? formatTextWithBold(children) : children}
      </span>
    </li>
  );
}

export function PrivacyTermsPage() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const t = content[language];

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      <Navigation onNavigateToSignIn={() => {}} />
      
      <main>
        <section className="relative py-24 overflow-hidden mt-12" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="absolute inset-0">
            <ImageWithFallback
              src={bgImage}
              alt="Background"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0D]/60 via-transparent to-[#0B0B0D]/60" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl md:text-5xl mb-4 font-heading">
                <span className="text-white font-heading">{t.title}</span>
              </h1>
              <p className="text-[#B9BBC6] text-sm font-body">{t.lastUpdated}</p>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-16">
              {/* Privacy Policy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="backdrop-blur-xl bg-gradient-to-br from-[#191922]/80 via-[#191922]/70 to-[#0B0B0D]/80 rounded-2xl border-2 border-[#C59B48]/22 p-8 md:p-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-[#C59B48]" />
                  <h2 className="text-3xl font-bold text-white font-heading">{t.privacy.title}</h2>
                </div>
                
                {t.privacy.intro && (
                  <p className="text-white/80 leading-relaxed font-body mb-8 pb-6 border-b border-white/10">
                    {t.privacy.intro}
                  </p>
                )}

                <div className="space-y-8">
                  {/* Who We Are */}
                  {t.privacy.whoWeAre && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.whoWeAre.title}</h3>
                      <ul className="space-y-2">
                        {t.privacy.whoWeAre.content.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Information We Collect */}
                  {t.privacy.informationWeCollect && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.informationWeCollect.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-4">{t.privacy.informationWeCollect.content}</p>
                      <div className="space-y-4">
                        {t.privacy.informationWeCollect.categories.map((category: InformationCategory, idx: number) => (
                          <div key={idx} className="bg-white/5 rounded-lg p-4">
                            <h4 className="text-lg font-bold text-white mb-2 font-heading">{category.title}</h4>
                            <ul className="space-y-1.5">
                              {category.items.map((item: string, itemIdx: number) => (
                                <ListItem key={itemIdx} className="text-sm">{item}</ListItem>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* How We Use */}
                  {t.privacy.howWeUse && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.howWeUse.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.privacy.howWeUse.content}</p>
                      <ol className="space-y-2 ml-4">
                        {t.privacy.howWeUse.items.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-white/70 leading-relaxed font-body">
                            <span className="text-[#C59B48] font-bold mt-0.5 font-body">{idx + 1}.</span>
                            <span className="flex-1 font-body">{typeof item === 'string' ? formatTextWithBold(item) : item}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* AI & Model Training */}
                  {t.privacy.aiModelTraining && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.aiModelTraining.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.privacy.aiModelTraining.content}</p>
                      <ul className="space-y-2 mb-4">
                        {t.privacy.aiModelTraining.uses.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                      <div className="bg-white/5 rounded-lg p-4">
                        <h4 className="text-lg font-bold text-white mb-2 font-heading">{t.privacy.aiModelTraining.trainingData.title}</h4>
                        <ul className="space-y-1.5">
                          {t.privacy.aiModelTraining.trainingData.items.map((item: string, idx: number) => (
                            <ListItem key={idx} className="text-sm">{item}</ListItem>
                          ))}
                        </ul>
                      </div>
                      {t.privacy.aiModelTraining.note && (
                        <p className="text-[#B9BBC6] text-sm italic mt-4 leading-relaxed font-body">{t.privacy.aiModelTraining.note}</p>
                      )}
                    </div>
                  )}

                  {/* How We Share */}
                  {t.privacy.howWeShare && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.howWeShare.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.privacy.howWeShare.content}</p>
                      <ul className="space-y-2 mb-3">
                        {t.privacy.howWeShare.items.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                      {t.privacy.howWeShare.note && (
                        <p className="text-white/80 font-semibold mt-4 font-body">{t.privacy.howWeShare.note}</p>
                      )}
                    </div>
                  )}

                  {/* Cookies */}
                  {t.privacy.cookies && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.cookies.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.privacy.cookies.content}</p>
                    </div>
                  )}

                  {/* Data Retention */}
                  {t.privacy.dataRetention && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.dataRetention.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.privacy.dataRetention.content}</p>
                      <ul className="space-y-2 mb-3">
                        {t.privacy.dataRetention.items.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                      {t.privacy.dataRetention.note && (
                        <p className="text-[#B9BBC6] text-sm italic mt-2 font-body">{t.privacy.dataRetention.note}</p>
                      )}
                    </div>
                  )}

                  {/* Security */}
                  {t.privacy.security && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.security.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.privacy.security.content}</p>
                    </div>
                  )}

                  {/* Your Rights */}
                  {t.privacy.yourRights && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.yourRights.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.privacy.yourRights.content}</p>
                      <ul className="space-y-2 mb-3">
                        {t.privacy.yourRights.items.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                      {t.privacy.yourRights.contact && (
                        <p className="text-white/80 mt-4 font-body">{t.privacy.yourRights.contact}</p>
                      )}
                    </div>
                  )}

                  {/* International Transfers */}
                  {t.privacy.internationalTransfers && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.internationalTransfers.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.privacy.internationalTransfers.content}</p>
                    </div>
                  )}

                  {/* Children */}
                  {t.privacy.children && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.children.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.privacy.children.content}</p>
                    </div>
                  )}

                  {/* Changes */}
                  {t.privacy.changes && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.changes.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.privacy.changes.content}</p>
                    </div>
                  )}

                  {/* Contact */}
                  {t.privacy.contact && (
                    <div className="pb-6">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.privacy.contact.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.privacy.contact.email}</p>
                      <p className="text-white/70 leading-relaxed font-body">{t.privacy.contact.address}</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Terms & Conditions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="backdrop-blur-xl bg-gradient-to-br from-[#191922]/80 via-[#191922]/70 to-[#0B0B0D]/80 rounded-2xl border-2 border-[#C59B48]/22 p-8 md:p-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-[#C59B48]" />
                  <h2 className="text-3xl font-bold text-white font-heading">{t.terms.title}</h2>
                </div>

                {t.terms.intro && (
                  <p className="text-white/80 leading-relaxed font-body mb-8 pb-6 border-b border-white/10">
                    {t.terms.intro}
                  </p>
                )}

                <div className="space-y-8">
                  {/* Definitions */}
                  {t.terms.definitions && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.definitions.title}</h3>
                      <ul className="space-y-2">
                        {t.terms.definitions.items.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Eligibility */}
                  {t.terms.eligibility && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.eligibility.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.eligibility.content}</p>
                    </div>
                  )}

                  {/* Verification */}
                  {t.terms.verification && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.verification.title}</h3>
                      <div className="space-y-2">
                        {t.terms.verification.content.map((item: string, idx: number) => (
                          <p key={idx} className="text-white/70 leading-relaxed font-body">{item}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Listings */}
                  {t.terms.listings && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.listings.title}</h3>
                      <div className="space-y-2">
                        {t.terms.listings.content.map((item: string, idx: number) => (
                          <p key={idx} className="text-white/70 leading-relaxed font-body">{item}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Authentication */}
                  {t.terms.authentication && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.authentication.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.terms.authentication.content}</p>
                      <ol className="space-y-2 mb-4 ml-4">
                        {t.terms.authentication.methods.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-white/70 leading-relaxed font-body">
                            <span className="text-[#C59B48] font-bold mt-0.5 font-body">{idx + 1}.</span>
                            <span className="flex-1 font-body">{typeof item === 'string' ? formatTextWithBold(item) : item}</span>
                          </li>
                        ))}
                      </ol>
                      {t.terms.authentication.important && (
                        <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-lg p-4 mt-4">
                          <p className="text-yellow-400 font-bold leading-relaxed font-body">{t.terms.authentication.important}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custody */}
                  {t.terms.custody && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.custody.title}</h3>
                      <div className="space-y-3">
                        {t.terms.custody.content.map((item: string, idx: number) => {
                          if (item.startsWith('•')) {
                            // Group consecutive bullet points
                            const bulletItems: string[] = [];
                            let currentIdx = idx;
                            while (currentIdx < t.terms.custody.content.length && t.terms.custody.content[currentIdx].startsWith('•')) {
                              bulletItems.push(t.terms.custody.content[currentIdx].replace('•', '').trim());
                              currentIdx++;
                            }
                            
                            // Only render on first bullet of group
                            if (idx === 0 || !t.terms.custody.content[idx - 1].startsWith('•')) {
                              return (
                                <ul key={idx} className="space-y-2">
                                  {bulletItems.map((bulletItem, bulletIdx) => (
                                    <ListItem key={bulletIdx}>{bulletItem}</ListItem>
                                  ))}
                                </ul>
                              );
                            }
                            return null;
                          }
                          return (
                            <p key={idx} className="text-white/70 leading-relaxed font-body">{item}</p>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Fees */}
                  {t.terms.fees && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.fees.title}</h3>
                      <div className="space-y-2">
                        {t.terms.fees.content.map((item: string, idx: number) => (
                          <p key={idx} className="text-white/70 leading-relaxed font-body">{item}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resale */}
                  {t.terms.resale && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.resale.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.resale.content}</p>
                    </div>
                  )}

                  {/* Rewards */}
                  {t.terms.rewards && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.rewards.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.terms.rewards.content}</p>
                      <ul className="space-y-2">
                        {t.terms.rewards.items.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prohibited */}
                  {t.terms.prohibited && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.prohibited.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.terms.prohibited.content}</p>
                      <ul className="space-y-2 mb-3">
                        {t.terms.prohibited.items.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                      {t.terms.prohibited.note && (
                        <p className="text-white/80 font-semibold mt-2 font-body">{t.terms.prohibited.note}</p>
                      )}
                    </div>
                  )}

                  {/* Intellectual Property */}
                  {t.terms.intellectualProperty && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.intellectualProperty.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.intellectualProperty.content}</p>
                    </div>
                  )}

                  {/* User Content */}
                  {t.terms.userContent && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.userContent.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.userContent.content}</p>
                    </div>
                  )}

                  {/* Disclaimers */}
                  {t.terms.disclaimers && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.disclaimers.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.disclaimers.content}</p>
                    </div>
                  )}

                  {/* Liability */}
                  {t.terms.liability && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.liability.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.liability.content}</p>
                    </div>
                  )}

                  {/* Termination */}
                  {t.terms.termination && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.termination.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.termination.content}</p>
                    </div>
                  )}

                  {/* Continuity */}
                  {t.terms.continuity && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.continuity.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body mb-3">{t.terms.continuity.content}</p>
                      <ul className="space-y-2">
                        {t.terms.continuity.items.map((item: string, idx: number) => (
                          <ListItem key={idx}>{item}</ListItem>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Regulatory */}
                  {t.terms.regulatory && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.regulatory.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.regulatory.content}</p>
                    </div>
                  )}

                  {/* Changes */}
                  {t.terms.changes && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.changes.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.changes.content}</p>
                    </div>
                  )}

                  {/* Governing Law */}
                  {t.terms.governingLaw && (
                    <div className="border-b border-white/10 pb-6 last:border-0">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.governingLaw.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.governingLaw.content}</p>
                    </div>
                  )}

                  {/* Contact */}
                  {t.terms.contact && (
                    <div className="pb-6">
                      <h3 className="text-xl font-bold text-[#C59B48] mb-3 font-heading">{t.terms.contact.title}</h3>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.contact.email}</p>
                      <p className="text-white/70 leading-relaxed font-body">{t.terms.contact.address}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer language={language} />
    </div>
  );
}

