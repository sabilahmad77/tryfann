import { motion } from 'motion/react';
import { TrendingUp, BarChart3, DollarSign, TrendingDown, Loader2 } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { useLanguage } from '@/contexts/useLanguage';
import type { MarketInsight } from '@/services/api/dashboardApi';

interface MarketInsightsProps {
  statsData?: {
    market_insight?: MarketInsight[];
    [key: string]: unknown;
  };
  isLoadingStats?: boolean;
}

const content = {
  en: {
    title: "Market Insights",
    subtitle: "Latest trends in the MENA art market",
    trending: "Trending",
    avgPrice: "Avg Price",
    growth: "Growth",
    loading: "Loading market insights...",
    error: "Failed to load market insights",
    noData: "No market insights available"
  },
  ar: {
    title: "رؤى السوق",
    subtitle: "أحدث الاتجاهات في سوق الفن في منطقة الشرق الأوسط",
    trending: "رائج",
    avgPrice: "متوسط السعر",
    growth: "النمو",
    loading: "جاري تحميل رؤى السوق...",
    error: "فشل تحميل رؤى السوق",
    noData: "لا توجد رؤى سوق متاحة"
  }
};

// Helper function to determine trend based on percentage
const getTrend = (percentage: number): 'up' | 'down' | 'neutral' => {
  if (percentage > 0) return 'up';
  if (percentage < 0) return 'down';
  return 'neutral';
};

// Helper function to format percentage
const formatPercentage = (percentage: number): string => {
  const sign = percentage >= 0 ? '+' : '';
  return `${sign}${percentage.toFixed(1)}%`;
};

// Helper function to format price
const formatPrice = (price: number): string => {
  if (price === 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export function MarketInsights({ statsData, isLoadingStats = false }: MarketInsightsProps) {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === 'ar';

  // Get market insights from props
  const marketInsights: MarketInsight[] = statsData?.market_insight || [];

  // Show loading state
  if (isLoadingStats) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-[#45e3d3]/20"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#45e3d3] to-[#3bc4b5] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#121217]" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
            <p className="text-sm text-[#8A8EA0]">{t.subtitle}</p>
          </div>
        </div>
        <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Loader2 className="w-6 h-6 text-[#45e3d3] animate-spin" />
          <p className={`ml-2 text-[#8A8EA0] ${isRTL ? 'mr-2 ml-0' : ''}`}>{t.loading}</p>
        </div>
      </motion.div>
    );
  }

  // Show error state (if no data and not loading)
  if (!isLoadingStats && !statsData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-[#45e3d3]/20"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#45e3d3] to-[#3bc4b5] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#121217]" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
            <p className="text-sm text-[#8A8EA0]">{t.subtitle}</p>
          </div>
        </div>
        <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <p className="text-[#f87171]">{t.error}</p>
        </div>
      </motion.div>
    );
  }

  // Show no data state
  if (!marketInsights || marketInsights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 border border-[#45e3d3]/20"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#45e3d3] to-[#3bc4b5] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#121217]" />
          </div>
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
            <p className="text-sm text-[#8A8EA0]">{t.subtitle}</p>
          </div>
        </div>
        <div className={`flex items-center justify-center py-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <p className="text-[#8A8EA0]">{t.noData}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-[#45e3d3]/20"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={`flex items-center gap-3 mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#45e3d3] to-[#3bc4b5] flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-[#121217]" />
        </div>
        <div className={isRTL ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl text-[#F2F2F3]">{t.title}</h2>
          <p className="text-sm text-[#8A8EA0]">{t.subtitle}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {marketInsights.map((insight, index) => {
          const trend = getTrend(insight.percentage);
          const percentageFormatted = formatPercentage(insight.percentage);
          const avgPriceFormatted = formatPrice(insight.avg_price);

          return (
            <motion.div
              key={`${insight.category}-${index}`}
              initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: isRTL ? -5 : 5 }}
              className="bg-[#0B0B0D] rounded-xl p-4 border border-[#4e4e4e78] hover:border-[#45e3d3]/30 transition-all"
            >
              <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h3 className="text-[#F2F2F3] mb-1">{insight.category}</h3>
                  <p className="text-xs text-[#8A8EA0]">{insight.description}</p>
                </div>
                <div className={`flex items-center gap-1 ${trend === 'up'
                    ? 'text-[#45e3d3]'
                    : trend === 'down'
                      ? 'text-[#f87171]'
                      : 'text-[#C59B48]'
                  }`}>
                  {trend === 'up' ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : (
                    <BarChart3 className="w-5 h-5" />
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <DollarSign className="w-4 h-4 text-[#8A8EA0]" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <p className="text-xs text-[#8A8EA0]">{t.avgPrice}</p>
                    <p className="text-[#C59B48]">{avgPriceFormatted}</p>
                  </div>
                </div>
                <div className="flex-1" />
                <Badge className={`${trend === 'up'
                    ? 'bg-[#45e3d3]/20 text-[#45e3d3] border-[#45e3d3]/30'
                    : trend === 'down'
                      ? 'bg-[#f87171]/20 text-[#f87171] border-[#f87171]/30'
                      : 'bg-[#C59B48]/20 text-[#C59B48] border-[#C59B48]/30'
                  }`}>
                  {percentageFormatted}
                </Badge>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

