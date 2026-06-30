import { Button } from "@/components/ui/button";
import { useRewardsMutation } from "@/services/api/onboardingApi";
import {
  markStepAsSubmitted,
  selectIsStepSubmitted,
  selectSubmittedData,
} from "@/store/onboardingSlice";
import type { RootState } from "@/store/store";
import { extractErrorMessage } from "@/utils/errorMessages";
import {
  ArrowRight,
  ChevronLeft,
  Gift,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Oval } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { OnboardingData } from "./OnboardingFlow";

interface GamificationStepProps {
  language: "en" | "ar";
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
  data: OnboardingData;
}

export function GamificationStep({
  language,
  onNext,
  onBack,
  data,
}: GamificationStepProps) {
  const dispatch = useDispatch();
  const isStepSubmitted = useSelector(
    (state: RootState) => selectIsStepSubmitted(state, 4) // Step 4 is GamificationStep
  );
  const submittedData = useSelector((state: RootState) =>
    selectSubmittedData(state, "gamification")
  );

  // Load initial values from Redux
  const savedData = (data.gamification || {}) as {
    selectedGoals?: string[];
    selectedGoal?: string; // Legacy support
    goal_type?: string | string[];
    points_reward?: string | string[];
  };

  // Support both legacy single selection and new multi-select
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    savedData.selectedGoals || 
    (savedData.selectedGoal ? [savedData.selectedGoal] : [])
  );
  const [rewards, { isLoading }] = useRewardsMutation();

  // Restore state from saved data when component mounts or data changes
  useEffect(() => {
    const gamificationData = (data.gamification || {}) as {
      selectedGoals?: string[];
      selectedGoal?: string; // Legacy support
      goal_type?: string | string[];
      points_reward?: string | string[];
    };
    if (gamificationData.selectedGoals) {
      setSelectedGoals(gamificationData.selectedGoals);
    } else if (gamificationData.selectedGoal) {
      // Legacy: convert single selection to array
      setSelectedGoals([gamificationData.selectedGoal]);
    } else {
      setSelectedGoals([]);
    }
  }, [data.gamification]);

  // Compare current selection with submitted data
  const hasChanges = () => {
    if (!isStepSubmitted || !submittedData) return true;
    const submitted = submittedData as { 
      selectedGoals?: string[];
      selectedGoal?: string; // Legacy support
    };
    const submittedGoals = submitted.selectedGoals || 
      (submitted.selectedGoal ? [submitted.selectedGoal] : []);
    
    // Compare arrays
    if (selectedGoals.length !== submittedGoals.length) return true;
    return !selectedGoals.every(goal => submittedGoals.includes(goal));
  };

  const shouldShowNext = isStepSubmitted && !hasChanges();
  
  const MAX_SELECTIONS = 2;
  
  const handleGoalToggle = (goalId: string) => {
    if (isLoading) return;
    
    setSelectedGoals((prev) => {
      if (prev.includes(goalId)) {
        // Deselect
        return prev.filter((id) => id !== goalId);
      } else {
        // Select (max 2)
        if (prev.length >= MAX_SELECTIONS) {
          toast.error(
            language === "en"
              ? `You can select a maximum of ${MAX_SELECTIONS} goals`
              : `يمكنك اختيار حد أقصى ${MAX_SELECTIONS} أهداف`
          );
          return prev;
        }
        return [...prev, goalId];
      }
    });
  };

  const isRTL = language === "ar";

  const t = {
    en: {
      title: "Set Your First Goal",
      subtitle: "Tell us what you want to focus on — it shapes your founding path",
      goals: {
        title: "Choose Your Primary Goal",
        subtitle: "This will help us guide your experience",
        options: [
          {
            id: "networking",
            icon: Users,
            title: "Build Network",
            desc: "Connect with 50+ art professionals",
            goal_type: "Build network",
            points_reward: "500",
            color: "from-blue-500/20 to-cyan-500/20",
            borderColor: "blue-500/50",
          },
          {
            id: "collection",
            icon: Gift,
            title: "Start Collecting",
            desc: "Browse and collect 10 artworks",
            goal_type: "Start collecting",
            points_reward: "750",
            color: "from-amber-500/20 to-orange-500/20",
            borderColor: "amber-500/50",
          },
          {
            id: "showcase",
            icon: Sparkles,
            title: "Showcase Work",
            desc: "Upload and feature 20 artworks",
            goal_type: "Showcase work",
            points_reward: "600",
            color: "from-purple-500/20 to-pink-500/20",
            borderColor: "purple-500/50",
          },
          {
            id: "referral",
            icon: Trophy,
            title: "Grow Community",
            desc: "Invite 15 quality members",
            goal_type: "Grow community",
            points_reward: "1000",
            color: "from-yellow-500/20 to-amber-500/20",
            borderColor: "yellow-500/50",
          },
        ],
      },
      back: "Back",
      continue: "Start My Journey",
      next: "Next",
    },
    ar: {
      title: "حدد هدفك الأول",
      subtitle: "أخبرنا بما تريد التركيز عليه — فهذا يشكّل مسارك التأسيسي",
      goals: {
        title: "اختر هدفك الأساسي",
        subtitle: "سيساعدنا هذا في توجيه تجربتك",
        options: [
          {
            id: "networking",
            icon: Users,
            title: "بناء الشبكة",
            desc: "تواصل مع أكثر من 50 محترف فني",
            goal_type: "Build network",
            points_reward: "500",
            color: "from-blue-500/20 to-cyan-500/20",
            borderColor: "blue-500/50",
          },
          {
            id: "collection",
            icon: Gift,
            title: "ابدأ الجمع",
            desc: "تصفح واجمع 10 أعمال فنية",
            goal_type: "Start collecting",
            points_reward: "750",
            color: "from-amber-500/20 to-orange-500/20",
            borderColor: "amber-500/50",
          },
          {
            id: "showcase",
            icon: Sparkles,
            title: "اعرض الأعمال",
            desc: "حمّل واعرض 20 عملاً فنياً",
            goal_type: "Showcase work",
            points_reward: "600",
            color: "from-purple-500/20 to-pink-500/20",
            borderColor: "purple-500/50",
          },
          {
            id: "referral",
            icon: Trophy,
            title: "تنمية المجتمع",
            desc: "ادعُ 15 عضواً ذا جودة",
            goal_type: "Grow community",
            points_reward: "1000",
            color: "from-yellow-500/20 to-amber-500/20",
            borderColor: "yellow-500/50",
          },
        ],
      },
      back: "رجوع",
      continue: "ابدأ رحلتي",
      next: "التالي",
    },
  };

  const content = t[language];

  const handleSubmit = async () => {
    // If step was already submitted and no changes, just proceed without API call
    if (shouldShowNext) {
      const selectedGoalsData = content.goals.options.filter((goal) =>
        selectedGoals.includes(goal.id)
      );
      if (selectedGoalsData.length > 0) {
        onNext({
          selectedGoals,
          goal_type: selectedGoalsData.map((g) => g.goal_type),
          points_reward: selectedGoalsData.map((g) => g.points_reward),
        });
      }
      return;
    }

    if (selectedGoals.length === 0) {
      toast.error(
        language === "en" 
          ? "Please select at least one goal" 
          : "يرجى اختيار هدف واحد على الأقل"
      );
      return;
    }

    try {
      const selectedGoalsData = content.goals.options.filter((goal) =>
        selectedGoals.includes(goal.id)
      );

      if (selectedGoalsData.length === 0) {
        toast.error(
          language === "en" ? "Invalid goal selected" : "هدف غير صحيح"
        );
        return;
      }

      const rewardsData = {
        goal_type: selectedGoalsData.map((g) => g.goal_type),
        points_reward: selectedGoalsData.map((g) => g.points_reward),
      };

      const result = await rewards(rewardsData).unwrap();

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
              ? "Goal set successfully!"
              : "تم تعيين الهدف بنجاح!";
        }

        toast.success(successMessage);

        // Mark step as submitted in Redux
        const stepData = {
          selectedGoals,
          goal_type: selectedGoalsData.map((g) => g.goal_type),
          points_reward: selectedGoalsData.map((g) => g.points_reward),
        };

        dispatch(
          markStepAsSubmitted({
            stepIndex: 4, // GamificationStep is step 4
            stepKey: "gamification",
            data: stepData,
          })
        );

        onNext(stepData);
      } else {
        const errorMessage =
          language === "en"
            ? "Failed to set goal. Please try again."
            : "فشل تعيين الهدف. يرجى المحاولة مرة أخرى.";
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, language);
      console.error("Rewards error:", errorMessage);
    }
  };

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
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-3xl text-white mb-2">{content.title}</h2>
          <p className="text-[#B9BBC6]">{content.subtitle}</p>
        </motion.div>

        {/* Goals Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="mb-6 text-center">
            <h3 className="text-2xl text-white mb-2">{content.goals.title}</h3>
            <p className="text-[#B9BBC6]">{content.goals.subtitle}</p>
          </div>

          <div className="mb-4 text-center">
            <p className="text-[#B9BBC6] text-sm">
              {language === "en"
                ? `Select up to ${MAX_SELECTIONS} goals (${selectedGoals.length}/${MAX_SELECTIONS} selected)`
                : `اختر حتى ${MAX_SELECTIONS} أهداف (${selectedGoals.length}/${MAX_SELECTIONS} محدد)`}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {content.goals.options.map((goal, index) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.id);
              const isDisabled = !isSelected && selectedGoals.length >= MAX_SELECTIONS;

              return (
                <motion.button
                  key={goal.id}
                  type="button"
                  onClick={() => handleGoalToggle(goal.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={!isDisabled ? { scale: 1.02 } : {}}
                  whileTap={!isDisabled ? { scale: 0.98 } : {}}
                  disabled={isLoading || isDisabled}
                  className={`p-6 rounded-xl border transition-all text-left relative ${
                    isSelected
                      ? `bg-gradient-to-br ${goal.color} border-${goal.borderColor}`
                      : isDisabled
                      ? "glass border-white/5 opacity-50"
                      : "glass border-white/10 hover:border-amber-500/30"
                  } disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center">
                      <span className="text-xs font-bold text-black">
                        {selectedGoals.indexOf(goal.id) + 1}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${goal.color} border border-${goal.borderColor} flex items-center justify-center shrink-0`}
                    >
                      <Icon
                        className={`w-7 h-7 ${
                          isSelected ? "text-amber-400" : "text-white/70"
                        }`}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4
                          className={`text-lg ${
                            isSelected ? "text-white" : "text-white/80"
                          }`}
                        >
                          {goal.title}
                        </h4>
                      </div>
                      <p className="text-[#B9BBC6] text-sm mb-3">{goal.desc}</p>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-2 text-amber-400 text-sm"
                        >
                          <Target className="w-4 h-4" />
                          <span>
                            {language === "en"
                              ? "Selected Goal"
                              : "الهدف المحدد"}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex gap-4"
        >
          {onBack && (
            <Button
              type="button"
              onClick={onBack}
              variant="outline"
              disabled={isLoading}
              className="flex-1 h-12 disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer"
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
            disabled={isLoading || selectedGoals.length === 0}
            className="flex-1 h-12 shadow-lg shadow-primary/50 group relative overflow-hidden disabled:bg-disabled disabled:cursor-not-allowed"
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
                  {language === "en"
                    ? "Setting goal..."
                    : "جارٍ تعيين الهدف..."}
                </>
              ) : (
                <>
                  {shouldShowNext ? content.next : content.continue}
                  <ArrowRight
                    className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${
                      isRTL ? "rotate-180" : ""
                    }`}
                  />
                </>
              )}
            </span>
          </Button>
        </motion.div>

        {/* Skip Button */}
        {/* Skip Button removed */}
      </div>
    </div>
  );
}
