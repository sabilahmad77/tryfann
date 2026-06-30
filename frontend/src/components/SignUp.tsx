import { useSignUpMutation } from "@/services/api/authApi";
import { useTrackEventMutation } from "@/services/api/qualificationApi";
import { useGetRegionsQuery } from "@/services/api/regionApi";
import { getSessionId } from "@/utils/analytics";
import { setTokens, type UserProfileData } from "@/store/authSlice";
import { persistor } from "@/store/store";
import { clearAllAuthState } from "@/utils/auth";
import { extractErrorMessage } from "@/utils/errorMessages";
import {
  ArrowRight,
  Award,
  Building2,
  Check,
  ChevronLeft,
  Gem,
  Gift,
  Lock,
  Mail,
  MapPin,
  Palette,
  Shield,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Zap,
  Globe,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Oval } from "react-loader-spinner";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import {
  InputField,
  PasswordField,
  SelectField,
} from "./ui/custom-form-elements";
import { Label } from "./ui/label";
import { AmbassadorVerificationModal } from "./auth/AmbassadorVerificationModal";
import { EmailVerificationModal } from "./auth/EmailVerificationModal";

interface SignUpProps {
  language: "en" | "ar";
  onNavigateToSignIn: () => void;
  onNavigateToHome: () => void;
  onSignUpComplete: (persona: string) => void;
  initialPersona?: string;
  initialReferralCode?: string;
}

interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  region: string;
  referralCode: string;
}

