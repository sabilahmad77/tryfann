import { motion } from "motion/react";
import { Heart, Bell, Eye, TrendingUp, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { useLanguage } from "@/contexts/useLanguage";

const content = {
  en: {
    title: "Watchlist",
    subtitle: "Track artworks and artists you're interested in",
    artworks: "Artworks",
    artists: "Artists",
    notify: "Notify me",
    remove: "Remove",
    viewDetails: "View Details",
    items: [
      {
        type: "artwork",
        title: "Celestial Dance",
        artist: "Omar Al-Rashid",
        price: "$18,000",
        status: "available",
        priceChange: "+5%",
      },
      {
        type: "artist",
        title: "Fatima Al-Qasimi",
        specialty: "Contemporary Sculpture",
        status: "New works coming",
        followers: "2.4K",
      },
      {
        type: "artwork",
        title: "Urban Symphony",
        artist: "Noor Hassan",
        price: "$22,500",
        status: "reserved",
        priceChange: "+8%",
      },
    ],
    available: "Available",
    reserved: "Reserved",
    newWorks: "New works coming",
    followers: "Followers",
  },
  ar: {
    title: "قائمة المراقبة",
    subtitle: "تتبع الأعمال الفنية والفنانين الذين تهتم بهم",
    artworks: "الأعمال الفنية",
    artists: "الفنانون",
    notify: "أخطرني",
    remove: "إزالة",
    viewDetails: "عرض التفاصيل",
    items: [
      {
        type: "artwork",
        title: "الرقصة السماوية",
        artist: "عمر الراشد",
        price: "١٨,٠٠٠ دولار",
        status: "available",
        priceChange: "+٥٪",
      },
      {
        type: "artist",
        title: "فاطمة القاسمي",
        specialty: "النحت المعاصر",
        status: "New works coming",
        followers: "٢.٤ ألف",
      },
      {
        type: "artwork",
        title: "سيمفونية المدينة",
        artist: "نور حسن",
        price: "٢٢,٥٠٠ دولار",
        status: "reserved",
        priceChange: "+٨٪",
      },
    ],
    available: "متاح",
    reserved: "محجوز",
    newWorks: "أعمال جديدة قادمة",
    followers: "المتابعون",
  },
};

export function Watchlist() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return {
          label: t.available,
          className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        };
      case "reserved":
        return {
          label: t.reserved,
          className: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        };
      default:
        return {
          label: t.newWorks,
          className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        };
    }
  };

  return (
    <div className="glass rounded-2xl p-6 h-full">
      {/* Header */}
      <div className={`mb-6 ${isRTL ? "text-right" : "text-left"}`}>
        <div
          className={`flex items-center gap-3 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[#fface3] to-[#9375b5] rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
        </div>
        <p className="text-sm text-[#8A8EA0]">{t.subtitle}</p>
      </div>

      {/* Watchlist Items */}
      <div className="space-y-4">
        {t.items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-[#191922] to-[#0B0B0D] rounded-xl p-4 border border-[#4e4e4e78] hover:border-[#fface3]/50 transition-all group"
          >
            <div
              className={`flex items-start justify-between ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                <div
                  className={`flex items-center gap-2 mb-2 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <h3 className="text-[#F2F2F3]">{item.title}</h3>
                  <Badge
                    className={`${getStatusBadge(item.status).className} border text-xs`}
                  >
                    {getStatusBadge(item.status).label}
                  </Badge>
                </div>

                {item.type === "artwork" ? (
                  <div>
                    <p className="text-sm text-[#8A8EA0] mb-2">{item.artist}</p>
                    <div
                      className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <span className="text-lg text-[#C59B48]">{item.price}</span>
                      <div
                        className={`flex items-center gap-1 ${isRTL ? "flex-row-reverse" : ""}`}
                      >
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-emerald-400">
                          {item.priceChange}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-[#8A8EA0] mb-2">{item.specialty}</p>
                    <div
                      className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                    >
                      <Eye className="w-4 h-4 text-[#9375b5]" />
                      <span className="text-sm text-[#8A8EA0]">
                        {item.followers} {t.followers}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                className={`flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:scale-110 transition-all duration-200 cursor-pointer"
                  title={t.viewDetails}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="hover:scale-110 transition-all duration-200 cursor-pointer"
                  title={t.notify}
                >
                  <Bell className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:scale-110 transition-all duration-200 cursor-pointer"
                  title={t.remove}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Button */}
      <Button
        variant="ghost"
        className="w-full mt-4 transition-all duration-200 cursor-pointer"
      >
        {language === "en"
          ? "View All Watchlist Items"
          : "عرض جميع عناصر قائمة المراقبة"}
      </Button>
    </div>
  );
}

