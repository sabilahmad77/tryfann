// TryFann · Point 2 — Split the Funnel by Role.
// Single source of truth for every role's progressive application form.
// Fields mirror the mandate's per-role "Data collected" lists exactly.
// Role drives: which steps/fields render, the track (game vs concierge),
// the review path, and whether the engagement layer is ever shown.

export type Lang = "en" | "ar";

export type FieldType =
  | "text"
  | "textarea"
  | "url"
  | "select"
  | "multiselect"
  | "radio"
  | "tags";

export interface FieldOption {
  value: string;
  en: string;
  ar: string;
}

export interface SchemaField {
  key: string;
  type: FieldType;
  label: Record<Lang, string>;
  placeholder?: Record<Lang, string>;
  help?: Record<Lang, string>;
  options?: FieldOption[];
  /** Defaults to required. Set true to make the field skippable. */
  optional?: boolean;
  /** Max selections for multiselect. */
  max?: number;
}

export interface SchemaStep {
  id: string;
  title: Record<Lang, string>;
  subtitle?: Record<Lang, string>;
  fields: SchemaField[];
}

export interface RoleSchema {
  role: string;
  track: "game" | "concierge";
  /** Game roles that can be lifted into a concierge path on manual review. */
  conciergeLift?: boolean;
  /** Short label for the role's review path, shown to the applicant. */
  reviewPath: Record<Lang, string>;
  steps: SchemaStep[];
}

/* ----------------------------- shared options ---------------------------- */

