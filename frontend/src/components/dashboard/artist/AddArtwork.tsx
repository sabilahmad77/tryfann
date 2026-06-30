import { useLanguage } from "@/contexts/useLanguage";
import {
  Camera,
  DollarSign,
  Image as ImageIcon,
  Lock,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Pencil,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCreateArtworkMutation,
  useGetMyArtworksQuery,
  useUpdateArtworkMutation,
  useDeleteArtworkMutation,
  type ArtworkItem,
} from "@/services/api/artworkApi";
import { Button } from "@/components/ui/button";
import { ArtworkModal, type ArtworkFormValues } from "./ArtworkModal";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { ProfileLockedState } from "@/components/dashboard/shared/ProfileLockedState";
import { ArtworkDetailModal, type ArtworkDetailData } from "@/components/ArtworkDetailModal";

interface AddArtworkProps {
  profileCompleted?: boolean;
  onCompleteProfile?: () => void;
  /** User type to use for artworks (Artist, Gallery, or Collector) */
  userType?: "Artist" | "Gallery" | "Collector";
  /** Callback to refetch dashboard stats after artwork is added */
  onRefetchStats?: () => void;
}

const content = {
  en: {
    title: "Add Artwork",
    subtitle: "Upload your masterpiece",
    uploadImage: "Upload Image",
    artworkTitle: "Artwork Title",
    description: "Description",
    price: "Price (AED)",
    medium: "Medium",
    dimensions: "Dimensions",
    addArtwork: "Add Artwork", // updated button label
    cancel: "Cancel",
    quickAdd: "Quick Add",
    mediamPlaceholder: "Oil on Canvas, Digital...",
    dimensionsPlaceholder: "100 x 80 cm",
    titlePlaceholder: "Enter title",
    descriptionPlaceholder: "Describe your artwork...",
    pricePlaceholder: "0.00",
    success: "Artwork added successfully! +50 points",
    error: "Please fill all required fields",
    imageRequired: "Please upload an image",
    earnPoints: "+50 pts",
    addNew: "Add New Artwork",
    myArtworks: "My Artworks",
    totalUploaded: "Total Uploaded",
    viewAll: "View All",
    delete: "Delete",
    confirmDelete: "Artwork deleted",
    noArtworks: "No artworks yet",
    startAdding: "Start adding your masterpieces",
    profileLocked: "Complete Your Profile",
    unlockFeature: "Complete your profile to unlock artwork uploads",
    completeProfile: "Complete Profile",
    profileRequired: "Please complete your profile to add artworks",
    loading: "Loading artworks...",
    loadError: "Unable to load artworks. Please try again.",
    userType: "User Type",
    noOfArtists: "Artists",
    artist: "Artist",
    gallery: "Gallery",
  },
  ar: {
    title: "إضافة عمل فني",
    subtitle: "ارفع تحفتك الفنية",
    uploadImage: "تحميل الصورة",
    artworkTitle: "عنوان العمل",
    description: "الوصف",
    price: "السعر (درهم)",
    medium: "الوسيط",
    dimensions: "الأبعاد",
    addArtwork: "إضافة عمل فني", // updated button label
    cancel: "إلغاء",
    quickAdd: "إضافة سريعة",
    mediamPlaceholder: "زيت على قماش، رقمي...",
    dimensionsPlaceholder: "100 × 80 سم",
    titlePlaceholder: "أدخل العنوان",
    descriptionPlaceholder: "صف عملك الفني...",
    pricePlaceholder: "0.00",
    success: "تمت إضافة العمل الفني! +50 نقطة",
    error: "يرجى ملء جميع الحقول",
    imageRequired: "يرجى تحميل صورة",
    earnPoints: "+50 نقطة",
    addNew: "إضافة عمل فني جديد",
    myArtworks: "أعمالي الفنية",
    totalUploaded: "المجموع المرفوع",
    viewAll: "عرض الكل",
    delete: "حذف",
    confirmDelete: "تم حذف العمل الفني",
    noArtworks: "لا توجد أعمال فنية حتى الآن",
    startAdding: "ابدأ بإضافة روائعك",
    profileLocked: "أكمل ملفك الشخصي",
    unlockFeature: "أكمل ملفك الشخصي لفتح تحميل الأعمال الفنية",
    completeProfile: "إكمال الملف الشخصي",
    profileRequired: "يرجى إكمال ملفك الشخصي لإضافة أعمال فنية",
    loading: "جارٍ تحميل الأعمال الفنية...",
    loadError: "تعذر تحميل الأعمال الفنية. يرجى المحاولة مرة أخرى.",
    userType: "نوع المستخدم",
    noOfArtists: "فنانين",
    artist: "فنان",
    gallery: "معرض",
  },
};

