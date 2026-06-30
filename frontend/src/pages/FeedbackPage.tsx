import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  Star,
  Send,
  MessageSquare,
  Smile,
  Meh,
  Frown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputField, TextareaField } from '@/components/ui/custom-form-elements';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';
import { useLanguage } from '@/contexts/useLanguage';
import { useSendFeedbackMutation, type UserFeedbackRequest } from '@/services/api/dashboardApi';

const content = {
  en: {
    title: "Share Your Feedback",
    subtitle: "Help us improve FANN by sharing your thoughts and suggestions",
    tabs: {
      general: "General Feedback",
      ideas: "Ideas & Suggestions",
    },
    satisfactionLabel: "How satisfied are you with FANN?",
    veryDissatisfied: "Very Dissatisfied",
    dissatisfied: "Dissatisfied",
    neutral: "Neutral",
    satisfied: "Satisfied",
    verySatisfied: "Very Satisfied",
    categoryLabel: "Category",
    categories: {
      performanceExperience: "Performance Experience",
      featuresFunctionality: "Features & Functionality",
      designInterface: "Design & Interface",
      performanceSpeed: "Performance & Speed",
      customerSupport: "Customer Support",
      other: "Other"
    },
    messageLabel: "Your Feedback",
    messagePlaceholder: "Tell us what you think, what we're doing well, or how we can improve...",
    ideasFeedback: {
      descriptionLabel: "Your Thoughts on FANN",
      descriptionPlaceholder: "Share your thoughts about FANN, your suggestions, whether you feel the concept is valuable and needed, and any improvements you'd like to see. We especially value feedback from artists, collectors, and investors.",
      categoryLabel: "What would you like to give feedback about?",
      categories: {
        newFeature: "New Feature",
        improvement: "Improvement",
        integration: "Integration",
        userExperience: "User Experience",
        communityFeatures: "Community Features",
        other: "Other"
      }
    },
    emailLabel: "Email",
    emailPlaceholder: "your.email@example.com",
    submitButton: "Submit Feedback",
    submitting: "Submitting...",
    successTitle: "Thank You!",
    successMessage: "Your feedback has been submitted successfully. We appreciate your input!",
    errorMessage: "Failed to submit feedback. Please try again.",
    requiredField: "Please fill in all required fields"
  },
  ar: {
    title: "شارك ملاحظاتك",
    subtitle: "ساعدنا في تحسين FANN من خلال مشاركة أفكارك واقتراحاتك",
    tabs: {
      general: "ملاحظات عامة",
      ideas: "أفكار واقتراحات",
    },
    satisfactionLabel: "ما مدى رضاك عن FANN؟",
    veryDissatisfied: "غير راضٍ جداً",
    dissatisfied: "غير راضٍ",
    neutral: "محايد",
    satisfied: "راضٍ",
    verySatisfied: "راضٍ جداً",
    categoryLabel: "الفئة",
    categories: {
      performanceExperience: "تجربة الأداء",
      featuresFunctionality: "الميزات والوظائف",
      designInterface: "التصميم والواجهة",
      performanceSpeed: "الأداء والسرعة",
      customerSupport: "دعم العملاء",
      other: "أخرى"
    },
    messageLabel: "ملاحظاتك",
    messagePlaceholder: "أخبرنا برأيك، ما نقوم به بشكل جيد، أو كيف يمكننا التحسين...",
    ideasFeedback: {
      descriptionLabel: "أفكارك حول FANN",
      descriptionPlaceholder: "شارك أفكارك حول FANN، واقتراحاتك، وما إذا كنت تشعر أن المفهوم ذو قيمة وضروري، وأي تحسينات ترغب في رؤيتها. نحن نقدر بشكل خاص الملاحظات من الفنانين والجامعين والمستثمرين.",
      categoryLabel: "ما الذي تود إبداء ملاحظاتك عنه؟",
      categories: {
        newFeature: "ميزة جديدة",
        improvement: "تحسين",
        integration: "تكامل",
        userExperience: "تجربة المستخدم",
        communityFeatures: "ميزات المجتمع",
        other: "أخرى"
      }
    },
    emailLabel: "البريد الإلكتروني",
    emailPlaceholder: "your.email@example.com",
    submitButton: "إرسال الملاحظات",
    submitting: "جاري الإرسال...",
    successTitle: "شكراً لك!",
    successMessage: "تم إرسال ملاحظاتك بنجاح. نحن نقدر مساهمتك!",
    errorMessage: "فشل إرسال الملاحظات. يرجى المحاولة مرة أخرى.",
    requiredField: "يرجى ملء جميع الحقول المطلوبة"
  }
};

type FeedbackTab = 'general' | 'ideas';

const GENERAL_CATEGORY_KEYS = [
  'performanceExperience',
  'featuresFunctionality',
  'designInterface',
  'performanceSpeed',
  'customerSupport',
  'other',
] as const;

const IDEA_CATEGORY_KEYS = [
  'newFeature',
  'improvement',
  'integration',
  'userExperience',
  'communityFeatures',
  'other',
] as const;

