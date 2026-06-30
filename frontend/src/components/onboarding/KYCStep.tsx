import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileUploadField,
  InputField,
  SelectField,
  LocationField,
  type LocationFieldValue,
} from "@/components/ui/custom-form-elements";
import { ImagePreviewList } from "@/components/ui/image-preview-list";
import { Label } from "@/components/ui/label";
import {
  useKycVerificationMutation,
  type KYCVerificationRequest,
} from "@/services/api/onboardingApi";
import {
  markStepAsSubmitted,
  selectIsStepSubmitted,
  selectSubmittedData,
} from "@/store/onboardingSlice";
import type { RootState } from "@/store/store";
import { extractErrorMessage } from "@/utils/errorMessages";
import {
  type PreviewItem,
  normalizeToPreviewItems,
  cleanupPreviewUrls,
  getFullImageUrl,
} from "@/utils/filePreviewHelpers";
import { setUser, updateUser, type UserProfileData } from "@/store/authSlice";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  ChevronLeft,
  FileText,
  Hash,
  Link,
  MapPin,
  Shield,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Oval } from "react-loader-spinner";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import type { OnboardingData } from "./OnboardingFlow";

interface KYCStepProps {
  language: "en" | "ar";
  onNext: (data: Record<string, unknown>) => void;
  onBack?: () => void;
  data: OnboardingData;
}

interface KYCFormData {
  id_number: string;
  dob: string;
  country: string;
  state: string;
  city: string;
  postal_code: string;
  street_address: string;
  id_type: string;
  gov_issued_id: File | File[] | null; // For form state only (legacy)
  gov_issued_id_front: File | null; // Front of ID
  gov_issued_id_back: File | null; // Back of ID
  proof_address: File | null;
  // Artist-specific fields
  social_link_handler: string;
  social_link_followers: string;
}

