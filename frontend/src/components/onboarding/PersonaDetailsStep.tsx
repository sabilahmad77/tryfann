import { Button } from "@/components/ui/button";
import {
  FileUploadField,
  InputField,
  TextareaField,
  SelectField,
} from "@/components/ui/custom-form-elements";
import {
  useProfileSetupMutation,
  useGetArtistPriceRangeOptionsQuery,
} from "@/services/api/onboardingApi";
import { extractErrorMessage } from "@/utils/errorMessages";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  Gem,
  Globe,
  Instagram,
  Palette,
  TrendingUp,
  User,
  Users as UsersIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Oval } from "react-loader-spinner";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import {
  markStepAsSubmitted,
  selectIsStepSubmitted,
  selectSubmittedData,
} from "@/store/onboardingSlice";
import { setUser, type UserProfileData } from "@/store/authSlice";
import type { OnboardingData } from "./OnboardingFlow";

interface PersonaDetailsStepProps {
  language: "en" | "ar";
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
  data: OnboardingData;
}

interface PersonaDetailsFormData {
  title: string;
  bio: string;
  website: string;
  instagram_handle: string;
  focus: string;
  years_of_experience: string;
  profile_image: File | null;
  // Shared extra fields across personas
  location: string;
  phone_number: string;
  // Artist-specific fields
  price_range: string;
  preferred_commission_rate: string;
  shipping_preference: string;
  studio_address: string;
  education: string;
  award_artist: string;
  artist_statement: string;
  // Gallery-specific fields
  organization_email: string;
  organization_main_contact_name: string;
  organization_name: string;
  organization_type: string;
  founded_year: string;
  exhibition_count: string;
}

