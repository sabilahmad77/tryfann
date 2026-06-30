import { useState, useEffect } from "react";
import {
  Loader2,
  Image as ImageIcon,
  User,
  Calendar,
  DollarSign,
  Tag,
  Ruler,
} from "lucide-react";
import { Button } from "../../ui/button";
import { useLanguage } from "@/contexts/useLanguage";
import { InputField, SelectField, TextareaField, FileUploadField } from "../../ui/custom-form-elements";
import { formatDateForInput } from "@/utils/dateUtils";
import { CustomModal } from "../../ui/CustomModal";
import { ImagePreviewList } from "../../ui/image-preview-list";
import {
  type PreviewItem,
  normalizeToPreviewItems,
  cleanupPreviewUrls,
  getFullImageUrl,
} from "@/utils/filePreviewHelpers";
import { motion } from "motion/react";

export interface Artwork {
  id?: number;
  title: string;
  artist: string;
  year: string;
  description?: string;
  dimensions?: string;
  image?: File | string | null;
  medium: string;
  acquired: string; // Date in YYYY-MM-DD format for input field
  value: string;
  category: "Contemporary" | "Digital" | "Traditional";
}

interface AddArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (artwork: Artwork) => void;
  isLoading?: boolean;
  initialData?: Artwork | null;
  isEditMode?: boolean;
}

const content = {
  en: {
    addArtworkTitle: "Add Artwork to Collection",
    editArtworkTitle: "Edit Artwork",
    artworkTitle: "Artwork Title",
    artistName: "Artist Name",
    year: "Year",
    description: "Description",
    dimensions: "Dimensions",
    medium: "Medium",
    acquisitionDate: "Acquisition Date",
    purchaseValue: "Purchase Value",
    category: "Category",
    uploadImage: "Upload Artwork Image",
    imageOptional: "(Optional)",
    cancel: "Cancel",
    addToCollection: "Add to Collection",
    updateArtwork: "Update Artwork",
    placeholder: {
      title: "e.g., Desert Echoes",
      artist: "e.g., Sarah Al-Mansouri",
      description: "Describe the artwork, its significance, style, and any notable details...",
      dimensions: "e.g., 120cm x 80cm",
      medium: "Oil on Canvas",
      acquisitionDate: "Dec 2024",
      purchaseValue: "10000",
    },
    categories: {
      contemporary: "Contemporary",
      digital: "Digital",
      traditional: "Traditional",
    },
  },
  ar: {
    addArtworkTitle: "إضافة عمل فني إلى المجموعة",
    editArtworkTitle: "تعديل العمل الفني",
    artworkTitle: "عنوان العمل الفني",
    artistName: "اسم الفنان",
    year: "السنة",
    description: "الوصف",
    dimensions: "الأبعاد",
    medium: "الوسيط",
    acquisitionDate: "تاريخ الاقتناء",
    purchaseValue: "قيمة الشراء",
    category: "الفئة",
    uploadImage: "تحميل صورة العمل الفني",
    imageOptional: "(اختياري)",
    cancel: "إلغاء",
    addToCollection: "إضافة إلى المجموعة",
    updateArtwork: "تحديث العمل الفني",
    placeholder: {
      title: "مثال: أصداء الصحراء",
      artist: "مثال: سارة المنصوري",
      description: "اوصف العمل الفني وأهميته وأسلوبه وأي تفاصيل ملحوظة...",
      dimensions: "مثال: 120سم × 80سم",
      medium: "زيت على قماش",
      acquisitionDate: "ديسمبر ٢٠٢٤",
      purchaseValue: "10000",
    },
    categories: {
      contemporary: "معاصر",
      digital: "رقمي",
      traditional: "تقليدي",
    },
  },
};

