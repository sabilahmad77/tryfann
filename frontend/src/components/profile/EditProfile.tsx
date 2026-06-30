import { Button } from "@/components/ui/button";
import {
  FileUploadField,
  InputField,
  TextareaField,
  SelectField,
} from "@/components/ui/custom-form-elements";
import { ImagePreviewList } from "@/components/ui/image-preview-list";
import { CustomModal } from "@/components/ui/CustomModal";
import {
  useProfileSetupMutation,
  useGetArtistPriceRangeOptionsQuery,
} from "@/services/api/onboardingApi";
import type { UserProfileData } from "@/store/authSlice";
import { setUser, updateUser } from "@/store/authSlice";
import type { RootState } from "@/store/store";
import { extractErrorMessage } from "@/utils/errorMessages";
import {
  type PreviewItem,
  normalizeToPreviewItems,
  cleanupPreviewUrls,
  getFullImageUrl,
} from "@/utils/filePreviewHelpers";
import {
  ArrowRight,
  Building2,
  Gem,
  Globe,
  Instagram,
  MapPin,
  Palette,
  Phone,
  TrendingUp,
  User,
  Users as UsersIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Oval } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

interface EditProfileProps {
  open: boolean;
  onClose: () => void;
  language: "en" | "ar";
  initialData?: {
    title?: string;
    bio?: string;
    website?: string;
    instagram_handle?: string;
    focus?: string;
    years_of_experience?: string;
    profile_image?: File | string | null;
    persona?: string;
    location?: string;
    phone_number?: string;
    // Artist & Collector shared field
    price_range?: string;
    // Artist-specific fields
    preferred_commission_rate?: string;
    shipping_preference?: string;
    studio_address?: string;
    education?: string;
    award_artist?: string;
    artist_statement?: string;
    // Gallery-specific fields
    organization_email?: string;
    organization_main_contact_name?: string;
    organization_name?: string;
    organization_type?: string;
    founded_year?: string;
    exhibition_count?: string;
  };
}

interface EditProfileFormData {
  title: string;
  bio: string;
  website: string;
  instagram_handle: string;
  focus: string;
  years_of_experience: string;
  profile_image: File | null;
  location: string;
  phone_number: string;
  // Artist & Collector shared field
  price_range: string;
  // Artist-specific fields
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

export function EditProfile({
  open,
  onClose,
  language,
  initialData,
}: EditProfileProps) {
  const dispatch = useDispatch();
  const persona = useSelector((state: RootState) => state.auth.persona) as
    | string
    | null;
  const storedUser = useSelector((state: RootState) => state.auth.user);

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreviews, setProfileImagePreviews] = useState<PreviewItem[]>([]);
  const [profileSetup, { isLoading }] = useProfileSetupMutation();

  const isArtist = persona === "artist" || initialData?.persona === "artist";
  const isGallery = persona === "gallery" || initialData?.persona === "gallery";
  const isCollector =
    persona === "collector" || initialData?.persona === "collector";

  // Artist price range options from API (for artist and collector personas)
  const { data: artistPriceRangeData } = useGetArtistPriceRangeOptionsQuery(
    undefined,
    { skip: !isArtist && !isCollector }
  );

  const normalizedInitialPriceRange =
    initialData?.price_range !== undefined && initialData?.price_range !== null
      ? String(initialData.price_range)
      : "";

