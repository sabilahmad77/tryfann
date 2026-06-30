import { motion } from "motion/react";
import {
    Image as ImageIcon,
    User,
    Calendar,
    DollarSign,
    Tag,
    Ruler,
    FileText,
    Palette,
} from "lucide-react";
import { CustomModal } from "./ui/CustomModal";
import { Badge } from "./ui/badge";
import { useLanguage } from "@/contexts/useLanguage";
import { getFullImageUrl } from "@/utils/filePreviewHelpers";

// Unified artwork interface that can handle different artwork types
export interface ArtworkDetailData {
    id?: number;
    title: string;
    artist?: string;
    artist_name?: string;
    year?: string;
    description?: string;
    dimensions?: string;
    image?: string | null;
    medium?: string;
    category?: string;
    price?: string;
    purchase_value?: number | string;
    status?: "available" | "sold" | "featured";
    acquisition_date?: string;
    created_at?: string;
    [key: string]: unknown;
}

interface ArtworkDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    artwork: ArtworkDetailData | null;
}

const content = {
    en: {
        title: "Artwork Details",
        artworkTitle: "Title",
        artist: "Artist",
        year: "Year",
        description: "Description",
        dimensions: "Dimensions",
        medium: "Medium",
        category: "Category",
        price: "Price",
        purchaseValue: "Purchase Value",
        status: "Status",
        acquisitionDate: "Acquisition Date",
        available: "Available",
        sold: "Sold",
        featured: "Featured",
        noDescription: "No description available",
        noImage: "No image available",
        close: "Close",
    },
    ar: {
        title: "تفاصيل العمل الفني",
        artworkTitle: "العنوان",
        artist: "الفنان",
        year: "السنة",
        description: "الوصف",
        dimensions: "الأبعاد",
        medium: "الوسيط",
        category: "الفئة",
        price: "السعر",
        purchaseValue: "قيمة الشراء",
        status: "الحالة",
        acquisitionDate: "تاريخ الاقتناء",
        available: "متاح",
        sold: "مباع",
        featured: "مميز",
        noDescription: "لا يوجد وصف متاح",
        noImage: "لا توجد صورة متاح",
        close: "إغلاق",
    },
};

