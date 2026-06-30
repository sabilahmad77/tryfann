import { motion } from "motion/react";
import { Sparkles, Heart, ShoppingCart, Eye } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { useLanguage } from "@/contexts/useLanguage";

const content = {
  en: {
    title: "Recommended for You",
    subtitle: "Curated based on your collection preferences",
    addToWishlist: "Add to Wishlist",
    viewDetails: "View Details",
    price: "Price",
    available: "Available",
    artworks: [
      {
        id: 1,
        title: "Ethereal Dunes",
        artist: "Layla Ahmed",
        price: "$3,200",
        views: 892,
        likes: 67,
      },
      {
        id: 2,
        title: "Neon Dreams",
        artist: "Omar Khalil",
        price: "$2,800",
        views: 1243,
        likes: 94,
      },
      {
        id: 3,
        title: "Ancient Horizons",
        artist: "Nadia Rahman",
        price: "$4,500",
        views: 634,
        likes: 52,
      },
    ],
  },
  ar: {
    title: "موصى به لك",
    subtitle: "منتقى بناءً على تفضيلات مجموعتك",
    addToWishlist: "إضافة إلى قائمة الأمنيات",
    viewDetails: "عرض التفاصيل",
    price: "السعر",
    available: "متاح",
    artworks: [
      {
        id: 1,
        title: "كثبان أثيرية",
        artist: "ليلى أحمد",
        price: "$3,200",
        views: 892,
        likes: 67,
      },
      {
        id: 2,
        title: "أحلام نيون",
        artist: "عمر خليل",
        price: "$2,800",
        views: 1243,
        likes: 94,
      },
      {
        id: 3,
        title: "آفاق قديمة",
        artist: "نادية رحمن",
        price: "$4,500",
        views: 634,
        likes: 52,
      },
    ],
  },
};

export function RecommendedArtworks() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-[#C59B48]/20"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className={`flex items-center gap-3 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C59B48] to-[#D6AE5A] flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-[#0B0B0D]" />
        </div>
        <div className={isRTL ? "text-right" : "text-left"}>
          <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
          <p className="text-sm text-[#8A8EA0]/70">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {t.artworks.map((artwork, index) => (
          <motion.div
            key={artwork.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="glass rounded-xl overflow-hidden border border-[#4e4e4e78] hover:border-[#C59B48]/30 transition-all group"
          >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-[#191922] to-[#0B0B0D]">
              <div className="absolute inset-0 bg-[#C59B48]/5 group-hover:bg-[#C59B48]/10 transition-colors" />
              <div className="absolute top-3 right-3 z-10">
                <Badge className="bg-[#45e3d3] text-[#0B0B0D] border-0">
                  {t.available}
                </Badge>
              </div>
              <button className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full glass border border-[#4e4e4e78] flex items-center justify-center hover:border-[#C59B48]/50 hover:bg-[#C59B48]/20 hover:scale-110 transition-all duration-200 cursor-pointer">
                <Heart className="w-4 h-4 text-[#F2F2F3]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3
                className={`text-[#F2F2F3] mb-1 ${isRTL ? "text-right" : "text-left"}`}
              >
                {artwork.title}
              </h3>
              <p
                className={`text-sm text-[#8A8EA0]/70 mb-3 ${
                  isRTL ? "text-right" : "text-left"
                }`}
              >
                {artwork.artist}
              </p>

              <div
                className={`flex items-center justify-between mb-3 ${
                  isRTL ? "flex-row-reverse" : ""
                }`}
              >
                <span className="text-[#C59B48]">{artwork.price}</span>
                <div
                  className={`flex items-center gap-3 text-xs text-[#8A8EA0]/70 ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Eye className="w-3 h-3" />
                    <span>{artwork.views}</span>
                  </div>
                  <div
                    className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <Heart className="w-3 h-3" />
                    <span>{artwork.likes}</span>
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                className="w-full hover:shadow-lg hover:shadow-primary/50 border-0 h-8 transition-all duration-200 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                {t.viewDetails}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

