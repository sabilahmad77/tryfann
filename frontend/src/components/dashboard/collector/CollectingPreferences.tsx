// P1-6 / Item K — collector preference profiling surfaced in the UI.
// Persists to IntersetReward via the existing /market_final/user_interest
// endpoint, so a complete set earns a queue boost and flows into the admin
// segmentation endpoint. Six dimensions: styles, mediums, price band, display
// spaces, time periods, buying frequency. EN + AR, RTL-aware, 44px targets.
import { useLanguage } from "@/contexts/useLanguage";
import { useUserInterestsMutation } from "@/services/api/onboardingApi";
import { extractErrorMessage } from "@/utils/errorMessages";
import { Check, Loader2, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

// Stable option VALUES (sent to the server, so segmentation buckets are
// consistent) paired with EN/AR labels for display.
const OPTIONS = {
  styles: [
    { v: "contemporary", en: "Contemporary", ar: "معاصر" },
    { v: "abstract", en: "Abstract", ar: "تجريدي" },
    { v: "traditional", en: "Traditional", ar: "تقليدي" },
    { v: "calligraphy", en: "Calligraphy", ar: "خط عربي" },
    { v: "photography", en: "Photography", ar: "تصوير" },
    { v: "street_art", en: "Street Art", ar: "فن الشارع" },
  ],
  mediums: [
    { v: "painting", en: "Painting", ar: "رسم" },
    { v: "sculpture", en: "Sculpture", ar: "نحت" },
    { v: "print", en: "Print", ar: "طباعة" },
    { v: "drawing", en: "Drawing", ar: "رسم يدوي" },
    { v: "textile", en: "Textile", ar: "نسيج" },
    { v: "ceramic", en: "Ceramic", ar: "خزف" },
    { v: "mixed_media", en: "Mixed Media", ar: "وسائط مختلطة" },
  ],
  spaces: [
    { v: "home", en: "Home", ar: "المنزل" },
    { v: "office", en: "Office", ar: "المكتب" },
    { v: "gallery", en: "Gallery", ar: "معرض" },
    { v: "private_collection", en: "Private collection", ar: "مجموعة خاصة" },
    { v: "public_space", en: "Public space", ar: "مساحة عامة" },
  ],
  periods: [
    { v: "contemporary_2000s", en: "Contemporary (2000s+)", ar: "معاصر (2000+)" },
    { v: "modern", en: "Modern (1960s-2000s)", ar: "حديث (1960-2000)" },
    { v: "mid_century", en: "Mid-Century", ar: "منتصف القرن" },
    { v: "historical", en: "Historical", ar: "تاريخي" },
    { v: "all_periods", en: "All periods", ar: "جميع الفترات" },
  ],
  price: [
    { v: "under5k", en: "Under $5,000", ar: "أقل من 5,000" },
    { v: "5k-20k", en: "$5,000 - $20,000", ar: "5,000 - 20,000" },
    { v: "20k-100k", en: "$20,000 - $100,000", ar: "20,000 - 100,000" },
    { v: "above100k", en: "Above $100,000", ar: "أكثر من 100,000" },
    { v: "flexible", en: "Flexible", ar: "مرن" },
  ],
  frequency: [
    { v: "first_time", en: "First-time", ar: "لأول مرة" },
    { v: "occasional", en: "Occasional", ar: "أحياناً" },
    { v: "regular", en: "Regular", ar: "بانتظام" },
    { v: "avid", en: "Avid", ar: "شغوف" },
  ],
} as const;

const content = {
  en: {
    title: "Collecting Preferences",
    subtitle:
      "Tell us what you collect. A complete profile boosts your queue standing and helps our concierge match you.",
    styles: "Styles",
    mediums: "Mediums",
    price: "Price band",
    spaces: "Where you display",
    periods: "Time periods",
    frequency: "Buying frequency",
    save: "Save preferences",
    saving: "Saving…",
    saved: "Saved",
    needPrice: "Please choose a price band.",
    success: "Preferences saved.",
  },
  ar: {
    title: "تفضيلات الجمع",
    subtitle:
      "أخبرنا بما تجمعه. الملف المكتمل يعزّز ترتيبك في قائمة الانتظار ويساعد مستشارنا على مطابقتك.",
    styles: "الأساليب",
    mediums: "الوسائط",
    price: "نطاق السعر",
    spaces: "أين تعرض",
    periods: "الفترات الزمنية",
    frequency: "معدل الشراء",
    save: "حفظ التفضيلات",
    saving: "جارٍ الحفظ…",
    saved: "تم الحفظ",
    needPrice: "يرجى اختيار نطاق السعر.",
    success: "تم حفظ التفضيلات.",
  },
};

type Opt = { v: string; en: string; ar: string };

export function CollectingPreferences() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  const [styles, setStyles] = useState<string[]>([]);
  const [mediums, setMediums] = useState<string[]>([]);
  const [spaces, setSpaces] = useState<string[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [price, setPrice] = useState<string>("");
  const [frequency, setFrequency] = useState<string>("");
  const [saved, setSaved] = useState(false);

  const [userInterests, { isLoading }] = useUserInterestsMutation();

  const toggle = (v: string, list: string[], set: (l: string[]) => void) =>
    set(list.includes(v) ? list.filter((i) => i !== v) : [...list, v]);

  const label = (o: Opt) => (language === "ar" ? o.ar : o.en);

  const handleSave = async () => {
    if (!price) {
      toast.error(t.needPrice);
      return;
    }
    try {
      await userInterests({
        art_style: styles,
        geographic_interset: [],
        preferred_time_periods: periods,
        price_interset: price,
        mediums,
        preferred_spaces: spaces,
        buying_frequency: frequency,
      }).unwrap();
      toast.success(t.success);
      setSaved(true);
    } catch (err) {
      toast.error(extractErrorMessage(err, language));
    }
  };

  const Chips = ({
    opts,
    selected,
    onToggle,
    single,
  }: {
    opts: readonly Opt[];
    selected: string[] | string;
    onToggle: (v: string) => void;
    single?: boolean;
  }) => (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => {
        const isSel = single ? selected === o.v : (selected as string[]).includes(o.v);
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onToggle(o.v)}
            disabled={isLoading}
            className={`fann-focus inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition ${
              isSel
                ? "border-amber-500/50 bg-amber-500/15 text-amber-200"
                : "border-white/10 bg-white/5 text-white/70 hover:border-amber-500/30"
            } cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {isSel && <Check className="h-3.5 w-3.5" />}
            {label(o)}
          </button>
        );
      })}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      dir={isRTL ? "rtl" : "ltr"}
      className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <div className="flex items-center gap-2 text-amber-400">
        <SlidersHorizontal className="h-5 w-5" />
        <h3 className="text-lg text-white">{t.title}</h3>
      </div>
      <p className="mt-1 mb-5 text-sm text-white/60">{t.subtitle}</p>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">{t.styles}</p>
          <Chips opts={OPTIONS.styles} selected={styles} onToggle={(v) => toggle(v, styles, setStyles)} />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">{t.mediums}</p>
          <Chips opts={OPTIONS.mediums} selected={mediums} onToggle={(v) => toggle(v, mediums, setMediums)} />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">{t.price}</p>
          <Chips opts={OPTIONS.price} selected={price} single onToggle={(v) => setPrice(v)} />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">{t.spaces}</p>
          <Chips opts={OPTIONS.spaces} selected={spaces} onToggle={(v) => toggle(v, spaces, setSpaces)} />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">{t.periods}</p>
          <Chips opts={OPTIONS.periods} selected={periods} onToggle={(v) => toggle(v, periods, setPeriods)} />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-white/40">{t.frequency}</p>
          <Chips opts={OPTIONS.frequency} selected={frequency} single onToggle={(v) => setFrequency(v)} />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isLoading}
        className="fann-focus mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-2.5 text-sm font-medium text-[#0B0B0D] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t.saving}
          </>
        ) : saved ? (
          <>
            <Check className="h-4 w-4" />
            {t.saved}
          </>
        ) : (
          t.save
        )}
      </button>
    </motion.div>
  );
}