export function AddArtwork({
  profileCompleted,
  onCompleteProfile,
  userType = "Artist",
  onRefetchStats,
}: AddArtworkProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkItem | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ArtworkItem | null>(null);
  const [selectedArtworkForDetail, setSelectedArtworkForDetail] = useState<ArtworkDetailData | null>(null);
  const [isArtworkDetailOpen, setIsArtworkDetailOpen] = useState(false);
  const {
    data: artworks,
    isLoading,
    isError,
    refetch,
  } = useGetMyArtworksQuery();
  const [createArtwork, { isLoading: isCreating }] = useCreateArtworkMutation();
  const [updateArtwork, { isLoading: isUpdating }] = useUpdateArtworkMutation();
  const [deleteArtwork, { isLoading: isDeleting }] = useDeleteArtworkMutation();

  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedArtwork(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (artwork: ArtworkItem) => {
    setModalMode("edit");
    setSelectedArtwork(artwork);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedArtwork(null);
  };

  const handleCreateSubmit = async (values: ArtworkFormValues) => {
    try {
      const created = await createArtwork({
        title: values.title,
        description: values.description,
        price: values.price,
        medium: values.medium,
        dimensions: values.dimensions,
        image: values.imageFile as File,
        user_type: userType,
        no_artist: values.no_artist || undefined,
      }).unwrap();

      toast.success(t.success);
      void refetch();
      // Refetch dashboard stats to update points and other stats
      onRefetchStats?.();
      handleModalClose();

      if (import.meta.env.DEV) {
        console.log("Artwork created:", created);
      }
    } catch {
      // Error toast already handled by baseApi
    }
  };

  const handleEditSubmit = async (values: ArtworkFormValues) => {
    if (!selectedArtwork) return;
    try {
      const updated = await updateArtwork({
        id: selectedArtwork.id,
        title: values.title,
        description: values.description,
        price: values.price,
        medium: values.medium,
        dimensions: values.dimensions,
        image: values.imageFile ?? undefined,
        user_type: userType,
        no_artist: values.no_artist || undefined,
      }).unwrap();

      toast.success(
        language === "en"
          ? "Artwork updated successfully"
          : "تم تحديث العمل الفني بنجاح"
      );
      void refetch();
      // Refetch dashboard stats to update points and other stats
      onRefetchStats?.();
      handleModalClose();

      if (import.meta.env.DEV) {
        console.log("Artwork updated:", updated);
      }
    } catch {
      // Error toast already handled by baseApi
    }
  };

  const handleDeleteClick = (artwork: ArtworkItem) => {
    setDeleteTarget(artwork);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteArtwork(deleteTarget.id).unwrap();
      toast.success(
        language === "en"
          ? "Artwork deleted successfully"
          : "تم حذف العمل الفني بنجاح"
      );
      void refetch();
    } catch {
      // Error toast already handled by baseApi
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleAddClick = () => {
    if (!profileCompleted) {
      toast.error(t.profileRequired);
      return;
    }
    handleOpenCreate();
  };

  return (
    <>
      {/* Main Card */}
      <div className="glass rounded-2xl p-6 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div
          className={`flex items-center justify-between mb-4 ${isRTL ? "flex-row-reverse" : ""
            }`}
        >
          <div
            className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
              }`}
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[#C59B48] to-[#D6AE5A] rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-[#121217]" />
              </div>
              {/* Pulsing glow */}
              <motion.div
                className="absolute inset-0 bg-[#C59B48]/30 rounded-xl blur-xl"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              {/* Lock overlay if profile not completed */}
              {!profileCompleted && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#D6AE5A] to-[#C59B48] rounded-full flex items-center justify-center border-2 border-[#121217]">
                  <Lock className="w-3 h-3 text-[#121217]" />
                </div>
              )}
            </div>
            <div className={isRTL ? "text-right" : "text-left"}>
              <h3 className="text-lg text-[#F2F2F3]">{t.myArtworks}</h3>
              <p className="text-sm text-[#8A8EA0]">
                {artworks?.length ?? 0}{" "}
                {language === "en" ? "artworks" : "أعمال فنية"}
              </p>
            </div>
          </div>

          {/* Add Button - match primary CTA styling and cursor behavior */}
          <Button
            type="button"
            onClick={handleAddClick}
            disabled={!profileCompleted}
            className="relative overflow-hidden bg-gradient-to-r from-[#C59B48] to-[#D6AE5A] text-[#121217] px-4 py-2 rounded-xl hover:opacity-90 transition-all group cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
          >
            <span
              className={`relative flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""
                }`}
            >
              {!profileCompleted && <Lock className="w-3 h-3" />}
              <Plus className="w-4 h-4" />
              <span className="text-sm">
                {language === "en" ? "Add Artwork" : "إضافة عمل فني"}
              </span>
            </span>
          </Button>
        </div>

        {/* Artworks Grid or Empty State */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {!profileCompleted ? (
            /* Profile Locked State */
            <ProfileLockedState
              title={t.profileLocked}
              description={t.unlockFeature}
              ctaLabel={t.completeProfile}
              onCta={onCompleteProfile}
              isRTL={isRTL}
            />
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-[#8A8EA0]">{t.loading}</p>
            </div>
          ) : isError ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-[#ff6b6b]">{t.loadError}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-[#C59B48]/40 text-[#C59B48] hover:bg-[#C59B48]/10"
              >
                {language === "en" ? "Retry" : "إعادة المحاولة"}
              </Button>
            </div>
          ) : !artworks || artworks.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="bg-[#0B0B0D] border border-[#C59B48]/20 rounded-xl p-8 text-center max-w-sm mx-auto">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#C59B48]/10 to-[#45e3d3]/10 border border-[#C59B48]/30 rounded-2xl flex items-center justify-center">
                  <Upload className="w-10 h-10 text-[#C59B48]/70" />
                </div>
                <p className="text-[#F2F2F3] mb-2">{t.noArtworks}</p>
                <p className="text-sm text-[#8A8EA0] mb-4">{t.startAdding}</p>
                <div className="flex items-center justify-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#45e3d3]" />
                    <span className="text-sm text-[#45e3d3]">{t.earnPoints}</span>
                  </div>
                  <div className="w-px h-4 bg-[#C59B48]/30" />
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-[#C59B48]" />
                    <span className="text-sm text-[#8A8EA0]">JPG, PNG</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {artworks.map((artwork: ArtworkItem, index: number) => (
                <motion.div
                  key={artwork.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="group relative"
                  onClick={() => {
                    setSelectedArtworkForDetail({
                      id: artwork.id,
                      title: artwork.title,
                      price: artwork.price,
                      image: artwork.image,
                      description: artwork.description || '',
                      dimensions: artwork.dimensions || '',
                      medium: artwork.medium || '',
                      status: artwork.status,
                      // Extract year from created_at if available (API might include it even if not in interface)
                      year: (() => {
                        const artworkWithDate = artwork as ArtworkItem & { created_at?: string };
                        return artworkWithDate.created_at
                          ? new Date(artworkWithDate.created_at).getFullYear().toString()
                          : undefined;
                      })(),
                    });
                    setIsArtworkDetailOpen(true);
                  }}
                >
                  {/* Artwork Tile */}
                  <div className="relative overflow-hidden rounded-xl border border-[#C59B48]/20 bg-[#0B0B0D] backdrop-blur-sm hover:border-[#C59B48]/50 transition-all duration-300 cursor-pointer">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={artwork.image}
                        alt={artwork.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0D] via-[#0B0B0D]/40 to-transparent opacity-80" />

                      {/* Hover Actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(artwork);
                          }}
                          className="w-10 h-10 bg-[#C59B48]/90 hover:bg-[#C59B48] rounded-lg flex items-center justify-center backdrop-blur-sm cursor-pointer"
                        >
                          <Pencil className="w-5 h-5 text-[#121217]" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(artwork);
                          }}
                          className="w-10 h-10 bg-red-500/90 hover:bg-red-500 rounded-lg flex items-center justify-center backdrop-blur-sm cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5 text-white" />
                        </motion.button>
                      </div>

                      {/* New Badge */}
                      {index === artworks.length - 1 && (
                        <div className="absolute top-2 left-2">
                          <div className="px-2 py-1 bg-gradient-to-r from-[#45e3d3] to-[#3bc4b5] rounded-lg flex items-center gap-1 backdrop-blur-sm">
                            <Sparkles className="w-3 h-3 text-white" />
                            <span className="text-xs text-white">New</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info Section */}
                    <div className="p-3 space-y-2">
                      <h4
                        className={`text-sm text-[#F2F2F3] mb-2 truncate ${isRTL ? "text-right" : "text-left"
                          }`}
                      >
                        {artwork.title}
                      </h4>

                      {/* First Row: Price and Medium */}
                      <div
                        className={`flex items-center justify-between gap-2 ${isRTL ? "flex-row-reverse" : ""
                          }`}
                      >
                        {/* Price */}
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#45e3d3]/10 border border-[#45e3d3]/30 rounded-lg">
                          <DollarSign className="w-3 h-3 text-[#45e3d3]" />
                          <span className="text-xs text-[#45e3d3]">{artwork.price}</span>
                        </div>

                        {/* Medium Badge */}
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#C59B48]/10 border border-[#C59B48]/30 rounded-lg max-w-[100px]">
                          <Palette className="w-3 h-3 text-[#C59B48] flex-shrink-0" />
                          <span className="text-xs text-[#C59B48] truncate">{artwork.medium}</span>
                        </div>
                      </div>
                    </div>

                    {/* Glow Effect on Hover */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#C59B48]/0 to-[#45e3d3]/0 group-hover:from-[#C59B48]/10 group-hover:to-[#45e3d3]/10 pointer-events-none transition-all duration-300"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <ArtworkModal
        isOpen={isModalOpen}
        mode={modalMode}
        defaultUserType={userType}
        initialValues={
          modalMode === "edit" && selectedArtwork
            ? {
              title: selectedArtwork.title,
              description: selectedArtwork.description,
              price: selectedArtwork.price,
              medium: selectedArtwork.medium,
              dimensions: selectedArtwork.dimensions,
              user_type: selectedArtwork.user_type || userType,
              no_artist: selectedArtwork.no_artist || "",
            }
            : undefined
        }
        existingImageUrl={
          modalMode === "edit" && selectedArtwork ? selectedArtwork.image : undefined
        }
        onClose={handleModalClose}
        onSubmit={modalMode === "create" ? handleCreateSubmit : handleEditSubmit}
        isSubmitting={modalMode === "create" ? isCreating : isUpdating}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          if (isDeleting) return;
          setIsDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        variant="danger"
        isLoading={isDeleting}
        title={
          language === "en"
            ? "Delete artwork"
            : "حذف العمل الفني"
        }
        message={
          language === "en"
            ? "Are you sure you want to delete this artwork? This action cannot be undone."
            : "هل أنت متأكد من حذف هذا العمل الفني؟ لا يمكن التراجع عن هذا الإجراء."
        }
      />

      {/* Artwork Detail Modal */}
      <ArtworkDetailModal
        isOpen={isArtworkDetailOpen}
        onClose={() => {
          setIsArtworkDetailOpen(false);
          setSelectedArtworkForDetail(null);
        }}
        artwork={selectedArtworkForDetail}
      />
    </>
  );
}

