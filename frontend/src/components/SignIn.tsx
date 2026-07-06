import { ROUTES } from "@/routes/paths";
import { useLoginMutation } from "@/services/api/authApi";
import {
  GoogleAuthButton,
  GOOGLE_CLIENT_ID,
} from "@/components/auth/GoogleAuthButton";
import {
  setAccessToken,
  setPersona,
  setTokens,
  type UserProfileData,
} from "@/store/authSlice";
import { persistor } from "@/store/store";
import { clearAllAuthState, REMEMBERED_EMAIL_KEY, REMEMBERED_PASSWORD_KEY } from "@/utils/auth";
import {
  ArrowRight,
  ChevronLeft,
  Globe,
  Lock,
  Mail,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Oval } from "react-loader-spinner";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Checkbox } from "./ui/checkbox";
import { InputField, PasswordField } from "./ui/custom-form-elements";
import { Label } from "./ui/label";
import { AmbassadorVerificationModal } from "./auth/AmbassadorVerificationModal";
import { EmailVerificationModal } from "./auth/EmailVerificationModal";

interface SignInProps {
  language: "en" | "ar";
  onNavigateToSignUp: () => void;
  onNavigateToHome: () => void;
}

interface SignInFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginResponseData {
  access?: string;
  refresh?: string;
  profile_completed?: boolean;
  role?: string;
  [key: string]: unknown;
}

interface LoginResponse {
  success?: boolean;
  status_code?: number;
  message?: string | Record<string, unknown>;
  data?: LoginResponseData;
  access?: string;
  refresh?: string;
  token?: string;
  user?: unknown;
}