export function PersonaDetailsStep({
  language,
  onNext,
  onBack,
  data,
}: PersonaDetailsStepProps) {
  const dispatch = useDispatch();
  const isStepSubmitted = useSelector(
    (state: RootState) => selectIsStepSubmitted(state, 1) // Step 1 is PersonaDetailsStep
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

  // Artist price range options from API
  const { data: artistPriceRangeData } = useGetArtistPriceRangeOptionsQuery();

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
    {}) as Partial<PersonaDetailsFormData>;

  // Determine if title should be disabled (only for artist role)
  const isArtist = data.persona === "artist";
  const isTitleDisabled = isArtist;

  // Get initial title: use saved data if exists, otherwise use full name from user, otherwise empty
  const initialTitle = (savedData.title as string) || getFullNameFromUser() || "";

  const initialValues: PersonaDetailsFormData = {
    title: initialTitle,
    bio: (savedData.bio as string) || "",
    website: (savedData.website as string) || "",
    instagram_handle: (savedData.instagram_handle as string) || "",
    focus: (savedData.focus as string) || "",
    years_of_experience: (savedData.years_of_experience as string) || "",
    profile_image: (savedData.profile_image as File | null) || null,
    location: (savedData.location as string) || "",
    phone_number: (savedData.phone_number as string) || "",
    price_range: (savedData.price_range as string) || "",
    preferred_commission_rate:
      (savedData.preferred_commission_rate as string) || "",
    shipping_preference: (savedData.shipping_preference as string) || "",
    studio_address: (savedData.studio_address as string) || "",
    education: (savedData.education as string) || "",
    award_artist: (savedData.award_artist as string) || "",
    artist_statement: (savedData.artist_statement as string) || "",
    organization_email: (savedData.organization_email as string) || "",
    organization_main_contact_name:
      (savedData.organization_main_contact_name as string) || "",
    organization_name: (savedData.organization_name as string) || "",
    organization_type: (savedData.organization_type as string) || "",
    founded_year: (savedData.founded_year as string) || "",
    exhibition_count: (savedData.exhibition_count as string) || "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PersonaDetailsFormData>({
    defaultValues: initialValues,
  });

  // Watch form values to compare with submitted data
  const currentValues = watch();

  // Load profile image and form values from saved data when component mounts or data changes
  useEffect(() => {
    const savedProfileImage = savedData.profile_image;

    // Handle profile image - could be a File, URL string, or null
    if (savedProfileImage) {
      if (savedProfileImage instanceof File) {
        setProfileImage(savedProfileImage);
        setValue("profile_image", savedProfileImage);
        // Create preview URL for File
        const previewUrl = URL.createObjectURL(savedProfileImage);
        setProfileImagePreview(previewUrl);
      } else if (typeof savedProfileImage === "string") {
        // It's a URL, show it but don't set as File
        setProfileImagePreview(savedProfileImage);
        setProfileImage(null);
        setValue("profile_image", null);
      }
    } else {
      setProfileImage(null);
      setProfileImagePreview(null);
      setValue("profile_image", null);
    }

    // Reset form with saved values
    // For title: use saved data if exists, otherwise use full name from user (only if not already set)
    const titleValue = (savedData.title as string) || getFullNameFromUser() || "";
    reset({
      title: titleValue,
      bio: (savedData.bio as string) || "",
      website: (savedData.website as string) || "",
      instagram_handle: (savedData.instagram_handle as string) || "",
      focus: (savedData.focus as string) || "",
      years_of_experience: (savedData.years_of_experience as string) || "",
      profile_image:
        (savedProfileImage instanceof File ? savedProfileImage : null) || null,
      location: (savedData.location as string) || "",
      phone_number: (savedData.phone_number as string) || "",
      price_range: (savedData.price_range as string) || "",
      preferred_commission_rate:
        (savedData.preferred_commission_rate as string) || "",
      shipping_preference: (savedData.shipping_preference as string) || "",
      studio_address: (savedData.studio_address as string) || "",
      education: (savedData.education as string) || "",
      award_artist: (savedData.award_artist as string) || "",
      artist_statement: (savedData.artist_statement as string) || "",
      organization_email: (savedData.organization_email as string) || "",
      organization_main_contact_name:
        (savedData.organization_main_contact_name as string) || "",
      organization_name: (savedData.organization_name as string) || "",
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

    const submitted = submittedData as Partial<PersonaDetailsFormData>;

    // Compare text fields (ignore profile_image for comparison as File objects can't be compared)
    const textFieldsMatch =
      (currentValues.title?.trim() || "") ===
      ((submitted.title as string) || "") &&
      (currentValues.bio?.trim() || "") === ((submitted.bio as string) || "") &&
      (currentValues.website?.trim() || "") ===
      ((submitted.website as string) || "") &&
      (currentValues.instagram_handle?.trim() || "") ===
      ((submitted.instagram_handle as string) || "") &&
      (currentValues.focus?.trim() || "") ===
      ((submitted.focus as string) || "") &&
      (currentValues.years_of_experience?.trim() || "") ===
      ((submitted.years_of_experience as string) || "") &&
      (currentValues.location?.trim() || "") ===
      ((submitted.location as string) || "") &&
      (currentValues.phone_number?.trim() || "") ===
      ((submitted.phone_number as string) || "") &&
      (currentValues.price_range?.trim() || "") ===
      ((submitted.price_range as string) || "") &&
      (currentValues.preferred_commission_rate?.trim() || "") ===
      ((submitted.preferred_commission_rate as string) || "") &&
      (currentValues.shipping_preference?.trim() || "") ===
      ((submitted.shipping_preference as string) || "") &&
      (currentValues.studio_address?.trim() || "") ===
      ((submitted.studio_address as string) || "") &&
      (currentValues.education?.trim() || "") ===
      ((submitted.education as string) || "") &&
      (currentValues.award_artist?.trim() || "") ===
      ((submitted.award_artist as string) || "") &&
      (currentValues.artist_statement?.trim() || "") ===
      ((submitted.artist_statement as string) || "") &&
      (currentValues.organization_email?.trim() || "") ===
      ((submitted.organization_email as string) || "") &&
      (currentValues.organization_main_contact_name?.trim() || "") ===
      ((submitted.organization_main_contact_name as string) || "") &&
      (currentValues.organization_name?.trim() || "") ===
      ((submitted.organization_name as string) || "") &&
      (currentValues.organization_type?.trim() || "") ===
      ((submitted.organization_type as string) || "") &&
      (currentValues.founded_year?.trim() || "") ===
      ((submitted.founded_year as string) || "") &&
      (currentValues.exhibition_count?.trim() || "") ===
      ((submitted.exhibition_count as string) || "");

    // Profile image comparison - check if both are null or both are files
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
      title: "Tell us about yourself",
      subtitle: "Help us personalize your FANN experience",
      artist: {
        displayName: "Artist Name",
        displayNamePlaceholder: "Your professional name",
        bio: "Artist Bio",
        bioPlaceholder: "Tell us about your artistic journey and style...",
        // reverted label and placeholder to original wording
        specialization: "Art Medium/Style",
        specializationPlaceholder: "e.g., Contemporary, Abstract, Digital Art",
        experience: "Years of Experience",
        experiencePlaceholder: "5",
      },
      gallery: {
        displayName: "Gallery Name",
        displayNamePlaceholder: "Your gallery's name",
        bio: "Gallery Description",
        bioPlaceholder: "Tell us about your gallery, focus, and vision...",
        specialization: "Gallery Focus",
        specializationPlaceholder: "e.g., Modern Art, Sculpture, Photography",
        experience: "Years in Operation",
        experiencePlaceholder: "10",
        location: "Gallery Location",
        locationPlaceholder: "Dubai, UAE",
      },
      collector: {
        displayName: "Display Name",
        displayNamePlaceholder: "How should we call you?",
        bio: "About Your Collection",
        bioPlaceholder: "What drives your collecting passion?...",
        specialization: "Collection Focus",
        specializationPlaceholder:
          "e.g., MENA Artists, Contemporary Photography",
        experience: "Years Collecting",
        experiencePlaceholder: "7",
      },
      curator: {
        displayName: "Curator Name",
        displayNamePlaceholder: "Your professional name",
        bio: "Curatorial Background",
        bioPlaceholder: "Exhibitions, writing, and the perspectives you bring...",
        specialization: "Curatorial Focus",
        specializationPlaceholder: "e.g., Contemporary MENA, Photography, Sculpture",
        experience: "Years Curating",
        experiencePlaceholder: "6",
      },
      investor: {
        displayName: "Your Name",
        displayNamePlaceholder: "How should your advisor address you?",
        bio: "Collecting & Investment Background",
        bioPlaceholder: "Your interests, prior acquisitions, what you look for...",
        specialization: "Primary Interest",
        specializationPlaceholder: "e.g., Established painters, Emerging artists",
        experience: "Years Involved in Art",
        experiencePlaceholder: "4",
      },
      common: {
        website: "Website",
        websitePlaceholder: "https://yourwebsite.com",
        instagram: "Instagram Handle",
        instagramPlaceholder: "@yourusername",
        // Used as Country for non-gallery personas (artists, collectors, etc.)
        location: "Country",
        locationPlaceholder: "Country",
        phone: "Phone Number",
        phonePlaceholder: "+971 50 123 4567",
        uploadPhoto: "Upload Profile Photo",
        optional: "(Optional)",
        required: "Required fields",
      },
      back: "Back",
      continue: "Continue",
      next: "Next",
    },
    ar: {
      title: "أخبرنا عن نفسك",
      subtitle: "ساعدنا في تخصيص تجربتك في FANN",
      artist: {
        displayName: "اسم الفنان",
        displayNamePlaceholder: "اسمك المهني",
        bio: "السيرة الفنية",
        bioPlaceholder: "أخبرنا عن رحلتك الفنية وأسلوبك...",
        specialization: "الوسيط/الأسلوب الفني",
        specializationPlaceholder: "مثلاً: معاصر، تجريدي، فن رقمي",
        experience: "سنوات الخبرة",
        experiencePlaceholder: "5",
      },
      gallery: {
        displayName: "اسم المعرض",
        displayNamePlaceholder: "اسم معرضك",
        bio: "وصف المعرض",
        bioPlaceholder: "أخبرنا عن معرضك وتركيزك ورؤيتك...",
        specialization: "تركيز المعرض",
        specializationPlaceholder:
          "مثلاً: الفن الحديث، النحت، التصوير الفوتوغرافي",
        experience: "سنوات التشغيل",
        experiencePlaceholder: "10",
        location: "موقع المعرض",
        locationPlaceholder: "دبي، الإمارات",
      },
      collector: {
        displayName: "الاسم المعروض",
        displayNamePlaceholder: "كيف يجب أن نناديك؟",
        bio: "عن مجموعتك",
        bioPlaceholder: "ما الذي يحرك شغفك بالجمع؟...",
        specialization: "تركيز المجموعة",
        specializationPlaceholder:
          "مثلاً: فنانو منطقة الشرق الأوسط، التصوير المعاصر",
        experience: "سنوات الجمع",
        experiencePlaceholder: "7",
      },
      curator: {
        displayName: "اسم المنسّق",
        displayNamePlaceholder: "اسمك المهني",
        bio: "الخلفية التنسيقية",
        bioPlaceholder: "المعارض والكتابة والرؤى التي تقدّمها...",
        specialization: "التركيز التنسيقي",
        specializationPlaceholder: "مثلاً: المعاصر في المنطقة، التصوير، النحت",
        experience: "سنوات التنسيق",
        experiencePlaceholder: "6",
      },
      investor: {
        displayName: "اسمك",
        displayNamePlaceholder: "كيف يخاطبك مستشارك؟",
        bio: "خلفية الاقتناء والاستثمار",
        bioPlaceholder: "اهتماماتك ومقتنياتك السابقة وما تبحث عنه...",
        specialization: "الاهتمام الأساسي",
        specializationPlaceholder: "مثلاً: رسامون راسخون، فنانون صاعدون",
        experience: "سنوات الانخراط في الفن",
        experiencePlaceholder: "4",
      },
      common: {
        website: "الموقع الإلكتروني",
        websitePlaceholder: "https://yourwebsite.com",
        instagram: "حساب إنستغرام",
        instagramPlaceholder: "@yourusername",
        // Used as Country for non-gallery personas (artists، الجامعين، إلخ)
        location: "الدولة",
        locationPlaceholder: "الدولة",
        phone: "رقم الهاتف",
        phonePlaceholder: "+971 50 123 4567",
        uploadPhoto: "تحميل صورة الملف الشخصي",
        optional: "(اختياري)",
        required: "الحقول المطلوبة",
      },
      back: "رجوع",
      continue: "متابعة",
      next: "التالي",
    },
  };

  const content = t[language];
  // Transform artist price range API response into SelectField options
  const priceRangeOptions: Array<{ value: string; label: string }> = (() => {
    if (!artistPriceRangeData) return [];
    try {
      const response = artistPriceRangeData as {
        data?: Array<{
          id?: number;
          range?: string;
          name?: string;
          value?: string;
          label?: string;
        }> | string[];
      };
      if (!response.data) return [];

      const { data } = response;

      if (Array.isArray(data)) {
        if (data.length > 0 && typeof data[0] === "string") {
          return (data as string[]).map((opt) => ({
            value: opt,
            label: opt,
          }));
        }

        if (data.length > 0 && typeof data[0] === "object") {
          return (data as Array<{
            id?: number;
            range?: string;
            name?: string;
            value?: string;
            label?: string;
          }>).map((item) => {
            const label =
              item.range || item.name || item.value || item.label || "";
            const id = item.id ?? label;
            return {
              value: String(id),
              label: label,
            };
          });
        }
      }
      return [];
    } catch (e) {
      console.error("Failed to transform artist price range options", e);
      return [];
    }
  })();
  const personaContent =
    data.persona && typeof data.persona === "string" && data.persona in content
      ? (content[data.persona as keyof typeof content] as (typeof content)["artist"])
      : content.artist;

  const icons = {
    artist: Palette,
    gallery: Building2,
    collector: Gem,
    curator: UsersIcon,
    investor: TrendingUp,
  };

  const Icon = icons[data.persona as keyof typeof icons] || Palette;
  const isGallery = data.persona === "gallery";
  const isCollector = data.persona === "collector";

  const onSubmit = async (formData: PersonaDetailsFormData) => {
    // If step was already submitted and no changes, just proceed without API call
    if (shouldShowNext) {
      onNext({ ...formData, profile_image: profileImage });
      return;
    }

    try {
      const profileData = {
        title: formData.title.trim(),
        bio: formData.bio.trim(),
        website: formData.website?.trim() || undefined,
        instagram_handle: formData.instagram_handle?.trim() || undefined,
        focus: formData.focus?.trim() || undefined,
        years_of_experience: formData.years_of_experience
          ? Number(formData.years_of_experience)
          : undefined,
        profile_image: profileImage || undefined,
        // Shared extra fields
        location: formData.location?.trim() || undefined,
        phone_number: formData.phone_number?.trim() || undefined,
        // Artist & Collector: use price_range for both (artists = price, collectors = budget)
        price_range:
          isArtist || isCollector
            ? formData.price_range?.trim() || undefined
            : undefined,
        preferred_commission_rate: isArtist
          ? formData.preferred_commission_rate?.trim() || undefined
          : undefined,
        shipping_preference: isArtist
          ? formData.shipping_preference?.trim() || undefined
          : undefined,
        studio_address: isArtist
          ? formData.studio_address?.trim() || undefined
          : undefined,
        education: isArtist
          ? formData.education?.trim() || undefined
          : undefined,
        award_artist: isArtist
          ? formData.award_artist?.trim() || undefined
          : undefined,
        artist_statement: isArtist
          ? formData.artist_statement?.trim() || undefined
          : undefined,
        // Gallery-specific
        organization_email: isGallery
          ? formData.organization_email?.trim() || undefined
          : undefined,
        organization_main_contact_name: isGallery
          ? formData.organization_main_contact_name?.trim() || undefined
          : undefined,
        organization_name: isGallery
          ? formData.organization_name?.trim() || undefined
          : undefined,
        organization_type: isGallery
          ? formData.organization_type?.trim() || undefined
          : undefined,
        founded_year: isGallery
          ? formData.founded_year?.trim() || undefined
          : undefined,
        exhibition_count: isGallery && formData.exhibition_count?.trim()
          ? Number(formData.exhibition_count.trim())
          : undefined,
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
              ? "Profile setup completed successfully!"
              : "تم إعداد الملف الشخصي بنجاح!";
        }

        toast.success(successMessage);

        // Extract user data from API response
        // API response structure: { success, status_code, message, data: { user: {...} } }
        if (apiResponse.data) {
          try {
            const responseData = apiResponse.data as { user?: UserProfileData };

            // Check if data contains user object
            if (
              responseData.user &&
              typeof responseData.user === "object" &&
              "id" in responseData.user
            ) {
              const userData = responseData.user as UserProfileData;

              // Merge all fields from form data with API response
              const mergedUserData: UserProfileData = {
                ...userData,
                // Common profile fields
                title: formData.title.trim() || userData.title || null,
                bio: formData.bio.trim() || userData.bio || null,
                website: formData.website?.trim()
                  ? (formData.website.trim() as string | string[])
                  : userData.website,
                instagram_handle:
                  formData.instagram_handle?.trim() ||
                  userData.instagram_handle ||
                  null,
                focus: formData.focus?.trim() || userData.focus || null,
                years_of_experience: formData.years_of_experience
                  ? Number(formData.years_of_experience)
                  : userData.years_of_experience || null,
                location:
                  formData.location?.trim() || userData.location || null,
                phone_number:
                  formData.phone_number?.trim() || userData.phone_number || null,
                // Artist & Collector: use price_range for both (artists = price, collectors = budget)
                ...(isArtist || isCollector
                  ? {
                    price_range:
                      formData.price_range?.trim() ||
                      userData.price_range ||
                      null,
                  }
                  : {}),
                // Artist-specific extra fields (only if persona is artist)
                ...(isArtist && {
                  preferred_commission_rate:
                    formData.preferred_commission_rate?.trim() ||
                    userData.preferred_commission_rate ||
                    null,
                  shipping_preference:
                    formData.shipping_preference?.trim() ||
                    userData.shipping_preference ||
                    null,
                  studio_address:
                    formData.studio_address?.trim() ||
                    userData.studio_address ||
                    null,
                  education:
                    formData.education?.trim() || userData.education || null,
                  award_artist:
                    formData.award_artist?.trim() || userData.award_artist || null,
                  artist_statement:
                    formData.artist_statement?.trim() ||
                    userData.artist_statement ||
                    null,
                }),
                // Gallery-specific fields (only if persona is gallery)
                ...(isGallery && {
                  organization_email:
                    formData.organization_email?.trim() ||
                    userData.organization_email ||
                    null,
                  organization_main_contact_name:
                    formData.organization_main_contact_name?.trim() ||
                    userData.organization_main_contact_name ||
                    null,
                  organization_name:
                    formData.organization_name?.trim() ||
                    userData.organization_name ||
                    null,
                  organization_type:
                    formData.organization_type?.trim() ||
                    userData.organization_type ||
                    null,
                  founded_year:
                    formData.founded_year?.trim() ||
                    userData.founded_year ||
                    null,
                  exhibition_count: formData.exhibition_count?.trim()
                    ? Number(formData.exhibition_count.trim())
                    : userData.exhibition_count || null,
                }),
                // profile_image is already included from userData spread above
              };

              dispatch(setUser(mergedUserData));
            } else if (
              apiResponse.data &&
              typeof apiResponse.data === "object" &&
              "id" in apiResponse.data
            ) {
              // Fallback: API response data might be the user object directly
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
        const stepData = { ...formData, profile_image: profileImage };
        dispatch(
          markStepAsSubmitted({
            stepIndex: 1, // PersonaDetailsStep is step 1
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
            <Icon className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-3xl text-white mb-2">{content.title}</h2>
          <p className="text-[#B9BBC6]">{content.subtitle}</p>
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
              label={content.common.uploadPhoto}
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              value={profileImage}
              onFileChange={(file) => {
                // Cleanup old preview URL if it was a blob URL
                if (
                  profileImagePreview &&
                  profileImagePreview.startsWith("blob:")
                ) {
                  URL.revokeObjectURL(profileImagePreview);
                }

                setProfileImage(file);
                setValue("profile_image", file);

                // Create preview URL for new file
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
              labelClassName="text-white/80 text-sm"
              buttonClassName="border-white/20 hover:border-amber-500/50 hover:bg-amber-500/10 text-white/70 hover:text-white"
            />
            {/* Show current profile image preview if exists and no new file selected */}
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

          {/* Display Name / Title */}
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
              label={personaContent.displayName}
              placeholder={personaContent.displayNamePlaceholder}
              icon={User}
              isRTL={isRTL}
              required
              disabled={isTitleDisabled}
              error={errors.title?.message}
            />
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
              })}
              label={personaContent.bio}
              placeholder={personaContent.bioPlaceholder}
              isRTL={isRTL}
              required
              error={errors.bio?.message}
            />
          </motion.div>

          {/* Two Column Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Specialization / Focus */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <InputField
                {...register("focus")}
                label={personaContent.specialization}
                placeholder={personaContent.specializationPlaceholder}
                isRTL={isRTL}
                error={errors.focus?.message}
              />
            </motion.div>

            {/* Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <InputField
                {...register("years_of_experience", {
                  pattern: {
                    value: /^\d+$/,
                    message:
                      language === "en"
                        ? "Please enter a valid number"
                        : "يرجى إدخال رقم صحيح",
                  },
                })}
                label={personaContent.experience}
                type="number"
                placeholder={personaContent.experiencePlaceholder}
                isRTL={isRTL}
                error={errors.years_of_experience?.message}
              />
            </motion.div>
          </div>

          {/* Location & Phone */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <InputField
                {...register("location")}
                label={
                  isGallery
                    ? content.gallery.location
                    : content.common.location
                }
                placeholder={
                  isGallery
                    ? content.gallery.locationPlaceholder
                    : content.common.locationPlaceholder
                }
                icon={Globe}
                isRTL={isRTL}
                error={errors.location?.message}
              />
            </motion.div>

            {/* Phone Number */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <InputField
                {...register("phone_number")}
                label={content.common.phone}
                type="tel"
                placeholder={content.common.phonePlaceholder}
                isRTL={isRTL}
                error={errors.phone_number?.message}
              />
            </motion.div>
          </div>

          {/* Social Links */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Website */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <InputField
                {...register("website", {
                  pattern: {
                    value: /^https?:\/\/.+/,
                    message:
                      language === "en"
                        ? "Please enter a valid URL"
                        : "يرجى إدخال رابط صحيح",
                  },
                })}
                label={content.common.website}
                type="url"
                placeholder={content.common.websitePlaceholder}
                icon={Globe}
                isRTL={isRTL}
                error={errors.website?.message}
              />
            </motion.div>

            {/* Instagram */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <InputField
                {...register("instagram_handle")}
                label={content.common.instagram}
                placeholder={content.common.instagramPlaceholder}
                icon={Instagram}
                isRTL={isRTL}
                error={errors.instagram_handle?.message}
              />
            </motion.div>
          </div>

          {/* Artist & Collector extra fields (price/budget range etc.) */}
          {(isArtist || isCollector) && (
            <div className="space-y-6 mt-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <SelectField
                    label={
                      language === "en"
                        ? isCollector
                          ? "Budget Range"
                          : "Price Range"
                        : isCollector
                          ? "نطاق الميزانية"
                          : "نطاق الأسعار"
                    }
                    placeholder={
                      language === "en"
                        ? isCollector
                          ? "Select your typical budget range"
                          : "Select price range"
                        : isCollector
                          ? "اختر نطاق ميزانيتك المعتاد"
                          : "اختر نطاق الأسعار"
                    }
                    options={priceRangeOptions}
                    value={watch("price_range")}
                    onValueChange={(value) =>
                      setValue("price_range", value, { shouldValidate: true })
                    }
                    isRTL={isRTL}
                    error={errors.price_range?.message}
                  />
                  {isArtist && (
                    <InputField
                      {...register("preferred_commission_rate")}
                      label={
                        language === "en"
                          ? "Preferred Commission Rate (%)"
                          : "نسبة العمولة المفضلة (%)"
                      }
                      type="number"
                      placeholder={language === "en" ? "10" : "10"}
                      isRTL={isRTL}
                      error={errors.preferred_commission_rate?.message}
                    />
                  )}
                </div>
              </motion.div>

              {isArtist && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <InputField
                        {...register("shipping_preference")}
                        label={
                          language === "en"
                            ? "Shipping Preference"
                            : "تفضيلات الشحن"
                        }
                        placeholder={
                          language === "en"
                            ? "e.g. Local, International, Both"
                            : "مثال: محلي، دولي، كلاهما"
                        }
                        isRTL={isRTL}
                        error={errors.shipping_preference?.message}
                      />
                      <InputField
                        {...register("studio_address")}
                        label={
                          language === "en"
                            ? "Studio Address"
                            : "عنوان الاستوديو"
                        }
                        placeholder={
                          language === "en"
                            ? "Studio address"
                            : "عنوان الاستوديو"
                        }
                        isRTL={isRTL}
                        error={errors.studio_address?.message}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85 }}
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      <InputField
                        {...register("education")}
                        label={language === "en" ? "Education" : "التعليم"}
                        placeholder={
                          language === "en"
                            ? "Art education or background"
                            : "التعليم أو الخلفية الفنية"
                        }
                        isRTL={isRTL}
                        error={errors.education?.message}
                      />
                      <InputField
                        {...register("award_artist")}
                        label={
                          language === "en"
                            ? "Awards / Honors"
                            : "الجوائز / التكريم"
                        }
                        placeholder={
                          language === "en"
                            ? "Key awards or recognitions"
                            : "الجوائز أو التكريمات البارزة"
                        }
                        isRTL={isRTL}
                        error={errors.award_artist?.message}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <TextareaField
                      {...register("artist_statement")}
                      label={
                        language === "en"
                          ? "Artist Statement"
                          : "بيان الفنان"
                      }
                      placeholder={
                        language === "en"
                          ? "Share your artistic philosophy or statement..."
                          : "شارك فلسفتك أو بيانك الفني..."
                      }
                      isRTL={isRTL}
                      error={errors.artist_statement?.message}
                    />
                  </motion.div>
                </>
              )}
            </div>
          )}

          {/* Gallery extra organization fields */}
          {isGallery && (
            <div className="space-y-6 mt-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <InputField
                    {...register("organization_name")}
                    label={
                      language === "en"
                        ? "Organization Name"
                        : "اسم المؤسسة"
                    }
                    placeholder={
                      language === "en"
                        ? "Gallery or organization name"
                        : "اسم المعرض أو المؤسسة"
                    }
                    isRTL={isRTL}
                    error={errors.organization_name?.message}
                  />
                  <InputField
                    {...register("organization_email")}
                    label={
                      language === "en"
                        ? "Organization Email"
                        : "البريد الإلكتروني للمؤسسة"
                    }
                    type="email"
                    placeholder="org@example.com"
                    isRTL={isRTL}
                    error={errors.organization_email?.message}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <InputField
                    {...register("organization_main_contact_name")}
                    label={
                      language === "en"
                        ? "Main Contact Name"
                        : "اسم جهة الاتصال الرئيسية"
                    }
                    placeholder={
                      language === "en"
                        ? "Primary contact person"
                        : "الشخص الأساسي للتواصل"
                    }
                    isRTL={isRTL}
                    error={errors.organization_main_contact_name?.message}
                  />
                  <SelectField
                    label={
                      language === "en"
                        ? "Organization Type"
                        : "نوع المؤسسة / المعرض"
                    }
                    placeholder={
                      language === "en"
                        ? "Select organization type"
                        : "اختر نوع المؤسسة"
                    }
                    options={[
                      {
                        value: "commercial",
                        label:
                          language === "en"
                            ? "Commercial / For-profit"
                            : "تجاري / هادف للربح",
                      },
                      {
                        value: "non_profit",
                        label:
                          language === "en" ? "Non-profit" : "غير ربحي",
                      },
                      {
                        value: "public_museum",
                        label:
                          language === "en"
                            ? "Public Museum"
                            : "متحف عام",
                      },
                      {
                        value: "private_collection",
                        label:
                          language === "en"
                            ? "Private Collection"
                            : "مجموعة خاصة",
                      },
                      {
                        value: "other",
                        label:
                          language === "en" ? "Other" : "أخرى",
                      },
                    ]}
                    value={watch("organization_type")}
                    onValueChange={(value) =>
                      setValue("organization_type", value, {
                        shouldValidate: true,
                      })
                    }
                    isRTL={isRTL}
                    error={errors.organization_type?.message}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <InputField
                    {...register("founded_year", {
                      pattern: {
                        value: /^\d{4}$/,
                        message:
                          language === "en"
                            ? "Enter a valid year (e.g. 2005)"
                            : "أدخل سنة صحيحة (مثال: 2005)",
                      },
                    })}
                    label={
                      language === "en" ? "Founded Year" : "سنة التأسيس"
                    }
                    type="number"
                    placeholder={
                      language === "en" ? "e.g. 2005" : "مثال: 2005"
                    }
                    isRTL={isRTL}
                    error={errors.founded_year?.message}
                  />
                  <InputField
                    {...register("exhibition_count", {
                      pattern: {
                        value: /^\d+$/,
                        message:
                          language === "en"
                            ? "Please enter a valid number"
                            : "يرجى إدخال رقم صحيح",
                      },
                    })}
                    label={
                      language === "en"
                        ? "Number of Exhibitions"
                        : "عدد المعارض"
                    }
                    type="number"
                    placeholder={
                      language === "en" ? "e.g. 12" : "مثال: 12"
                    }
                    isRTL={isRTL}
                    error={errors.exhibition_count?.message}
                  />
                </div>
              </motion.div>
            </div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-4 pt-6"
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
              disabled={isLoading}
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
    </div>
  );
}