  const initialValues: EditProfileFormData = {
    title: initialData?.title || "",
    bio: initialData?.bio || "",
    website: initialData?.website || "",
    instagram_handle: initialData?.instagram_handle || "",
    focus: initialData?.focus || "",
    years_of_experience: initialData?.years_of_experience || "",
    profile_image: null,
    location: initialData?.location || "",
    phone_number: initialData?.phone_number || "",
    price_range: normalizedInitialPriceRange,
    preferred_commission_rate: initialData?.preferred_commission_rate || "",
    shipping_preference: initialData?.shipping_preference || "",
    studio_address: initialData?.studio_address || "",
    education: initialData?.education || "",
    award_artist: initialData?.award_artist || "",
    artist_statement: initialData?.artist_statement || "",
    organization_email: initialData?.organization_email || "",
    organization_main_contact_name:
      initialData?.organization_main_contact_name || "",
    organization_name: initialData?.organization_name || "",
    organization_type: initialData?.organization_type || "",
    founded_year: initialData?.founded_year || "",
    exhibition_count: initialData?.exhibition_count || "",
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<EditProfileFormData>({
    defaultValues: initialValues,
  });

  const watchedPriceRange = watch("price_range");
  const watchedOrganizationType = watch("organization_type");

  // Load initial values when dialog opens or initialData changes
  useEffect(() => {
    if (open && initialData) {
      const resetPriceRange =
        initialData.price_range !== undefined && initialData.price_range !== null
          ? String(initialData.price_range)
          : "";

      reset({
        title: initialData.title || "",
        bio: initialData.bio || "",
        website: initialData.website || "",
        instagram_handle: initialData.instagram_handle || "",
        focus: initialData.focus || "",
        years_of_experience: initialData.years_of_experience || "",
        profile_image: null,
        location: initialData.location || "",
        phone_number: initialData.phone_number || "",
        price_range: resetPriceRange,
        preferred_commission_rate: initialData.preferred_commission_rate || "",
        shipping_preference: initialData.shipping_preference || "",
        studio_address: initialData.studio_address || "",
        education: initialData.education || "",
        award_artist: initialData.award_artist || "",
        artist_statement: initialData.artist_statement || "",
        organization_email: initialData.organization_email || "",
        organization_main_contact_name:
          initialData.organization_main_contact_name || "",
        organization_name: initialData.organization_name || "",
        organization_type: initialData.organization_type || "",
        founded_year: initialData.founded_year || "",
        exhibition_count: initialData.exhibition_count || "",
      });

      // Handle profile image - could be a File, URL string, or null
      if (initialData.profile_image) {
        if (initialData.profile_image instanceof File) {
          setProfileImage(initialData.profile_image);
          setValue("profile_image", initialData.profile_image);
          // Create preview items from File
          const previews = normalizeToPreviewItems(initialData.profile_image);
          setProfileImagePreviews(previews);
        } else if (typeof initialData.profile_image === "string") {
          // It's a URL, show it but don't set as File
          const fullUrl = getFullImageUrl(initialData.profile_image);
          if (fullUrl) {
            const previews = normalizeToPreviewItems(fullUrl);
            setProfileImagePreviews(previews);
          } else {
            setProfileImagePreviews([]);
          }
          setProfileImage(null);
          setValue("profile_image", null);
        }
      } else {
        setProfileImage(null);
        setProfileImagePreviews([]);
        setValue("profile_image", null);
      }
      // Ensure SelectField sees the normalized value
      if (resetPriceRange) {
        setValue("price_range", resetPriceRange, { shouldValidate: false });
      }
    }
  }, [open, initialData, reset, setValue]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrls(profileImagePreviews);
    };
  }, [profileImagePreviews]);

  const isRTL = language === "ar";

  const t = {
    en: {
      title: "Edit Profile",
      subtitle: "Update your profile information",
      artist: {
        displayName: "Artist Name",
        displayNamePlaceholder: "Your professional name",
        bio: "Artist Bio",
        bioPlaceholder: "Tell us about your artistic journey and style...",
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
        displayName: "Professional Name",
        displayNamePlaceholder: "Your curatorial name",
        bio: "Curatorial Statement",
        bioPlaceholder: "Share your curatorial approach and philosophy...",
        specialization: "Curatorial Expertise",
        specializationPlaceholder: "e.g., Contemporary Art, Cultural Heritage",
        experience: "Years of Experience",
        experiencePlaceholder: "8",
      },
      investor: {
        displayName: "Name/Organization",
        displayNamePlaceholder: "Your name or company",
        bio: "Investment Philosophy",
        bioPlaceholder: "What guides your art investment decisions?...",
        specialization: "Investment Focus",
        specializationPlaceholder: "e.g., Emerging Artists, Blue-chip Art",
        experience: "Years Investing",
        experiencePlaceholder: "5",
      },
      common: {
        website: "Website",
        websitePlaceholder: "https://yourwebsite.com",
        instagram: "Instagram Handle",
        instagramPlaceholder: "@yourusername or https://instagram.com/username",
        location: "Location",
        locationPlaceholder: "e.g., Dubai, UAE",
        phone: "Phone Number",
        phonePlaceholder: "e.g., +971 50 123 4567",
        uploadPhoto: "Upload Profile Photo",
        optional: "(Optional)",
        required: "Required fields",
        priceRangeArtist: "Price Range",
        priceRangeCollector: "Budget Range",
        priceRangeArtistPlaceholder: "Select price range",
        priceRangeCollectorPlaceholder: "Select your typical budget range",
        preferredCommissionRate: "Preferred Commission Rate (%)",
        preferredCommissionRatePlaceholder: "10",
        shippingPreference: "Shipping Preference",
        shippingPreferencePlaceholder: "e.g. Local, International, Both",
        studioAddress: "Studio Address",
        studioAddressPlaceholder: "Studio address",
        education: "Education",
        educationPlaceholder: "Art education or background",
        awardArtist: "Awards / Honors",
        awardArtistPlaceholder: "Key awards or recognitions",
        artistStatement: "Artist Statement",
        artistStatementPlaceholder:
          "Share your artistic philosophy or statement...",
        organizationName: "Organization Name",
        organizationNamePlaceholder: "Gallery or organization name",
        organizationEmail: "Organization Email",
        organizationEmailPlaceholder: "org@example.com",
        mainContactName: "Main Contact Name",
        mainContactNamePlaceholder: "Primary contact person",
        organizationType: "Organization Type",
        organizationTypePlaceholder: "Select organization type",
        foundedYear: "Founded Year",
        foundedYearPlaceholder: "e.g. 2005",
        exhibitionCount: "Number of Exhibitions",
        exhibitionCountPlaceholder: "e.g. 12",
      },
      cancel: "Cancel",
      save: "Save Changes",
      saving: "Saving...",
    },
    ar: {
      title: "تعديل الملف الشخصي",
      subtitle: "قم بتحديث معلومات ملفك الشخصي",
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
        displayName: "الاسم المهني",
        displayNamePlaceholder: "اسمك التنسيقي",
        bio: "البيان التنسيقي",
        bioPlaceholder: "شارك نهجك وفلسفتك التنسيقية...",
        specialization: "الخبرة التنسيقية",
        specializationPlaceholder: "مثلاً: الفن المعاصر، التراث الثقافي",
        experience: "سنوات الخبرة",
        experiencePlaceholder: "8",
      },
      investor: {
        displayName: "الاسم/المؤسسة",
        displayNamePlaceholder: "اسمك أو شركتك",
        bio: "فلسفة الاستثمار",
        bioPlaceholder: "ما الذي يوجه قرارات استثمارك الفني؟...",
        specialization: "تركيز الاستثمار",
        specializationPlaceholder: "مثلاً: الفنانون الناشئون، الفن الممتاز",
        experience: "سنوات الاستثمار",
        experiencePlaceholder: "5",
      },
      common: {
        website: "الموقع الإلكتروني",
        websitePlaceholder: "https://yourwebsite.com",
        instagram: "حساب إنستغرام",
        instagramPlaceholder: "@yourusername أو https://instagram.com/username",
        location: "الموقع",
        locationPlaceholder: "مثلاً: دبي، الإمارات",
        phone: "رقم الهاتف",
        phonePlaceholder: "مثلاً: 971 50 123 4567+",
        uploadPhoto: "تحميل صورة الملف الشخصي",
        optional: "(اختياري)",
        required: "الحقول المطلوبة",
        priceRangeArtist: "نطاق الأسعار",
        priceRangeCollector: "نطاق الميزانية",
        priceRangeArtistPlaceholder: "اختر نطاق الأسعار",
        priceRangeCollectorPlaceholder: "اختر نطاق ميزانيتك المعتاد",
        preferredCommissionRate: "نسبة العمولة المفضلة (%)",
        preferredCommissionRatePlaceholder: "10",
        shippingPreference: "تفضيلات الشحن",
        shippingPreferencePlaceholder: "مثال: محلي، دولي، كلاهما",
        studioAddress: "عنوان الاستوديو",
        studioAddressPlaceholder: "عنوان الاستوديو",
        education: "التعليم",
        educationPlaceholder: "التعليم أو الخلفية الفنية",
        awardArtist: "الجوائز / التكريم",
        awardArtistPlaceholder: "الجوائز أو التكريمات البارزة",
        artistStatement: "بيان الفنان",
        artistStatementPlaceholder: "شارك فلسفتك أو بيانك الفني...",
        organizationName: "اسم المؤسسة",
        organizationNamePlaceholder: "اسم المعرض أو المؤسسة",
        organizationEmail: "البريد الإلكتروني للمؤسسة",
        organizationEmailPlaceholder: "org@example.com",
        mainContactName: "اسم جهة الاتصال الرئيسية",
        mainContactNamePlaceholder: "الشخص الأساسي للتواصل",
        organizationType: "نوع المؤسسة / المعرض",
        organizationTypePlaceholder: "اختر نوع المؤسسة",
        foundedYear: "سنة التأسيس",
        foundedYearPlaceholder: "مثال: 2005",
        exhibitionCount: "عدد المعارض",
        exhibitionCountPlaceholder: "مثال: 12",
      },
      cancel: "إلغاء",
      save: "حفظ التغييرات",
      saving: "جارٍ الحفظ...",
    },
  };

  const content = t[language];
  const personaType = (initialData?.persona || persona || "artist") as
    | "artist"
    | "gallery"
    | "collector"
    | "curator"
    | "investor";
  const personaContent =
    personaType in content
      ? (content[personaType as keyof typeof content] as typeof content.artist)
      : content.artist;

  const icons = {
    artist: Palette,
    gallery: Building2,
    collector: Gem,
    curator: UsersIcon,
    investor: TrendingUp,
  };

  const Icon = icons[personaType] || Palette;

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

  const onSubmit = async (formData: EditProfileFormData) => {
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
        location: formData.location?.trim() || undefined,
        phone_number: formData.phone_number?.trim() || undefined,
        // Artist & Collector: use price_range for both (artists = price, collectors = budget)
        price_range:
          (isArtist || isCollector) && formData.price_range?.trim()
            ? formData.price_range.trim()
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
        exhibition_count:
          isGallery && formData.exhibition_count?.trim()
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
              ? "Profile updated successfully!"
              : "تم تحديث الملف الشخصي بنجاح!";
        }

        toast.success(successMessage);

        // Extract user data from API response
        // API response structure: { success, status_code, message, data: { user: {...} } }
        if (apiResponse.data && storedUser) {
          try {
            const responseData = apiResponse.data as { user?: UserProfileData };

            // Check if data contains user object
            if (
              responseData.user &&
              typeof responseData.user === "object" &&
              "id" in responseData.user
            ) {
              const userData = responseData.user as UserProfileData;

              // Merge API user data with form values to ensure form updates are preserved
              const mergedUserData: UserProfileData = {
                ...userData,
                // Override with form values to ensure they're up to date
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
                  formData.phone_number?.trim() ||
                  userData.phone_number ||
                  null,
                // profile_image is already included from userData spread above
              };

              dispatch(setUser(mergedUserData));
              onClose();
              return;
            }
          } catch (error) {
            console.error(
              "Failed to parse user data from profile update response:",
              error
            );
          }
        }

        // Fallback: Update Redux store with form data if API response structure is unexpected
        if (storedUser) {
          dispatch(
            updateUser({
              title: formData.title.trim(),
              bio: formData.bio.trim(),
              website: formData.website?.trim() || storedUser.website || null,
              instagram_handle:
                formData.instagram_handle?.trim() ||
                storedUser.instagram_handle ||
                null,
              focus: formData.focus?.trim() || storedUser.focus || null,
              years_of_experience: formData.years_of_experience
                ? Number(formData.years_of_experience)
                : storedUser.years_of_experience || null,
              location:
                formData.location?.trim() || storedUser.location || null,
              phone_number:
                formData.phone_number?.trim() ||
                storedUser.phone_number ||
                null,
              // Keep existing profile_image if not in response
              profile_image: storedUser.profile_image,
            })
          );
        }

        onClose();
      } else {
        const errorMessage =
          language === "en"
            ? "Profile update failed. Please try again."
            : "فشل تحديث الملف الشخصي. يرجى المحاولة مرة أخرى.";
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, language);
      console.error("Profile update error:", errorMessage);
    }
  };

  return (
    <CustomModal
      isOpen={open}
      onClose={onClose}
      title={content.title}
      headerIcon={Icon}
      size="xl"
      maxHeight="max-h-[95vh]"
      contentClassName="p-8"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p className="text-[#B9BBC6]">{content.subtitle}</p>
        </motion.div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                // Cleanup old preview URLs
                cleanupPreviewUrls(profileImagePreviews);

                setProfileImage(file);
                setValue("profile_image", file);

                // Create preview items for new file
                if (file) {
                  const previews = normalizeToPreviewItems(file);
                  setProfileImagePreviews(previews);
                } else {
                  setProfileImagePreviews([]);
                }
              }}
              onPreviewChange={(items) => {
                setProfileImagePreviews(items);
              }}
              isRTL={isRTL}
              formatText={
                language === "en"
                  ? "PNG, JPG up to 5MB"
                  : "PNG، JPG حتى 5 ميجابايت"
              }
            />
            {/* Show current profile image preview if exists and no new file selected */}
            {profileImagePreviews.length > 0 && !profileImage && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-[#B9BBC6]">
                  {language === "en"
                    ? "Current profile image"
                    : "صورة الملف الشخصي الحالية"}
                </p>
                <ImagePreviewList
                  items={profileImagePreviews}
                  size="md"
                  showNames={false}
                  isRTL={isRTL}
                />
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

          {/* Location and Phone */}
          {(storedUser?.show_location === true ||
            storedUser?.show_phone === true) && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Location - only show if show_location is true */}
                {storedUser?.show_location === true && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <InputField
                      {...register("location")}
                      label={content.common.location}
                      placeholder={content.common.locationPlaceholder}
                      icon={MapPin}
                      isRTL={isRTL}
                      error={errors.location?.message}
                    />
                  </motion.div>
                )}

                {/* Phone Number - only show if show_phone is true */}
                {storedUser?.show_phone === true && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <InputField
                      {...register("phone_number")}
                      label={content.common.phone}
                      type="tel"
                      placeholder={content.common.phonePlaceholder}
                      icon={Phone}
                      isRTL={isRTL}
                      error={errors.phone_number?.message}
                    />
                  </motion.div>
                )}
              </div>
            )}

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
                      isCollector
                        ? content.common.priceRangeCollector
                        : content.common.priceRangeArtist
                    }
                    placeholder={
                      isCollector
                        ? content.common.priceRangeCollectorPlaceholder
                        : content.common.priceRangeArtistPlaceholder
                    }
                    options={priceRangeOptions}
                    value={watchedPriceRange}
                    onValueChange={(value) =>
                      setValue("price_range", value, { shouldValidate: true })
                    }
                    isRTL={isRTL}
                    error={errors.price_range?.message}
                  />
                  {isArtist && (
                    <InputField
                      {...register("preferred_commission_rate")}
                      label={content.common.preferredCommissionRate}
                      type="number"
                      placeholder={content.common.preferredCommissionRatePlaceholder}
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
                        label={content.common.shippingPreference}
                        placeholder={content.common.shippingPreferencePlaceholder}
                        isRTL={isRTL}
                        error={errors.shipping_preference?.message}
                      />
                      <InputField
                        {...register("studio_address")}
                        label={content.common.studioAddress}
                        placeholder={content.common.studioAddressPlaceholder}
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
                        label={content.common.education}
                        placeholder={content.common.educationPlaceholder}
                        isRTL={isRTL}
                        error={errors.education?.message}
                      />
                      <InputField
                        {...register("award_artist")}
                        label={content.common.awardArtist}
                        placeholder={content.common.awardArtistPlaceholder}
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
                      label={content.common.artistStatement}
                      placeholder={content.common.artistStatementPlaceholder}
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
                    label={content.common.organizationName}
                    placeholder={content.common.organizationNamePlaceholder}
                    isRTL={isRTL}
                    error={errors.organization_name?.message}
                  />
                  <InputField
                    {...register("organization_email")}
                    label={content.common.organizationEmail}
                    type="email"
                    placeholder={content.common.organizationEmailPlaceholder}
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
                    label={content.common.mainContactName}
                    placeholder={content.common.mainContactNamePlaceholder}
                    isRTL={isRTL}
                    error={errors.organization_main_contact_name?.message}
                  />
                  <SelectField
                    label={content.common.organizationType}
                    placeholder={content.common.organizationTypePlaceholder}
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
                        label: language === "en" ? "Non-profit" : "غير ربحي",
                      },
                      {
                        value: "public_museum",
                        label:
                          language === "en" ? "Public Museum" : "متحف عام",
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
                        label: language === "en" ? "Other" : "أخرى",
                      },
                    ]}
                    value={watchedOrganizationType}
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
                    label={content.common.foundedYear}
                    type="number"
                    placeholder={content.common.foundedYearPlaceholder}
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
                    label={content.common.exhibitionCount}
                    type="number"
                    placeholder={content.common.exhibitionCountPlaceholder}
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
            transition={{ delay: 1.0 }}
            className="flex gap-4 pt-6"
          >
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1 h-12 border-white/20 hover:border-primary/50 hover:bg-primary/10 text-white/70 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {content.cancel}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 shadow-lg shadow-primary/50 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                    {content.saving}
                  </>
                ) : (
                  <>
                    {content.save}
                    <ArrowRight
                      className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180" : ""
                        }`}
                    />
                  </>
                )}
              </span>
            </Button>
          </motion.div>
        </form>
      </div>
    </CustomModal>
  );
}