export function AddArtworkModal({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  initialData = null,
  isEditMode = false,
}: AddArtworkModalProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    year: "",
    description: "",
    dimensions: "",
    medium: "",
    acquired: "",
    value: "",
    category: "Contemporary" as "Contemporary" | "Digital" | "Traditional",
  });

  const [artworkImage, setArtworkImage] = useState<File | null>(null);
  const [artworkImagePreviews, setArtworkImagePreviews] = useState<PreviewItem[]>([]);

  // Load initial data when editing
  useEffect(() => {
    if (isEditMode && initialData) {
      setFormData({
        title: initialData.title || "",
        artist: initialData.artist || "",
        year: initialData.year || "",
        description: initialData.description || "",
        dimensions: initialData.dimensions || "",
        medium: initialData.medium || "",
        acquired: initialData.acquired ? formatDateForInput(initialData.acquired) : "",
        value: initialData.value || "",
        category: initialData.category || "Contemporary",
      });

      // Handle artwork image - could be a File, URL string, or null
      if (initialData.image) {
        if (initialData.image instanceof File) {
          setArtworkImage(initialData.image);
          const previews = normalizeToPreviewItems(initialData.image);
          setArtworkImagePreviews(previews);
        } else if (typeof initialData.image === "string") {
          const fullUrl = getFullImageUrl(initialData.image);
          if (fullUrl) {
            const previews = normalizeToPreviewItems(fullUrl);
            setArtworkImagePreviews(previews);
          } else {
            setArtworkImagePreviews([]);
          }
          setArtworkImage(null);
        }
      } else {
        setArtworkImage(null);
        setArtworkImagePreviews([]);
      }
    } else {
      // Reset form for add mode
      setFormData({
        title: "",
        artist: "",
        year: "",
        description: "",
        dimensions: "",
        medium: "",
        acquired: "",
        value: "",
        category: "Contemporary",
      });
      setArtworkImage(null);
      setArtworkImagePreviews([]);
    }
  }, [isEditMode, initialData, isOpen]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrls(artworkImagePreviews);
    };
  }, [artworkImagePreviews]);

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validate required fields
    if (!formData.title.trim() || !formData.artist.trim() || !formData.year.trim()) {
      return;
    }

    // Validate year is a valid number
    const yearNum = parseInt(formData.year);
    if (isNaN(yearNum) || yearNum < 1000 || yearNum > 9999) {
      return;
    }

    onSave({
      id: initialData?.id,
      title: formData.title.trim(),
      artist: formData.artist.trim(),
      year: formData.year.trim(),
      description: formData.description.trim() || undefined,
      dimensions: formData.dimensions.trim() || undefined,
      image: artworkImage,
      medium: formData.medium.trim(),
      acquired: formData.acquired,
      value: formData.value,
      category: formData.category,
    });
  };

  const footer = (
    <div className={`flex gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
      <Button
        type="button"
        onClick={onClose}
        variant="outline"
        disabled={isLoading}
        className="flex-1 transition-all duration-200 cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
      >
        {t.cancel}
      </Button>
      <Button
        type="button"
        onClick={handleSave}
        disabled={
          !formData.title.trim() || 
          !formData.artist.trim() || 
          !formData.year.trim() || 
          isLoading
        }
        className="flex-1 bg-gradient-to-r from-[#C59B48] to-[#D6AE5A] hover:from-[#A98237] hover:to-[#A98237] hover:shadow-lg hover:shadow-[#C59B48]/50 text-[#0B0B0D] border-0 disabled:opacity-50 disabled:bg-disabled disabled:cursor-not-allowed cursor-pointer transition-all duration-200"
      >
        {isLoading ? (
          <>
            <Loader2 className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"} animate-spin`} />
            {language === "en"
              ? isEditMode
                ? "Updating..."
                : "Adding..."
              : isEditMode
                ? "جاري التحديث..."
                : "جاري الإضافة..."}
          </>
        ) : isEditMode ? (
          t.updateArtwork
        ) : (
          t.addToCollection
        )}
      </Button>
    </div>
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t.editArtworkTitle : t.addArtworkTitle}
      size="lg"
      footer={footer}
    >
      <form onSubmit={handleSave} className="p-6">
        <div className="space-y-4">
          {/* Artwork Image Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <FileUploadField
              label={t.uploadImage}
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              value={artworkImage}
              onFileChange={(file) => {
                cleanupPreviewUrls(artworkImagePreviews);
                setArtworkImage(file);
                if (file) {
                  const previews = normalizeToPreviewItems(file);
                  setArtworkImagePreviews(previews);
                } else {
                  setArtworkImagePreviews([]);
                }
              }}
              onPreviewChange={(items) => {
                setArtworkImagePreviews(items);
              }}
              isRTL={isRTL}
              formatText={
                language === "en"
                  ? "PNG, JPG up to 5MB"
                  : "PNG، JPG حتى 5 ميجابايت"
              }
              hideOptional={false}
            />
            {/* Show current artwork image preview if exists and no new file selected */}
            {artworkImagePreviews.length > 0 && !artworkImage && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-[#B9BBC6]">
                  {language === "en"
                    ? "Current artwork image"
                    : "صورة العمل الفني الحالية"}
                </p>
                <ImagePreviewList
                  items={artworkImagePreviews}
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

          {/* Artwork Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <InputField
              label={t.artworkTitle}
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={t.placeholder.title}
              icon={ImageIcon}
              isRTL={isRTL}
              required
            />
          </motion.div>

          {/* Artist Name */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <InputField
              label={t.artistName}
              type="text"
              value={formData.artist}
              onChange={(e) =>
                setFormData({ ...formData, artist: e.target.value })
              }
              placeholder={t.placeholder.artist}
              icon={User}
              isRTL={isRTL}
              required
            />
          </motion.div>

          {/* Year and Medium */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <InputField
                label={t.year}
                type="number"
                min="1000"
                max="9999"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                placeholder="2024"
                icon={Calendar}
                isRTL={isRTL}
                required
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <InputField
                label={t.medium}
                type="text"
                value={formData.medium}
                onChange={(e) =>
                  setFormData({ ...formData, medium: e.target.value })
                }
                placeholder={t.placeholder.medium}
                icon={Tag}
                isRTL={isRTL}
              />
            </motion.div>
          </div>

          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <TextareaField
              label={t.description}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={t.placeholder.description}
              isRTL={isRTL}
              rows={4}
            />
          </motion.div>

          {/* Dimensions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <InputField
              label={t.dimensions}
              type="text"
              value={formData.dimensions}
              onChange={(e) =>
                setFormData({ ...formData, dimensions: e.target.value })
              }
              placeholder={t.placeholder.dimensions}
              icon={Ruler}
              isRTL={isRTL}
            />
          </motion.div>

          {/* Category */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <SelectField
              label={t.category}
              value={formData.category}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  category: value as "Contemporary" | "Digital" | "Traditional",
                })
              }
              options={[
                {
                  value: "Contemporary",
                  label: t.categories.contemporary,
                },
                {
                  value: "Digital",
                  label: t.categories.digital,
                },
                {
                  value: "Traditional",
                  label: t.categories.traditional,
                },
              ]}
              placeholder={language === "en" ? "Select category" : "اختر الفئة"}
              icon={Tag}
              isRTL={isRTL}
              contentClassName="z-[10000]"
            />
          </motion.div>

          {/* Acquisition Date and Purchase Value */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <InputField
                label={t.acquisitionDate}
                type="date"
                value={formData.acquired}
                onChange={(e) =>
                  setFormData({ ...formData, acquired: e.target.value })
                }
                icon={Calendar}
                isRTL={isRTL}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
            >
              <InputField
                label={t.purchaseValue}
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                placeholder={t.placeholder.purchaseValue}
                icon={DollarSign}
                isRTL={isRTL}
              />
            </motion.div>
          </div>
        </div>
      </form>
    </CustomModal>
  );
}
