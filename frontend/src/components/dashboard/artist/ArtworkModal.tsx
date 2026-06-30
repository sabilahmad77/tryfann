import { useLanguage } from "@/contexts/useLanguage";
import { Camera, DollarSign, Palette, Ruler, ArrowRight, Users } from "lucide-react";
import { CustomModal } from "@/components/ui/CustomModal";
import {
  InputField,
  TextareaField,
  FileUploadField,
  SelectField,
} from "@/components/ui/custom-form-elements";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export type ArtworkFormValues = {
  title: string;
  description: string;
  price: string;
  medium: string;
  dimensions: string;
  imageFile: File | null;
  user_type: string;
  no_artist?: string;
};

interface ArtworkModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialValues?: Partial<ArtworkFormValues>;
  onClose: () => void;
  onSubmit: (values: ArtworkFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
  /** Existing image URL to show when editing (backend image) */
  existingImageUrl?: string;
  /** Default user type to use (hides user type select when provided) */
  defaultUserType?: "Artist" | "Gallery" | "Collector";
}

const modalContent = {
  en: {
    titleCreate: "Add Artwork",
    titleEdit: "Edit Artwork",
    uploadImage: "Upload Image",
    artworkTitle: "Artwork Title",
    description: "Description",
    price: "Price (AED)",
    medium: "Medium",
    dimensions: "Dimensions",
    userType: "User Type",
    noOfArtists: "Number of Artists",
    mediamPlaceholder: "Oil on Canvas, Digital...",
    dimensionsPlaceholder: "100 x 80 cm",
    titlePlaceholder: "Enter title",
    descriptionPlaceholder: "Describe your artwork...",
    pricePlaceholder: "0.00",
    userTypePlaceholder: "Select user type",
    noOfArtistsPlaceholder: "Enter number of artists",
    imageRequired: "Please upload an image",
    error: "Please fill all required fields",
    save: "Save Changes",
    add: "Add Artwork",
    cancel: "Cancel",
  },
  ar: {
    titleCreate: "إضافة عمل فني",
    titleEdit: "تعديل العمل الفني",
    uploadImage: "تحميل الصورة",
    artworkTitle: "عنوان العمل",
    description: "الوصف",
    price: "السعر (درهم)",
    medium: "الوسيط",
    dimensions: "الأبعاد",
    userType: "نوع المستخدم",
    noOfArtists: "عدد الفنانين",
    mediamPlaceholder: "زيت على قماش، رقمي...",
    dimensionsPlaceholder: "100 × 80 سم",
    titlePlaceholder: "أدخل العنوان",
    descriptionPlaceholder: "صف عملك الفني...",
    pricePlaceholder: "0.00",
    userTypePlaceholder: "اختر نوع المستخدم",
    noOfArtistsPlaceholder: "أدخل عدد الفنانين",
    imageRequired: "يرجى تحميل صورة",
    error: "يرجى ملء جميع الحقول",
    save: "حفظ التغييرات",
    add: "إضافة عمل فني",
    cancel: "إلغاء",
  },
};

