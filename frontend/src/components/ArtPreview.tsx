import { useState } from 'react';
import artwork1 from '@/assets/artwork-1.jpeg';
import artwork2 from '@/assets/artwork-2.jpeg';
import artwork3 from '@/assets/artwork-3.jpeg';
import artwork4 from '@/assets/artwork-4.jpeg';
import { DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ArtPreviewProps {
  language: 'en' | 'ar';
}

const content = {
  en: {
    title: { white: "Featured ", gold: "Artworks" },
    subtitle: "Discover verified artworks from partner galleries and featured artists. Each piece is authenticated, documented, and ready for collection.",
    placeholder: {
      artist: "Featured Artist",
      value: "Est. Value",
    }
  },
  ar: {
    title: { white: "الأعمال الفنية", gold: " المميزة" },
    subtitle: "اكتشف الأعمال الفنية الموثقة من المعارض الشريكة والفنانين المميزين. كل قطعة موثقة وموثقة وجاهزة للاقتناء.",
    placeholder: {
      artist: "فنان مميز",
      value: "القيمة المقدرة",
    }
  }
};

// Placeholder artwork data - ready for real artwork integration
const placeholderArtworks = [
  {
    id: 1,
    image: artwork1,
    value: "$350 - $700",
    en: {
      title: "Chromatic Silence",
      artist: "Emerging Contemporary Abstract Artist",
      description: "Emotion-driven abstract work focusing on layered textures and expressive color balance. Designed to evoke mood rather than narrative."
    },
    ar: {
      title: "الصمت اللوني",
      artist: "فنان تجريدي معاصر ناشئ",
      description: "عمل تجريدي مدفوع بالعاطفة يركز على الطبقات النسيجية والتوازن اللوني التعبيري. مصمم لإثارة المزاج بدلاً من السرد."
    }
  },
  {
    id: 2,
    image: artwork2,
    value: "$450 - $900",
    en: {
      title: "The Watcher of Roots",
      artist: "Emerging Surreal Artist",
      description: "A symbolic visual narrative blending organic forms and imagination, reflecting growth, protection, and subconscious themes."
    },
    ar: {
      title: "حارس الجذور",
      artist: "فنان سريالي ناشئ",
      description: "سرد بصري رمزي يدمج الأشكال العضوية والخيال، يعكس مواضيع النمو والحماية واللاوعي."
    }
  },
  {
    id: 3,
    image: artwork3,
    value: "$300 - $650",
    en: {
      title: "Echoes of the Workshop",
      artist: "Emerging Classical Still Life Painter",
      description: "A calm, studio-style still life inspired by traditional European painting techniques with focus on material texture and aging."
    },
    ar: {
      title: "أصداء الورشة",
      artist: "رسام طبيعة صامتة كلاسيكي ناشئ",
      description: "طبيعة صامتة هادئة بأسلوب الاستوديو مستوحاة من تقنيات الرسم الأوروبية التقليدية مع التركيز على نسيج المواد والشيخوخة."
    }
  },
  {
    id: 4,
    image: artwork4,
    value: "$600 - $1,200",
    en: {
      title: "Unspoken Gaze",
      artist: "Emerging Realist Portrait Artist",
      description: "A detailed portrait capturing subtle emotional depth and natural light, emphasizing realism and human expression."
    },
    ar: {
      title: "نظرة غير مكشوفة",
      artist: "فنان بورتريه واقعي ناشئ",
      description: "بورتريه مفصل يلتقط عمقًا عاطفيًا خفيًا وضوءًا طبيعيًا، مؤكدًا على الواقعية والتعبير الإنساني."
    }
  }
];

export function ArtPreview({ language }: ArtPreviewProps) {
  const t = content[language];
  const isRTL = language === 'ar';
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const handleCardFlip = (cardId: number) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  return (
    <section className="relative py-16 overflow-hidden w-full" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Subtle background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#C59B48]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-[#45e3d3]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-heading font-semibold px-2 sm:px-0">
            <span className="text-[#F2F2F3] font-heading font-semibold">{t.title.white}</span>
            <span className="text-[#C59B48] font-heading font-semibold">{t.title.gold}</span>
          </h2>
          <p className="text-[#B9BBC6] max-w-4xl mx-auto text-sm sm:text-base md:text-lg font-body font-normal px-4 sm:px-0">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Artwork Grid - 4 Cards with Flip Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-7xl mx-auto w-full px-4 sm:px-0"
        >
          {placeholderArtworks.map((artwork, index) => {
            const isFlipped = flippedCards.has(artwork.id);
            const artworkContent = artwork[language];
            return (
              <motion.div
                key={artwork.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative h-[300px] sm:h-[350px] md:h-[400px] cursor-pointer touch-manipulation"
                style={{ perspective: '1000px' }}
                onClick={() => handleCardFlip(artwork.id)}
                whileTap={{ scale: 0.98 }}
              >
                {/* Flip Card Container */}
                <div
                  className={`relative w-full h-full transition-transform duration-700 ${isFlipped ? '[transform:rotateY(180deg)]' : ''
                    } lg:group-hover:[transform:rotateY(180deg)]`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front Side - Image Only */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-[#191922] border transition-all duration-500 ${isFlipped ? 'border-[rgba(197,155,72,0.22)]' : 'border-[#2A2A3A] lg:group-hover:border-[rgba(197,155,72,0.22)]'
                      }`}
                    style={{
                      backfaceVisibility: 'hidden',
                      boxShadow: isFlipped ? '0 0 0 1px rgba(197,155,72,0.20), 0 18px 60px rgba(0,0,0,0.55)' : '0 0 0 1px rgba(197,155,72,0), 0 18px 60px rgba(0,0,0,0.55)'
                    }}
                  >
                    {/* Artwork Image */}
                    <div className="relative h-full w-full bg-[#191922] flex items-center justify-center overflow-hidden">
                      <ImageWithFallback
                        src={artwork.image}
                        alt={artworkContent.title || artworkContent.artist}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#191922]/90 via-transparent to-transparent" />
                    </div>
                  </div>

                  {/* Back Side - Details */}
                  <div
                    className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-[#191922] border border-[rgba(197,155,72,0.22)]"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      boxShadow: '0 0 0 1px rgba(197,155,72,0.20), 0 18px 60px rgba(0,0,0,0.55)'
                    }}
                  >
                    {/* Content */}
                    <div className="relative h-full flex flex-col p-4 sm:p-6 z-10">
                      {/* Title */}
                      <h3 className="text-[#F2F2F3] text-base sm:text-lg md:text-xl mb-2 sm:mb-3 font-heading font-semibold line-clamp-2">
                        {artworkContent.title || artworkContent.artist}
                      </h3>

                      {/* Artist Name */}
                      <div className="mb-3 sm:mb-4">
                        <p className="text-[#8A8EA0] text-xs sm:text-sm mb-1 font-body font-medium">{t.placeholder.artist}</p>
                        <p className="text-[#F2F2F3] text-sm sm:text-base font-body font-normal line-clamp-1">{artworkContent.artist}</p>
                      </div>

                      {/* Description */}
                      {artworkContent.description && (
                        <p className="text-[#B9BBC6] text-xs sm:text-sm mb-3 sm:mb-4 font-body font-normal leading-relaxed flex-1 line-clamp-3 sm:line-clamp-4">
                          {artworkContent.description}
                        </p>
                      )}

                      {/* Estimated Value */}
                      <div className="mt-auto pt-3 sm:pt-4 border-t border-[#2A2A3A]">
                        <div className="flex items-center gap-2 text-[#C59B48] text-sm sm:text-base font-medium font-body">
                          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="break-words">{artwork.value}</span>
                        </div>
                        <p className="text-[#8A8EA0] text-xs mt-1 font-body font-normal">{t.placeholder.value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}