type GeneralCategoryKey = typeof GENERAL_CATEGORY_KEYS[number];
type IdeaCategoryKey = typeof IDEA_CATEGORY_KEYS[number];

const GENERAL_CATEGORY_VALUE_MAP: Record<GeneralCategoryKey, string> = {
  performanceExperience: content.en.categories.performanceExperience,
  featuresFunctionality: content.en.categories.featuresFunctionality,
  designInterface: content.en.categories.designInterface,
  performanceSpeed: content.en.categories.performanceSpeed,
  customerSupport: content.en.categories.customerSupport,
  other: content.en.categories.other,
};

const IDEA_CATEGORY_VALUE_MAP: Record<IdeaCategoryKey, string> = {
  newFeature: content.en.ideasFeedback.categories.newFeature,
  improvement: content.en.ideasFeedback.categories.improvement,
  integration: content.en.ideasFeedback.categories.integration,
  userExperience: content.en.ideasFeedback.categories.userExperience,
  communityFeatures: content.en.ideasFeedback.categories.communityFeatures,
  other: content.en.ideasFeedback.categories.other,
};

const sentimentFromSatisfaction = (satisfaction: number): 'Bad' | 'Neutral' | 'Good' => {
  if (satisfaction >= 4) return 'Good';
  if (satisfaction === 3) return 'Neutral';
  return 'Bad';
};