export function ArtworkModal({
  isOpen,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
  existingImageUrl,
  defaultUserType,
}: ArtworkModalProps) {
  const { language } = useLanguage();
  const t = modalContent[language];
  const isRTL = language === "ar";

  const [values, setValues] = useState<ArtworkFormValues>({
    title: "",
    description: "",
    price: "",
    medium: "",
    dimensions: "",
    imageFile: null,
    user_type: defaultUserType || "Artist",
    no_artist: "",
  });
  const [initialSnapshot, setInitialSnapshot] = useState<
    | {
        title: string;
        description: string;
        price: string;
        medium: string;
        dimensions: string;
        user_type: string;
        no_artist: string;
        hasNewImage: boolean;
      }
    | null
  >(null);

  useEffect(() => {
    if (isOpen) {
      const initialTitle = initialValues?.title ?? "";
      const initialDescription = initialValues?.description ?? "";
      const initialPrice = initialValues?.price ?? "";
      const initialMedium = initialValues?.medium ?? "";
      const initialDimensions = initialValues?.dimensions ?? "";
      // Always use defaultUserType if provided, otherwise use initialValues or default to "Artist"
      const initialUserType = defaultUserType ?? initialValues?.user_type ?? "Artist";
      const initialNoArtist = initialValues?.no_artist ?? "";

      setValues({
        title: initialTitle,
        description: initialDescription,
        price: initialPrice,
        medium: initialMedium,
        dimensions: initialDimensions,
        imageFile: null,
        user_type: initialUserType,
        no_artist: initialNoArtist,
      });

      setInitialSnapshot({
        title: initialTitle,
        description: initialDescription,
        price: initialPrice,
        medium: initialMedium,
        dimensions: initialDimensions,
        user_type: initialUserType,
        no_artist: initialNoArtist,
        hasNewImage: false,
      });
    }
  }, [isOpen, initialValues, defaultUserType]);

  const handleSubmit = async () => {
    const isDirty =
      initialSnapshot !== null &&
      (values.title !== initialSnapshot.title ||
        values.description !== initialSnapshot.description ||
        values.price !== initialSnapshot.price ||
        values.medium !== initialSnapshot.medium ||
        values.dimensions !== initialSnapshot.dimensions ||
        values.user_type !== initialSnapshot.user_type ||
        values.no_artist !== initialSnapshot.no_artist ||
        !!values.imageFile !== initialSnapshot.hasNewImage);

    if (!isDirty) {
      toast.error(
        language === "en"
          ? "No changes to save."
          : "لا توجد تغييرات لحفظها."
      );
      return;
    }

    // For create, image is required. For edit, allow without new image.
    if (mode === "create" && !values.imageFile) {
      toast.error(t.imageRequired);
      return;
    }

    if (
      !values.title ||
      !values.description ||
      !values.price ||
      !values.medium ||
      !values.dimensions ||
      !values.user_type
    ) {
      toast.error(t.error);
      return;
    }

    // Validate no_artist when Gallery is selected
    if (values.user_type === "Gallery" && !values.no_artist) {
      toast.error(
        language === "en"
          ? "Please enter the number of artists"
          : "يرجى إدخال عدد الفنانين"
      );
      return;
    }

    await onSubmit(values);
  };

  const title = mode === "create" ? t.titleCreate : t.titleEdit;
  const primaryLabel = mode === "create" ? t.add : t.save;

  const isDirty =
    initialSnapshot !== null &&
    (values.title !== initialSnapshot.title ||
      values.description !== initialSnapshot.description ||
      values.price !== initialSnapshot.price ||
      values.medium !== initialSnapshot.medium ||
      values.dimensions !== initialSnapshot.dimensions ||
      values.user_type !== initialSnapshot.user_type ||
      values.no_artist !== initialSnapshot.no_artist ||
      !!values.imageFile !== initialSnapshot.hasNewImage);

  const isGallery = values.user_type === "Gallery";
  const showUserTypeSelect = !defaultUserType; // Hide select when defaultUserType is provided

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      headerIcon={Camera}
      size="lg"
      maxHeight="max-h-[90vh]"
    >
      <div className="p-6 space-y-6">
        {/* Image Upload */}
        <FileUploadField
          label={t.uploadImage}
          required={mode === "create"}
          isRTL={isRTL}
          accept="image/*"
          maxSize={10 * 1024 * 1024}
          value={values.imageFile}
          onFileChange={(file) =>
            setValues((prev) => ({
              ...prev,
              imageFile: file,
            }))
          }
          formatText={
            language === "en"
              ? "JPG, PNG up to 10MB"
              : "صور JPG أو PNG حتى 10 ميجابايت"
          }
        />

        {/* Existing image preview for edit mode when no new file is selected */}
        {mode === "edit" && !values.imageFile && existingImageUrl && (
          <div className="space-y-2">
            <p className={`text-xs text-[#8A8EA0] ${isRTL ? "text-right" : "text-left"}`}>
              {language === "en"
                ? "Current image (will be kept unless you upload a new one)"
                : "الصورة الحالية (سيتم الاحتفاظ بها ما لم تقم بتحميل صورة جديدة)"}
            </p>
            <div className="relative w-full max-w-xs mx-auto">
              <div className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-background">
                <img
                  src={existingImageUrl}
                  alt="Current artwork"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          <InputField
            label={t.artworkTitle}
            required
            isRTL={isRTL}
            value={values.title}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder={t.titlePlaceholder}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label={t.price}
              required
              isRTL={isRTL}
              type="number"
              icon={DollarSign}
              value={values.price}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder={t.pricePlaceholder}
            />
            <InputField
              label={t.medium}
              required
              isRTL={isRTL}
              icon={Palette}
              value={values.medium}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, medium: e.target.value }))
              }
              placeholder={t.mediamPlaceholder}
            />
          </div>

          <InputField
            label={t.dimensions}
            required
            isRTL={isRTL}
            icon={Ruler}
            value={values.dimensions}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                dimensions: e.target.value,
              }))
            }
            placeholder={t.dimensionsPlaceholder}
          />

          {/* User Type Select - only show when defaultUserType is not provided */}
          {showUserTypeSelect && (
            <SelectField
              label={t.userType}
              required
              isRTL={isRTL}
              value={values.user_type}
              onValueChange={(value) =>
                setValues((prev) => ({
                  ...prev,
                  user_type: value,
                  // Clear no_artist when switching back to Artist
                  no_artist: value === "Artist" ? "" : prev.no_artist,
                }))
              }
              placeholder={t.userTypePlaceholder}
              options={[
                { value: "Artist", label: language === "en" ? "Artist" : "فنان" },
                { value: "Gallery", label: language === "en" ? "Gallery" : "معرض" },
              ]}
            />
          )}

          {/* Number of Artists field - show when Gallery is selected (either via select or defaultUserType) */}
          {isGallery && (
            <InputField
              label={t.noOfArtists}
              required
              isRTL={isRTL}
              type="number"
              icon={Users}
              value={values.no_artist || ""}
              onChange={(e) =>
                setValues((prev) => ({
                  ...prev,
                  no_artist: e.target.value,
                }))
              }
              placeholder={t.noOfArtistsPlaceholder}
            />
          )}

          <TextareaField
            label={t.description}
            required
            isRTL={isRTL}
            value={values.description}
            onChange={(e) =>
              setValues((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder={t.descriptionPlaceholder}
            rows={4}
          />
        </div>

        {/* Actions */}
        <div
          className={`flex gap-4 pt-6 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            disabled={isSubmitting}
            className="flex-1 h-12 border-white/20 hover:border-primary/50 hover:bg-primary/10 text-white/70 hover:text-white disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer"
          >
            {t.cancel}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !isDirty}
            className="flex-1 h-12 shadow-lg shadow-primary/50 group relative overflow-hidden disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubmitting ? (
                language === "en" ? "Saving..." : "جارٍ الحفظ..."
              ) : (
                <>
                  {primaryLabel}
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
      </div>
    </CustomModal>
  );
}


