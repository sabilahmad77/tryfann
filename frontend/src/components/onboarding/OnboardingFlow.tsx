import {
  initializeOnboarding,
  selectCurrentStep,
  selectOnboardingData,
  setCurrentStep,
  updateStepData,
} from "@/store/onboardingSlice";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CompletionStep } from "./CompletionStep";
import { GamificationStep } from "./GamificationStep";
import { KYCStep } from "./KYCStep";
import { RoleApplicationStep } from "./RoleApplicationStep";
import { WelcomeStep } from "./WelcomeStep";
import { isConciergeTrack } from "@/config/roleApplicationSchema";

interface OnboardingFlowProps {
  language: "en" | "ar";
  selectedPersona: string;
  onComplete: () => void;
}

export interface OnboardingData {
  persona: string;
  personaDetails: Record<string, unknown>;
  interests: Record<string, unknown>;
  kyc: Record<string, unknown>;
  gamification: Record<string, unknown>;
}

export function OnboardingFlow({
  language,
  selectedPersona,
  onComplete,
}: OnboardingFlowProps) {
  const dispatch = useDispatch();
  const currentStep = useSelector(selectCurrentStep);
  const onboardingData = useSelector(selectOnboardingData);

  // Initialize onboarding with persona if not already set
  useEffect(() => {
    if (!onboardingData.persona || onboardingData.persona !== selectedPersona) {
      dispatch(initializeOnboarding({ persona: selectedPersona }));
    }
  }, [selectedPersona, onboardingData.persona, dispatch]);

  const isRTL = language === "ar";
  // Gallery + Investor follow the CONCIERGE track: a short professional
  // application routed to the team. No points, missions, or readiness UI —
  // ever. Game roles get the engagement layer after their application.
  const isConcierge = isConciergeTrack(selectedPersona);

  const t = {
    en: {
      steps: isConcierge
        ? ["Welcome", "Application", "Submitted"]
        : ["Welcome", "Application", "Verification", "Rewards", "Complete"],
      stepOf: "Step {current} of {total}",
    },
    ar: {
      steps: isConcierge
        ? ["مرحباً", "الطلب", "تم الإرسال"]
        : ["مرحباً", "الطلب", "التحقق", "المكافآت", "اكتمال"],
      stepOf: "الخطوة {current} من {total}",
    },
  };

  const content = t[language];

  // Role drives the form schema + track. RoleApplicationStep renders the
  // exact per-role fields from the schema (Typeform-style, multi-group).
  // - concierge (gallery/investor): application → submitted (zero game UI)
  // - game (artist/collector/curator/ambassador): application → verification
  //   → rewards → complete (the engagement layer)
  const steps = isConcierge
    ? [
        { component: WelcomeStep, key: "welcome" },
        { component: RoleApplicationStep, key: "personaDetails" },
        { component: CompletionStep, key: "completion" },
      ]
    : [
        { component: WelcomeStep, key: "welcome" },
        { component: RoleApplicationStep, key: "personaDetails" },
        { component: KYCStep, key: "kyc" },
        { component: GamificationStep, key: "gamification" },
        { component: CompletionStep, key: "completion" },
      ];

  const handleNext = (stepData: Record<string, unknown>) => {
    // Persist meaningful step data to Redux; welcome/completion carry none.
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
      className="fann-landing min-h-screen relative overflow-hidden"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Backdrop — one quiet gold wash, gallery-wall restraint */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "var(--gold-soft)" }}
        />
      </div>

      <div className="relative z-10 min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Stepper Header - Hide on WelcomeStep (step 0) */}
          {currentStep !== 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              {/* Track eyebrow + progress text */}
              <div className="text-center mb-6">
                <p className="fann-eyebrow mb-2" style={{ color: "var(--gold)" }}>
                  {isConcierge
                    ? (isRTL ? "طلب التأسيس — مراجعة مخصّصة" : "Founding application — concierge review")
                    : (isRTL ? "إعداد عضوية التأسيس" : "Founding onboarding")}
                </p>
                <p className="text-sm" style={{ color: "var(--bone-2)" }}>
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
                              ? "rgb(197, 155, 72)"
                              : isCurrent
                                ? "rgb(214, 174, 90)"
                                : "rgba(255, 255, 255, 0.06)",
                          }}
                          className="w-12 h-12 rounded-full flex items-center justify-center relative z-10"
                          style={{
                            border: `2px solid ${isCompleted || isCurrent ? "var(--gold)" : "var(--hairline)"}`,
                          }}
                        >
                          {isCompleted ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring" }}
                            >
                              <Check className="w-6 h-6" style={{ color: "var(--ink-void)" }} />
                            </motion.div>
                          ) : (
                            <span
                              className="text-sm fann-tnum"
                              style={{ color: isCurrent ? "var(--ink-void)" : "var(--bone-3)" }}
                            >
                              {index + 1}
                            </span>
                          )}
                        </motion.div>

                        {/* Step Label */}
                        <p
                          className="text-xs mt-2 text-center absolute top-14 whitespace-nowrap"
                          style={{ color: isCurrent ? "var(--gold)" : "var(--bone-3)" }}
                        >
                          {step}
                        </p>
                      </div>

                      {/* Connector Line */}
                      {index < content.steps.length - 1 && (
                        <div className="flex-1 h-px mx-2 relative -mt-6">
                          <div className="absolute inset-0" style={{ background: "var(--hairline)" }} />
                          <motion.div
                            className="absolute inset-0"
                            style={{
                              background: "var(--gold)",
                              transformOrigin: isRTL ? "right" : "left",
                            }}
                            initial={{ scaleX: 0 }}
                            animate={{
                              scaleX: isCompleted ? 1 : 0,
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
          )}

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