export function SignIn({
  language,
  onNavigateToSignUp,
  onNavigateToHome,
}: SignInProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SignInFormData>({
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");
  const [login, { isLoading }] = useLoginMutation();
  const [showAmbassadorVerificationModal, setShowAmbassadorVerificationModal] =
    useState(false);
  const [showEmailVerificationModal, setShowEmailVerificationModal] =
    useState(false);

  // Load remembered credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    const savedPassword = localStorage.getItem(REMEMBERED_PASSWORD_KEY);

    if (savedEmail && savedPassword) {
      setValue("email", savedEmail);
      setValue("password", savedPassword);
      setValue("rememberMe", true);
    }
  }, [setValue]);

  const t = {
    en: {
      title: "Welcome Back",
      subtitle: "Sign in to continue your FANN journey",
      email: "Email Address",
      emailPlaceholder: "your.email@example.com",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      forgotPassword: "Forgot password?",
      rememberMe: "Remember me",
      signInButton: "Sign In",
      signingIn: "Signing in...",
      noAccount: "Don't have an account?",
      signUp: "Sign Up",
      orContinue: "Or continue with",
      sso: "Single Sign-On",
      backToHome: "Back to Home",
      leftPanel: {
        title: "Continue Your Art Journey",
        desc: "Access your personalized dashboard and connect with the MENA/GCC art ecosystem.",
        features: [
          {
            icon: Shield,
            title: "Secure Access",
            desc: "Your account is protected with enterprise-grade security",
          },
          {
            icon: TrendingUp,
            title: "Track your status",
            desc: "Follow your verification and founding-cohort standing",
          },
          {
            icon: Globe,
            title: "Global Network",
            desc: "Engage with verified artists, galleries, and collectors",
          },
          {
            icon: Zap,
            title: "Provenance-First",
            desc: "Certificates of authenticity and chain of custody on every work",
          },
        ],
      },
      stats: {
        artists: "Artists",
        collectors: "Collectors",
        galleries: "Galleries",
        verified: "Verified",
      },
    },
    ar: {
      title: "مرحباً بعودتك",
      subtitle: "سجّل الدخول لمواصلة رحلتك في FANN",
      email: "البريد الإلكتروني",
      emailPlaceholder: "your.email@example.com",
      password: "كلمة المرور",
      passwordPlaceholder: "أدخل كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      rememberMe: "تذكرني",
      signInButton: "تسجيل الدخول",
      signingIn: "جارٍ تسجيل الدخول...",
      noAccount: "ليس لديك حساب؟",
      signUp: "إنشاء حساب",
      orContinue: "أو المتابعة باستخدام",
      sso: "تسجيل دخول موحد",
      backToHome: "العودة للرئيسية",
      leftPanel: {
        title: "تابع رحلتك الفنية",
        desc: "الوصول إلى لوحة التحكم الشخصية والتواصل مع نظام الفن في منطقة الشرق الأوسط وشمال أفريقيا ودول مجلس التعاون الخليجي.",
        features: [
          {
            icon: Shield,
            title: "دخول آمن",
            desc: "حسابك محمي بأمان على مستوى المؤسسات",
          },
          {
            icon: TrendingUp,
            title: "تتبّع حالتك",
            desc: "تابع حالة التحقق ومكانتك في مجموعة المؤسسين",
          },
          {
            icon: Globe,
            title: "شبكة عالمية",
            desc: "تفاعل مع فنانين ومعارض وجامعين معتمدين",
          },
          {
            icon: Zap,
            title: "المصداقية أولًا",
            desc: "شهادات أصالة وسلسلة حيازة لكل عمل",
          },
        ],
      },
      stats: {
        artists: "فنانون",
        collectors: "جامعون",
        galleries: "معارض",
        verified: "موثّق",
      },
    },
  };

  const content = t[language];
  const isRTL = language === "ar";

  // Show ambassador verification modal if needed
  if (showAmbassadorVerificationModal) {
    return <AmbassadorVerificationModal />;
  }

  // Show email verification modal if needed
  if (showEmailVerificationModal) {
    return <EmailVerificationModal />;
  }

  const onSubmit = async (data: SignInFormData) => {
    try {
      // Handle remember me functionality
      if (data.rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, data.email.trim());
        localStorage.setItem(REMEMBERED_PASSWORD_KEY, data.password.trim());
      } else {
        // Clear saved credentials if remember me is unchecked
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        localStorage.removeItem(REMEMBERED_PASSWORD_KEY);
      }

      const result = await login({
        email: data.email.trim(),
        password: data.password.trim(),
      }).unwrap();

      // Extract tokens from the nested data structure
      // API response: { success: true, status_code: 200, message: {}, data: { access: "...", refresh: "...", role: "...", is_verify: ..., ... } }
      const loginResult = result as LoginResponse;
      const responseData = loginResult.data || loginResult;

      const accessToken =
        (responseData as LoginResponseData).access ||
        loginResult.access ||
        loginResult.token;

      const refreshToken =
        (responseData as LoginResponseData).refresh || loginResult.refresh;

      // Extract user profile data from response
      // The API always returns full user data in the data field
      const userData = loginResult.data
        ? (loginResult.data as unknown as UserProfileData)
        : undefined;

      // Get profile completion status and role (persona) from userData
      const profileCompleted = userData?.profile_completed ?? false;
      const role = userData?.role || (responseData as LoginResponseData)?.role;
      // Convert role to lowercase persona (e.g., "Artist" -> "artist")
      const persona = role ? role.toLowerCase() : undefined;

      if (accessToken) {
        // Clear all auth state before setting new tokens
        await clearAllAuthState(dispatch, persistor, {
          clearExpiredPage: true,    // Clear expired page on relogin
        });

        // Store tokens in Redux (persisted via redux-persist)
        if (refreshToken) {
          dispatch(
            setTokens({
              accessToken,
              refreshToken,
              profileCompleted,
              persona,
              user: userData,
            })
          );
        } else {
          dispatch(
            setAccessToken({
              token: accessToken,
              profileCompleted,
              user: userData,
            })
          );
          // If persona exists, set it separately when only access token is available
          if (persona) {
            dispatch(setPersona(persona));
          }
        }
      } else {
        console.warn("No token received from API response:", result);
        // Still proceed if user data is present (some APIs return user without explicit token)
        const hasUserData = loginResult.data || loginResult.user;
        if (!hasUserData) {
          throw new Error("Invalid response from server");
        }
      }

      // Extract role and is_verify from user data for verification check
      const userRole = userData?.role;
      const isVerify = userData?.is_verify;

      // Check if user is an ambassador with pending verification
      const isAmbassador =
        userRole === "Ambassador" || userRole?.toLowerCase?.() === "ambassador";
      const isPendingVerification = isAmbassador && isVerify === false;

      // Check if user needs email verification (artist, gallery, collector)
      const needsEmailVerification =
        isVerify === false &&
        (userRole === "Artist" ||
          userRole === "Gallery" ||
          userRole === "Collector" ||
          userRole?.toLowerCase?.() === "artist" ||
          userRole?.toLowerCase?.() === "gallery" ||
          userRole?.toLowerCase?.() === "collector");

      // Show success message
      const successMessage =
        (typeof loginResult.message === "string"
          ? loginResult.message
          : null) ||
        (language === "en"
          ? "Successfully signed in!"
          : "تم تسجيل الدخول بنجاح!");

      toast.success(successMessage);

      // Check for verification status
      if (isPendingVerification) {
        // Show ambassador verification modal instead of navigating
        setShowAmbassadorVerificationModal(true);
      } else if (needsEmailVerification) {
        // Show email verification modal instead of navigating
        setShowEmailVerificationModal(true);
      } else {
        // Redirect to dashboard regardless of profile completion status
        navigate(ROUTES.DASHBOARD, { replace: true });
      }
    } catch {
      // Error toast is already shown by baseApi interceptor
      // No need to show duplicate toast here
    }
  };

  const statsData = [
    { value: content.stats.verified, label: content.stats.artists },
    { value: content.stats.verified, label: content.stats.collectors },
    { value: content.stats.verified, label: content.stats.galleries },
  ];

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
              className="flex items-center gap-2 text-cream/70 hover:text-[#C59B48] transition-colors group mb-8 cursor-pointer"
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

          {/* Features Section */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2
                className="fann-display mb-3"
                style={{ fontSize: "1.75rem", color: "var(--bone)" }}
              >
                {content.leftPanel.title}
              </h2>
              <p className="mb-8 leading-relaxed" style={{ color: "var(--bone-2)" }}>
                {content.leftPanel.desc}
              </p>

              <div className="space-y-6 mb-10">
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
                        <h3 className="text-[#F2F2F3] mb-1">{feature.title}</h3>
                        <p className="text-[#F2F2F3]/60 text-sm">
                          {feature.desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {statsData.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="p-3 text-center transition-all"
                    style={{
                      background: "var(--ink-card)",
                      border: "1px solid var(--hairline)",
                      borderRadius: "var(--r-md)",
                    }}
                  >
                    <div className="mb-1 text-xl" style={{ color: "var(--gold)" }}>
                      {stat.value}
                    </div>
                    <div className="text-xs" style={{ color: "var(--bone-3)" }}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
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
              {/* Header */}
              <div className="mb-8">
                <h2
                  className="fann-display mb-2"
                  style={{ fontSize: "clamp(1.75rem, 3vw, 2.25rem)", color: "var(--bone)" }}
                >
                  {content.title}
                </h2>
                <p style={{ color: "var(--bone-2)" }}>{content.subtitle}</p>
              </div>

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-5">
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

                  {/* Password */}
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
                    required
                    error={errors.password?.message}
                  />

                  {/* Remember Me and Forgot Password */}
                  <div
                    className={`flex items-center ${isRTL ? "flex-row-reverse justify-between" : "justify-between"
                      }`}
                  >
                    {/* Remember Me Checkbox */}
                    <div className={`flex items-center ${isRTL ? "gap-2 flex-row-reverse" : "gap-2"}`}>
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe}
                        onCheckedChange={(checked) =>
                          setValue("rememberMe", checked === true)
                        }
                        className="border-[#C59B48]/30 data-[state=checked]:bg-[#C59B48] data-[state=checked]:border-[#C59B48]"
                      />
                      <Label
                        htmlFor="rememberMe"
                        className="text-sm text-[#F2F2F3]/70 cursor-pointer hover:text-[#F2F2F3] transition-colors"
                      >
                        {content.rememberMe}
                      </Label>
                    </div>

                    {/* Forgot Password */}
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                      className="text-sm text-[#C59B48] hover:text-[#D6AE5A] transition-colors cursor-pointer"
                    >
                      {content.forgotPassword}
                    </button>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleFormSubmit(onSubmit)}
                      disabled={isLoading}
                      className="fann-focus group h-12 w-full font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        background: "var(--gold)",
                        color: "var(--ink-void)",
                        borderRadius: "var(--r-md)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) e.currentTarget.style.background = "var(--gold-hi)";
                      }}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--gold)")}
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
                            {content.signingIn}
                          </>
                        ) : (
                          <>
                            {content.signInButton}
                            <ArrowRight
                              className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""
                                }`}
                            />
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Continue with Google (renders only when configured) */}
                {GOOGLE_CLIENT_ID && (
                  <div className="mt-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-px flex-1 bg-[#F2F2F3]/10" />
                      <span className="text-xs text-[#F2F2F3]/40">
                        {language === "en" ? "or" : "أو"}
                      </span>
                      <div className="h-px flex-1 bg-[#F2F2F3]/10" />
                    </div>
                    <GoogleAuthButton />
                  </div>
                )}

                {/* Sign Up Link */}
                <div className="mt-6 text-center">
                  <span className="text-[#F2F2F3]/60 text-sm">
                    {content.noAccount}
                  </span>{" "}
                  <button
                    type="button"
                    onClick={onNavigateToSignUp}
                    className="text-[#C59B48] hover:text-[#D6AE5A] transition-colors text-sm cursor-pointer"
                  >
                    {content.signUp}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