const CATEGORIES: FieldOption[] = [
  { value: "painting", en: "Painting", ar: "الرسم" },
  { value: "sculpture", en: "Sculpture", ar: "النحت" },
  { value: "photography", en: "Photography", ar: "التصوير" },
  { value: "mixed_media", en: "Mixed media", ar: "وسائط مختلطة" },
  { value: "drawing", en: "Drawing", ar: "الرسم اليدوي" },
  { value: "printmaking", en: "Printmaking", ar: "الطباعة الفنية" },
  { value: "ceramics", en: "Ceramics", ar: "الخزف" },
  { value: "installation", en: "Installation", ar: "التجهيز الفني" },
  { value: "calligraphy", en: "Calligraphy", ar: "الخط" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const REGIONS: FieldOption[] = [
  { value: "gcc", en: "GCC", ar: "دول الخليج" },
  { value: "mena", en: "Wider MENA", ar: "الشرق الأوسط وشمال إفريقيا" },
  { value: "europe", en: "Europe", ar: "أوروبا" },
  { value: "north_america", en: "North America", ar: "أمريكا الشمالية" },
  { value: "asia_pacific", en: "Asia-Pacific", ar: "آسيا والمحيط الهادئ" },
  { value: "africa", en: "Africa", ar: "إفريقيا" },
  { value: "latin_america", en: "Latin America", ar: "أمريكا اللاتينية" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const PRICE_BANDS: FieldOption[] = [
  { value: "lt_1k", en: "Under $1,000", ar: "أقل من 1,000$" },
  { value: "1k_5k", en: "$1,000 – $5,000", ar: "1,000$ – 5,000$" },
  { value: "5k_20k", en: "$5,000 – $20,000", ar: "5,000$ – 20,000$" },
  { value: "20k_100k", en: "$20,000 – $100,000", ar: "20,000$ – 100,000$" },
  { value: "gt_100k", en: "$100,000+", ar: "أكثر من 100,000$" },
];

/* ------------------------------- schemas -------------------------------- */

export const ROLE_SCHEMAS: Record<string, RoleSchema> = {
  /* ------------------------------- ARTIST ------------------------------- */
  artist: {
    role: "artist",
    track: "game",
    conciergeLift: true,
    reviewPath: { en: "Auto + review", ar: "تلقائي + مراجعة" },
    steps: [
      {
        id: "practice",
        title: { en: "About your practice", ar: "عن ممارستك الفنية" },
        subtitle: {
          en: "Tell us where you work and what you make.",
          ar: "أخبرنا أين تعمل وما الذي تصنعه.",
        },
        fields: [
          {
            key: "location",
            type: "text",
            label: { en: "Location", ar: "الموقع" },
            placeholder: { en: "City, Country", ar: "المدينة، الدولة" },
          },
          {
            key: "medium",
            type: "multiselect",
            max: 4,
            label: { en: "Medium / category", ar: "الوسيط / الفئة" },
            help: { en: "Choose up to 4.", ar: "اختر حتى 4." },
            options: CATEGORIES,
          },
        ],
      },
      {
        id: "work",
        title: { en: "Your work", ar: "أعمالك" },
        subtitle: {
          en: "Share your portfolio and what you have available.",
          ar: "شارك معرض أعمالك وما هو متاح لديك.",
        },
        fields: [
          {
            key: "portfolio_link",
            type: "url",
            label: { en: "Portfolio link", ar: "رابط معرض الأعمال" },
            placeholder: { en: "https://…", ar: "https://…" },
          },
          {
            key: "social_links",
            type: "tags",
            optional: true,
            label: { en: "Social links", ar: "روابط التواصل" },
            placeholder: {
              en: "Instagram, website… (Enter to add)",
              ar: "إنستغرام، موقع… (Enter للإضافة)",
            },
          },
          {
            key: "works_available",
            type: "select",
            label: { en: "Works available", ar: "الأعمال المتاحة" },
            options: [
              { value: "1_5", en: "1 – 5", ar: "1 – 5" },
              { value: "6_20", en: "6 – 20", ar: "6 – 20" },
              { value: "21_50", en: "21 – 50", ar: "21 – 50" },
              { value: "gt_50", en: "50+", ar: "أكثر من 50" },
            ],
          },
          {
            key: "price_band",
            type: "select",
            label: { en: "Typical price band", ar: "نطاق السعر المعتاد" },
            options: PRICE_BANDS,
          },
        ],
      },
      {
        id: "authenticity",
        title: { en: "Authenticity & intent", ar: "الأصالة والنية" },
        subtitle: {
          en: "How your work can be verified — and whether you want to list.",
          ar: "كيف يمكن توثيق عملك — وهل ترغب في الإدراج.",
        },
        fields: [
          {
            key: "authenticatable",
            type: "multiselect",
            label: {
              en: "How are your works authenticatable?",
              ar: "كيف يمكن توثيق أعمالك؟",
            },
            options: [
              { value: "signed", en: "Signed", ar: "موقّعة" },
              { value: "editioned", en: "Editioned", ar: "بإصدارات مرقّمة" },
              { value: "certificate", en: "Certificate of authenticity", ar: "شهادة أصالة" },
              { value: "none_yet", en: "None yet", ar: "لا شيء بعد" },
            ],
          },
          {
            key: "intent_to_list",
            type: "radio",
            label: { en: "Intent to list on FANN", ar: "نية الإدراج على FANN" },
            options: [
              { value: "ready", en: "Yes — ready to list", ar: "نعم — جاهز للإدراج" },
              { value: "exploring", en: "Exploring", ar: "أستكشف" },
              { value: "not_yet", en: "Not yet", ar: "ليس بعد" },
            ],
          },
        ],
      },
    ],
  },

  /* ------------------------------- GALLERY ------------------------------ */
  gallery: {
    role: "gallery",
    track: "concierge",
    reviewPath: { en: "Concierge — manual approval", ar: "مخصّص — موافقة يدوية" },
    steps: [
      {
        id: "gallery",
        title: { en: "Your gallery", ar: "معرضك" },
        subtitle: {
          en: "The essentials so our team can place you.",
          ar: "الأساسيات حتى يتمكن فريقنا من تصنيفك.",
        },
        fields: [
          {
            key: "gallery_name",
            type: "text",
            label: { en: "Gallery name", ar: "اسم المعرض" },
          },
          {
            key: "location",
            type: "text",
            label: { en: "Location", ar: "الموقع" },
            placeholder: { en: "City, Country", ar: "المدينة، الدولة" },
          },
          {
            key: "website",
            type: "url",
            label: { en: "Website", ar: "الموقع الإلكتروني" },
            placeholder: { en: "https://…", ar: "https://…" },
          },
          {
            key: "socials",
            type: "tags",
            optional: true,
            label: { en: "Social channels", ar: "قنوات التواصل" },
            placeholder: { en: "Add handles (Enter)", ar: "أضف الحسابات (Enter)" },
          },
        ],
      },
      {
        id: "roster",
        title: { en: "Roster & inventory", ar: "القائمة والمخزون" },
        subtitle: {
          en: "Who you represent and what you hold.",
          ar: "من تمثّل وما الذي تملكه.",
        },
        fields: [
          {
            key: "represented_artist_count",
            type: "select",
            label: { en: "Represented artists", ar: "عدد الفنانين الممثَّلين" },
            options: [
              { value: "1_5", en: "1 – 5", ar: "1 – 5" },
              { value: "6_15", en: "6 – 15", ar: "6 – 15" },
              { value: "16_40", en: "16 – 40", ar: "16 – 40" },
              { value: "gt_40", en: "40+", ar: "أكثر من 40" },
            ],
          },
          {
            key: "categories",
            type: "multiselect",
            max: 5,
            label: { en: "Categories", ar: "الفئات" },
            options: CATEGORIES,
          },
          {
            key: "inventory_size",
            type: "select",
            label: { en: "Inventory size", ar: "حجم المخزون" },
            options: [
              { value: "lt_25", en: "Under 25 works", ar: "أقل من 25 عملاً" },
              { value: "25_100", en: "25 – 100 works", ar: "25 – 100 عمل" },
              { value: "100_500", en: "100 – 500 works", ar: "100 – 500 عمل" },
              { value: "gt_500", en: "500+ works", ar: "أكثر من 500 عمل" },
            ],
          },
        ],
      },
      {
        id: "partnership",
        title: { en: "Partnership", ar: "الشراكة" },
        subtitle: {
          en: "Your decision-maker and what you're looking for.",
          ar: "صاحب القرار لديك وما الذي تبحث عنه.",
        },
        fields: [
          {
            key: "decision_maker_name",
            type: "text",
            label: { en: "Decision-maker name", ar: "اسم صاحب القرار" },
          },
          {
            key: "decision_maker_role",
            type: "text",
            label: { en: "Their role", ar: "منصبه" },
            placeholder: { en: "Director, Owner…", ar: "مدير، مالك…" },
          },
          {
            key: "partnership_interest",
            type: "multiselect",
            label: { en: "Partnership interest", ar: "مجال الشراكة" },
            options: [
              { value: "list_inventory", en: "List inventory", ar: "إدراج المخزون" },
              { value: "consignment", en: "Consignment", ar: "بيع بالأمانة" },
              { value: "co_exhibitions", en: "Co-exhibitions", ar: "معارض مشتركة" },
              { value: "concierge_sales", en: "Concierge sales", ar: "مبيعات مخصّصة" },
              { value: "other", en: "Other", ar: "أخرى" },
            ],
          },
          {
            key: "meeting_request",
            type: "radio",
            label: { en: "Request a meeting?", ar: "طلب اجتماع؟" },
            options: [
              { value: "yes", en: "Yes, please", ar: "نعم، من فضلك" },
              { value: "not_yet", en: "Not yet", ar: "ليس بعد" },
            ],
          },
        ],
      },
    ],
  },

  /* ------------------------------ COLLECTOR ----------------------------- */
  collector: {
    role: "collector",
    track: "game",
    reviewPath: { en: "Auto + review", ar: "تلقائي + مراجعة" },
    steps: [
      {
        id: "interests",
        title: { en: "What you collect", ar: "ماذا تجمع" },
        subtitle: {
          en: "Help us tailor what you'll see.",
          ar: "ساعدنا في تخصيص ما ستراه.",
        },
        fields: [
          {
            key: "collecting_interests",
            type: "tags",
            label: { en: "Collecting interests", ar: "اهتمامات الجمع" },
            placeholder: {
              en: "Themes, movements, artists… (Enter)",
              ar: "مواضيع، حركات، فنانون… (Enter)",
            },
          },
          {
            key: "preferred_categories",
            type: "multiselect",
            max: 5,
            label: { en: "Preferred categories", ar: "الفئات المفضّلة" },
            options: CATEGORIES,
          },
        ],
      },
      {
        id: "buying",
        title: { en: "How you buy", ar: "كيف تشتري" },
        subtitle: {
          en: "Budget is optional — it just sharpens recommendations.",
          ar: "الميزانية اختيارية — تُحسّن التوصيات فقط.",
        },
        fields: [
          {
            key: "budget_band",
            type: "select",
            optional: true,
            label: { en: "Budget band (optional)", ar: "نطاق الميزانية (اختياري)" },
            options: PRICE_BANDS,
          },
          {
            key: "buying_motivation",
            type: "multiselect",
            label: { en: "Buying motivation", ar: "دافع الشراء" },
            options: [
              { value: "passion", en: "Passion / love of art", ar: "شغف / حب الفن" },
              { value: "investment", en: "Investment", ar: "استثمار" },
              { value: "interior", en: "Interior / design", ar: "ديكور / تصميم" },
              { value: "support_artists", en: "Supporting artists", ar: "دعم الفنانين" },
              { value: "other", en: "Other", ar: "أخرى" },
            ],
          },
        ],
      },
      {
        id: "trust",
        title: { en: "Trust & region", ar: "الثقة والمنطقة" },
        subtitle: {
          en: "Your biggest concern helps us build the right protections.",
          ar: "أكبر مخاوفك تساعدنا في بناء الحماية المناسبة.",
        },
        fields: [
          {
            key: "trust_concern",
            type: "select",
            label: {
              en: "Biggest trust concern when buying",
              ar: "أكبر مخاوف الثقة عند الشراء",
            },
            options: [
              { value: "authenticity", en: "Authenticity / forgery", ar: "الأصالة / التزوير" },
              { value: "provenance", en: "Provenance gaps", ar: "فجوات المصدر" },
              { value: "condition", en: "Condition", ar: "الحالة" },
              { value: "logistics", en: "Shipping / handling", ar: "الشحن / المناولة" },
              { value: "price", en: "Price fairness", ar: "عدالة السعر" },
              { value: "other", en: "Other", ar: "أخرى" },
            ],
          },
          {
            key: "region",
            type: "select",
            label: { en: "Region", ar: "المنطقة" },
            options: REGIONS,
          },
        ],
      },
    ],
  },

  /* ------------------------------- CURATOR ------------------------------ */
  curator: {
    role: "curator",
    track: "game",
    conciergeLift: true,
    reviewPath: { en: "Auto + review", ar: "تلقائي + مراجعة" },
    steps: [
      {
        id: "practice",
        title: { en: "Your practice", ar: "ممارستك" },
        subtitle: {
          en: "Your focus and background.",
          ar: "تركيزك وخلفيتك.",
        },
        fields: [
          {
            key: "curatorial_focus",
            type: "textarea",
            label: { en: "Curatorial focus", ar: "التركيز التنسيقي" },
            placeholder: {
              en: "Themes, periods, regions you curate around…",
              ar: "المواضيع والفترات والمناطق التي تنسّق حولها…",
            },
          },
          {
            key: "professional_background",
            type: "textarea",
            label: {
              en: "Professional background",
              ar: "الخلفية المهنية",
            },
            placeholder: {
              en: "Institutions, exhibitions, roles…",
              ar: "مؤسسات، معارض، أدوار…",
            },
          },
          {
            key: "portfolio_link",
            type: "url",
            optional: true,
            label: { en: "Portfolio / profile link", ar: "رابط الملف / السيرة" },
            placeholder: { en: "https://…", ar: "https://…" },
          },
        ],
      },
      {
        id: "network",
        title: { en: "Network & themes", ar: "الشبكة والمواضيع" },
        subtitle: {
          en: "Who you connect and what you're drawn to.",
          ar: "من تربط بينهم وما الذي يجذبك.",
        },
        fields: [
          {
            key: "network",
            type: "textarea",
            label: {
              en: "Artist & gallery network",
              ar: "شبكة الفنانين والمعارض",
            },
            placeholder: {
              en: "Artists and galleries you work with…",
              ar: "الفنانون والمعارض الذين تعمل معهم…",
            },
          },
          {
            key: "themes_of_interest",
            type: "tags",
            label: { en: "Themes of interest", ar: "المواضيع محل الاهتمام" },
            placeholder: { en: "Add themes (Enter)", ar: "أضف مواضيع (Enter)" },
          },
          {
            key: "region",
            type: "select",
            label: { en: "Region", ar: "المنطقة" },
            options: REGIONS,
          },
        ],
      },
    ],
  },

  /* ------------------------------- INVESTOR ----------------------------- */
  investor: {
    role: "investor",
    track: "concierge",
    reviewPath: { en: "Concierge — founders only", ar: "مخصّص — المؤسّسون فقط" },
    steps: [
      {
        id: "identity",
        title: { en: "Who you are", ar: "من أنت" },
        subtitle: {
          en: "Handled privately by the founding team.",
          ar: "يُدار بسرّية من قبل الفريق المؤسّس.",
        },
        fields: [
          {
            key: "investor_type",
            type: "select",
            label: { en: "Investor type", ar: "نوع المستثمر" },
            options: [
              { value: "angel", en: "Angel", ar: "مستثمر ملاك" },
              { value: "vc", en: "VC", ar: "رأس مال مخاطر" },
              { value: "family_office", en: "Family office", ar: "مكتب عائلي" },
              { value: "strategic", en: "Strategic", ar: "استراتيجي" },
              { value: "other", en: "Other", ar: "أخرى" },
            ],
          },
          {
            key: "fund_company",
            type: "text",
            label: { en: "Fund / company", ar: "الصندوق / الشركة" },
          },
          {
            key: "role_title",
            type: "text",
            label: { en: "Your role / title", ar: "دورك / منصبك" },
          },
          {
            key: "entity_type",
            type: "select",
            label: { en: "Entity type", ar: "نوع الكيان" },
            options: [
              { value: "individual", en: "Individual", ar: "فرد" },
              { value: "llc", en: "LLC", ar: "شركة ذات مسؤولية محدودة" },
              { value: "fund", en: "Fund", ar: "صندوق" },
              { value: "corporate", en: "Corporate", ar: "شركة" },
              { value: "other", en: "Other", ar: "أخرى" },
            ],
          },
          {
            key: "hq",
            type: "text",
            label: { en: "Headquarters", ar: "المقر الرئيسي" },
            placeholder: { en: "City, Country", ar: "المدينة، الدولة" },
          },
        ],
      },
      {
        id: "interest",
        title: { en: "Your interest", ar: "اهتمامك" },
        subtitle: {
          en: "Ticket, focus, and a short thesis.",
          ar: "حجم الاستثمار والتركيز وأطروحة موجزة.",
        },
        fields: [
          {
            key: "ticket_band",
            type: "select",
            label: { en: "Ticket band", ar: "نطاق الاستثمار" },
            options: [
              { value: "lt_25k", en: "Under $25k", ar: "أقل من 25 ألف$" },
              { value: "25k_100k", en: "$25k – $100k", ar: "25 – 100 ألف$" },
              { value: "100k_500k", en: "$100k – $500k", ar: "100 – 500 ألف$" },
              { value: "500k_2m", en: "$500k – $2M", ar: "500 ألف – 2 مليون$" },
              { value: "gt_2m", en: "$2M+", ar: "أكثر من 2 مليون$" },
            ],
          },
          {
            key: "strategic_interest",
            type: "textarea",
            label: { en: "Strategic interest", ar: "الاهتمام الاستراتيجي" },
            placeholder: {
              en: "Why FANN, and what you bring beyond capital…",
              ar: "لماذا FANN، وما الذي تقدّمه إلى جانب رأس المال…",
            },
          },
          {
            key: "thesis",
            type: "textarea",
            label: { en: "Short investment thesis", ar: "أطروحة استثمارية موجزة" },
            placeholder: {
              en: "Your view on the verified physical-art market…",
              ar: "رؤيتك لسوق الفن المادي الموثّق…",
            },
          },
        ],
      },
      {
        id: "contact",
        title: { en: "Contact", ar: "التواصل" },
        subtitle: {
          en: "How and whether you'd like to talk.",
          ar: "كيف وهل ترغب في التحدّث.",
        },
        fields: [
          {
            key: "contact_preference",
            type: "select",
            label: { en: "Contact preference", ar: "طريقة التواصل المفضّلة" },
            options: [
              { value: "email", en: "Email", ar: "البريد الإلكتروني" },
              { value: "call", en: "Call", ar: "مكالمة" },
              { value: "video", en: "Video", ar: "فيديو" },
              { value: "intro", en: "Intro via mutual", ar: "تعريف عبر طرف مشترك" },
            ],
          },
          {
            key: "briefing_request",
            type: "radio",
            label: { en: "Request a founder briefing?", ar: "طلب إحاطة من المؤسّسين؟" },
            options: [
              { value: "yes", en: "Yes, please", ar: "نعم، من فضلك" },
              { value: "not_yet", en: "Not yet", ar: "ليس بعد" },
            ],
          },
        ],
      },
    ],
  },

  /* ----------------------------- AMBASSADOR ----------------------------- */
  ambassador: {
    role: "ambassador",
    track: "game",
    reviewPath: { en: "Game + manual approval", ar: "لعبة + موافقة يدوية" },
    steps: [
      {
        id: "community",
        title: { en: "Your community", ar: "مجتمعك" },
        subtitle: {
          en: "Where your audience is and how big.",
          ar: "أين جمهورك وما حجمه.",
        },
        fields: [
          {
            key: "channel_type",
            type: "select",
            label: { en: "Community / channel type", ar: "نوع المجتمع / القناة" },
            options: [
              { value: "newsletter", en: "Newsletter", ar: "نشرة بريدية" },
              { value: "social", en: "Social following", ar: "متابعون على التواصل" },
              { value: "community", en: "Community / club", ar: "مجتمع / نادٍ" },
              { value: "podcast", en: "Podcast", ar: "بودكاست" },
              { value: "events", en: "Events", ar: "فعاليات" },
              { value: "other", en: "Other", ar: "أخرى" },
            ],
          },
          {
            key: "platform",
            type: "multiselect",
            label: { en: "Primary platforms", ar: "المنصّات الأساسية" },
            options: [
              { value: "instagram", en: "Instagram", ar: "إنستغرام" },
              { value: "tiktok", en: "TikTok", ar: "تيك توك" },
              { value: "youtube", en: "YouTube", ar: "يوتيوب" },
              { value: "x", en: "X / Twitter", ar: "إكس / تويتر" },
              { value: "linkedin", en: "LinkedIn", ar: "لينكدإن" },
              { value: "substack", en: "Substack", ar: "ساب ستاك" },
              { value: "messaging", en: "WhatsApp / Telegram", ar: "واتساب / تيليجرام" },
              { value: "other", en: "Other", ar: "أخرى" },
            ],
          },
          {
            key: "audience_size",
            type: "select",
            label: { en: "Audience size", ar: "حجم الجمهور" },
            options: [
              { value: "lt_1k", en: "Under 1k", ar: "أقل من 1000" },
              { value: "1k_10k", en: "1k – 10k", ar: "1000 – 10 آلاف" },
              { value: "10k_50k", en: "10k – 50k", ar: "10 – 50 ألف" },
              { value: "50k_250k", en: "50k – 250k", ar: "50 – 250 ألف" },
              { value: "gt_250k", en: "250k+", ar: "أكثر من 250 ألف" },
            ],
          },
        ],
      },
      {
        id: "reach",
        title: { en: "Your reach", ar: "نطاق تأثيرك" },
        subtitle: {
          en: "Who you can introduce — quality over volume.",
          ar: "من يمكنك تقديمهم — الجودة قبل الكمّ.",
        },
        fields: [
          {
            key: "region",
            type: "select",
            label: { en: "Region", ar: "المنطقة" },
            options: REGIONS,
          },
          {
            key: "referral_capability",
            type: "multiselect",
            label: { en: "Who can you introduce?", ar: "من يمكنك تقديمهم؟" },
            options: [
              { value: "artists", en: "Artists", ar: "فنانون" },
              { value: "collectors", en: "Collectors", ar: "جامعون" },
              { value: "galleries", en: "Galleries", ar: "معارض" },
              { value: "curators", en: "Curators", ar: "منسّقون" },
              { value: "cultural_partners", en: "Cultural partners", ar: "شركاء ثقافيون" },
            ],
          },
          {
            key: "content_outreach_ideas",
            type: "textarea",
            label: { en: "Content & outreach ideas", ar: "أفكار المحتوى والتواصل" },
            placeholder: {
              en: "How you'd introduce FANN to your community…",
              ar: "كيف ستقدّم FANN لمجتمعك…",
            },
          },
        ],
      },
    ],
  },
};

export const CONCIERGE_ROLES = Object.values(ROLE_SCHEMAS)
  .filter((s) => s.track === "concierge")
  .map((s) => s.role);

export function getRoleSchema(role: string | null | undefined): RoleSchema | null {
  if (!role) return null;
  return ROLE_SCHEMAS[role.toLowerCase()] ?? null;
}

export function isConciergeTrack(role: string | null | undefined): boolean {
  const s = getRoleSchema(role);
  return s?.track === "concierge";
}