export function SignUp({
  language,
  onNavigateToSignIn,
  onNavigateToHome,
  onSignUpComplete,
  initialPersona,
  initialReferralCode,
}: SignUpProps) {
  const dispatch = useDispatch();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(
    initialPersona || null
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showAmbassadorVerificationModal, setShowAmbassadorVerificationModal] =
    useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);

  // Auto-select persona and move to step 2 if initialPersona is provided
  useEffect(() => {
    if (initialPersona) {
      setSelectedPersona(initialPersona);
      setStep(2);
    }
  }, [initialPersona]);

  const [trackEvent] = useTrackEventMutation();

  // React Hook Form setup
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignUpFormData>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      region: "",
      referralCode: initialReferralCode || "",
    },
  });

  // Set referral code when initialReferralCode changes
  useEffect(() => {
    if (initialReferralCode) {
      setValue("referralCode", initialReferralCode.toUpperCase());
    }
  }, [initialReferralCode, setValue]);

  // API hooks
  const [signUp, { isLoading }] = useSignUpMutation();
  const { data: regionsData } = useGetRegionsQuery();

  // Watch password and confirmPassword for real-time matching validation
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Check if passwords match (only when both have values)
  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;
  const passwordsMismatch =
    password && confirmPassword && password !== confirmPassword;

  const t = {
    en: {
      title: "Join FANN",
      subtitle: "Create your account",
      step1Title: "Select Your Role",
      step1Subtitle:
        "Choose the path that best describes you in the art ecosystem",
      step2Title: "Account Information",
      step2Subtitle: "Enter your details to create your account",
      fullName: "Full Name",
      fullNamePlaceholder: "Enter your full name",
      email: "Email Address",
      emailPlaceholder: "your.email@example.com",
      password: "Password",
      passwordPlaceholder: "Create a strong password",
      confirmPassword: "Confirm Password",
      confirmPasswordPlaceholder: "Re-enter your password",
      region: "Region",
      regionPlaceholder: "Select your region",
      referral: "Referral Code",
      referralOptional: "(Optional)",
      referralPlaceholder: "Enter code",
      terms: "I agree to the Terms & Conditions and Privacy Policy",
      kyc: "KYC verification will be required for full platform access",
      signUpButton: "Create Account",
      signingUp: "Creating account...",
      haveAccount: "Already have an account?",
      signIn: "Sign In",
      back: "Back",
      backToHome: "Back to Home",
      continue: "Continue",
      step: "Step",
      of: "of",
      personas: {
        artist: {
          name: "Artist",
          desc: "Showcase and monetize your artwork",
          points: "+500 pts",
        },
        gallery: {
          name: "Gallery / Museum",
          desc: "Bring your roster to a provenance-first market",
          concierge: true,
        },
        collector: {
          name: "Collector",
          desc: "Discover and acquire authenticated art",
        },
        curator: {
          name: "Curator / Critic",
          desc: "Shape collections and vouch for authenticity",
        },
        investor: {
          name: "Investor / Patron",
          desc: "Back the founding cohort of a verified market",
          concierge: true,
        },
        ambassador: {
          name: "Ambassador",
          desc: "Introduce the artists and collectors you trust",
        },
      },
      leftPanel: {
        welcomeTitle: "Welcome to the Future of Art",
        welcomeDesc:
          "Join a verified community where authenticated fine art meets digital innovation.",
        features: [
          {
            icon: Shield,
            title: "Verified & Secure",
            desc: "KYC-verified community with certified authentication",
          },
          {
            icon: Zap,
            title: "Provenance-First",
            desc: "Verifiable certificates and a clear chain of custody on every work",
          },
          {
            icon: Globe,
            title: "Global Network",
            desc: "Connect with artists, galleries, and collectors worldwide",
          },
          {
            icon: Award,
            title: "Early Access",
            desc: "Be among the first to experience the platform",
          },
        ],
        selectedPersona: "Your Path",
        benefits: "Your Welcome Package",
        benefitsList: [
          "Waitlisted status",
          "Founding-cohort review",
          "Early platform access",
          "Provenance Viewer access",
        ],
      },
      regions: [
        "UAE",
        "Saudi Arabia",
        "Qatar",
        "Kuwait",
        "Bahrain",
        "Oman",
        "Egypt",
        "Lebanon",
        "Jordan",
        "Other",
      ],
    },
    ar: {
      title: "انضم إلى FANN",
      subtitle: "أنشئ حسابك",
      step1Title: "اختر دورك",
      step1Subtitle: "اختر المسار الذي يصفك بشكل أفضل في النظام الفني",
      step2Title: "معلومات الحساب",
      step2Subtitle: "أدخل بياناتك لإنشاء حسابك",
      fullName: "الاسم الكامل",
      fullNamePlaceholder: "أدخل اسمك الكامل",
      email: "البريد الإلكتروني",
      emailPlaceholder: "your.email@example.com",
      password: "كلمة المرور",
      passwordPlaceholder: "أنشئ كلمة مرور قوية",
      confirmPassword: "تأكيد كلمة المرور",
      confirmPasswordPlaceholder: "أعد إدخال كلمة المرور",
      region: "المنطقة",
      regionPlaceholder: "اختر منطقتك",
      referral: "كود الإحالة",
      referralOptional: "(اختياري)",
      referralPlaceholder: "أدخل الكود",
      terms: "أوافق على الشروط والأحكام وسياسة الخصوصية",
      kyc: "سيكو�� التحقق من الهوية (KYC) مطلوباً للوصول الكامل للمنصة",
      signUpButton: "إنشاء حساب",
      signingUp: "جارٍ إنشاء الحساب...",
      haveAccount: "لديك حساب بالفعل؟",
      signIn: "تسجيل الدخول",
      back: "رجوع",
      backToHome: "العودة للرئيسية",
      continue: "متابعة",
      step: "الخطوة",
      of: "من",
      personas: {
        artist: {
          name: "فنان",
          desc: "اعرض واستثمر أعمالك الفنية",
          points: "+500 نقطة",
        },
        gallery: {
          name: "معرض / متحف",
          desc: "قدّم مجموعتك إلى سوق يضع المصداقية أولًا",
          concierge: true,
        },
        collector: {
          name: "جامع",
          desc: "اكتشف واقتنِ الفن الموثق",
        },
        curator: {
          name: "منسق / ناقد",
          desc: "شكّل المجموعات واشهد على الأصالة",
        },
        investor: {
          name: "مستثمر / راعي",
          desc: "ادعم مجموعة المؤسسين لسوق موثوق",
          concierge: true,
        },
        ambassador: {
          name: "سفير",
          desc: "قدّم الفنانين والجامعين الذين تثق بهم",
        },
      },
      leftPanel: {
        welcomeTitle: "مرحباً بك في مستقبل الفن",
        welcomeDesc:
          "انضم إل�� مج��مع موثق حيث يلتقي الفن الراقي الموثق بتكنولوجيا البلوكتشين.",
        features: [
          {
            icon: Shield,
            title: "موثق وآمن",
            desc: "مجتمع موثق بـ KYC مع مصادقة البلوكتشين",
          },
          {
            icon: Zap,
            title: "المصداقية أولًا",
            desc: "شهادات قابلة للتحقق وسلسلة حيازة واضحة لكل عمل",
          },
          {
            icon: Globe,
            title: "شبكة عالمية",
            desc: "تواصل مع الفنانين والمعارض والجامعين عالمياً",
          },
          {
            icon: Award,
            title: "وصول مبكر",
            desc: "كن من أوائل من يختبر المنصة",
          },
        ],
        selectedPersona: "مسارك",
        benefits: "حزمة الترحيب الخاصة بك",
        benefitsList: [
          "حالة: مُدرَج",
          "مراجعة لمجموعة المؤسسين",
          "الوصول المبكر للمنصة",
          "الوصول إلى عارض المصداقية",
        ],
      },
      regions: [
        "الإمارات",
        "السعودية",
        "قطر",
        "الكويت",
        "البحرين",
        "عُمان",
        "مصر",
        "لبنان",
        "الأردن",
        "أخرى",
      ],
    },
  };

  const content = t[language];
  const isRTL = language === "ar";

  // Convert regions to SelectFieldOption format
  // Use API data if available, otherwise fallback to hardcoded regions
  const regionOptions =
    regionsData && regionsData.length > 0
      ? regionsData.map((region) => ({
        value: region.name,
        label: region.name,
      }))
      : content.regions.map((region) => ({
        value: region,
        label: region,
      }));

  const personas = [
    {
      id: "artist",
      icon: Palette,
      gradient: "from-amber-500 to-orange-500",
      ...content.personas.artist,
    },
    {
      id: "gallery",
      icon: Building2,
      gradient: "from-yellow-500 to-amber-500",
      ...content.personas.gallery,
    },
    {
      id: "collector",
      icon: Gem,
      gradient: "from-orange-500 to-amber-600",
      ...content.personas.collector,
    },
    {
      id: "curator",
      icon: Sparkles,
      gradient: "from-amber-400 to-yellow-500",
      ...content.personas.curator,
    },
    {
      id: "investor",
      icon: TrendingUp,
      gradient: "from-yellow-600 to-orange-600",
      ...content.personas.investor,
    },
    {
      id: "ambassador",
      icon: Users,
      gradient: "from-amber-500 to-amber-600",
      ...content.personas.ambassador,
    },
  ];

  // Map persona ID to API role format
  const getRoleFromPersona = (personaId: string | null): string => {
    const roleMap: Record<string, string> = {
      artist: "Artist",
      gallery: "Gallery",
      collector: "Collector",
      curator: "Curator",
      investor: "Investor",
      ambassador: "Ambassador",
    };
    return roleMap[personaId || "artist"] || "Artist";
  };

  // Map persona to points
  const getPointsFromPersona = (personaId: string | null): string => {
    const pointsMap: Record<string, string> = {
      artist: "500",
      gallery: "750",
      collector: "500",
      curator: "600",
      investor: "0",
      ambassador: "600",
    };
    return pointsMap[personaId || "artist"] || "500";
  };

  // Map region name to region ID (optional - returns 0 if not provided)
  const getRegionId = (regionName: string): number => {
    if (!regionName || regionName.trim() === "") {
      return 0; // Optional field, return 0 if not provided
    }

    // Use API data if available
    if (regionsData && regionsData.length > 0) {
      const region = regionsData.find(
        (r) =>
          r.name === regionName ||
          r.name.toLowerCase() === regionName.toLowerCase()
      );
      if (region) {
        return region.id;
      }
    }

    // Fallback: create a simple mapping if API data is not available
    const regionMap: Record<string, number> = {
      UAE: 1,
      "Saudi Arabia": 2,
      Qatar: 3,
      Kuwait: 4,
      Bahrain: 5,
      Oman: 6,
      Egypt: 7,
      Lebanon: 8,
      Jordan: 9,
      Other: 10,
      // Arabic mappings
      الإمارات: 1,
      السعودية: 2,
      قطر: 3,
      الكويت: 4,
      البحرين: 5,
      عُمان: 6,
      مصر: 7,
      لبنان: 8,
      الأردن: 9,
      أخرى: 10,
    };
    return regionMap[regionName] || 0;
  };

  const handleContinueToStep2 = () => {
    if (selectedPersona) {
      trackEvent({
        name: "signup_role_selected",
        session_id: getSessionId(),
        props: { role: selectedPersona },
      });
      setStep(2);
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    if (!acceptedTerms || !selectedPersona) {
      toast.error(
        language === "en"
          ? "Please accept the terms and conditions"
          : "يرجى الموافقة على الشروط والأحكام"
      );
      return;
    }

    try {
      trackEvent({
        name: "signup_submitted",
        session_id: getSessionId(),
        props: { role: getRoleFromPersona(selectedPersona) },
      });
      // Split full name into first and last name
      const nameParts = data.fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || firstName;

      // Prepare signup data
      const regionId = data.region ? getRegionId(data.region) : undefined;
      const signUpData = {
        role: getRoleFromPersona(selectedPersona),
        points: getPointsFromPersona(selectedPersona),
        first_name: firstName,
        last_name: lastName,
        email: data.email.trim(),
        password: data.password,
        confirm_password: data.confirmPassword,
        ...(regionId && regionId > 0 && { region: regionId }),
        referral_code: data.referralCode.trim() || "",
      };

      const result = await signUp(signUpData).unwrap();

      // Debug: Log the response to help troubleshoot
      console.log("SignUp API Response:", result);
      console.log("Response type:", typeof result);
      console.log("Is result an object?", result && typeof result === "object");

      // Handle API response structure: { success, status_code, message, data }
      // RTK Query's unwrap() returns the response body directly
      // New API response: { success: true, status_code: 200, message: {}, data: { access: "...", refresh: "...", ... } }
      const apiResponse = result as {
        success?: boolean;
        status_code?: number;
        message?: string | Record<string, unknown>;
        data?: {
          access?: string;
          refresh?: string;
          [key: string]: unknown;
        };
        [key: string]: unknown;
      };

      // Debug: Log the parsed response
      console.log("Parsed API Response:", apiResponse);
      console.log("Success value:", apiResponse.success);
      console.log("Status code:", apiResponse.status_code);
      console.log("Response data:", apiResponse.data);

      // Check for success - API returns { success: true, status_code: 200, ... }
      const isSuccess =
        apiResponse.success === true || apiResponse.status_code === 200;

      console.log("Is success?", isSuccess);

      if (isSuccess) {
        // Extract tokens and user data from response.data
        // New API response structure: { success: true, status_code: 200, message: {}, data: { access: "...", refresh: "...", role: "...", is_verify: ..., ... } }
        // The API always returns full user data in the data field
        let accessToken: string | null = null;
        let refreshToken: string | null = null;
        let userData: UserProfileData | undefined = undefined;

        if (apiResponse.data && typeof apiResponse.data === "object") {
          accessToken = apiResponse.data.access || null;
          refreshToken = apiResponse.data.refresh || null;

          // Extract user data from response
          // The API always returns full user profile data in the data field
          userData = apiResponse.data as unknown as UserProfileData;

          console.log("Extracted tokens:", {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            hasUserData: !!userData,
          });
        }

        // Extract role and is_verify from user data
        const role = userData?.role;
        const isVerify = userData?.is_verify;

        // Check if user is an ambassador with pending verification
        const isAmbassador =
          role === "Ambassador" || role?.toLowerCase() === "ambassador";
        const isPendingVerification = isAmbassador && isVerify === false;

        // Check if user needs email verification (artist, gallery, collector)
        const needsEmailVerification =
          isVerify === false &&
          (role === "Artist" ||
            role === "Gallery" ||
            role === "Collector" ||
            role?.toLowerCase() === "artist" ||
            role?.toLowerCase() === "gallery" ||
            role?.toLowerCase() === "collector");

        // If tokens are found, store them in Redux store along with persona
        const persona = selectedPersona || "artist";
        if (accessToken && refreshToken) {
          // Clear all auth state before setting new tokens
          await clearAllAuthState(dispatch, persistor, {
            clearExpiredPage: true,    // Clear expired page on signup
          });

          dispatch(
            setTokens({
              accessToken,
              refreshToken,
              persona,
              user: userData,
            })
          );
          console.log("Tokens and persona stored in Redux store");
        } else {
          console.warn("No tokens found in API response");
        }

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
            // If message is an object with content, try to extract a message from it
            const messageObj = apiResponse.message as Record<string, unknown>;
            if (messageObj.message) {
              successMessage = String(messageObj.message);
            } else if (messageObj.success) {
              successMessage = String(messageObj.success);
            }
          }
        }

        // Default success message if none provided
        if (!successMessage) {
          successMessage =
            language === "en"
              ? "Account created successfully!"
              : "تم إنشاء الحساب بنجاح!";
        }

        // Show success toast
        toast.success(successMessage);

        // Check for verification status
        if (isPendingVerification) {
          // Show ambassador verification modal instead of navigating
          setShowAmbassadorVerificationModal(true);
        } else if (needsEmailVerification) {
          // Show email verification modal instead of navigating
          setShowEmailVerificationModal(true);
        } else {
          // Navigate to onboarding page after storing tokens
          console.log("Navigating to onboarding with persona:", persona);

          // Call the navigation callback
          onSignUpComplete(persona);

          console.log("Navigation callback completed");
        }
      } else {
        // Handle failure case (success is false or undefined)
        console.warn(
          "SignUp failed - success is not true:",
          apiResponse.success
        );
        const errorMessage =
          language === "en"
            ? "Account creation failed. Please try again."
            : "فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.";
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      // Error toast is already shown by baseApi interceptor
      const errorMessage = extractErrorMessage(err, language);
      console.error("Sign up error:", errorMessage);
    }
  };

  const selectedPersonaData = personas.find((p) => p.id === selectedPersona);

  // Show ambassador verification modal if needed
  if (showAmbassadorVerificationModal) {
    return <AmbassadorVerificationModal />;
  }

  // Show email verification modal if needed
  if (showEmailVerificationModal) {
    return <EmailVerificationModal />;
  }

  return (
    <div className="fann-landing min-h-screen flex" dir={isRTL ? "rtl" : "ltr"}>
      {/* LEFT PANEL - Branding & Info */}
      <motion.div
        initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-[40%] relative overflow-hidden"
        style={{
          background: "var(--ink-panel)",
          borderInlineEnd: "1px solid var(--hairline)",
        }}
      >
        {/* Backdrop — one quiet gold wash, gallery-wall restraint */}
        <div className="absolute inset-0" aria-hidden="true">
          <div
            className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
            style={{ background: "var(--gold-soft)" }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo/Brand */}
          <div className="mb-12">
            <motion.button
              onClick={onNavigateToHome}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 text-[#F2F2F3]/70 hover:text-[#C59B48] transition-colors group mb-8 cursor-pointer"
            >
              <ChevronLeft
                className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${isRTL ? "rotate-180" : ""
                  }`}
              />
              <span className="text-sm">{content.backToHome}</span>
            </motion.button>

            <h1
              className="fann-display mb-2"
              style={{ fontSize: "2.25rem", color: "var(--bone)" }}
            >
              FANN<span style={{ color: "var(--gold)" }}>.</span>
            </h1>
            <p className="text-sm" style={{ color: "var(--bone-2)" }}>
              {content.subtitle}
            </p>
          </div>

          {/* Dynamic Content Based on Step */}
          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1-info"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2
                    className="fann-display mb-3"
                    style={{ fontSize: "1.75rem", color: "var(--bone)" }}
                  >
                    {content.leftPanel.welcomeTitle}
                  </h2>
                  <p className="mb-8 leading-relaxed" style={{ color: "var(--bone-2)" }}>
                    {content.leftPanel.welcomeDesc}
                  </p>

                  <div className="space-y-6">
                    {content.leftPanel.features.map((feature, idx) => {
                      const Icon = feature.icon;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          className="flex gap-4"
                        >
                          <div className="w-12 h-12 rounded-lg bg-[#F2F2F3]/5 border border-[#C59B48]/20 flex items-center justify-center shrink-0">
                            <Icon className="w-6 h-6 text-[#C59B48]" />
                          </div>
                          <div>
                            <h3 className="text-[#F2F2F3] mb-1">
                              {feature.title}
                            </h3>
                            <p className="text-[#F2F2F3]/60 text-sm">
                              {feature.desc}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2-info"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Selected Persona Display */}
                  {selectedPersonaData && (
                    <div className="mb-8">
                      <p className="text-[#F2F2F3]/60 text-sm mb-3">
                        {content.leftPanel.selectedPersona}
                      </p>
                      <div
                        className="p-6"
                        style={{
                          background: "var(--ink-card)",
                          border: "1px solid var(--gold-edge)",
                          borderRadius: "var(--r-lg)",
                          boxShadow: "var(--shadow-card)",
                        }}
                      >
                        <div className="flex items-center gap-4 mb-4">
                          {(() => {
                            const Icon = selectedPersonaData.icon;
                            return (
                              <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center"
                                style={{
                                  background: "var(--gold-soft)",
                                  border: "1px solid var(--gold-edge)",
                                  borderRadius: "var(--r-md)",
                                }}
                              >
                                <Icon className="w-7 h-7" style={{ color: "var(--gold)" }} strokeWidth={1.5} />
                              </div>
                            );
                          })()}
                          <div>
                            <h3
                              className="fann-display mb-1"
                              style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--bone)" }}
                            >
                              {selectedPersonaData.name}
                            </h3>
                            <p className="text-[#F2F2F3]/70 text-sm">
                              {selectedPersonaData.desc}
                            </p>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C59B48]/20 border border-[#C59B48]/30">
                          <Gift className="w-4 h-4 text-[#C59B48]" />
                          <span className="text-[#C59B48] text-sm">
                            {'concierge' in selectedPersonaData
                              ? (isRTL ? 'مسار مخصّص' : 'Concierge path')
                              : (isRTL ? 'مجموعة المؤسسين' : 'Founding cohort')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Benefits */}
                  <div>
                    <p className="text-[#F2F2F3]/60 text-sm mb-3">
                      {content.leftPanel.benefits}
                    </p>
                    <div className="space-y-2">
                      {content.leftPanel.benefitsList.map((benefit, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          className="flex items-center gap-3 text-[#F2F2F3]/80"
                        >
                          <div className="w-5 h-5 rounded-full bg-[#C59B48]/20 border border-[#C59B48]/30 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-[#C59B48]" />
                          </div>
                          <span className="text-sm">{benefit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Stats/Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-8"
            style={{ borderTop: "1px solid var(--hairline)" }}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
              <span className="text-[#F2F2F3]/60 text-xs uppercase tracking-[0.18em]">Pre-launch</span>
              <span className="w-1 h-1 rounded-full bg-[#C59B48]/40" />
              <span className="text-[#F2F2F3]/60 text-xs uppercase tracking-[0.18em]">Application-based</span>
              <span className="w-1 h-1 rounded-full bg-[#C59B48]/40" />
              <span className="text-[#F2F2F3]/60 text-xs uppercase tracking-[0.18em]">Founding cohort capped</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 relative overflow-hidden">
        {/* Form Container */}
        <div className="h-full overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-6 lg:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-xl"
            >
              {/* Step Indicator */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-5">
                  <span className="fann-meta fann-tnum" style={{ color: "var(--gold)" }}>
                    {content.step} {step} {content.of} 2
                  </span>
                  <div
                    className="h-px flex-1 overflow-hidden"
                    style={{ background: "var(--hairline)" }}
                    role="progressbar"
                    aria-valuenow={step}
                    aria-valuemin={1}
                    aria-valuemax={2}
                  >
                    <motion.div
                      className="h-full"
                      style={{ background: "var(--gold)" }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${(step / 2) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
                <h2
                  className="fann-display mb-2"
                  style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: "var(--bone)" }}
                >
                  {step === 1 ? content.step1Title : content.step2Title}
                </h2>
                <p style={{ color: "var(--bone-2)" }}>
                  {step === 1 ? content.step1Subtitle : content.step2Subtitle}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  /* STEP 1: Persona Selection */
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Role gate — landing catalogue treatment (hairline-divided cells) */}
                    <div
                      role="radiogroup"
                      aria-label={content.step1Title}
                      className="mb-8 grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-2"
                      style={{
                        background: "var(--hairline)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--r-lg)",
                      }}
                    >
                      {personas.map((persona, idx) => {
                        const Icon = persona.icon;
                        const isSelected = selectedPersona === persona.id;
                        const num = (isRTL
                          ? ["٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦"]
                          : ["01", "02", "03", "04", "05", "06"])[idx];

                        return (
                          <button
                            key={persona.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setSelectedPersona(persona.id)}
                            className="fann-focus group relative flex w-full flex-col p-5 text-start transition-colors cursor-pointer"
                            style={{
                              background: isSelected ? "var(--ink-card)" : "var(--ink-panel)",
                              boxShadow: isSelected ? "inset 0 0 0 2px var(--gold)" : "none",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.background = "var(--ink-card)";
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.background = "var(--ink-panel)";
                            }}
                          >
                            {/* gold reveal edge on hover */}
                            <span
                              aria-hidden="true"
                              className={`absolute inset-x-0 top-0 origin-left transition-transform duration-300 ${isSelected ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                              style={{ height: 2, background: "var(--gold)" }}
                            />
                            <div className="flex w-full items-center justify-between">
                              <span className="fann-meta fann-tnum" style={{ color: "var(--gold)" }}>
                                {num}
                              </span>
                              <div className="flex items-center gap-2">
                                {"concierge" in persona && (
                                  <span
                                    className="fann-meta px-2 py-0.5"
                                    style={{
                                      color: "var(--gold)",
                                      border: "1px solid var(--gold-edge)",
                                      borderRadius: "var(--r-pill)",
                                    }}
                                  >
                                    {isRTL ? "مخصّص" : "Concierge"}
                                  </span>
                                )}
                                {isSelected ? (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="flex h-5 w-5 items-center justify-center rounded-full"
                                    style={{ background: "var(--gold)" }}
                                  >
                                    <Check className="h-3.5 w-3.5" style={{ color: "var(--ink-void)" }} />
                                  </motion.span>
                                ) : (
                                  <Icon
                                    className="h-5 w-5"
                                    style={{ color: "var(--bone-3)" }}
                                    strokeWidth={1.5}
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                            </div>
                            <h3
                              className="fann-display mt-4"
                              style={{ fontWeight: 700, fontSize: 20, color: "var(--bone)" }}
                            >
                              {persona.name}
                            </h3>
                            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--bone-2)" }}>
                              {persona.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleContinueToStep2}
                      disabled={!selectedPersona}
                      className="fann-focus group h-12 w-full font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        background: "var(--gold)",
                        color: "var(--ink-void)",
                        borderRadius: "var(--r-md)",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedPersona) e.currentTarget.style.background = "var(--gold-hi)";
                      }}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {content.continue}
                        <ArrowRight
                          className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""
                            }`}
                        />
                      </span>
                    </button>

                    <div className="text-center pt-6">
                      <span className="text-[#B9BBC6] text-sm">
                        {content.haveAccount}
                      </span>{" "}
                      <button
                        type="button"
                        onClick={onNavigateToSignIn}
                        className="text-primary hover:text-primary/80 transition-colors text-sm cursor-pointer"
                      >
                        {content.signIn}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  /* STEP 2: Registration Form */
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: isRTL ? -30 : 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: isRTL ? 30 : -30 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form
                      onSubmit={handleFormSubmit(onSubmit)}
                      className="space-y-5"
                    >
                      {/* Full Name */}
                      <InputField
                        {...register("fullName", {
                          required:
                            language === "en"
                              ? "Full name is required"
                              : "الاسم الكامل مطلوب",
                          minLength: {
                            value: 2,
                            message:
                              language === "en"
                                ? "Name must be at least 2 characters"
                                : "يجب أن يكون الاسم حرفين على الأقل",
                          },
                        })}
                        label={content.fullName}
                        type="text"
                        placeholder={content.fullNamePlaceholder}
                        icon={User}
                        isRTL={isRTL}
                        required
                        error={errors.fullName?.message}
                      />

                      {/* Email */}
                      <InputField
                        {...register("email", {
                          required:
                            language === "en"
                              ? "Email is required"
                              : "البريد الإلكتروني مطلوب",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message:
                              language === "en"
                                ? "Invalid email address"
                                : "عنوان بريد إلكتروني غير صالح",
                          },
                        })}
                        label={content.email}
                        type="email"
                        placeholder={content.emailPlaceholder}
                        icon={Mail}
                        isRTL={isRTL}
                        required
                        error={errors.email?.message}
                      />

                      {/* Password Fields */}
                      <div className="grid sm:grid-cols-2 gap-5">
                        <PasswordField
                          {...register("password", {
                            required:
                              language === "en"
                                ? "Password is required"
                                : "كلمة المرور مطلوبة",
                            minLength: {
                              value: 6,
                              message:
                                language === "en"
                                  ? "Password must be at least 6 characters"
                                  : "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
                            },
                          })}
                          label={content.password}
                          placeholder={content.passwordPlaceholder}
                          icon={Lock}
                          isRTL={isRTL}
                          showToggle
                          showPassword={showPassword}
                          onShowPasswordChange={setShowPassword}
                          required
                          error={errors.password?.message}
                        />

                        <div className="relative">
                          <PasswordField
                            {...register("confirmPassword", {
                              required:
                                language === "en"
                                  ? "Please confirm your password"
                                  : "يرجى تأكيد كلمة المرور",
                              validate: (value) =>
                                value === password ||
                                (language === "en"
                                  ? "Passwords do not match"
                                  : "كلمات المرور غير متطابقة"),
                            })}
                            label={content.confirmPassword}
                            placeholder={content.confirmPasswordPlaceholder}
                            icon={Lock}
                            isRTL={isRTL}
                            showToggle
                            showPassword={showConfirmPassword}
                            onShowPasswordChange={setShowConfirmPassword}
                            required
                            error={errors.confirmPassword?.message}
                          />
                          {/* Password match indicator */}
                          {confirmPassword && (
                            <div className="absolute -bottom-5 left-0 right-0 flex items-center gap-1 mt-1">
                              {passwordsMatch ? (
                                <div className="flex items-center gap-1 text-green-400 text-xs">
                                  <Check className="w-3 h-3" />
                                  <span>
                                    {language === "en"
                                      ? "Passwords match"
                                      : "كلمات المرور متطابقة"}
                                  </span>
                                </div>
                              ) : passwordsMismatch ? (
                                <div className="flex items-center gap-1 text-red-400 text-xs">
                                  <span>
                                    {language === "en"
                                      ? "Passwords do not match"
                                      : "كلمات المرور غير متطابقة"}
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Region & Referral */}
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <SelectField
                            label={content.region}
                            placeholder={content.regionPlaceholder}
                            icon={MapPin}
                            options={regionOptions}
                            value={watch("region")}
                            onValueChange={(value) => {
                              setValue("region", value, {
                                shouldValidate: true,
                              });
                            }}
                            isRTL={isRTL}
                          />
                        </div>

                        <InputField
                          {...register("referralCode", {
                            setValueAs: (value) => value.toUpperCase(),
                          })}
                          label={content.referral}
                          type="text"
                          placeholder={content.referralPlaceholder}
                          icon={Gift}
                          isRTL={isRTL}
                          disabled={!!initialReferralCode}
                        />
                      </div>

                      {/* Referral Success Message */}
                      <AnimatePresence>
                        {watch("referralCode") && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-2 p-3"
                            style={{
                              background: "var(--gold-soft)",
                              border: "1px solid var(--gold-edge)",
                              borderRadius: "var(--r-md)",
                            }}
                          >
                            <Check className="w-4 h-4 shrink-0" style={{ color: "var(--gold)" }} />
                            <span className="text-sm" style={{ color: "var(--bone-2)" }}>
                              {isRTL
                                ? "تم تطبيق رمز الإحالة — يُحتسب بعد التحقق من بريدك."
                                : "Referral code applied — it counts once you verify your email."}
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Terms */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id="terms"
                            checked={acceptedTerms}
                            onCheckedChange={(checked: boolean) =>
                              setAcceptedTerms(checked)
                            }
                            className="mt-0.5 border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <Label
                            htmlFor="terms"
                            className="text-white/70 text-sm cursor-pointer leading-relaxed"
                          >
                            {content.terms}
                          </Label>
                        </div>

                        <div
                          className="flex items-start gap-2 p-3"
                          style={{
                            background: "var(--ink-card)",
                            border: "1px solid var(--hairline)",
                            borderRadius: "var(--r-md)",
                          }}
                        >
                          <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--gold)" }} />
                          <span className="text-xs leading-relaxed" style={{ color: "var(--bone-2)" }}>
                            {content.kyc}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          disabled={isLoading}
                          className={`h-12 px-6 transition-all ${isLoading
                            ? "disabled:bg-disabled disabled:cursor-not-allowed"
                            : "cursor-pointer"
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <ChevronLeft
                              className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`}
                            />
                            {content.back}
                          </span>
                        </Button>

                        <button
                          type="submit"
                          disabled={isLoading || !acceptedTerms}
                          className="fann-focus group h-12 flex-1 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                          style={{
                            background: "var(--gold)",
                            color: "var(--ink-void)",
                            borderRadius: "var(--r-md)",
                          }}
                          onMouseEnter={(e) => {
                            if (!isLoading && acceptedTerms)
                              e.currentTarget.style.background = "var(--gold-hi)";
                          }}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
                        >
                          <span className="flex items-center justify-center gap-2">
                            {isLoading ? (
                              <>
                                <Oval
                                  height={20}
                                  width={20}
                                  color="#0B0B0D"
                                  ariaLabel="loading"
                                  visible={true}
                                />
                                {content.signingUp}
                              </>
                            ) : (
                              <>
                                {content.signUpButton}
                                <ArrowRight
                                  className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""
                                    }`}
                                />
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
