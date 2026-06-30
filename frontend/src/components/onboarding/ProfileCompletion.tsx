import {
  initializeOnboarding,
  selectCurrentStep,
  selectOnboardingData,
  setCurrentStep,
  updateStepData,
} from "@/store/onboardingSlice";
import { ArrowLeft, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CompletionStep } from "./CompletionStep";
import { GamificationStep } from "./GamificationStep";
import { KYCStep } from "./KYCStep";
import { RoleApplicationStep } from "./RoleApplicationStep";
import { isConciergeTrack } from "@/config/roleApplicationSchema";

interface ProfileCompletionProps {
  language: "en" | "ar";
  selectedPersona: string;
  onComplete: () => void;
  onCancel?: () => void;
  initialStep?: number; // Optional initial step based on profile_step
}

export function ProfileCompletion({
  language,
  selectedPersona,
  onComplete,
  onCancel,
  initialStep,
}: ProfileCompletionProps) {
  const dispatch = useDispatch();
  const currentStep = useSelector(selectCurrentStep);
  const onboardingData = useSelector(selectOnboardingData);

  // Initialize onboarding with persona and set initial step
  useEffect(() => {
    if (!onboardingData.persona || onboardingData.persona !== selectedPersona) {
      dispatch(initializeOnboarding({ persona: selectedPersona }));
    }
    // Use initialStep if provided (based on profile_step), otherwise start at step 0
    // This only affects where user starts when ProfileCompletion first loads
    // All existing Next/Back navigation logic remains unchanged
    const startingStep = initialStep !== undefined ? initialStep : 0;
    dispatch(setCurrentStep(startingStep));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount to initialize

  const isRTL = language === "ar";
  // Concierge roles (gallery/investor) never see the game layer here either.
  const isConcierge = isConciergeTrack(selectedPersona);

  const t = {
    en: {
      steps: isConcierge
        ? ["Application", "Submitted"]
        : ["Application", "Verification", "Rewards", "Complete"],
      stepOf: "Step {current} of {total}",
      backToDashboard: "Back to Dashboard",
    },
    ar: {
      steps: isConcierge
        ? ["الطلب", "تم الإرسال"]
        : ["الطلب", "التحقق", "المكافآت", "اكتمال"],
      stepOf: "الخطوة {current} من {total}",
      backToDashboard: "العودة إلى لوحة التحكم",
    },
  };

  const content = t[language];

  // Schema-driven role application drives the fields. Concierge gets a short
  // application → submitted; game roles continue into the engagement layer.
  const steps = isConcierge
    ? [
        { component: RoleApplicationStep, key: "personaDetails" },
        { component: CompletionStep, key: "completion" },
      ]
    : [
        { component: RoleApplicationStep, key: "personaDetails" },
        { component: KYCStep, key: "kyc" },
        { component: GamificationStep, key: "gamification" },
        { component: CompletionStep, key: "completion" },
      ];

  const handleNext = (stepData: Record<string, unknown>) => {
    const stepKey = steps[currentStep].key;
    if (
      stepKey === "personaDetails" ||
      stepKey === "kyc" ||
      stepKey === "gamification"
    ) {
      dispatch(
        updateStepData({
          stepKey: stepKey as "personaDetails" | "kyc" | "gamification",
          data: stepData,
        })
      );
    }

    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      dispatch(setCurrentStep(currentStep + 1));
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      dispatch(setCurrentStep(currentStep - 1));
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div
      className="min-h-screen bg-[#0B0B0D] relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(251,191,36,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(251,191,36,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Back to Dashboard Button */}
      {onCancel && (
        <motion.button
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onCancel}
          className={`fixed top-6 ${isRTL ? "right-6" : "left-6"} z-50 flex items-center gap-2 px-4 py-2 bg-[#191922]/80 backdrop-blur-sm border border-amber-500/30 rounded-xl text-white hover:bg-[#191922] hover:border-amber-500/50 transition-all duration-200 group cursor-pointer`}
        >
          {isRTL ? (
            <>
              <span className="text-sm">{content.backToDashboard}</span>
              <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-180" />
            </>
          ) : (
            <>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">{content.backToDashboard}</span>
            </>
          )}
        </motion.button>
      )}

      <div className="relative z-10 min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Stepper Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            {/* Progress Text */}
            <div className="text-center mb-6">
              <p className="text-[#B9BBC6] text-sm">
                {content.stepOf
                  .replace("{current}", (currentStep + 1).toString())
                  .replace("{total}", steps.length.toString())}
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {content.steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                  <div key={index} className="flex items-center flex-1">
                    <div className="flex flex-col items-center relative">
                      {/* Step Circle */}
                      <motion.div
                        animate={{
                          scale: isCurrent ? 1.1 : 1,
                          backgroundColor: isCompleted
                            ? "rgb(245, 158, 11)"
                            : isCurrent
                              ? "rgb(251, 191, 36)"
                              : "rgba(255, 255, 255, 0.1)",
                        }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isCompleted || isCurrent
                          ? "border-amber-500"
                          : "border-white/20"
                          } relative z-10 bg-[#0B0B0D]`}
                      >
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring" }}
                          >
                            <Check className="w-6 h-6 text-black" />
                          </motion.div>
                        ) : (
                          <span
                            className={`text-sm ${isCurrent ? "text-black" : "text-[#B9BBC6]"
                              }`}
                          >
                            {index + 1}
                          </span>
                        )}

                        {/* Glow Effect for Current Step */}
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 rounded-full bg-amber-500/30 blur-xl"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </motion.div>

                      {/* Step Label */}
                      <p
                        className={`text-xs mt-2 text-center absolute top-14 whitespace-nowrap ${isCurrent ? "text-amber-400" : "text-[#B9BBC6]"
                          }`}
                      >
                        {step}
                      </p>
                    </div>

                    {/* Connector Line */}
                    {index < content.steps.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 relative -mt-6">
                        <div className="absolute inset-0 bg-white/10" />
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-amber-500 to-yellow-500"
                          initial={{ scaleX: 0 }}
                          animate={{
                            scaleX: isCompleted ? 1 : 0,
                          }}
                          style={{
                            transformOrigin: isRTL ? "right" : "left",
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: isRTL ? -50 : 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRTL ? 50 : -50 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                language={language}
                onNext={handleNext}
                onBack={currentStep > 0 ? handleBack : undefined}
                data={onboardingData}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

