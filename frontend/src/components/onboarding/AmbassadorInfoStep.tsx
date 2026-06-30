import { Button } from "@/components/ui/button";
import {
  FileUploadField,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/ui/custom-form-elements";
import {
  useProfileSetupMutation,
  useGetInstagramFollowerOptionsQuery,
  useGetTwitterFollowerOptionsQuery,
  useGetYoutubeSubscriberOptionsQuery,
  useGetPrimaryPlatformOptionsQuery,
} from "@/services/api/onboardingApi";
import { extractErrorMessage } from "@/utils/errorMessages";
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  Globe,
  Hash,
  Instagram,
  Megaphone,
  Twitter,
  User,
  Video,
  Youtube,
  Mail,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Oval } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import {
  markStepAsSubmitted,
  selectIsStepSubmitted,
  selectSubmittedData,
} from "@/store/onboardingSlice";
import { setUser, type UserProfileData } from "@/store/authSlice";
import type { RootState } from "@/store/store";
import type { OnboardingData } from "./OnboardingFlow";

interface AmbassadorInfoStepProps {
  language: "en" | "ar";
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
  data: OnboardingData;
}

interface AmbassadorInfoFormData {
  title: string;
  bio: string;
  profile_image: File | null;
  instagram_handle: string;
  instagram_followers: string;
  tiktok_handle: string;
  tiktok_followers: string;
  youtube_handle: string;
  youtube_subscribers: string;
  twitter_handle: string;
  twitter_followers: string;
  primary_platform: string;
  content_niche: string;
  promotion_plan: string;
}