export function KYCStep({ language, onNext, onBack, data }: KYCStepProps) {
  const dispatch = useDispatch();
  const isStepSubmitted = useSelector(
    (state: RootState) => selectIsStepSubmitted(state, 3) // Step 3 is KYCStep
  );
  const submittedData = useSelector((state: RootState) =>
    selectSubmittedData(state, "kyc")
  );
  const storedUser = useSelector((state: RootState) => state.auth.user);

  // Determine if user is artist role
  const isArtistRole = data.persona?.toLowerCase() === "artist";

  // Load initial values from Redux onboarding slice and merge with storedUser KYC fields
  // Check storedUser for KYC fields (kyc_id_type, kyc_gov_issued_id, etc.) when page reloads
  const kycDataFromUser = storedUser
    ? ({
        id_number: (storedUser as { kyc_id_number?: string }).kyc_id_number,
        dob: (storedUser as { kyc_dob?: string }).kyc_dob,
        country: (storedUser as { kyc_country?: string }).kyc_country,
        state: (storedUser as { kyc_state?: string }).kyc_state,
        city: (storedUser as { kyc_city?: string }).kyc_city,
        postal_code: (storedUser as { kyc_postal_code?: string }).kyc_postal_code,
        street_address: (storedUser as { kyc_street_address?: string }).kyc_street_address,
        id_type: (storedUser as { kyc_id_type?: string }).kyc_id_type,
        gov_issued_id: (storedUser as { kyc_gov_issued_id?: string | string[] | null }).kyc_gov_issued_id,
        proof_address: (storedUser as { kyc_proof_address?: string | null }).kyc_proof_address,
        // Artist-specific fields
        social_link_handler: (storedUser as { kyc_social_link_handler?: string }).kyc_social_link_handler,
        social_link_followers: (storedUser as { kyc_social_link_followers?: string }).kyc_social_link_followers,
      } as Partial<
        KYCFormData & {
          gov_issued_id?: File | File[] | string | string[] | null;
          proof_address?: File | string | null;
        }
      >)
    : {};

  // Merge onboarding data with user KYC data (user data takes precedence)
  const savedData = {
    ...(data.kyc || {}),
    ...kycDataFromUser,
  } as Partial<
    KYCFormData & {
      gov_issued_id?: File | File[] | string | string[] | null;
      acceptedCompliance?: boolean;
    }
  >;
  const initialValues: KYCFormData = {
    id_number: (savedData.id_number as string) || "",
    dob: (savedData.dob as string) || "",
    country: (savedData.country as string) || "",
    state: (savedData.state as string) || "",
    city: (savedData.city as string) || "",
    postal_code: (savedData.postal_code as string) || "",
    street_address: (savedData.street_address as string) || "",
    id_type: (savedData.id_type as string) || "",
    gov_issued_id: null,
    gov_issued_id_front: null,
    gov_issued_id_back: null,
    proof_address: null,
    // Artist-specific fields
    social_link_handler: (savedData.social_link_handler as string) || "",
    social_link_followers: (savedData.social_link_followers as string) || "",
  };

  const [idDocumentFront, setIdDocumentFront] = useState<File | null>(null);
  const [idDocumentBack, setIdDocumentBack] = useState<File | null>(null);
  const [proofOfAddress, setProofOfAddress] = useState<File | null>(null);
  const [idDocumentPreviews, setIdDocumentPreviews] = useState<PreviewItem[]>(
    []
  );
  const [proofOfAddressPreviews, setProofOfAddressPreviews] = useState<
    PreviewItem[]
  >([]);
  // Restore compliance checkbox state from saved data
  const savedCompliance = savedData.acceptedCompliance;
  const [acceptedCompliance, setAcceptedCompliance] = useState(
    savedCompliance || false
  );

  const [kycVerification, { isLoading }] = useKycVerificationMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<KYCFormData>({
    defaultValues: initialValues,
  });

  // Watch form values to compare with submitted data
  const currentValues = watch();

  // Load document files and form values from saved data when component mounts or data changes
  useEffect(() => {
    // Recompute savedData inside useEffect to react to storedUser changes
    const kycDataFromUser = storedUser
      ? ({
          id_number: (storedUser as { kyc_id_number?: string }).kyc_id_number,
          dob: (storedUser as { kyc_dob?: string }).kyc_dob,
          country: (storedUser as { kyc_country?: string }).kyc_country,
          state: (storedUser as { kyc_state?: string }).kyc_state,
          city: (storedUser as { kyc_city?: string }).kyc_city,
          postal_code: (storedUser as { kyc_postal_code?: string }).kyc_postal_code,
          street_address: (storedUser as { kyc_street_address?: string }).kyc_street_address,
          id_type: (storedUser as { kyc_id_type?: string }).kyc_id_type,
          gov_issued_id: (storedUser as { kyc_gov_issued_id?: string | string[] | null }).kyc_gov_issued_id,
          proof_address: (storedUser as { kyc_proof_address?: string | null }).kyc_proof_address,
          // Artist-specific fields
          social_link_handler: (storedUser as { kyc_social_link_handler?: string }).kyc_social_link_handler,
          social_link_followers: (storedUser as { kyc_social_link_followers?: string }).kyc_social_link_followers,
        } as Partial<
          KYCFormData & {
            gov_issued_id?: File | File[] | string | string[] | null;
            proof_address?: File | string | null;
          }
        >)
      : {};

    // Merge onboarding data with user KYC data (user data takes precedence when defined)
    const onboardingKyc = (data.kyc || {}) as Partial<
      KYCFormData & {
        gov_issued_id?: File | File[] | string | string[] | null;
        acceptedCompliance?: boolean;
      }
    >;

    const currentSavedData: Partial<
      KYCFormData & {
        gov_issued_id?: File | File[] | string | string[] | null;
        acceptedCompliance?: boolean;
      }
    > = {
      acceptedCompliance: onboardingKyc.acceptedCompliance,
      id_number:
        kycDataFromUser.id_number !== undefined
          ? kycDataFromUser.id_number
          : onboardingKyc.id_number,
      dob:
        kycDataFromUser.dob !== undefined
          ? kycDataFromUser.dob
          : onboardingKyc.dob,
      country:
        kycDataFromUser.country !== undefined
          ? kycDataFromUser.country
          : onboardingKyc.country,
      state:
        kycDataFromUser.state !== undefined
          ? kycDataFromUser.state
          : onboardingKyc.state,
      city:
        kycDataFromUser.city !== undefined
          ? kycDataFromUser.city
          : onboardingKyc.city,
      postal_code:
        kycDataFromUser.postal_code !== undefined
          ? kycDataFromUser.postal_code
          : onboardingKyc.postal_code,
      street_address:
        kycDataFromUser.street_address !== undefined
          ? kycDataFromUser.street_address
          : onboardingKyc.street_address,
      id_type:
        kycDataFromUser.id_type !== undefined
          ? kycDataFromUser.id_type
          : onboardingKyc.id_type,
      gov_issued_id:
        kycDataFromUser.gov_issued_id !== undefined
          ? kycDataFromUser.gov_issued_id
          : onboardingKyc.gov_issued_id,
      proof_address:
        kycDataFromUser.proof_address !== undefined
          ? kycDataFromUser.proof_address
          : onboardingKyc.proof_address,
      // Artist-specific fields
      social_link_handler:
        kycDataFromUser.social_link_handler !== undefined
          ? kycDataFromUser.social_link_handler
          : onboardingKyc.social_link_handler,
      social_link_followers:
        kycDataFromUser.social_link_followers !== undefined
          ? kycDataFromUser.social_link_followers
          : onboardingKyc.social_link_followers,
    };

    const savedIdDoc = currentSavedData.gov_issued_id;
    const savedProof = currentSavedData.proof_address;
    const savedComplianceState = currentSavedData.acceptedCompliance;

    // Restore compliance checkbox
    if (savedComplianceState !== undefined) {
      setAcceptedCompliance(savedComplianceState);
    }

    // Handle ID documents - support front and back separately
    // API can return: single string, array of strings, or separate front/back fields
    if (savedIdDoc) {
      // Normalize to array for handling
      const idDocs = Array.isArray(savedIdDoc)
        ? savedIdDoc
        : [savedIdDoc];

      const fileDocs: File[] = [];
      const urlDocs: string[] = [];

      idDocs.forEach((doc) => {
        if (doc instanceof File) {
          fileDocs.push(doc);
        } else if (typeof doc === "string" && doc) {
          urlDocs.push(doc);
        }
      });

      if (fileDocs.length > 0) {
        // Map files: first = front, second = back
        setIdDocumentFront(fileDocs[0] || null);
        setIdDocumentBack(fileDocs[1] || null);
        setValue("gov_issued_id_front", fileDocs[0] || null);
        setValue("gov_issued_id_back", fileDocs[1] || null);
        const previews = normalizeToPreviewItems(fileDocs, ["Front", "Back"]);
        setIdDocumentPreviews(previews);
      } else if (urlDocs.length > 0) {
        // Map URLs: first = front, second = back
        setIdDocumentFront(null);
        setIdDocumentBack(null);
        setValue("gov_issued_id_front", null);
        setValue("gov_issued_id_back", null);
        const fullUrls = urlDocs
          .map((url) => getFullImageUrl(url))
          .filter((url): url is string => !!url);
        const previews = normalizeToPreviewItems(fullUrls, ["Front", "Back"]);
        setIdDocumentPreviews(previews);
      } else {
        setIdDocumentFront(null);
        setIdDocumentBack(null);
        setIdDocumentPreviews([]);
        setValue("gov_issued_id_front", null);
        setValue("gov_issued_id_back", null);
      }
    } else {
      setIdDocumentFront(null);
      setIdDocumentBack(null);
      setIdDocumentPreviews([]);
      setValue("gov_issued_id_front", null);
      setValue("gov_issued_id_back", null);
    }

    // Handle proof of address - single file
    if (savedProof) {
      if (savedProof instanceof File) {
        setProofOfAddress(savedProof);
        setValue("proof_address", savedProof);
        const previews = normalizeToPreviewItems(savedProof);
        setProofOfAddressPreviews(previews);
      } else if (typeof savedProof === "string") {
        const fullUrl = getFullImageUrl(savedProof);
        if (fullUrl) {
          const previews = normalizeToPreviewItems(fullUrl);
          setProofOfAddressPreviews(previews);
        } else {
          setProofOfAddressPreviews([]);
        }
        setProofOfAddress(null);
        setValue("proof_address", null);
      }
    } else {
      setProofOfAddress(null);
      setProofOfAddressPreviews([]);
      setValue("proof_address", null);
    }

    // Reset form with saved values
    // Extract File objects for form reset (skip string URLs as they can't be used directly)
    let frontFile: File | null = null;
    let backFile: File | null = null;
    
    if (savedIdDoc instanceof File) {
      frontFile = savedIdDoc;
    } else if (Array.isArray(savedIdDoc)) {
      if (savedIdDoc[0] instanceof File) {
        frontFile = savedIdDoc[0];
      }
      if (savedIdDoc[1] instanceof File) {
        backFile = savedIdDoc[1];
      }
    }
    
    const idTypeValue = (currentSavedData.id_type as string) || "";
    
    reset({
      id_number: (currentSavedData.id_number as string) || "",
      dob: (currentSavedData.dob as string) || "",
      country: (currentSavedData.country as string) || "",
      state: (currentSavedData.state as string) || "",
      city: (currentSavedData.city as string) || "",
      postal_code: (currentSavedData.postal_code as string) || "",
      street_address: (currentSavedData.street_address as string) || "",
      id_type: idTypeValue,
      gov_issued_id: null,
      gov_issued_id_front: frontFile,
      gov_issued_id_back: backFile,
      proof_address: savedProof instanceof File ? savedProof : null,
      // Artist-specific fields
      social_link_handler: (currentSavedData.social_link_handler as string) || "",
      social_link_followers: (currentSavedData.social_link_followers as string) || "",
    });
    
    // Explicitly set id_type to ensure SelectField updates properly
    // This is needed because SelectField uses controlled value and needs explicit update
    if (idTypeValue) {
      setValue("id_type", idTypeValue, { shouldValidate: false });
    }
  }, [data.kyc, storedUser, reset, setValue]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrls(idDocumentPreviews);
      cleanupPreviewUrls(proofOfAddressPreviews);
    };
  }, [idDocumentPreviews, proofOfAddressPreviews]);

  // Compare current form values with submitted values
  const hasChanges = () => {
    if (!isStepSubmitted || !submittedData) return true;

    const submitted = submittedData as Partial<
      KYCFormData & {
        acceptedCompliance?: boolean;
        gov_issued_id?: File | File[] | string | string[] | null;
      }
    >;

    // Compare text fields
    const textFieldsMatch =
      (currentValues.id_number?.trim() || "") ===
        ((submitted.id_number as string) || "") &&
      (currentValues.dob || "") === ((submitted.dob as string) || "") &&
      (currentValues.country?.trim() || "") ===
        ((submitted.country as string) || "") &&
      (currentValues.state?.trim() || "") ===
        ((submitted.state as string) || "") &&
      (currentValues.city?.trim() || "") ===
        ((submitted.city as string) || "") &&
      (currentValues.postal_code?.trim() || "") ===
        ((submitted.postal_code as string) || "") &&
      (currentValues.street_address?.trim() || "") ===
        ((submitted.street_address as string) || "") &&
      (currentValues.id_type?.trim() || "") ===
        ((submitted.id_type as string) || "");

    // File comparison - check if both are null or both have files with same name
    const submittedIdDocs = submitted.gov_issued_id;
    const submittedIdDocsArray = Array.isArray(submittedIdDocs)
      ? submittedIdDocs
      : submittedIdDocs
        ? [submittedIdDocs]
        : [];

    const submittedFrontName =
      submittedIdDocsArray[0] instanceof File
        ? submittedIdDocsArray[0].name
        : typeof submittedIdDocsArray[0] === "string"
          ? submittedIdDocsArray[0]
          : "";
    const submittedBackName =
      submittedIdDocsArray[1] instanceof File
        ? submittedIdDocsArray[1].name
        : typeof submittedIdDocsArray[1] === "string"
          ? submittedIdDocsArray[1]
          : "";

    // Check if front and back documents match (both null or both have same names)
    const frontMatch =
      (!idDocumentFront && !submittedFrontName) ||
      (idDocumentFront?.name === submittedFrontName && submittedFrontName !== "");
    const backMatch =
      (!idDocumentBack && !submittedBackName) ||
      (idDocumentBack?.name === submittedBackName && submittedBackName !== "");
    const idDocMatch = frontMatch && backMatch;

    const proofMatch =
      (!proofOfAddress && !submitted.proof_address) ||
      (proofOfAddress &&
        submitted.proof_address &&
        (proofOfAddress.name ===
          (submitted.proof_address as unknown as string) ||
          proofOfAddress.name ===
            (submitted.proof_address as unknown as string)));

    // Compare compliance checkbox
    const complianceMatch =
      acceptedCompliance === (submitted.acceptedCompliance || false);

    // Artist-specific fields comparison
    const artistFieldsMatch = !isArtistRole || (
      (currentValues.social_link_handler?.trim() || "") ===
        ((submitted.social_link_handler as string) || "") &&
      (currentValues.social_link_followers?.trim() || "") ===
        ((submitted.social_link_followers as string) || "")
    );

    return !(textFieldsMatch && idDocMatch && proofMatch && complianceMatch && artistFieldsMatch);
  };

  const shouldShowNext = isStepSubmitted && !hasChanges();

  const isRTL = language === "ar";

  const t = {
    en: {
      title: "Identity Verification",
      subtitle: "Building trust starts here",
      description: "To keep FANN safe, credible, and fair for everyone, we verify every member's identity. This process protects artists, collectors, and institutions — and ensures all activity on the platform is genuine.",
      notice: {
        title: "Why we ask for this",
        points: [
          "Required for regulatory compliance in the MENA/GCC region",
          "Prevents fraud and impersonation",
          "Enables high-value art transactions",
          "Protects the integrity of the entire FANN community",
        ],
        conclusion: "Your information is handled securely and used only for verification purposes.",
      },
      idNumber: "ID Number",
      idNumberPlaceholder: "Enter your ID number",
      dateOfBirth: "Date of Birth",
      location: {
        label: "Location",
        country: "Country",
        state: "State/Province",
        city: "City",
      },
      postalCode: "Postal Code",
      postalCodePlaceholder: "Postal/ZIP code",
      streetAddress: "Street Address",
      streetAddressPlaceholder: "Street and building",
      idType: {
        label: "ID Type",
        placeholder: "Select ID type",
        options: [
          { value: "Passport", label: "Passport" },
          { value: "National ID", label: "National ID" },
          { value: "Emirates ID", label: "Emirates ID" },
          { value: "Iqama (Saudi Residency)", label: "Iqama (Saudi Residency)" },
          { value: "Driver's License", label: "Driver's License" },
        ],
      },
      documents: {
        title: "Upload Documents",
        idDocument: {
          label: "Government-issued ID",
          desc: "Clear photo or scan of your ID (front and back)",
        },
        proofOfAddress: {
          label: "Proof of Address",
          desc: "Utility bill or bank statement (not older than 3 months)",
        },
        uploadButton: "Click to upload",
        formats: "PDF, PNG, JPG up to 10MB",
      },
      compliance: {
        title: "Data Privacy & Compliance",
        text: "I consent to the processing of my personal data for KYC verification purposes and understand that my information will be stored securely in accordance with GDPR and local regulations.",
      },
      security: {
        title: "Your data is secure",
        features: [
          "End-to-end encryption",
          "GDPR compliant",
          "Secure storage",
          "Never shared",
        ],
      },
      skipForNow: "Skip for now (Limited access)",
      back: "Back",
      continue: "Verify & Continue",
      next: "Next",
      // Artist-specific fields
      socialLinkHandler: "Social Link Handler",
      socialLinkHandlerPlaceholder: "Enter your social link handler",
      socialLinkFollowers: "Social Link Followers",
      socialLinkFollowersPlaceholder: "Enter your social link follower",
    },
    ar: {
      title: "التحقق من الهوية",
      subtitle: "بناء الثقة يبدأ من هنا",
      description: "لإبقاء FANN آمنة وموثوقة وعادلة للجميع، نتحقق من هوية كل عضو. هذه العملية تحمي الفنانين والجامعين والمؤسسات — وتضمن أن جميع الأنشطة على المنصة حقيقية.",
      notice: {
        title: "لماذا نطلب هذا",
        points: [
          "مطلوب للامتثال التنظيمي في منطقة الشرق الأوسط وشمال أفريقيا ودول مجلس التعاون الخليجي",
          "يمنع الاحتيال وانتحال الشخصية",
          "يمكن المعاملات الفنية عالية القيمة",
          "يحمي نزاهة مجتمع FANN بأكمله",
        ],
        conclusion: "يتم التعامل مع معلوماتك بشكل آمن وتُستخدم فقط لأغراض التحقق.",
      },
      idNumber: "رقم الهوية",
      idNumberPlaceholder: "أدخل رقم هويتك",
      dateOfBirth: "تاريخ الميلاد",
      location: {
        label: "الموقع",
        country: "البلد",
        state: "الولاية/المحافظة",
        city: "المدينة",
      },
      postalCode: "الرمز البريدي",
      postalCodePlaceholder: "الرمز البريدي",
      streetAddress: "عنوان الشارع",
      streetAddressPlaceholder: "الشارع والمبنى",
      idType: {
        label: "نوع الهوية",
        placeholder: "اختر نوع الهوية",
        options: [
          { value: "Passport", label: "جواز السفر" },
          { value: "National ID", label: "الهوية الوطنية" },
          { value: "Emirates ID", label: "هوية الإمارات" },
          {
            value: "Iqama (Saudi Residency)",
            label: "الإقامة (إقامة سعودية)",
          },
          { value: "Driver's License", label: "رخصة القيادة" },
        ],
      },
      documents: {
        title: "تحميل المستندات",
        idDocument: {
          label: "هوية صادرة عن الحكومة",
          desc: "صورة واضحة أو مسح ضوئي لهويتك (الأمام والخلف)",
        },
        proofOfAddress: {
          label: "إثبات العنوان",
          desc: "فاتورة المرافق أو كشف حساب بنكي (لا يزيد عمره عن 3 أشهر)",
        },
        uploadButton: "انقر للتحميل",
        formats: "PDF، PNG، JPG حتى 10 ميجابايت",
      },
      compliance: {
        title: "خصوصية البيانات والامتثال",
        text: "أوافق على معالجة بياناتي الشخصية لأغراض التحقق من معرفة العميل وأفهم أن معلوماتي ستُخزن بشكل آمن وفقاً للائحة العامة لحماية البيانات (GDPR) واللوائح المحلية.",
      },
      security: {
        title: "بياناتك آمنة",
        features: [
          "تشفير من طرف إلى طرف",
          "متوافق مع GDPR",
          "تخزين آمن",
          "لن يتم مشاركتها أبداً",
        ],
      },
      skipForNow: "تخطي الآن (وصول محدود)",
      back: "رجوع",
      continue: "التحقق والمتابعة",
      next: "التالي",
      // Artist-specific fields
      socialLinkHandler: "معرف الرابط الاجتماعي",
      socialLinkHandlerPlaceholder: "أدخل معرف الرابط الاجتماعي",
      socialLinkFollowers: "متابعي الرابط الاجتماعي",
      socialLinkFollowersPlaceholder: "أدخل متابع الرابط الاجتماعي",
    },
  };

  const content = t[language];

  // Watch country and id_type to filter ID type options
  const selectedCountry = watch("country");
  const currentIdType = watch("id_type");
  
  // Filter ID type options based on country
  const filteredIdTypeOptions = useMemo(() => {
    const allOptions = content.idType.options;
    
    // UAE country code is "AE"
    if (selectedCountry === "AE") {
      // Show Emirates ID, hide Iqama (Saudi Residency)
      return allOptions.filter(
        (opt) => opt.value !== "Iqama (Saudi Residency)"
      );
    } else if (selectedCountry === "SA") {
      // Show Iqama (Saudi Residency), hide Emirates ID
      return allOptions.filter((opt) => opt.value !== "Emirates ID");
    } else {
      // For other countries, hide both Emirates ID and Iqama (Saudi Residency)
      return allOptions.filter(
        (opt) =>
          opt.value !== "Emirates ID" &&
          opt.value !== "Iqama (Saudi Residency)"
      );
    }
  }, [selectedCountry, content.idType.options]);

  // Clear id_type if it's not in the filtered options
  useEffect(() => {
    if (
      currentIdType &&
      !filteredIdTypeOptions.some((opt) => opt.value === currentIdType)
    ) {
      setValue("id_type", "", { shouldValidate: false });
    }
  }, [filteredIdTypeOptions, currentIdType, setValue]);

  const onSubmit = async (formData: KYCFormData) => {
    // If step was already submitted and no changes, just proceed without API call
    if (shouldShowNext) {
      const savedIdDocs: string[] = [];
      if (idDocumentFront?.name) savedIdDocs.push(idDocumentFront.name);
      if (idDocumentBack?.name) savedIdDocs.push(idDocumentBack.name);
      
      onNext({
        id_number: formData.id_number,
        dob: formData.dob,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        postal_code: formData.postal_code,
        street_address: formData.street_address,
        id_type: formData.id_type,
        gov_issued_id:
          savedIdDocs.length === 1
            ? savedIdDocs[0]
            : savedIdDocs.length > 1
              ? savedIdDocs
              : "",
        proof_address: proofOfAddress?.name || "",
        acceptedCompliance: acceptedCompliance, // Include compliance checkbox state
        // Artist-specific fields
        ...(isArtistRole && {
          social_link_handler: formData.social_link_handler || "",
          social_link_followers: formData.social_link_followers || "",
        }),
      });
      return;
    }

    if (!acceptedCompliance) {
      toast.error(
        language === "en"
          ? "Please accept the compliance terms"
          : "يرجى قبول شروط الامتثال"
      );
      return;
    }

    try {
      const kycData: KYCVerificationRequest = {
        id_number: formData.id_number.trim(),
        dob: formData.dob, // Format: YYYY-MM-DD (from date input)
        country: formData.country.trim(),
        state: formData.state.trim(),
        city: formData.city.trim(),
        postal_code: formData.postal_code.trim(),
        street_address: formData.street_address.trim(),
        id_type: formData.id_type.trim(),
      };

      // Handle ID documents - send front and back separately
      if (idDocumentFront) {
        kycData.gov_issued_id_front = idDocumentFront;
      }
      if (idDocumentBack) {
        kycData.gov_issued_id_back = idDocumentBack;
      }
      if (proofOfAddress) {
        kycData.proof_address = proofOfAddress;
      }

      // Artist-specific fields
      if (isArtistRole) {
        if (formData.social_link_handler?.trim()) {
          kycData.social_link_handler = formData.social_link_handler.trim();
        }
        if (formData.social_link_followers?.trim()) {
          kycData.social_link_followers = formData.social_link_followers.trim();
        }
      }

      const result = await kycVerification(kycData).unwrap();

      // Handle API response
      const apiResponse = result as {
        success?: boolean;
        status_code?: number;
        message?: string | Record<string, unknown>;
        data?: {
          kyc_verification?: {
            id?: number;
            id_number?: string;
            dob?: string;
            country?: string;
            state?: string;
            city?: string;
            postal_code?: string;
            street_address?: string;
            id_type?: string;
            gov_issued_id?: string | null; // Legacy single file
            gov_issued_id_front?: string | null; // Front of ID
            gov_issued_id_back?: string | null; // Back of ID
            proof_address?: string | null;
            // Artist-specific fields
            social_link_handler?: string | null;
            social_link_followers?: string | null;
          };
          user?: unknown;
          [key: string]: unknown;
        };
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
              ? "KYC verification submitted successfully!"
              : "تم تقديم التحقق من الهوية بنجاح!";
        }

        toast.success(successMessage);

        // Update user data in Redux with KYC information from API response
        if (storedUser && apiResponse.data?.kyc_verification) {
          const kycVerification = apiResponse.data.kyc_verification as {
            id?: number;
            id_number?: string;
            dob?: string;
            country?: string;
            state?: string;
            city?: string;
            postal_code?: string;
            street_address?: string;
            id_type?: string;
            gov_issued_id?: string | null; // Legacy single file
            gov_issued_id_front?: string | null; // Front of ID
            gov_issued_id_back?: string | null; // Back of ID
            proof_address?: string | null;
            // Artist-specific fields
            social_link_handler?: string | null;
            social_link_followers?: string | null;
            [key: string]: unknown;
          };

          // Combine front and back into array for storage, or use legacy single file
          let govIdUrls: string[] | string | null = null;
          if (kycVerification.gov_issued_id_front || kycVerification.gov_issued_id_back) {
            const urls: string[] = [];
            if (kycVerification.gov_issued_id_front) urls.push(kycVerification.gov_issued_id_front);
            if (kycVerification.gov_issued_id_back) urls.push(kycVerification.gov_issued_id_back);
            govIdUrls = urls.length === 1 ? urls[0] : urls;
          } else if (kycVerification.gov_issued_id) {
            govIdUrls = kycVerification.gov_issued_id;
          }

          dispatch(
            updateUser({
              // Store KYC data as additional properties in user object
              // Using type assertion since KYC fields aren't in UserProfileData interface
              ...({
                kyc_id_number:
                  kycVerification.id_number || formData.id_number.trim(),
                kyc_dob: kycVerification.dob || formData.dob,
                kyc_country:
                  kycVerification.country || formData.country.trim(),
                kyc_state:
                  kycVerification.state || formData.state.trim(),
                kyc_city: kycVerification.city || formData.city.trim(),
                kyc_postal_code:
                  kycVerification.postal_code || formData.postal_code.trim(),
                kyc_id_type: kycVerification.id_type || formData.id_type.trim(),
                kyc_gov_issued_id: govIdUrls,
                kyc_proof_address: kycVerification.proof_address || null,
                // Artist-specific fields
                ...(isArtistRole && {
                  kyc_social_link_handler:
                    kycVerification.social_link_handler || formData.social_link_handler?.trim() || null,
                  kyc_social_link_followers:
                    kycVerification.social_link_followers || formData.social_link_followers?.trim() || null,
                }),
              } as Partial<typeof storedUser>),
            })
          );
        } else if (storedUser) {
          // Fallback: if API response doesn't have kyc_verification, use form data
          // Check if API response contains document URLs in alternative format
          let govIdUrl: string | string[] | null = null;
          if (idDocumentFront || idDocumentBack) {
            // If we uploaded new files, use their names (they'll be uploaded)
            // Note: The actual files will be uploaded, so we store placeholder names
            // The API will return the actual URLs after upload
            const urls: string[] = [];
            if (idDocumentFront) urls.push(idDocumentFront.name);
            if (idDocumentBack) urls.push(idDocumentBack.name);
            govIdUrl = urls.length === 1 ? urls[0] : urls.length > 0 ? urls : null;
          }
          
          let proofUrl = proofOfAddress?.name || null;

          // If API response has document data in alternative format
          if (apiResponse.data) {
            try {
              const responseData = apiResponse.data as {
                gov_issued_id?: string | string[];
                gov_issued_id_front?: string;
                gov_issued_id_back?: string;
                proof_address?: string;
                [key: string]: unknown;
              };
              if (responseData.gov_issued_id_front || responseData.gov_issued_id_back) {
                const urls: string[] = [];
                if (responseData.gov_issued_id_front) urls.push(responseData.gov_issued_id_front);
                if (responseData.gov_issued_id_back) urls.push(responseData.gov_issued_id_back);
                govIdUrl = urls.length === 1 ? urls[0] : urls;
              } else if (responseData.gov_issued_id) {
                govIdUrl = responseData.gov_issued_id;
              }
              if (responseData.proof_address) {
                proofUrl = responseData.proof_address;
              }
            } catch (error) {
              console.error(
                "Failed to parse document URLs from response:",
                error
              );
            }
          }

          dispatch(
            updateUser({
              // Store KYC data as additional properties in user object
              // Using type assertion since KYC fields aren't in UserProfileData interface
              ...({
                kyc_id_number: formData.id_number.trim(),
                kyc_dob: formData.dob,
                kyc_country: formData.country.trim(),
                kyc_state: formData.state.trim(),
                kyc_city: formData.city.trim(),
                kyc_postal_code: formData.postal_code.trim(),
                kyc_id_type: formData.id_type.trim(),
                kyc_gov_issued_id: govIdUrl,
                kyc_proof_address: proofUrl,
                // Artist-specific fields
                ...(isArtistRole && {
                  kyc_social_link_handler: formData.social_link_handler?.trim() || null,
                  kyc_social_link_followers: formData.social_link_followers?.trim() || null,
                }),
              } as Partial<typeof storedUser>),
            })
          );
        }

        // Check if API response includes updated user data (profile_step may be updated)
        if (apiResponse.data) {
          try {
            const responseData = apiResponse.data as { user?: UserProfileData };

            if (
              responseData.user &&
              typeof responseData.user === "object" &&
              "id" in responseData.user
            ) {
              const userData = responseData.user as UserProfileData;

              // Merge with existing storedUser if available
              if (storedUser) {
                const mergedUserData: UserProfileData = {
                  ...storedUser,
                  ...userData, // API response takes precedence
                };
                dispatch(setUser(mergedUserData));
              } else {
                dispatch(setUser(userData));
              }
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
              "Failed to parse user data from KYC verification response:",
              error
            );
          }
        }

        // Mark step as submitted in Redux
        // Use document URLs from API response if available, otherwise use file names
        // Initialize all KYC fields with formData values as fallback
        let savedIdType: string = formData.id_type;
        let savedIdNumber: string = formData.id_number;
        let savedDob: string = formData.dob;
        let savedCountry: string = formData.country;
        let savedState: string = formData.state;
        let savedCity: string = formData.city;
        let savedPostalCode: string = formData.postal_code;
        let savedStreetAddress: string = formData.street_address;
        let savedIdDocs: string[] = [];
        let savedProofAddress: string = "";
        
        if (apiResponse.data?.kyc_verification) {
          const kycVerification = apiResponse.data.kyc_verification;
          // Extract all KYC fields from kyc_verification object
          if (kycVerification.id_type) savedIdType = kycVerification.id_type;
          if (kycVerification.id_number) savedIdNumber = kycVerification.id_number;
          if (kycVerification.dob) savedDob = kycVerification.dob;
          if (kycVerification.country) savedCountry = kycVerification.country;
          if (kycVerification.state) savedState = kycVerification.state;
          if (kycVerification.city) savedCity = kycVerification.city;
          if (kycVerification.postal_code) savedPostalCode = kycVerification.postal_code;
          if (kycVerification.street_address) savedStreetAddress = kycVerification.street_address;
          // Extract document URLs
          if (kycVerification.gov_issued_id_front) savedIdDocs.push(kycVerification.gov_issued_id_front);
          if (kycVerification.gov_issued_id_back) savedIdDocs.push(kycVerification.gov_issued_id_back);
          if (savedIdDocs.length === 0 && kycVerification.gov_issued_id) {
            // Legacy single file
            savedIdDocs = Array.isArray(kycVerification.gov_issued_id) 
              ? kycVerification.gov_issued_id 
              : [kycVerification.gov_issued_id];
          }
          if (kycVerification.proof_address) {
            savedProofAddress = kycVerification.proof_address;
          }
        } else if (apiResponse.data) {
          // Check alternative format in response data
          try {
            const responseData = apiResponse.data as {
              id_type?: string;
              id_number?: string;
              dob?: string;
              country?: string;
              state?: string;
              city?: string;
              postal_code?: string;
              street_address?: string;
              gov_issued_id?: string | string[];
              gov_issued_id_front?: string;
              gov_issued_id_back?: string;
              proof_address?: string;
              [key: string]: unknown;
            };
            // Extract all KYC fields from alternative format
            if (responseData.id_type) savedIdType = responseData.id_type;
            if (responseData.id_number) savedIdNumber = responseData.id_number;
            if (responseData.dob) savedDob = responseData.dob;
            if (responseData.country) savedCountry = responseData.country;
            if (responseData.state) savedState = responseData.state;
            if (responseData.city) savedCity = responseData.city;
            if (responseData.postal_code) savedPostalCode = responseData.postal_code;
            if (responseData.street_address) savedStreetAddress = responseData.street_address;
            // Extract document URLs
            if (responseData.gov_issued_id_front || responseData.gov_issued_id_back) {
              if (responseData.gov_issued_id_front) savedIdDocs.push(responseData.gov_issued_id_front);
              if (responseData.gov_issued_id_back) savedIdDocs.push(responseData.gov_issued_id_back);
            } else if (responseData.gov_issued_id) {
              savedIdDocs = Array.isArray(responseData.gov_issued_id)
                ? responseData.gov_issued_id
                : [responseData.gov_issued_id];
            }
            if (responseData.proof_address) {
              savedProofAddress = responseData.proof_address;
            }
          } catch (error) {
            console.error("Failed to parse document URLs from response for stepData:", error);
          }
        }
        
        // Fallback to file names if API didn't return URLs
        if (savedIdDocs.length === 0) {
          if (idDocumentFront?.name) savedIdDocs.push(idDocumentFront.name);
          if (idDocumentBack?.name) savedIdDocs.push(idDocumentBack.name);
        }
        if (!savedProofAddress) {
          savedProofAddress = proofOfAddress?.name || "";
        }

        // Artist-specific fields for stepData
        let savedSocialLinkHandler = formData.social_link_handler || "";
        let savedSocialLinkFollowers = formData.social_link_followers || "";
        
        if (apiResponse.data?.kyc_verification) {
          const kycVerification = apiResponse.data.kyc_verification;
          if (kycVerification.social_link_handler) savedSocialLinkHandler = kycVerification.social_link_handler;
          if (kycVerification.social_link_followers) savedSocialLinkFollowers = kycVerification.social_link_followers;
        }

        const stepData = {
          id_number: savedIdNumber,
          dob: savedDob,
          country: savedCountry,
          state: savedState,
          city: savedCity,
          postal_code: savedPostalCode,
          street_address: savedStreetAddress,
          id_type: savedIdType,
          gov_issued_id:
            savedIdDocs.length === 1
              ? savedIdDocs[0]
              : savedIdDocs.length > 1
                ? savedIdDocs
                : "",
          proof_address: savedProofAddress,
          acceptedCompliance: acceptedCompliance, // Save compliance checkbox state
          // Artist-specific fields
          ...(isArtistRole && {
            social_link_handler: savedSocialLinkHandler,
            social_link_followers: savedSocialLinkFollowers,
          }),
        };

        dispatch(
          markStepAsSubmitted({
            stepIndex: 3, // KYCStep is step 3
            stepKey: "kyc",
            data: stepData,
          })
        );

        onNext(stepData);
      } else {
        const errorMessage =
          language === "en"
            ? "KYC verification failed. Please try again."
            : "فشل التحقق من الهوية. يرجى المحاولة مرة أخرى.";
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err, language);
      console.error("KYC verification error:", errorMessage);
    }
  };

  const handleSkip = () => {
    onNext({ skipped: true });
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
            <Shield className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-3xl text-white mb-2">{content.title}</h2>
          <p className="text-[#B9BBC6] font-semibold mb-3">{content.subtitle}</p>
          <p className="text-[#B9BBC6] text-sm leading-relaxed max-w-2xl mx-auto">{content.description}</p>
        </motion.div>

        {/* Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-6 rounded-xl bg-blue-500/10 border border-blue-500/30"
        >
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <h3 className="text-blue-400">{content.notice.title}</h3>
          </div>
          <ul className="space-y-2 ml-8 mb-4">
            {content.notice.points.map((point, index) => (
              <li
                key={index}
                className="text-[#B9BBC6] text-sm flex items-start gap-2"
              >
                <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#B9BBC6] text-sm ml-8">{content.notice.conclusion}</p>
        </motion.div>

        <div className="space-y-6">
          {/* ID Number & Date of Birth */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <InputField
                {...register("id_number", {
                  required:
                    language === "en"
                      ? "ID number is required"
                      : "رقم الهوية مطلوب",
                })}
                label={content.idNumber}
                placeholder={content.idNumberPlaceholder}
                icon={Hash}
                isRTL={isRTL}
                required
                error={errors.id_number?.message}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <InputField
                {...register("dob", {
                  required:
                    language === "en"
                      ? "Date of birth is required"
                      : "تاريخ الميلاد مطلوب",
                })}
                label={content.dateOfBirth}
                type="date"
                icon={Calendar}
                isRTL={isRTL}
                required
                error={errors.dob?.message}
              />
            </motion.div>
          </div>

          {/* Location (Country, State, City) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LocationField
              label=""
              value={{
                country: watch("country") || "",
                state: watch("state") || "",
                city: watch("city") || "",
              }}
              onValueChange={(value: LocationFieldValue) => {
                setValue("country", value.country, { shouldValidate: true });
                setValue("state", value.state, { shouldValidate: true });
                setValue("city", value.city, { shouldValidate: true });
              }}
              isRTL={isRTL}
              required
              errors={{
                country: errors.country?.message,
                state: errors.state?.message,
                city: errors.city?.message,
              }}
              layout="grid"
            />
          </motion.div>

          {/* Street Address & Postal Code */}
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <InputField
                {...register("street_address", {
                  required:
                    language === "en"
                      ? "Street address is required"
                      : "عنوان الشارع مطلوب",
                })}
                label={content.streetAddress}
                placeholder={content.streetAddressPlaceholder}
                icon={MapPin}
                isRTL={isRTL}
                required
                error={errors.street_address?.message}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <InputField
                {...register("postal_code", {
                  required:
                    language === "en"
                      ? "Postal code is required"
                      : "الرمز البريدي مطلوب",
                })}
                label={content.postalCode}
                placeholder={content.postalCodePlaceholder}
                icon={Hash}
                isRTL={isRTL}
                required
                error={errors.postal_code?.message}
              />
            </motion.div>
          </div>

          {/* ID Type */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <SelectField
              label={content.idType.label}
              placeholder={content.idType.placeholder}
              options={filteredIdTypeOptions}
              value={watch("id_type")}
              onValueChange={(value) => {
                setValue("id_type", value, { shouldValidate: true });
              }}
              isRTL={isRTL}
              required
              error={errors.id_type?.message}
            />
          </motion.div>

          {/* Artist-specific: Social Link Handler & Followers */}
          {isArtistRole && (
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75 }}
              >
                <InputField
                  {...register("social_link_handler")}
                  label={content.socialLinkHandler}
                  placeholder={content.socialLinkHandlerPlaceholder}
                  icon={Link}
                  isRTL={isRTL}
                  error={errors.social_link_handler?.message}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <InputField
                  {...register("social_link_followers")}
                  label={content.socialLinkFollowers}
                  placeholder={content.socialLinkFollowersPlaceholder}
                  icon={Users}
                  isRTL={isRTL}
                  error={errors.social_link_followers?.message}
                />
              </motion.div>
            </div>
          )}

          {/* Document Uploads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-4"
          >
            <h3 className="text-white text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              {content.documents.title}
            </h3>

            {/* ID Document - Multiple files (Front & Back) */}
            <div className="p-6 rounded-xl glass border border-white/10">
              <FileUploadField
                label={content.documents.idDocument.label}
                helperText={content.documents.idDocument.desc}
                accept=".pdf,.png,.jpg,.jpeg"
                maxSize={10 * 1024 * 1024} // 10MB
                multiple={true}
                maxFiles={2}
                files={[idDocumentFront, idDocumentBack].filter(
                  (f): f is File => f !== null
                )}
                onFilesChange={(files) => {
                  // Cleanup old preview URLs
                  cleanupPreviewUrls(idDocumentPreviews);

                  // Map files: first = front, second = back
                  const front = files[0] || null;
                  const back = files[1] || null;

                  setIdDocumentFront(front);
                  setIdDocumentBack(back);
                  setValue("gov_issued_id_front", front);
                  setValue("gov_issued_id_back", back);

                  // Create preview items for new files
                  if (files.length > 0) {
                    const previews = normalizeToPreviewItems(files, [
                      "Front",
                      "Back",
                    ]);
                    setIdDocumentPreviews(previews);
                  } else {
                    setIdDocumentPreviews([]);
                  }
                }}
                onPreviewChange={(items) => {
                  setIdDocumentPreviews(items);
                }}
                showPreview={false}
                isRTL={isRTL}
                formatText={content.documents.formats}
                buttonText={content.documents.uploadButton}
                buttonClassName="border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-white/70 hover:text-white"
                labelClassName="text-white/80 text-sm"
              />
              {/* Show current document previews if exist and no new files selected */}
              {idDocumentPreviews.length > 0 &&
                !idDocumentFront &&
                !idDocumentBack && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-[#B9BBC6]">
                      {language === "en"
                        ? "Current documents"
                        : "المستندات الحالية"}
                    </p>
                    <ImagePreviewList
                      items={idDocumentPreviews}
                      onRemove={(item) => {
                        // Remove from previews (read-only for existing documents)
                        const newPreviews = idDocumentPreviews.filter(
                          (p) => p.id !== item.id
                        );
                        setIdDocumentPreviews(newPreviews);
                        cleanupPreviewUrls([item]);
                      }}
                      size="md"
                      gridCols={2}
                      showNames={true}
                      itemLabels={["Front", "Back"]}
                      isRTL={isRTL}
                    />
                    <p className="text-xs text-white/40">
                      {language === "en"
                        ? "Upload new documents to replace"
                        : "قم بتحميل مستندات جديدة للاستبدال"}
                    </p>
                  </div>
                )}
              {/* Show previews for newly selected files */}
              {idDocumentPreviews.length > 0 &&
                (idDocumentFront || idDocumentBack) && (
                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-[#B9BBC6]">
                      {language === "en"
                        ? "Selected documents"
                        : "المستندات المحددة"}
                    </p>
                    <ImagePreviewList
                      items={idDocumentPreviews}
                      onRemove={(item) => {
                        // Find and remove the file
                        const index = idDocumentPreviews.findIndex(
                          (p) => p.id === item.id
                        );
                        if (index === 0) {
                          // Remove front
                          setIdDocumentFront(null);
                          setValue("gov_issued_id_front", null);
                        } else if (index === 1) {
                          // Remove back
                          setIdDocumentBack(null);
                          setValue("gov_issued_id_back", null);
                        }
                        const newPreviews = idDocumentPreviews.filter(
                          (p) => p.id !== item.id
                        );
                        setIdDocumentPreviews(newPreviews);
                        cleanupPreviewUrls([item]);
                      }}
                      size="md"
                      gridCols={2}
                      showNames={true}
                      itemLabels={["Front", "Back"]}
                      isRTL={isRTL}
                    />
                  </div>
                )}
            </div>

            {/* Proof of Address */}
            <div className="p-6 rounded-xl glass border border-white/10">
              <FileUploadField
                label={content.documents.proofOfAddress.label}
                helperText={content.documents.proofOfAddress.desc}
                accept=".pdf,.png,.jpg,.jpeg"
                maxSize={10 * 1024 * 1024} // 10MB
                value={proofOfAddress}
                onFileChange={(file) => {
                  // Cleanup old preview URLs
                  cleanupPreviewUrls(proofOfAddressPreviews);

                  setProofOfAddress(file);
                  setValue("proof_address", file || null);

                  // Create preview items for new file
                  if (file) {
                    const previews = normalizeToPreviewItems(file);
                    setProofOfAddressPreviews(previews);
                  } else {
                    setProofOfAddressPreviews([]);
                  }
                }}
                onPreviewChange={(items) => {
                  setProofOfAddressPreviews(items);
                }}
                isRTL={isRTL}
                formatText={content.documents.formats}
                buttonText={content.documents.uploadButton}
                buttonClassName="border-amber-500/30 hover:border-amber-500/50 hover:bg-amber-500/10 text-white/70 hover:text-white"
                labelClassName="text-white/80 text-sm"
              />
              {/* Show current document preview if exists and no new file selected */}
              {proofOfAddressPreviews.length > 0 && !proofOfAddress && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-[#B9BBC6]">
                    {language === "en" ? "Current document" : "المستند الحالي"}
                  </p>
                  <ImagePreviewList
                    items={proofOfAddressPreviews}
                    size="md"
                    showNames={true}
                    isRTL={isRTL}
                  />
                  <p className="text-xs text-white/40">
                    {language === "en"
                      ? "Upload new document to replace"
                      : "قم بتحميل مستند جديد للاستبدال"}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Security Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="p-6 rounded-xl bg-green-500/10 border border-green-500/30"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-green-400" />
              <h3 className="text-green-400">{content.security.title}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {content.security.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-[#B9BBC6] text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Compliance Checkbox */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="p-6 rounded-xl glass border border-white/10"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id="compliance"
                checked={acceptedCompliance}
                onCheckedChange={(checked: boolean) =>
                  setAcceptedCompliance(checked)
                }
                className="mt-0.5 border-white/20 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
              />
              <div>
                <Label
                  htmlFor="compliance"
                  className="text-white/80 cursor-pointer mb-1 block"
                >
                  {content.compliance.title}
                </Label>
                <p className="text-[#B9BBC6] text-sm leading-relaxed">
                  {content.compliance.text}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="space-y-4 pt-8"
          >
            <div className="flex gap-4">
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
                disabled={isLoading || !acceptedCompliance}
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
                      {language === "en" ? "Submitting..." : "جارٍ الإرسال..."}
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
            </div>

            <Button
              type="button"
              onClick={handleSkip}
              variant="ghost"
              disabled={isLoading}
              className="w-full disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer"
            >
              {content.skipForNow}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
