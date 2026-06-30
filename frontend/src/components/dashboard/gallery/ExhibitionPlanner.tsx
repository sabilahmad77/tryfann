import { motion } from "motion/react";
import { Calendar, Plus, Clock, MapPin, TrendingUp, Eye } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { useLanguage } from "@/contexts/useLanguage";

const content = {
  en: {
    title: "Exhibition Planner",
    upcoming: "Upcoming",
    active: "Active",
    draft: "Draft",
    viewAll: "View All",
    createNew: "Create Exhibition",
    exhibitions: [
      {
        title: "Contemporary MENA Artists",
        status: "active",
        date: "Dec 15 - Feb 28",
        visitors: "2.4K",
        artworks: 24,
        location: "Main Gallery",
      },
      {
        title: "Digital Art Showcase",
        status: "upcoming",
        date: "Mar 5 - Apr 20",
        visitors: "0",
        artworks: 18,
        location: "Virtual Space",
      },
      {
        title: "Emerging Voices",
        status: "draft",
        date: "TBD",
        visitors: "0",
        artworks: 12,
        location: "East Wing",
      },
    ],
    visitors: "Visitors",
    artworks: "Artworks",
  },
  ar: {
    title: "مخطط المعارض",
    upcoming: "قادم",
    active: "نشط",
    draft: "مسودة",
    viewAll: "عرض الكل",
    createNew: "إنشاء معرض",
    exhibitions: [
      {
        title: "فنانو منطقة الشرق الأوسط المعاصرون",
        status: "active",
        date: "١٥ ديسمبر - ٢٨ فبراير",
        visitors: "٢.٤ ألف",
        artworks: 24,
        location: "المعرض الرئيسي",
      },
      {
        title: "معرض الفن الرقمي",
        status: "upcoming",
        date: "٥ مارس - ٢٠ أبريل",
        visitors: "٠",
        artworks: 18,
        location: "الفضاء الافتراضي",
      },
      {
        title: "أصوات ناشئة",
        status: "draft",
        date: "سيتم التحديد",
        visitors: "٠",
        artworks: 12,
        location: "الجناح الشرقي",
      },
    ],
    visitors: "الزوار",
    artworks: "الأعمال الفنية",
  },
};

export function ExhibitionPlanner() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === "ar";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "upcoming":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "draft":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="glass rounded-2xl p-6 h-full">
      {/* Header */}
      <div
        className={`flex items-center justify-between mb-6 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-[#9375b5] to-[#9375b5] rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
        </div>
        <Button
          size="sm"
          className="hover:shadow-lg hover:shadow-primary/50 border-0 transition-all duration-200 cursor-pointer"
        >
          <Plus className={`w-4 h-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {t.createNew}
        </Button>
      </div>

      {/* Exhibitions List */}
      <div className="space-y-4">
        {t.exhibitions.map((exhibition, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-[#191922] to-[#0B0B0D] rounded-xl p-4 border border-[#4e4e4e78] hover:border-[#C59B48]/50 transition-all cursor-pointer"
          >
            <div
              className={`flex items-start justify-between mb-3 ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <div className={isRTL ? "text-right" : "text-left"}>
                <h3 className="text-[#F2F2F3] mb-1">{exhibition.title}</h3>
                <div
                  className={`flex items-center gap-2 text-sm text-[#8A8EA0] ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{exhibition.date}</span>
                </div>
              </div>
              <Badge className={`${getStatusColor(exhibition.status)} border`}>
                {t[exhibition.status as keyof typeof t]}
              </Badge>
            </div>

            <div
              className={`flex items-center gap-2 mb-3 text-sm text-[#8A8EA0] ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{exhibition.location}</span>
            </div>

            <div
              className={`flex items-center gap-6 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <Eye className="w-4 h-4 text-[#45e3d3]" />
                <span className="text-sm text-[#8A8EA0]">
                  {exhibition.visitors} {t.visitors}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <TrendingUp className="w-4 h-4 text-[#9375b5]" />
                <span className="text-sm text-[#8A8EA0]">
                  {exhibition.artworks} {t.artworks}
                </span>
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
        {t.viewAll}
      </Button>
    </div>
  );
}