export function AmbassadorInfoStep({
  language,
  onNext,
  onBack,
  data,
}: AmbassadorInfoStepProps) {
  const dispatch = useDispatch();
  const isStepSubmitted = useSelector(
    (state: RootState) => selectIsStepSubmitted(state, 1) // Step 1 is AmbassadorInfoStep
  );
  const submittedData = useSelector((state: RootState) =>
    selectSubmittedData(state, "personaDetails")
  );
  const storedUser = useSelector((state: RootState) => state.auth.user);

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [profileSetup, { isLoading }] = useProfileSetupMutation();

  // Fetch dropdown options from API
  const { data: instagramFollowerData } = useGetInstagramFollowerOptionsQuery();
  const { data: twitterFollowerData } = useGetTwitterFollowerOptionsQuery();
  const { data: youtubeSubscriberData } = useGetYoutubeSubscriberOptionsQuery();
  const { data: primaryPlatformData } = useGetPrimaryPlatformOptionsQuery();

  // Get full name from stored user (first_name + last_name) for initial title value
  const getFullNameFromUser = (): string => {
    if (storedUser?.first_name && storedUser?.last_name) {
      return `${storedUser.first_name} ${storedUser.last_name}`.trim();
    }
    if (storedUser?.first_name) {
      return storedUser.first_name;
    }
    return "";
  };

  // Load initial values from Redux
  const savedData = (data.personaDetails ||
    {}) as Partial<AmbassadorInfoFormData>;

  // Get initial title: use saved data if exists, otherwise use full name from user, otherwise empty
  const initialTitle = (savedData.title as string) || getFullNameFromUser() || "";

  const initialValues: AmbassadorInfoFormData = {
    title: initialTitle,
    bio: (savedData.bio as string) || "",
    profile_image: (savedData.profile_image as File | null) || null,
    instagram_handle: (savedData.instagram_handle as string) || "",
    instagram_followers: (savedData.instagram_followers as string) || "",
    tiktok_handle: (savedData.tiktok_handle as string) || "",
    tiktok_followers: (savedData.tiktok_followers as string) || "",
    youtube_handle: (savedData.youtube_handle as string) || "",
    youtube_subscribers: (savedData.youtube_subscribers as string) || "",
    twitter_handle: (savedData.twitter_handle as string) || "",
    twitter_followers: (savedData.twitter_followers as string) || "",
    primary_platform: (savedData.primary_platform as string) || "",
    content_niche: (savedData.content_niche as string) || "",
    promotion_plan: (savedData.promotion_plan as string) || "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<AmbassadorInfoFormData>({
    defaultValues: initialValues,
  });

  // Watch form values
  const currentValues = watch();

  // Load profile image and form values from saved data
  useEffect(() => {
    const savedProfileImage = savedData.profile_image;

    if (savedProfileImage) {
      if (savedProfileImage instanceof File) {
        setProfileImage(savedProfileImage);
        setValue("profile_image", savedProfileImage);
        const previewUrl = URL.createObjectURL(savedProfileImage);
        setProfileImagePreview(previewUrl);
      } else if (typeof savedProfileImage === "string") {
        setProfileImagePreview(savedProfileImage);
        setProfileImage(null);
        setValue("profile_image", null);
      }
    } else {
      setProfileImage(null);
      setProfileImagePreview(null);
      setValue("profile_image", null);
    }

    // For title: use saved data if exists, otherwise use full name from user (only if not already set)
    const titleValue = (savedData.title as string) || getFullNameFromUser() || "";
    reset({
      title: titleValue,
      bio: (savedData.bio as string) || "",
      profile_image:
        (savedProfileImage instanceof File ? savedProfileImage : null) || null,
      instagram_handle: (savedData.instagram_handle as string) || "",
      instagram_followers: (savedData.instagram_followers as string) || "",
      tiktok_handle: (savedData.tiktok_handle as string) || "",
      tiktok_followers: (savedData.tiktok_followers as string) || "",
      youtube_handle: (savedData.youtube_handle as string) || "",
      youtube_subscribers: (savedData.youtube_subscribers as string) || "",
      twitter_handle: (savedData.twitter_handle as string) || "",
      twitter_followers: (savedData.twitter_followers as string) || "",
      primary_platform: (savedData.primary_platform as string) || "",
      content_niche: (savedData.content_niche as string) || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.personaDetails, storedUser]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  // Compare current form values with submitted values
  const hasChanges = () => {
    if (!isStepSubmitted || !submittedData) return true;

    const submitted = submittedData as Partial<AmbassadorInfoFormData>;

    const textFieldsMatch =
      (currentValues.title?.trim() || "") ===
      ((submitted.title as string) || "") &&
      (currentValues.bio?.trim() || "") === ((submitted.bio as string) || "") &&
      (currentValues.instagram_handle?.trim() || "") ===
      ((submitted.instagram_handle as string) || "") &&
      (currentValues.instagram_followers?.trim() || "") ===
      ((submitted.instagram_followers as string) || "") &&
      (currentValues.tiktok_handle?.trim() || "") ===
      ((submitted.tiktok_handle as string) || "") &&
      (currentValues.tiktok_followers?.trim() || "") ===
      ((submitted.tiktok_followers as string) || "") &&
      (currentValues.youtube_handle?.trim() || "") ===
      ((submitted.youtube_handle as string) || "") &&
      (currentValues.youtube_subscribers?.trim() || "") ===
      ((submitted.youtube_subscribers as string) || "") &&
      (currentValues.twitter_handle?.trim() || "") ===
      ((submitted.twitter_handle as string) || "") &&
      (currentValues.twitter_followers?.trim() || "") ===
      ((submitted.twitter_followers as string) || "") &&
      (currentValues.primary_platform?.trim() || "") ===
        ((submitted.primary_platform as string) || "") &&
      (currentValues.content_niche?.trim() || "") ===
        ((submitted.content_niche as string) || "") &&
      (currentValues.promotion_plan?.trim() || "") ===
        ((submitted.promotion_plan as string) || "");

    const imageMatch =
      (!profileImage && !submitted.profile_image) ||
      (profileImage &&
        submitted.profile_image &&
        profileImage.name === (submitted.profile_image as File)?.name);

    return !(textFieldsMatch && imageMatch);
  };

  const shouldShowNext = isStepSubmitted && !hasChanges();

  const isRTL = language === "ar";

  const t = {
    en: {
      title: "Tell us about your social presence",
      subtitle: "Help us understand your reach and audience",
      displayName: "Display Name",
      displayNamePlaceholder: "Your name or brand name",
      uploadPhoto: "Upload Profile Photo",
      optional: "(Optional)",
      instagram: "Instagram Handle",
      instagramPlaceholder: "@username",
      instagramFollowers: "Instagram Followers",
      instagramFollowersPlaceholder: "Select follower range",
      tiktok: "TikTok Handle",
      tiktokPlaceholder: "@username",
      tiktokFollowers: "TikTok Followers",
      tiktokFollowersPlaceholder: "Select follower range",
      youtube: "YouTube Channel",
      youtubePlaceholder: "Channel URL or @handle",
      youtubeSubscribers: "YouTube Subscribers",
      youtubeSubscribersPlaceholder: "Select subscriber range",
      twitter: "Twitter/X Handle",
      twitterPlaceholder: "@username",
      twitterFollowers: "Twitter/X Followers",
      twitterFollowersPlaceholder: "Select follower range",
      primaryPlatform: "Primary Platform",
      primaryPlatformPlaceholder: "Select your main platform",
      contentNiche: "Content Niche",
      contentNichePlaceholder: "e.g., Art Reviews, Lifestyle, Culture",
      bio: "Short Bio",
      bioPlaceholder: "Tell us about your content and audience (max 250 characters)",
      followerRanges: [
        "Under 1K",
        "1K - 10K",
        "10K - 50K",
        "50K - 100K",
        "100K - 500K",
        "500K - 1M",
        "1M+",
      ],
      platforms: ["Instagram", "TikTok", "YouTube", "Twitter/X", "Other"],
      tips: {
        title: "Why we ask",
        message:
          "This helps us match you with the right artists and art pieces to promote, ensuring authentic partnerships.",
      },
      promotionPlanLabel: "How will you promote FANN?",
      promotionPlanPlaceholder:
        "Share how you plan to promote FANN to your audience, e.g. content formats, channels, and frequency.",
      back: "Back",
      continue: "Continue",
      next: "Next",
    },
    ar: {
      title: "أخبرنا عن تواجدك على وسائل التواصل",
      subtitle: "ساعدنا في فهم مدى وصولك وجمهورك",
      displayName: "الاسم المعروض",
      displayNamePlaceholder: "اسمك أو اسم علامتك التجارية",
      uploadPhoto: "تحميل صورة الملف الشخصي",
      optional: "(اختياري)",
      instagram: "اسم المستخدم على انستغرام",
      instagramPlaceholder: "@اسم المستخدم",
      instagramFollowers: "متابعو انستغرام",
      instagramFollowersPlaceholder: "اختر نطاق المتابعين",
      tiktok: "اسم المستخدم على تيك توك",
      tiktokPlaceholder: "@اسم المستخدم",
      tiktokFollowers: "متابعو تيك توك",
      tiktokFollowersPlaceholder: "اختر نطاق المتابعين",
      youtube: "قناة يوتيوب",
      youtubePlaceholder: "رابط القناة أو @اسم المستخدم",
      youtubeSubscribers: "مشتركو يوتيوب",
      youtubeSubscribersPlaceholder: "اختر نطاق المشتركين",
      twitter: "اسم المستخدم على تويتر/إكس",
      twitterPlaceholder: "@اسم المستخدم",
      twitterFollowers: "متابعو تويتر/إكس",
      twitterFollowersPlaceholder: "اختر نطاق المتابعين",
      primaryPlatform: "المنصة الرئيسية",
      primaryPlatformPlaceholder: "اختر منصتك الرئيسية",
      contentNiche: "تخصص المحتوى",
      contentNichePlaceholder: "مثلاً، مراجعات الفن، أسلوب الحياة، الثقافة",
      bio: "سيرة قصيرة",
      bioPlaceholder: "أخبرنا عن محتواك وجمهورك (حد أقصى 250 حرفاً)",
      followerRanges: [
        "أقل من 1K",
        "1K - 10K",
        "10K - 50K",
        "50K - 100K",
        "100K - 500K",
        "500K - 1M",
        "1M+",
      ],
      platforms: ["انستغرام", "تيك توك", "يوتيوب", "تويتر/إكس", "آخر"],
      tips: {
        title: "لماذا نسأل",
        message:
          "هذا يساعدنا في مطابقتك مع الفنانين والقطع الفنية المناسبة للترويج، مما يضمن شراكات حقيقية.",
      },
      promotionPlanLabel: "كيف ستقوم بالترويج لمنصة FANN؟",
      promotionPlanPlaceholder:
        "شارك كيف تخطط للترويج لمنصة FANN لجمهورك، مثل أنواع المحتوى والقنوات وتكرار النشر.",
      back: "رجوع",
      continue: "متابعة",
      next: "التالي",
    },
  };

  const content = t[language];

  // Helper function to transform API response to SelectFieldOption format
  const transformApiOptions = (
    apiData: unknown,
    fallbackOptions: string[]
  ): Array<{ value: string; label: string }> => {
    if (!apiData) return fallbackOptions.map((opt) => ({ value: opt, label: opt }));

    try {
      const response = apiData as {
        success?: boolean;
        status_code?: number;
        data?: Array<{
          id: number;
          range?: string;
          name?: string;
          value?: string;
          label?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          [key: string]: unknown;
        }> | string[];
      };

      let options: Array<{ value: string; label: string }> = [];

      // Handle different response formats
      if (response.data) {
        const data = response.data;

        if (Array.isArray(data)) {
          // If it's an array of strings
          if (data.length > 0 && typeof data[0] === "string") {
            options = (data as string[]).map((opt) => ({ value: opt, label: opt }));
          }
          // If it's an array of objects (API response format)
          else if (data.length > 0 && typeof data[0] === "object") {
            // Filter by is_active === true and transform to SelectFieldOption format
            options = (data as Array<{
              id: number;
              range?: string;
              name?: string;
              value?: string;
              label?: string;
              is_active?: boolean;
              [key: string]: unknown;
            }>)
              .filter((item) => item.is_active !== false) // Only show active items (default to true if undefined)
              .map((item) => {
                // Use id as value (for API submission) and range/name as label (for display)
                const displayLabel = item.range || item.name || item.value || item.label || String(item.id);
                return {
                  value: String(item.id), // Send id to API
                  label: displayLabel, // Show range/name to user
                };
              });
          }
        } else if (typeof data === "object" && "name" in data) {
          // Single object response
          const opt = data as { name?: string; range?: string; is_active?: boolean; id?: number };
          if (opt.is_active !== false) {
            const displayLabel = opt.range || opt.name || String(opt.id || "");
            options = [{ value: String(opt.id || ""), label: displayLabel }];
          }
        }
      }

      // Return API options if available, otherwise fallback
      return options.length > 0
        ? options
        : fallbackOptions.map((opt) => ({ value: opt, label: opt }));
    } catch (error) {
      console.error("Error transforming API options:", error);
      return fallbackOptions.map((opt) => ({ value: opt, label: opt }));
    }
  };

  // Get follower/subscriber options from API with fallback
  const instagramFollowerOptions = transformApiOptions(
    instagramFollowerData,
    content.followerRanges
  );
  const twitterFollowerOptions = transformApiOptions(
    twitterFollowerData,
    content.followerRanges
  );
  const youtubeSubscriberOptions = transformApiOptions(
    youtubeSubscriberData,
    content.followerRanges
  );
  // TikTok uses same follower ranges as Instagram/Twitter (fallback to Instagram)
  const tiktokFollowerOptions = instagramFollowerOptions;

  // Get primary platform options from API with fallback
  const platformOptions = transformApiOptions(
    primaryPlatformData,
    content.platforms
  );

  const onSubmit = async (formData: AmbassadorInfoFormData) => {
    // At least one complete social media entry is required (handle + follower/subscriber count)
    // Check if at least one platform has both handle and follower/subscriber count
    const hasInstagram =
      formData.instagram_handle?.trim() && formData.instagram_followers?.trim();
    const hasTikTok =
      formData.tiktok_handle?.trim() && formData.tiktok_followers?.trim();
    const hasYouTube =
      formData.youtube_handle?.trim() && formData.youtube_subscribers?.trim();
    const hasTwitter =
      formData.twitter_handle?.trim() && formData.twitter_followers?.trim();

    const hasCompleteSocialMedia = hasInstagram || hasTikTok || hasYouTube || hasTwitter;

    if (!hasCompleteSocialMedia) {
      toast.error(
        language === "en"
          ? "Please provide at least one complete social media entry (handle and follower/subscriber count) for Instagram, TikTok, YouTube, or Twitter"
          : "يرجى تقديم إدخال وسائل تواصل كامل واحد على الأقل (اسم المستخدم وعدد المتابعين/المشتركين) لانستغرام، تيك توك، يوتيوب، أو تويتر"
      );
      return;
    }

    // If step was already submitted and no changes, just proceed without API call
    if (shouldShowNext) {
      onNext({ ...formData, profile_image: profileImage });
      return;
    }

    try {

      const profileData = {
        title: formData.title.trim(),
        bio: formData.bio.trim(),
        profile_image: profileImage || undefined,
        instagram_handle: formData.instagram_handle?.trim() || undefined,
        instagram_follower: formData.instagram_followers?.trim() || undefined,
        tiktok_handle: formData.tiktok_handle?.trim() || undefined,
        tiktok_follower: formData.tiktok_followers?.trim() || undefined,
        youtube_handle: formData.youtube_handle?.trim() || undefined,
        youtube_subscribers: formData.youtube_subscribers?.trim() || undefined,
        twitter_handle: formData.twitter_handle?.trim() || undefined,
        twitter_follower: formData.twitter_followers?.trim() || undefined,
        content_niche: formData.content_niche?.trim() || undefined,
        focus: formData.content_niche?.trim() || undefined, // focus is also sent for backward compatibility
        primary_platform: formData.primary_platform?.trim() || undefined,
        promotion_plan: formData.promotion_plan?.trim() || undefined,
      };

      const result = await profileSetup(profileData).unwrap();

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
              ? "Profile setup completed successfully!"
              : "تم إعداد الملف الشخصي بنجاح!";
        }

        toast.success(successMessage);

        // Extract user data from API response
        if (apiResponse.data) {
          try {
            const responseData = apiResponse.data as { user?: UserProfileData };

            if (
              responseData.user &&
              typeof responseData.user === "object" &&
              "id" in responseData.user
            ) {
              const userData = responseData.user as UserProfileData;

              // Merge all fields from form data with API response
              const mergedUserData: UserProfileData = {
                ...userData,
                // Basic profile fields
                title: formData.title.trim() || userData.title || null,
                bio: formData.bio.trim() || userData.bio || null,
                // Social media handles
                instagram_handle:
                  formData.instagram_handle?.trim() ||
                  userData.instagram_handle ||
                  null,
                tiktok_handle:
                  formData.tiktok_handle?.trim() ||
                  userData.tiktok_handle ||
                  null,
                youtube_handle:
                  formData.youtube_handle?.trim() ||
                  userData.youtube_handle ||
                  null,
                twitter_handle:
                  formData.twitter_handle?.trim() ||
                  userData.twitter_handle ||
                  null,
                // Social media follower/subscriber counts (map form plural to API singular)
                instagram_follower:
                  formData.instagram_followers?.trim() ||
                  userData.instagram_follower ||
                  null,
                tiktok_follower:
                  formData.tiktok_followers?.trim() ||
                  userData.tiktok_follower ||
                  null,
                youtube_subscribers:
                  formData.youtube_subscribers?.trim() ||
                  userData.youtube_subscribers ||
                  null,
                twitter_follower:
                  formData.twitter_followers?.trim() ||
                  userData.twitter_follower ||
                  null,
                // Ambassador-specific fields
                content_niche:
                  formData.content_niche?.trim() ||
                  userData.content_niche ||
                  null,
                focus: formData.content_niche?.trim() || userData.focus || null, // Also update focus for backward compatibility
                primary_platform:
                  formData.primary_platform?.trim() ||
                  userData.primary_platform ||
                  null,
                promotion_plan:
                  formData.promotion_plan?.trim() ||
                  userData.promotion_plan ||
                  null,
                // profile_image is already included from userData spread above
              };

              dispatch(setUser(mergedUserData));
            } else if (
              apiResponse.data &&
              typeof apiResponse.data === "object" &&
              "id" in apiResponse.data
            ) {
              const userData = apiResponse.data as unknown as UserProfileData;
              dispatch(setUser(userData));
            }
          } catch (error) {
            console.error(
              "Failed to parse user data from profile setup response:",
              error
            );
          }
        }

        // Mark step as submitted in Redux
        const stepData = {
          ...formData,
          profile_image: profileImage,
        };
        dispatch(
          markStepAsSubmitted({
            stepIndex: 1, // AmbassadorInfoStep is step 1
            stepKey: "personaDetails",
            data: stepData,
          })
        );

        onNext(stepData);
      } else {
        const errorMessage =
          language === "en"
            ? "Profile setup failed. Please try again."
            : "فشل إعداد الملف الشخصي. يرجى المحاولة مرة أخرى.";
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, language);
      console.error("Profile setup error:", errorMessage);
    }
  };

  // Form validation: at least one complete social media entry is required (handle + follower/subscriber count)
  const hasInstagram =
    watch("instagram_handle")?.trim() && watch("instagram_followers")?.trim();
  const hasTikTok =
    watch("tiktok_handle")?.trim() && watch("tiktok_followers")?.trim();
  const hasYouTube =
    watch("youtube_handle")?.trim() && watch("youtube_subscribers")?.trim();
  const hasTwitter =
    watch("twitter_handle")?.trim() && watch("twitter_followers")?.trim();

  const hasCompleteSocialMedia = hasInstagram || hasTikTok || hasYouTube || hasTwitter;

  const isFormValid =
    watch("title")?.trim() &&
    watch("bio")?.trim() &&
    watch("content_niche")?.trim() &&
    hasCompleteSocialMedia;

  return (
    <div className="glass border border-white/10 rounded-3xl p-8 md:p-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Megaphone className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-3xl text-white mb-2">{content.title}</h2>
          <p className="text-[#B9BBC6]">{content.subtitle}</p>
          {storedUser?.email && (
            <div
              className={`mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-white/70 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <Mail className="w-4 h-4 text-amber-300" />
              <span className="font-medium">
                {language === "en" ? "Contact email:" : "البريد الإلكتروني للتواصل:"}
              </span>
              <span className="text-white/80">{storedUser.email}</span>
            </div>
          )}
        </motion.div>

        {/* Pro Tip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3"
        >
          <Megaphone className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-400 text-sm mb-1">{content.tips.title}</p>
            <p className="text-[#B9BBC6] text-sm">{content.tips.message}</p>
          </div>
        </motion.div>

        {/* Form */}
        <div className="space-y-6">
          {/* Profile Photo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FileUploadField
              label={content.uploadPhoto}
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              value={profileImage}
              onFileChange={(file) => {
                if (
                  profileImagePreview &&
                  profileImagePreview.startsWith("blob:")
                ) {
                  URL.revokeObjectURL(profileImagePreview);
                }

                setProfileImage(file);
                setValue("profile_image", file);

                if (file) {
                  const previewUrl = URL.createObjectURL(file);
                  setProfileImagePreview(previewUrl);
                } else {
                  setProfileImagePreview(null);
                }
              }}
              isRTL={isRTL}
              formatText={
                language === "en"
                  ? "PNG, JPG up to 5MB"
                  : "PNG، JPG حتى 5 ميجابايت"
              }
            />
            {profileImagePreview && !profileImage && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-[#B9BBC6]">
                  {language === "en"
                    ? "Current profile image"
                    : "صورة الملف الشخصي الحالية"}
                </p>
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-white/10 bg-white/5">
                  <img
                    src={profileImagePreview}
                    alt="Current profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-white/40">
                  {language === "en"
                    ? "Upload new image to replace"
                    : "قم بتحميل صورة جديدة للاستبدال"}
                </p>
              </div>
            )}
          </motion.div>

          {/* Display Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <InputField
              {...register("title", {
                required:
                  language === "en"
                    ? "Display name is required"
                    : "اسم العرض مطلوب",
                minLength: {
                  value: 2,
                  message:
                    language === "en"
                      ? "Name must be at least 2 characters"
                      : "يجب أن يكون الاسم حرفين على الأقل",
                },
              })}
              label={content.displayName}
              placeholder={content.displayNamePlaceholder}
              icon={User}
              isRTL={isRTL}
              required
              error={errors.title?.message}
            />
          </motion.div>

          {/* Instagram Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 p-5 rounded-xl glass border border-white/5"
          >
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Instagram className="w-5 h-5 text-pink-400" />
              <h3 className="text-white">Instagram</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InputField
                {...register("instagram_handle")}
                label={content.instagram}
                placeholder={content.instagramPlaceholder}
                icon={Instagram}
                isRTL={isRTL}
                hideOptional
                error={errors.instagram_handle?.message}
              />

              <SelectField
                label={content.instagramFollowers}
                placeholder={content.instagramFollowersPlaceholder}
                icon={BarChart3}
                options={instagramFollowerOptions}
                value={watch("instagram_followers")}
                onValueChange={(value) => {
                  setValue("instagram_followers", value, {
                    shouldValidate: true,
                  });
                }}
                isRTL={isRTL}
                hideOptional
              />
            </div>
          </motion.div>

          {/* TikTok Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4 p-5 rounded-xl glass border border-white/5"
          >
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Video className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white">TikTok</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InputField
                {...register("tiktok_handle")}
                label={content.tiktok}
                placeholder={content.tiktokPlaceholder}
                icon={Video}
                isRTL={isRTL}
                hideOptional
                error={errors.tiktok_handle?.message}
              />

              <SelectField
                label={content.tiktokFollowers}
                placeholder={content.tiktokFollowersPlaceholder}
                icon={BarChart3}
                options={tiktokFollowerOptions}
                value={watch("tiktok_followers")}
                onValueChange={(value) => {
                  setValue("tiktok_followers", value, {
                    shouldValidate: true,
                  });
                }}
                isRTL={isRTL}
                hideOptional
              />
            </div>
          </motion.div>

          {/* YouTube Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-4 p-5 rounded-xl glass border border-white/5"
          >
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Youtube className="w-5 h-5 text-red-400" />
              <h3 className="text-white">YouTube</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InputField
                {...register("youtube_handle")}
                label={content.youtube}
                placeholder={content.youtubePlaceholder}
                icon={Youtube}
                isRTL={isRTL}
                hideOptional
                error={errors.youtube_handle?.message}
              />

              <SelectField
                label={content.youtubeSubscribers}
                placeholder={content.youtubeSubscribersPlaceholder}
                icon={BarChart3}
                options={youtubeSubscriberOptions}
                value={watch("youtube_subscribers")}
                onValueChange={(value) => {
                  setValue("youtube_subscribers", value, {
                    shouldValidate: true,
                  });
                }}
                isRTL={isRTL}
                hideOptional
              />
            </div>
          </motion.div>

          {/* Twitter Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-4 p-5 rounded-xl glass border border-white/5"
          >
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Twitter className="w-5 h-5 text-blue-400" />
              <h3 className="text-white">Twitter / X</h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <InputField
                {...register("twitter_handle")}
                label={content.twitter}
                placeholder={content.twitterPlaceholder}
                icon={Twitter}
                isRTL={isRTL}
                hideOptional
                error={errors.twitter_handle?.message}
              />

              <SelectField
                label={content.twitterFollowers}
                placeholder={content.twitterFollowersPlaceholder}
                icon={BarChart3}
                options={twitterFollowerOptions}
                value={watch("twitter_followers")}
                onValueChange={(value) => {
                  setValue("twitter_followers", value, {
                    shouldValidate: true,
                  });
                }}
                isRTL={isRTL}
                hideOptional
              />
            </div>
          </motion.div>

          {/* Primary Platform */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <SelectField
              label={content.primaryPlatform}
              placeholder={content.primaryPlatformPlaceholder}
              icon={Globe}
              options={platformOptions}
              value={watch("primary_platform")}
              onValueChange={(value) => {
                setValue("primary_platform", value, {
                  shouldValidate: true,
                });
              }}
              isRTL={isRTL}
            />
          </motion.div>

          {/* Content Niche */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <InputField
              {...register("content_niche", {
                required:
                  language === "en"
                    ? "Content niche is required"
                    : "تخصص المحتوى مطلوب",
              })}
              label={content.contentNiche}
              placeholder={content.contentNichePlaceholder}
              icon={Hash}
              isRTL={isRTL}
              required
              error={errors.content_niche?.message}
            />
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <TextareaField
              {...register("bio", {
                required:
                  language === "en"
                    ? "Bio is required"
                    : "السيرة الذاتية مطلوبة",
                minLength: {
                  value: 10,
                  message:
                    language === "en"
                      ? "Bio must be at least 10 characters"
                      : "يجب أن تكون السيرة الذاتية 10 أحرف على الأقل",
                },
                maxLength: {
                  value: 250,
                  message:
                    language === "en"
                      ? "Bio must not exceed 250 characters"
                      : "يجب ألا تتجاوز السيرة الذاتية 250 حرفاً",
                },
              })}
              label={content.bio}
              placeholder={content.bioPlaceholder}
              isRTL={isRTL}
              required
              error={errors.bio?.message}
              maxLength={250}
            />
            <p className="text-white/40 text-xs text-right mt-1">
              {watch("bio")?.length || 0}/250
            </p>
          </motion.div>

          {/* Promotion Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <TextareaField
              {...register("promotion_plan", {
                maxLength: {
                  value: 400,
                  message:
                    language === "en"
                      ? "Response must not exceed 400 characters"
                      : "يجب ألا يتجاوز الرد 400 حرفاً",
                },
              })}
              label={content.promotionPlanLabel}
              placeholder={content.promotionPlanPlaceholder}
              isRTL={isRTL}
              error={errors.promotion_plan?.message}
              maxLength={400}
            />
            <p className="text-white/40 text-xs text-right mt-1">
              {watch("promotion_plan")?.length || 0}/400
            </p>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05 }}
          className="flex gap-4 pt-8"
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
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading || !isFormValid}
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