export function ArtworkDetailModal({
    isOpen,
    onClose,
    artwork,
}: ArtworkDetailModalProps) {
    const { language } = useLanguage();
    const t = content[language];
    const isRTL = language === "ar";

    if (!artwork) return null;

    // Normalize artwork data
    const artistName = artwork.artist || artwork.artist_name || "";
    const imageUrl = artwork.image
        ? getFullImageUrl(artwork.image) || artwork.image
        : null;
    const price =
        artwork.price ||
        (artwork.purchase_value
            ? `$${Number(artwork.purchase_value).toLocaleString()}`
            : "");
    const status = artwork.status;

    const getStatusBadge = () => {
        if (!status) return null;

        switch (status) {
            case "featured":
                return (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                        {t.featured}
                    </Badge>
                );
            case "sold":
                return (
                    <Badge className="bg-gradient-to-r from-red-500 to-rose-500 text-white border-0">
                        {t.sold}
                    </Badge>
                );
            case "available":
                return (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                        {t.available}
                    </Badge>
                );
            default:
                return null;
        }
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={onClose}
            title={t.title}
            headerIcon={ImageIcon}
            size="xl"
            maxHeight="max-h-[95vh]"
        >
            <div className="p-6">
                <div className={`grid md:grid-cols-2 gap-6 ${isRTL ? "md:grid-cols-2" : ""}`}>
                    {/* Image Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                    >
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-[#191922] border border-[#2A2A3A]">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={artwork.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <ImageIcon className="w-16 h-16 text-[#8A8EA0] mx-auto mb-2" />
                                        <p className="text-sm text-[#8A8EA0]">{t.noImage}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Details Section */}
                    <motion.div
                        initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="space-y-4"
                    >
                        {/* Title */}
                        <div>
                            <h2
                                className={`text-2xl font-bold text-[#F2F2F3] mb-2 ${isRTL ? "text-right" : "text-left"}`}
                            >
                                {artwork.title}
                            </h2>
                            {status && (
                                <div className={`mt-2 ${isRTL ? "text-right" : "text-left"}`}>
                                    {getStatusBadge()}
                                </div>
                            )}
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-3">
                            {/* Artist */}
                            {artistName && (
                                <div
                                    className={`flex items-start gap-3 p-3 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    <User className="w-5 h-5 text-[#C59B48] shrink-0 mt-0.5" />
                                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="text-xs text-[#8A8EA0] mb-1">{t.artist}</p>
                                        <p className="text-sm text-[#F2F2F3]">{artistName}</p>
                                    </div>
                                </div>
                            )}

                            {/* Year */}
                            {artwork.year && (
                                <div
                                    className={`flex items-start gap-3 p-3 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    <Calendar className="w-5 h-5 text-[#45e3d3] shrink-0 mt-0.5" />
                                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="text-xs text-[#8A8EA0] mb-1">{t.year}</p>
                                        <p className="text-sm text-[#F2F2F3]">{artwork.year}</p>
                                    </div>
                                </div>
                            )}

                            {/* Price */}
                            {price && (
                                <div
                                    className={`flex items-start gap-3 p-3 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    <DollarSign className="w-5 h-5 text-[#45e3d3] shrink-0 mt-0.5" />
                                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="text-xs text-[#8A8EA0] mb-1">{t.price}</p>
                                        <p className="text-sm text-[#C59B48] font-semibold">{price}</p>
                                    </div>
                                </div>
                            )}

                            {/* Medium */}
                            {artwork.medium && (
                                <div
                                    className={`flex items-start gap-3 p-3 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    <Palette className="w-5 h-5 text-[#C59B48] shrink-0 mt-0.5" />
                                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="text-xs text-[#8A8EA0] mb-1">{t.medium}</p>
                                        <p className="text-sm text-[#F2F2F3]">{artwork.medium}</p>
                                    </div>
                                </div>
                            )}

                            {/* Category */}
                            {artwork.category && (
                                <div
                                    className={`flex items-start gap-3 p-3 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    <Tag className="w-5 h-5 text-[#9375b5] shrink-0 mt-0.5" />
                                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="text-xs text-[#8A8EA0] mb-1">{t.category}</p>
                                        <p className="text-sm text-[#F2F2F3]">{artwork.category}</p>
                                    </div>
                                </div>
                            )}

                            {/* Dimensions */}
                            {artwork.dimensions && (
                                <div
                                    className={`flex items-start gap-3 p-3 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    <Ruler className="w-5 h-5 text-[#45e3d3] shrink-0 mt-0.5" />
                                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="text-xs text-[#8A8EA0] mb-1">{t.dimensions}</p>
                                        <p className="text-sm text-[#F2F2F3]">{artwork.dimensions}</p>
                                    </div>
                                </div>
                            )}

                            {/* Acquisition Date (for collector artworks) */}
                            {artwork.acquisition_date && (
                                <div
                                    className={`flex items-start gap-3 p-3 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "flex-row-reverse" : ""}`}
                                >
                                    <Calendar className="w-5 h-5 text-[#9375b5] shrink-0 mt-0.5" />
                                    <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                                        <p className="text-xs text-[#8A8EA0] mb-1">
                                            {t.acquisitionDate}
                                        </p>
                                        <p className="text-sm text-[#F2F2F3]">
                                            {new Date(artwork.acquisition_date).toLocaleDateString(
                                                language === "en" ? "en-US" : "ar-SA",
                                                {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                }
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {artwork.description && (
                            <div
                                className={`p-4 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "text-right" : "text-left"}`}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-[#C59B48]" />
                                    <p className="text-xs text-[#8A8EA0]">{t.description}</p>
                                </div>
                                <p className="text-sm text-[#F2F2F3] leading-relaxed whitespace-pre-wrap">
                                    {artwork.description}
                                </p>
                            </div>
                        )}

                        {!artwork.description && (
                            <div
                                className={`p-4 bg-[#191922] rounded-lg border border-[#2A2A3A] ${isRTL ? "text-right" : "text-left"}`}
                            >
                                <p className="text-sm text-[#8A8EA0]">{t.noDescription}</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </CustomModal>
    );
}