export function FeedbackPage() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === 'ar';

  const [activeTab, setActiveTab] = useState<FeedbackTab>('general');
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [generalAbout, setGeneralAbout] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [ideaDescription, setIdeaDescription] = useState<string>('');
  const [ideaCategory, setIdeaCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendFeedback, { isLoading: isSendingFeedback }] = useSendFeedbackMutation();

  const satisfactionLevels = [
    { value: 1, label: t.veryDissatisfied, icon: Frown, color: '#ef4444' },
    { value: 2, label: t.dissatisfied, icon: Frown, color: '#f97316' },
    { value: 3, label: t.neutral, icon: Meh, color: '#C59B48' },
    { value: 4, label: t.satisfied, icon: Smile, color: '#45e3d3' },
    { value: 5, label: t.verySatisfied, icon: Smile, color: '#10b981' },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const isGeneral = activeTab === 'general';

    if (isGeneral) {
      if (!satisfaction || !generalAbout || !message.trim()) {
        toast.error(t.requiredField);
        return;
      }
    } else {
      if (!ideaDescription.trim() || !ideaCategory) {
        toast.error(t.requiredField);
        return;
      }
    }

    let payload: UserFeedbackRequest;
    const emailValue = email.trim();

    if (isGeneral) {
      const selectedAbout = GENERAL_CATEGORY_VALUE_MAP[generalAbout as GeneralCategoryKey] || '';

      if (!selectedAbout) {
        toast.error(t.requiredField);
        return;
      }

      payload = {
        feedback_category: "",
        feedback_about: selectedAbout,
        feedback: message.trim(),
        sentiment: sentimentFromSatisfaction(satisfaction),
        ...(emailValue ? { email: emailValue } : {}),
      };
    } else {
      const selectedIdeaCategory = IDEA_CATEGORY_VALUE_MAP[ideaCategory as IdeaCategoryKey] || '';

      if (!selectedIdeaCategory) {
        toast.error(t.requiredField);
        return;
      }

      payload = {
        title: "FANN Concept Feedback",
        describe_idea: ideaDescription.trim(),
        feedback_category: selectedIdeaCategory,
        feedback_about: "",
        ...(emailValue ? { email: emailValue } : {}),
      };
    }

    try {
      setIsSubmitting(true);
      await sendFeedback(payload).unwrap();

      toast.success(t.successTitle, {
        description: t.successMessage,
      });

      // Reset form
      setEmail('');
      if (isGeneral) {
        setSatisfaction(0);
        setGeneralAbout('');
        setMessage('');
      } else {
        setIdeaDescription('');
        setIdeaCategory('');
      }
    } catch (error) {
      console.error('Feedback submission failed:', error);
      toast.error(t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout currentPage="feedback">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`mb-6 ${isRTL ? 'text-right' : 'text-left'}`}
      >
        <h1 className="text-4xl md:text-5xl mb-2 text-[#F2F2F3]">
          {t.title}
        </h1>
        <p className="text-[#8A8EA0] text-lg">{t.subtitle}</p>
      </motion.div>

      {/* Tabs */}
      <div className={`glass rounded-2xl p-2 mb-6 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {(['general', 'ideas'] as FeedbackTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 rounded-xl text-sm md:text-base transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#C59B48] via-[#fbbf24] to-[#C59B48] text-[#0B0B0D] shadow-lg shadow-[#fbbf24]/30'
                  : 'text-[#8A8EA0] hover:text-[#F2F2F3]'
              }`}
            >
              {t.tabs[tab]}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {/* Feedback Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'general' ? (
              <>
                {/* Satisfaction Rating */}
                <div>
                  <label className={`block text-[#F2F2F3] mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.satisfactionLabel} <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className={`grid grid-cols-5 gap-3`}>
                    {satisfactionLevels.map((level) => {
                      const Icon = level.icon;
                      const isSelected = satisfaction === level.value;
                      return (
                        <motion.button
                          key={level.value}
                          type="button"
                          onClick={() => setSatisfaction(level.value)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`p-4 rounded-xl transition-all cursor-pointer ${isSelected
                            ? 'border-2 border-[#C59B48] bg-[#C59B48]/10'
                            : 'bg-[#0B0B0D] border border-[#4e4e4e78]'
                            }`}
                        >
                          <Icon
                            className={`w-8 h-8 mx-auto mb-2 transition-colors`}
                            style={{ color: isSelected ? level.color : '#8A8EA0' }}
                          />
                          <p className={`text-xs text-center ${isSelected ? 'text-[#F2F2F3]' : 'text-[#8A8EA0]'
                            }`}>
                            {level.label}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

              {/* Feedback About */}
              <div>
                <label className={`block text-[#F2F2F3] mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.ideasFeedback.categoryLabel} <span className="text-[#ef4444]">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {GENERAL_CATEGORY_KEYS.map((key) => {
                    const label = t.categories[key];
                    const isSelected = generalAbout === key;
                    return (
                      <motion.button
                        key={`general-about-${key}`}
                        type="button"
                        onClick={() => setGeneralAbout(key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 rounded-lg transition-all cursor-pointer ${isSelected
                          ? 'border-2 border-[#C59B48] bg-[#C59B48]/10 text-[#F2F2F3]'
                          : 'bg-[#0B0B0D] border border-[#4e4e4e78] text-[#8A8EA0] hover:border-[#C59B48]/30'
                          } ${isRTL ? 'text-right' : 'text-left'}`}
                      >
                        <span className="text-sm">{label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

                {/* Message */}
                <TextareaField
                  label={t.messageLabel}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.messagePlaceholder}
                  rows={6}
                  required
                  isRTL={isRTL}
                />
              </>
            ) : (
              <>
                {/* Idea Description */}
                <TextareaField
                  label={t.ideasFeedback.descriptionLabel}
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  placeholder={t.ideasFeedback.descriptionPlaceholder}
                  rows={6}
                  required
                  isRTL={isRTL}
                />

                {/* Idea Category */}
                <div>
                  <label className={`block text-[#F2F2F3] mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.categoryLabel} <span className="text-[#ef4444]">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {IDEA_CATEGORY_KEYS.map((key) => {
                      const label = t.ideasFeedback.categories[key];
                      const isSelected = ideaCategory === key;
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          onClick={() => setIdeaCategory(key)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 rounded-lg transition-all cursor-pointer ${isSelected
                            ? 'border-2 border-[#C59B48] bg-[#C59B48]/10 text-[#F2F2F3]'
                            : 'bg-[#0B0B0D] border border-[#4e4e4e78] text-[#8A8EA0] hover:border-[#C59B48]/30'
                            } ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          <span className="text-sm">{label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <InputField
              label={t.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              isRTL={isRTL}
            />

            {/* Submit Button */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                disabled={isSubmitting || isSendingFeedback}
                className={`w-full h-12 shadow-lg shadow-primary/30 transition-all cursor-pointer disabled:bg-disabled disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''
                  }`}
              >
                {isSubmitting || isSendingFeedback ? (
                  <span>{t.submitting}</span>
                ) : (
                  <>
                    <Send className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    <span>{t.submitButton}</span>
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 shadow-2xl"
        >
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-[#45e3d3]/20 rounded-lg flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-[#45e3d3]" />
              </div>
              <div>
                <h3 className="text-[#F2F2F3] mb-1">
                  {language === 'en' ? 'Your Voice Matters' : 'صوتك مهم'}
                </h3>
                <p className="text-sm text-[#8A8EA0]">
                  {language === 'en'
                    ? 'Every piece of feedback helps us build a better platform for the art community.'
                    : 'كل ملاحظة تساعدنا في بناء منصة أفضل لمجتمع الفن.'}
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-[#C59B48]/20 rounded-lg flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-[#C59B48]" />
              </div>
              <div>
                <h3 className="text-[#F2F2F3] mb-1">
                  {language === 'en' ? 'We Read Everything' : 'نقرأ كل شيء'}
                </h3>
                <p className="text-sm text-[#8A8EA0]">
                  {language === 'en'
                    ? 'Our team reviews every submission to understand your needs better.'
                    : 'يراجع فريقنا كل رسالة لفهم احتياجاتك بشكل أفضل.'}
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center shrink-0">
                <Smile className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <h3 className="text-[#F2F2F3] mb-1">
                  {language === 'en' ? 'Continuous Improvement' : 'تحسين مستمر'}
                </h3>
                <p className="text-sm text-[#8A8EA0]">
                  {language === 'en'
                    ? "We're constantly evolving based on your valuable insights."
                    : 'نحن نتطور باستمرار بناءً على رؤاكم القيمة.'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

