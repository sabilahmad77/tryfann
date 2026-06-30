import { useLanguage } from "@/contexts/useLanguage";
import {
  useCreateArtworkCollectionMutation,
  useDeleteArtworkCollectionMutation,
  useGetArtworkCollectionQuery,
  useUpdateArtworkCollectionMutation,
  type ArtworkCollection,
} from "@/services/api/dashboardApi";
import { formatDateForDisplay } from "@/utils/dateUtils";
import {
  Gem,
  Loader2,
  Lock,
  Plus,
  Trash2,
  TrendingUp
} from "lucide-react";
import { Edit2 } from "lucide-react@0.487.0";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { ConfirmationDialog } from "../../ui/ConfirmationDialog";
import { AddArtworkModal, type Artwork } from "./AddArtworkModal";
import { ProfileLockedState } from "../shared/ProfileLockedState";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { getFullImageUrl } from "@/utils/filePreviewHelpers";
import { ArtworkDetailModal, type ArtworkDetailData } from "@/components/ArtworkDetailModal";

interface MyCollectionProps {
  profileCompleted?: boolean;
  onCompleteProfile?: () => void;
  statsData?: {
    artwork_count?: number;
    portfolio_value?: number;
    growth?: number;
    [key: string]: unknown;
  };
  /** Callback to refetch dashboard stats after collection is modified */
  onRefetchStats?: () => void;
}

const content = {
  en: {
    title: "My Collection",
    totalPieces: "Total Pieces",
    totalValue: "Portfolio Value",
    growth: "Growth",
    addPiece: "Add Artwork",
    filter: "Filter",
    recent: "Recent Acquisitions",
    profileLocked: "Complete Your Profile",
    unlockFeature: "Complete your profile to unlock collection management",
    completeProfile: "Complete Profile",
    profileRequired: "Please complete your profile to add artworks",
    pieces: [
      {
        title: "Desert Echoes",
        artist: "Sarah Al-Mansouri",
        year: "2024",
        medium: "Oil on Canvas",
        acquired: "Nov 2024",
        value: "$12,500",
        category: "Contemporary" as const,
      },
      {
        title: "Digital Horizon",
        artist: "Ahmed Hassan",
        year: "2024",
        medium: "Digital Art",
        acquired: "Oct 2024",
        value: "$8,000",
        category: "Digital" as const,
      },
      {
        title: "Urban Reflections",
        artist: "Layla Ibrahim",
        year: "2023",
        medium: "Mixed Media",
        acquired: "Sep 2024",
        value: "$15,000",
        category: "Contemporary" as const,
      },
    ] as Artwork[],
    categories: {
      contemporary: "Contemporary",
      digital: "Digital",
      traditional: "Traditional",
    },
    by: "by",
    deleteSuccess: "Artwork deleted successfully",
    deleteError: "Failed to delete artwork",
    addSuccess: "Artwork added successfully",
    editSuccess: "Artwork updated successfully",
    addError: "Failed to add artwork",
    editError: "Failed to update artwork",
    actions: {
      edit: "Edit",
      delete: "Delete",
    },
  },
  ar: {
    title: "مجموعتي",
    totalPieces: "إجمالي القطع",
    totalValue: "قيمة المحفظة",
    growth: "النمو",
    addPiece: "إضافة عمل فني",
    filter: "تصفية",
    recent: "الاقتناءات الأخيرة",
    profileLocked: "أكمل ملفك الشخصي",
    unlockFeature: "أكمل ملفك الشخصي لفتح إدارة مجموعتك",
    completeProfile: "إكمال الملف الشخصي",
    profileRequired: "يرجى إكمال ملفك الشخصي لإضافة أعمال فنية",
    pieces: [
      {
        title: "أصداء الصحراء",
        artist: "سارة المنصوري",
        year: "٢٠٢٤",
        medium: "زيت على قماش",
        acquired: "نوفمبر ٢٠٢٤",
        value: "١٢,٥٠٠ دولار",
        category: "Contemporary" as const,
      },
      {
        title: "الأفق الرقمي",
        artist: "أحمد حسن",
        year: "٢٠٢٤",
        medium: "فن رقمي",
        acquired: "أكتوبر ٢٠٢٤",
        value: "٨,٠٠٠ دولار",
        category: "Digital" as const,
      },
      {
        title: "انعكاسات المدينة",
        artist: "ليلى إبراهيم",
        year: "٢٠٢٣",
        medium: "وسائط مختلطة",
        acquired: "سبتمبر ٢٠٢٤",
        value: "١٥,٠٠٠ دولار",
        category: "Contemporary" as const,
      },
    ] as Artwork[],
    categories: {
      contemporary: "معاصر",
      digital: "رقمي",
      traditional: "تقليدي",
    },
    by: "بواسطة",
    deleteSuccess: "تم حذف العمل الفني بنجاح",
    deleteError: "فشل حذف العمل الفني",
    addSuccess: "تم إضافة العمل الفني بنجاح",
    editSuccess: "تم تحديث العمل الفني بنجاح",
    addError: "فشل إضافة العمل الفني",
    editError: "فشل تحديث العمل الفني",
    actions: {
      edit: "تعديل",
      delete: "حذف",
    },
  },
};

