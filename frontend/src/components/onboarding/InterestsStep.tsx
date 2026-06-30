import { Button } from "@/components/ui/button";
import { useUserInterestsMutation } from "@/services/api/onboardingApi";
import {
  markStepAsSubmitted,
  selectIsStepSubmitted,
  selectSubmittedData,
} from "@/store/onboardingSlice";
import type { RootState } from "@/store/store";
import { extractErrorMessage } from "@/utils/errorMessages";
import {
  ArrowRight,
  Calendar,
  Check,
  ChevronLeft,
  DollarSign,
  Heart,
  MapPin,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Oval } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { OnboardingData } from "./OnboardingFlow";

interface InterestsStepProps {
  language: "en" | "ar";
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
  data: OnboardingData;
}

export function InterestsStep({
  language,
  onNext,
  onBack,
  data,
}: InterestsStepProps) {
  const dispatch = useDispatch();
  const isStepSubmitted = useSelector(
    (state: RootState) => selectIsStepSubmitted(state, 2) // Step 2 is InterestsStep
  );
  const submittedData = useSelector((state: RootState) =>
    selectSubmittedData(state, "interests")
  );

  // Load initial values from Redux
  const savedData = (data.interests || {}) as {
    art_style?: string[];
    geographic_interset?: string[];
    preferred_time_periods?: string[];
    price_interset?: string;
  };

  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    savedData.art_style || []
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    savedData.geographic_interset || []
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>(
    savedData.price_interset || ""
  );
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(
    savedData.preferred_time_periods || []
  );

  const [userInterests, { isLoading }] = useUserInterestsMutation();

  // Helper function to reverse map display string back to option value
  const reverseMapPriceRange = (displayString: string): string => {
    if (!displayString) return "";

    // Map of display strings (both EN and AR) to option values
    const reverseMap: Record<string, string> = {
      // English
      "Under $5,000": "under5k",
      "$5,000 - $20,000": "5k-20k",
      "$20,000 - $100,000": "20k-100k",
      "Above $100,000": "above100k",
      Flexible: "flexible",
      // Arabic
      "أقل من 5,000 دولار": "under5k",
      "5,000 - 20,000 دولار": "5k-20k",
      "20,000 - 100,000 دولار": "20k-100k",
      "أكثر من 100,000 دولار": "above100k",
      "مرن": "flexible",
    };

    // Check if it's already an option value
    const optionValues = ["under5k", "5k-20k", "20k-100k", "above100k", "flexible"];
    if (optionValues.includes(displayString)) {
      return displayString;
    }

    // Try to find in reverse map
    return reverseMap[displayString] || displayString;
  };

  // Restore state from saved data when component mounts or data changes
  useEffect(() => {
    const interestsData = (data.interests || {}) as {
      art_style?: string[];
      geographic_interset?: string[];
      preferred_time_periods?: string[];
      price_interset?: string;
    };
    setSelectedStyles(interestsData.art_style || []);
    setSelectedRegions(interestsData.geographic_interset || []);
    // Reverse map the price range from display string back to option value
    const savedPriceRange = interestsData.price_interset || "";
    setSelectedPriceRange(reverseMapPriceRange(savedPriceRange));
    setSelectedPeriods(interestsData.preferred_time_periods || []);
  }, [data.interests]);

  // Compare current selections with submitted data
  const hasChanges = () => {
    if (!isStepSubmitted || !submittedData) return true;

    const submitted = submittedData as {
      art_style?: string[];
      geographic_interset?: string[];
      preferred_time_periods?: string[];
      price_interset?: string;
    };

    // Compare arrays (order doesn't matter)
    const arraysEqual = (a: string[] = [], b: string[] = []) => {
      if (a.length !== b.length) return false;
      if (a.length === 0 && b.length === 0) return true;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, idx) => val === sortedB[idx]);
    };

    // Normalize price range for comparison
    // Convert submitted price_interset (display string) back to option value for comparison
    const submittedPriceRangeNormalized = reverseMapPriceRange(
      submitted.price_interset || ""
    );
    const currentPriceRangeNormalized = selectedPriceRange || "";

    return (
      !arraysEqual(selectedStyles, submitted.art_style) ||
      !arraysEqual(selectedRegions, submitted.geographic_interset) ||
      !arraysEqual(selectedPeriods, submitted.preferred_time_periods) ||
      currentPriceRangeNormalized !== submittedPriceRangeNormalized
    );
  };

  const shouldShowNext = isStepSubmitted && !hasChanges();

  const isRTL = language === "ar";

  const t = {
    en: {
      title: "Interest",
      subtitle: "Your choices shape your FANN journey",
      styles: {
        title: "Art Styles & Mediums",
        subtitle: "Select all that apply",
        options: [
          "Contemporary",
          "Abstract",
          "Traditional",
          "Digital Art",
          "Photography",
          "Sculpture",
          "Calligraphy",
          "Mixed Media",
          "Installation",
          "Street Art",
        ],
      },
      regions: {
        title: "Geographic Interest",
        subtitle: "Which regions are you most interested in?",
        options: [
          "UAE Artists",
          "Saudi Arabia",
          "Egypt",
          "Lebanon",
          "Gulf Region",
          "North Africa",
          "Middle East",
          "Global/International",
        ],
      },
      priceRange: {
        title: "Price Range Interest",
        subtitle: "What's your typical price range?",
        options: [
          { value: "under5k", label: "Under $5,000", desc: "Emerging artists" },
          {
            value: "5k-20k",
            label: "$5,000 - $20,000",
            desc: "Mid-career artists",
          },
          {
            value: "20k-100k",
            label: "$20,000 - $100,000",
            desc: "Established artists",
          },
          {
            value: "above100k",
            label: "Above $100,000",
            desc: "Blue-chip & investment",
          },
          { value: "flexible", label: "Flexible", desc: "Open to all ranges" },
        ],
      },
      periods: {
        title: "Preferred Time Periods",
        subtitle: "Which eras appeal to you?",
        options: [
          "Contemporary (2000s+)",
          "Modern (1960s-2000s)",
          "Mid-Century",
          "Historical/Classical",
          "All Periods",
        ],
      },
      tips: {
        title: "Pro Tip",
        message:
          "Select at least 3 preferences to get personalized recommendations",
      },
      back: "Back",
      continue: "Continue",
      next: "Next",
    },
    ar: {
      title: "الاهتمامات",
      subtitle: "خياراتك تشكل رحلتك في FANN",
      styles: {
        title: "الأساليب والوسائط الفنية",
        subtitle: "اختر كل ما ينطبق",
        options: [
          "معاصر",
          "تجريدي",
          "تقليدي",
          "فن رقمي",
          "تصوير فوتوغرافي",
          "نحت",
          "خط عربي",
          "وسائط مختلطة",
          "تركيب",
          "فن الشارع",
        ],
      },
      regions: {
        title: "الاهتمام الجغرافي",
        subtitle: "ما هي المناطق التي تهمك أكثر؟",
        options: [
          "فنانو الإمارات",
          "السعودية",
          "مصر",
          "لبنان",
          "منطقة الخليج",
          "شمال أفريقيا",
          "الشرق الأوسط",
          "عالمي/دولي",
        ],
      },
      priceRange: {
        title: "نطاق السعر المهتم به",
        subtitle: "ما هو نطاق السعر المعتاد الخاص بك؟",
        options: [
          {
            value: "under5k",
            label: "أقل من 5,000 دولار",
            desc: "فنانون ناشئون",
          },
          {
            value: "5k-20k",
            label: "5,000 - 20,000 دولار",
            desc: "فنانون في منتصف المسيرة",
          },
          {
            value: "20k-100k",
            label: "20,000 - 100,000 دولار",
            desc: "فنانون راسخون",
          },
          {
            value: "above100k",
            label: "أكثر من 100,000 دولار",
            desc: "استثمار ممتاز",
          },
          { value: "flexible", label: "مرن", desc: "مفتوح لجميع النطاقات" },
        ],
      },
      periods: {
        title: "الفترات الزمنية المفضلة",
        subtitle: "ما هي العصور التي تجذبك؟",
        options: [
          "معاصر (2000+)",
          "حديث (1960-2000)",
          "منتصف القرن",
          "تاريخي/كلاسيكي",
          "جميع الفترات",
        ],
      },
      tips: {
        title: "نصيحة احترافية",
        message: "اختر 3 تفضيلات على الأقل للحصول على توصيات مخصصة",
      },
      back: "رجوع",
      continue: "متابعة",
      next: "التالي",
    },
  };

  const content = t[language];

  const toggleSelection = (
    item: string,
    list: string[],
    setter: (list: string[]) => void
  ) => {
    if (list.includes(item)) {
      setter(list.filter((i) => i !== item));
    } else {
      setter([...list, item]);
    }
  };

  const handleSubmit = async () => {
    // If step was already submitted and no changes, just proceed without API call
    if (shouldShowNext) {
      const interestsData = {
        art_style: selectedStyles,
        geographic_interset: selectedRegions,
        preferred_time_periods: selectedPeriods,
        price_interset: selectedPriceRange || "",
      };
      onNext(interestsData);
      return;
    }

    // Validate at least some selections
    if (
      selectedStyles.length === 0 &&
      selectedRegions.length === 0 &&
      !selectedPriceRange &&
      selectedPeriods.length === 0
    ) {
      toast.error(
        language === "en"
          ? "Please select at least one interest"
          : "يرجى اختيار اهتمام واحد على الأقل"
      );
      return;
    }

    try {
      // Map price range values to API format
      const priceRangeMap: Record<string, string> = {
        under5k: language === "en" ? "Under $5,000" : "أقل من 5,000 دولار",
        "5k-20k":
          language === "en" ? "$5,000 - $20,000" : "5,000 - 20,000 دولار",
        "20k-100k":
          language === "en" ? "$20,000 - $100,000" : "20,000 - 100,000 دولار",
        above100k:
          language === "en" ? "Above $100,000" : "أكثر من 100,000 دولار",
        flexible: language === "en" ? "Flexible" : "مرن",
      };

      const interestsData = {
        art_style: selectedStyles,
        geographic_interset: selectedRegions,
        preferred_time_periods: selectedPeriods,
        price_interset: selectedPriceRange
          ? priceRangeMap[selectedPriceRange] || selectedPriceRange
          : "",
      };

      const result = await userInterests(interestsData).unwrap();

      // Handle API response
      const apiResponse = result as {
        success?: boolean;
        status_code?: number;
        message?: string | Record<string, unknown>;
        data?: unknown;
      };

      const isSuccess =
        apiResponse.success === true || apiResponse.status_code === 200;

      if (isSuccess) {
        // Extract success message
        let successMessage = "";
        if (apiResponse.message) {
          if (
            typeof apiResponse.message === "string" &&
            apiResponse.message.trim()
          ) {
            successMessage = apiResponse.message;
          } else if (
            typeof apiResponse.message === "object" &&
            apiResponse.message !== null &&
            Object.keys(apiResponse.message).length > 0
          ) {
            const messageObj = apiResponse.message as Record<string, unknown>;
            if (messageObj.message) {
              successMessage = String(messageObj.message);
            }
          }
        }

        if (!successMessage) {
          successMessage =
            language === "en"
              ? "Interests saved successfully!"
              : "تم حفظ الاهتمامات بنجاح!";
        }

        toast.success(successMessage);

        // Mark step as submitted in Redux
        dispatch(
          markStepAsSubmitted({
            stepIndex: 2, // InterestsStep is step 2
            stepKey: "interests",
            data: interestsData,
          })
        );

        onNext(interestsData);
      } else {
        const errorMessage =
          language === "en"
            ? "Failed to save interests. Please try again."
            : "فشل حفظ الاهتمامات. يرجى المحاولة مرة أخرى.";
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, language);
      console.error("Interests error:", errorMessage);
    }
  };

  const totalSelections =
    selectedStyles.length +
    selectedRegions.length +
    (selectedPriceRange ? 1 : 0) +
    selectedPeriods.length;

  return (
    <div className="glass border border-white/10 rounded-3xl p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Heart className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-3xl text-white mb-2">{content.title}</h2>
          <p className="text-[#B9BBC6]">{content.subtitle}</p>
        </motion.div>

        {/* Pro Tip */}
        {totalSelections < 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
          >
            <Heart className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-amber-400 text-sm mb-1">
                {content.tips.title}
              </p>
              <p className="text-[#B9BBC6] text-sm">{content.tips.message}</p>
            </div>
          </motion.div>
        )}

        <div className="space-y-10">
          {/* Art Styles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-4">
              <h3 className="text-xl text-white mb-1">
                {content.styles.title}
              </h3>
              <p className="text-[#B9BBC6] text-sm">{content.styles.subtitle}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {content.styles.options.map((style, index) => {
                const isSelected = selectedStyles.includes(style);
                return (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() =>
                      toggleSelection(style, selectedStyles, setSelectedStyles)
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border transition-all ${isSelected
                        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/50 text-white"
                        : "glass border-white/10 text-white/70 hover:border-amber-500/30"
                      } cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-black" />
                        </motion.div>
                      )}
                      <span className="text-sm text-center">{style}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Geographic Interest */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xl text-white">{content.regions.title}</h3>
                <p className="text-[#B9BBC6] text-sm">
                  {content.regions.subtitle}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {content.regions.options.map((region, index) => {
                const isSelected = selectedRegions.includes(region);
                return (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() =>
                      toggleSelection(
                        region,
                        selectedRegions,
                        setSelectedRegions
                      )
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border transition-all ${isSelected
                        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/50 text-white"
                        : "glass border-white/10 text-white/70 hover:border-amber-500/30"
                      } cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-black" />
                        </motion.div>
                      )}
                      <span className="text-sm text-center">{region}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Price Range */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xl text-white">
                  {content.priceRange.title}
                </h3>
                <p className="text-[#B9BBC6] text-sm">
                  {content.priceRange.subtitle}
                </p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {content.priceRange.options.map((option, index) => {
                const isSelected = selectedPriceRange === option.value;
                return (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() => setSelectedPriceRange(option.value)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className={`p-5 rounded-xl border transition-all text-left ${isSelected
                        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/50"
                        : "glass border-white/10 hover:border-amber-500/30"
                      } cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div
                        className={`${isSelected ? "text-white" : "text-white/70"
                          }`}
                      >
                        {option.label}
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-black" />
                        </motion.div>
                      )}
                    </div>
                    <p className="text-xs text-white/50">{option.desc}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Time Periods */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-xl text-white">{content.periods.title}</h3>
                <p className="text-[#B9BBC6] text-sm">
                  {content.periods.subtitle}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {content.periods.options.map((period, index) => {
                const isSelected = selectedPeriods.includes(period);
                return (
                  <motion.button
                    key={index}
                    type="button"
                    onClick={() =>
                      toggleSelection(
                        period,
                        selectedPeriods,
                        setSelectedPeriods
                      )
                    }
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isLoading}
                    className={`p-4 rounded-xl border transition-all ${isSelected
                        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/50 text-white"
                        : "glass border-white/10 text-white/70 hover:border-amber-500/30"
                      } cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center"
                        >
                          <Check className="w-3 h-3 text-black" />
                        </motion.div>
                      )}
                      <span className="text-sm text-center">{period}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 pt-8"
        >
          {onBack && (
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              disabled={isLoading}
              className="flex-1 h-12 disabled:opacity-50 disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft
                className={`w-5 h-5 mr-2 ${isRTL ? "rotate-180" : ""}`}
              />
              {content.back}
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || totalSelections < 1}
            className="flex-1 h-12 shadow-lg shadow-primary/50 group relative overflow-hidden disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Oval
                    height={20}
                    width={20}
                    color="#0B0B0D"
                    ariaLabel="loading"
                    visible={true}
                  />
                  {language === "en" ? "Saving..." : "جارٍ الحفظ..."}
                </>
              ) : (
                <>
                  {shouldShowNext ? content.next : content.continue}
                  <ArrowRight
                    className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180" : ""
                      }`}
                  />
                </>
              )}
            </span>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