export function MyCollection({
  profileCompleted = true,
  onCompleteProfile,
  statsData,
  onRefetchStats,
}: MyCollectionProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [artworkList, setArtworkList] = useState<Artwork[]>([]);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [deletingArtworkId, setDeletingArtworkId] = useState<number | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [artworkToDelete, setArtworkToDelete] = useState<number | null>(null);
  const [selectedArtworkForDetail, setSelectedArtworkForDetail] = useState<ArtworkDetailData | null>(null);
  const [isArtworkDetailOpen, setIsArtworkDetailOpen] = useState(false);

  // Fetch artworks from API
  const {
    data: artworksData,
    isLoading: isLoadingArtworks,
    error: artworksError,
  } = useGetArtworkCollectionQuery(undefined, { skip: !profileCompleted });

  const [createArtwork, { isLoading: isCreating }] =
    useCreateArtworkCollectionMutation();
  const [updateArtwork, { isLoading: isUpdating }] =
    useUpdateArtworkCollectionMutation();
  const [deleteArtwork, { isLoading: isDeleting }] =
    useDeleteArtworkCollectionMutation();

  // Transform API data to component format
  useEffect(() => {
    if (!profileCompleted) {
      return;
    }
    if (artworksData?.data) {
      const apiArtworks = Array.isArray(artworksData.data)
        ? artworksData.data
        : [artworksData.data];

      const transformedArtworks: Artwork[] = apiArtworks.map(
        (artwork: ArtworkCollection) => ({
          id: artwork.id,
          title: artwork.title,
          artist: artwork.artist_name,
          year: artwork.year,
          description: artwork.description,
          dimensions: artwork.dimensions,
          image: artwork.image || null,
          medium: artwork.medium,
          acquired: artwork.acquisition_date || "", // Keep original YYYY-MM-DD format for date input
          value: artwork.purchase_value
            ? artwork.purchase_value.toString()
            : "0",
          category: (artwork.category as "Contemporary" | "Digital" | "Traditional") || "Contemporary",
        })
      );

      setArtworkList(transformedArtworks);
    } else if (!artworksData && !isLoadingArtworks && !artworksError) {
      // Fallback to default data if API returns no data
      setArtworkList(t.pieces);
    }
  }, [profileCompleted, artworksData, isLoadingArtworks, artworksError, t.pieces]);

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "contemporary":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "digital":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    }
  };

  const handleAddArtwork = async (artwork: Artwork) => {
    try {
      const purchaseValue = artwork.value
        ? parseFloat(artwork.value) || 0
        : 0;

      let response;
      if (artwork.id) {
        // Update existing artwork
        response = await updateArtwork({
          id: artwork.id,
          data: {
            title: artwork.title,
            artist_name: artwork.artist,
            year: artwork.year,
            description: artwork.description,
            dimensions: artwork.dimensions,
            image: artwork.image instanceof File ? artwork.image : undefined,
            medium: artwork.medium,
            category: artwork.category,
            acquisition_date: artwork.acquired || undefined,
            purchase_value: purchaseValue,
          },
        }).unwrap();
      } else {
        // Create new artwork
        response = await createArtwork({
          title: artwork.title,
          artist_name: artwork.artist,
          year: artwork.year,
          description: artwork.description,
          dimensions: artwork.dimensions,
          image: artwork.image instanceof File ? artwork.image : undefined,
          medium: artwork.medium,
          category: artwork.category,
          acquisition_date: artwork.acquired || undefined,
          purchase_value: purchaseValue,
        }).unwrap();
      }

      // Extract success message from API response
      let successMessage = artwork.id ? t.editSuccess : t.addSuccess;
      if (response?.message) {
        if (typeof response.message === "string" && response.message.trim()) {
          successMessage = response.message;
        } else if (
          typeof response.message === "object" &&
          response.message !== null &&
          Object.keys(response.message).length > 0
        ) {
          const messageObj = response.message as Record<string, unknown>;
          if (messageObj.message) {
            successMessage = String(messageObj.message);
          }
        }
      }

      toast.success(successMessage);
      // Refetch dashboard stats to update points and other stats
      onRefetchStats?.();
      setIsModalOpen(false);
      setEditingArtwork(null);
    } catch (error) {
      console.error(
        `Failed to ${artwork.id ? "update" : "create"} artwork:`,
        error
      );
      const errorMessage = artwork.id ? t.editError : t.addError;
      toast.error(errorMessage);
      setIsModalOpen(false);
      setEditingArtwork(null);
    }
  };

  const handleEditArtwork = (artwork: Artwork) => {
    setEditingArtwork(artwork);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (artworkId: number) => {
    setArtworkToDelete(artworkId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!artworkToDelete) return;

    try {
      setDeletingArtworkId(artworkToDelete);
      const response = await deleteArtwork(artworkToDelete).unwrap();

      // Extract success message from API response
      let successMessage = t.deleteSuccess;
      if (response?.message) {
        if (typeof response.message === "string" && response.message.trim()) {
          successMessage = response.message;
        } else if (
          typeof response.message === "object" &&
          response.message !== null &&
          Object.keys(response.message).length > 0
        ) {
          const messageObj = response.message as Record<string, unknown>;
          if (messageObj.message) {
            successMessage = String(messageObj.message);
          }
        }
      }

      toast.success(successMessage);
      // Refetch dashboard stats to update points and other stats
      onRefetchStats?.();
      setShowDeleteConfirm(false);
      setArtworkToDelete(null);
    } catch (error) {
      console.error("Failed to delete artwork:", error);
      toast.error(t.deleteError);
    } finally {
      setDeletingArtworkId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setArtworkToDelete(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArtwork(null);
  };

  const handleAddClick = () => {
    if (!profileCompleted) {
      toast.error(t.profileRequired);
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <div className="glass rounded-2xl p-6 h-full">
      {/* Header */}
      <div
        className={`flex items-center justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""
          }`}
      >
        <div
          className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""
            }`}
        >
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-[#C59B48] to-[#9375b5] rounded-xl flex items-center justify-center">
              <Gem className="w-6 h-6 text-white" />
            </div>
            {/* Subtle pulsing glow (match AddArtwork) */}
            <motion.div
              className="absolute inset-0 bg-[#C59B48]/30 rounded-xl blur-xl"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Lock overlay if profile not completed */}
            {!profileCompleted && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-[#D6AE5A] to-[#C59B48] rounded-full flex items-center justify-center border-2 border-[#0B0B0D]">
                <Lock className="w-3 h-3 text-[#0B0B0D]" />
              </div>
            )}
          </div>
          <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
        </div>
        <div className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <Button
            size="sm"
            onClick={handleAddClick}
            disabled={!profileCompleted}
            className="border-0 cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
          >
            {!profileCompleted && <Lock className={`w-3 h-3 ${isRTL ? "ml-2" : "mr-2"}`} />}
            <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.addPiece}
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-[#0B0B0D] rounded-xl p-4 border border-[#9375b5]/30"
        >
          <div
            className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""
              }`}
          >
            <Gem className="w-4 h-4 text-[#9375b5]" />
            <span className="text-xs text-[#8A8EA0]">{t.totalPieces}</span>
          </div>
          <p className="text-2xl text-[#F2F2F3]">
            {statsData?.artwork_count ?? artworkList.length}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-[#0B0B0D] rounded-xl p-4 border border-[#45e3d3]/30"
        >
          <div
            className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""
              }`}
          >
            <TrendingUp className="w-4 h-4 text-[#45e3d3]" />
            <span className="text-xs text-[#8A8EA0]">{t.totalValue}</span>
          </div>
          <p className="text-2xl text-[#F2F2F3]">
            {statsData?.portfolio_value
              ? `$${statsData.portfolio_value.toFixed(1)}K`
              : "$0K"}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-[#0B0B0D] rounded-xl p-4 border border-[#C59B48]/30"
        >
          <div
            className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""
              }`}
          >
            <TrendingUp className="w-4 h-4 text-[#C59B48]" />
            <span className="text-xs text-[#8A8EA0]">{t.growth}</span>
          </div>
          <p className="text-2xl text-emerald-400">
            {statsData?.growth !== undefined
              ? `+${statsData.growth.toFixed(1)}%`
              : "+0%"}
          </p>
        </motion.div>
      </div>

      {/* Recent Acquisitions */}
      <div>
        <h3
          className={`text-sm text-[#8A8EA0] mb-4 ${isRTL ? "text-right" : "text-left"
            }`}
        >
          {t.recent}
        </h3>
        {!profileCompleted ? (
          <ProfileLockedState
            title={t.profileLocked}
            description={t.unlockFeature}
            ctaLabel={t.completeProfile}
            onCta={onCompleteProfile}
            isRTL={isRTL}
          />
        ) : isLoadingArtworks ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-[#C59B48] animate-spin" />
          </div>
        ) : artworksError ? (
          <div className="text-center py-8 text-[#8A8EA0]">
            <p className="text-sm">
              {language === "en"
                ? "Failed to load artworks. Showing default data."
                : "فشل تحميل الأعمال الفنية. عرض البيانات الافتراضية."}
            </p>
          </div>
        ) : artworkList.length === 0 ? (
          <div className="text-center py-8 text-[#8A8EA0]">
            <p className="text-sm">
              {language === "en"
                ? "No artworks found. Add your first artwork!"
                : "لم يتم العثور على أعمال فنية. أضف أول عمل فني!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto overflow-x-hidden custom-scrollbar">
            {artworkList.map((piece, index) => (
              <motion.div
                key={piece.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setSelectedArtworkForDetail({
                    id: piece.id,
                    title: piece.title,
                    artist: piece.artist,
                    artist_name: piece.artist,
                    year: piece.year,
                    description: piece.description,
                    dimensions: piece.dimensions,
                    image: typeof piece.image === 'string' ? piece.image : null,
                    medium: piece.medium,
                    category: piece.category,
                    purchase_value: piece.value ? parseFloat(piece.value) : undefined,
                    acquisition_date: piece.acquired || undefined,
                  });
                  setIsArtworkDetailOpen(true);
                }}
                className="bg-[#0B0B0D] rounded-xl p-4 border border-[#4e4e4e78] hover:border-[#C59B48]/50 transition-all cursor-pointer"
              >
                <div
                  className={`flex items-start gap-4 ${isRTL ? "flex-row-reverse" : ""
                    }`}
                >
                  {/* Artwork Image */}
                  {piece.image && typeof piece.image === "string" && (
                    <Avatar className="w-16 h-16 border-2 border-[#C59B48]/50 shrink-0">
                      <AvatarImage
                        src={getFullImageUrl(piece.image) || piece.image}
                        alt={piece.title}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-[#C59B48] to-[#9375b5] text-white">
                        {piece.title.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                    <div
                      className={`flex items-center gap-2 mb-1 ${isRTL ? "flex-row-reverse" : ""
                        }`}
                    >
                      <h3 className="text-[#F2F2F3]">{piece.title}</h3>
                      <Badge
                        className={`${getCategoryColor(
                          piece.category
                        )} border text-xs`}
                      >
                        {
                          t.categories[
                          piece.category.toLowerCase() as keyof typeof t.categories
                          ]
                        }
                      </Badge>
                    </div>
                    <p className="text-sm text-[#8A8EA0]">
                      {t.by} {piece.artist} • {piece.year}
                    </p>
                    {piece.medium && (
                      <p className="text-xs text-[#B9BBC6] mt-1">{piece.medium}</p>
                    )}
                    {piece.dimensions && (
                      <p className="text-xs text-[#B9BBC6] mt-1">
                        {language === "en" ? "Dimensions: " : "الأبعاد: "}
                        {piece.dimensions}
                      </p>
                    )}
                    {piece.description && (
                      <p className="text-xs text-[#8A8EA0] mt-2 line-clamp-2">
                        {piece.description}
                      </p>
                    )}
                  </div>
                  <div
                    className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""
                      }`}
                  >
                    <div className={isRTL ? "text-left" : "text-right"}>
                      <p className="text-lg text-[#C59B48]">
                        ${parseFloat(piece.value || "0").toLocaleString()}
                      </p>
                      <p className="text-xs text-[#B9BBC6]">
                        {piece.acquired ? formatDateForDisplay(piece.acquired, language) : ""}
                      </p>
                    </div>
                    <div
                      className={`flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditArtwork(piece);
                        }}
                        disabled={isUpdating || isDeleting}
                        className="bg-primary/10 hover:bg-primary/20 hover:scale-110 text-primary hover:text-primary transition-all duration-200 cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed disabled:hover:scale-100"
                        title={t.actions.edit}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (piece.id) handleDeleteClick(piece.id);
                        }}
                        disabled={
                          isDeleting ||
                          deletingArtworkId === piece.id ||
                          !piece.id
                        }
                        className="bg-red-500/10 hover:bg-red-500/20 hover:scale-110 text-red-400 hover:text-red-300 transition-all duration-200 cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed"
                        title={t.actions.delete}
                      >
                        {deletingArtworkId === piece.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Artwork Modal */}
      <AddArtworkModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleAddArtwork}
        isLoading={isCreating || isUpdating}
        initialData={editingArtwork}
        isEditMode={!!editingArtwork}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        title={
          language === "en"
            ? "Delete Artwork"
            : "حذف العمل الفني"
        }
        message={
          language === "en"
            ? "Are you sure you want to delete this artwork? This action cannot be undone."
            : "هل أنت متأكد من حذف هذا العمل الفني؟ لا يمكن التراجع عن هذا الإجراء."
        }
        confirmText={language === "en" ? "Delete" : "حذف"}
        cancelText={language === "en" ? "Cancel" : "إلغاء"}
        isLoading={isDeleting && deletingArtworkId === artworkToDelete}
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
    </div>
  );
}
