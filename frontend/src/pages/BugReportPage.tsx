import { DashboardLayout } from '@/components/dashboard/shared/DashboardLayout';
import { Button } from '@/components/ui/button';
import { FileUploadField, InputField, TextareaField } from '@/components/ui/custom-form-elements';
import { useLanguage } from '@/contexts/useLanguage';
import { AlertCircle, AlertTriangle, Bug, CheckCircle, Info, Monitor } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useReportBugMutation } from '@/services/api/dashboardApi';

const content = {
  en: {
    title: "Report a Bug",
    subtitle: "Help us improve FANN by reporting any issues you encounter",
    severityLabel: "Bug Severity",
    critical: "Critical",
    criticalDesc: "App is unusable",
    high: "High",
    highDesc: "Major feature broken",
    medium: "Medium",
    mediumDesc: "Feature partially working",
    low: "Low",
    lowDesc: "Minor issue",
    categoryLabel: "Bug Category",
    categories: {
      ui: "UI/UX Issue",
      performance: "Performance",
      functionality: "Functionality",
      security: "Security",
      data: "Data Issue",
      other: "Other"
    },
    titleLabel: "Bug Title",
    titlePlaceholder: "Brief description of the bug",
    descriptionLabel: "Bug Description",
    descriptionPlaceholder: "Please describe the bug in detail. Include what you were doing, what happened, and what you expected to happen...",
    deviceLabel: "Device/Browser Info",
    devicePlaceholder: "e.g., Chrome 120, iPhone 14, Windows 11",
    screenshotLabel: "Screenshot",
    screenshotButton: "Upload Screenshot",
    emailLabel: "Email for Follow-up",
    emailPlaceholder: "your.email@example.com",
    submitButton: "Submit Bug Report",
    submitting: "Submitting...",
    successTitle: "Thank You!",
    successMessage: "Bug report submitted successfully. We'll investigate this issue.",
    errorMessage: "Failed to submit bug report. Please try again.",
    requiredField: "Please fill in all required fields"
  },
  ar: {
    title: "الإبلاغ عن خلل",
    subtitle: "ساعدنا في تحسين FANN من خلال الإبلاغ عن أي مشاكل تواجهها",
    severityLabel: "خطورة الخلل",
    critical: "حرج",
    criticalDesc: "التطبيق غير قابل للاستخدام",
    high: "عالية",
    highDesc: "ميزة رئيسية معطلة",
    medium: "متوسطة",
    mediumDesc: "الميزة تعمل جزئياً",
    low: "منخفضة",
    lowDesc: "مشكلة بسيطة",
    categoryLabel: "فئة الخلل",
    categories: {
      ui: "مشكلة واجهة/تجربة المستخدم",
      performance: "الأداء",
      functionality: "الوظائف",
      security: "الأمان",
      data: "مشكلة بيانات",
      other: "أخرى"
    },
    titleLabel: "عنوان الخلل",
    titlePlaceholder: "وصف موجز للخلل",
    descriptionLabel: "وصف الخلل",
    descriptionPlaceholder: "يرجى وصف الخلل بالتفصيل. قم بتضمين ما كنت تفعله، وما حدث، وما كنت تتوقع أن يحدث...",
    deviceLabel: "معلومات الجهاز/المتصفح",
    devicePlaceholder: "مثال: Chrome 120، iPhone 14، Windows 11",
    screenshotLabel: "لقطة الشاشة",
    screenshotButton: "رفع لقطة الشاشة",
    emailLabel: "البريد الإلكتروني للمتابعة",
    emailPlaceholder: "your.email@example.com",
    submitButton: "إرسال تقرير الخلل",
    submitting: "جاري الإرسال...",
    successTitle: "شكراً لك!",
    successMessage: "تم إرسال تقرير الخلل بنجاح. سنحقق في هذه المشكلة.",
    errorMessage: "فشل إرسال تقرير الخلل. يرجى المحاولة مرة أخرى.",
    requiredField: "يرجى ملء جميع الحقول المطلوبة"
  }
};

export function BugReportPage() {
  const { language } = useLanguage();
  const t = content[language];
  const isRTL = language === 'ar';

  const [severity, setSeverity] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [bugTitle, setBugTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [reportBug, { isLoading: isReportingBug }] = useReportBugMutation();

  const severityLevels = [
    {
      value: 'critical',
      label: t.critical,
      desc: t.criticalDesc,
      icon: AlertTriangle,
      color: '#ef4444',
      bgColor: '#ef4444/20'
    },
    {
      value: 'high',
      label: t.high,
      desc: t.highDesc,
      icon: AlertCircle,
      color: '#f97316',
      bgColor: '#f97316/20'
    },
    {
      value: 'medium',
      label: t.medium,
      desc: t.mediumDesc,
      icon: Info,
      color: '#C59B48',
      bgColor: '#C59B48/20'
    },
    {
      value: 'low',
      label: t.low,
      desc: t.lowDesc,
      icon: CheckCircle,
      color: '#10b981',
      bgColor: '#10b981/20'
    },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!severity || !category || !bugTitle.trim() || !description.trim()) {
      toast.error(t.requiredField);
      return;
    }

    const severityLabel =
      severityLevels.find((level) => level.value === severity)?.label || severity;
    const categoryLabel =
      t.categories[category as keyof typeof t.categories] || category;

    const payload = {
      title: bugTitle.trim(),
      severity: severityLabel,
      description: description.trim(),
      bug_category: categoryLabel,
      device_info: deviceInfo.trim() || undefined,
      email: email.trim() || undefined,
      bug_image: screenshotFile || undefined,
    };

    try {
      setIsSubmitting(true);
      await reportBug(payload).unwrap();

      toast.success(t.successTitle, {
        description: t.successMessage,
      });

      // Reset form
      setSeverity('');
      setCategory('');
      setBugTitle('');
      setDescription('');
      setDeviceInfo('');
      setEmail('');
      setScreenshotFile(null);
    } catch (error) {
      console.error('Bug report submission failed:', error);
      toast.error(t.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout currentPage="bugReport">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`mb-8 ${isRTL ? 'text-right' : 'text-left'}`}
      >
        <h1 className="text-4xl md:text-5xl mb-2 text-[#F2F2F3]">
          {t.title}
        </h1>
        <p className="text-[#8A8EA0] text-lg">{t.subtitle}</p>
      </motion.div>

      <div className="space-y-6">
        {/* Bug Report Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 shadow-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Severity Level */}
            <div>
              <label className={`block text-[#F2F2F3] mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.severityLabel} <span className="text-[#ef4444]">*</span>
              </label>
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-3`}>
                {severityLevels.map((level) => {
                  const Icon = level.icon;
                  const isSelected = severity === level.value;
                  return (
                    <motion.button
                      key={level.value}
                      type="button"
                      onClick={() => setSeverity(level.value)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl transition-all cursor-pointer ${isSelected
                        ? 'border-2 border-[#C59B48] bg-[#C59B48]/10'
                        : 'bg-[#0B0B0D] border border-[#4e4e4e78]'
                        }`}
                    >
                      <Icon
                        className={`w-6 h-6 mx-auto mb-2 transition-colors`}
                        style={{ color: isSelected ? level.color : '#8A8EA0' }}
                      />
                      <p className={`text-sm mb-1 text-center ${isSelected ? 'text-[#F2F2F3]' : 'text-[#8A8EA0]'
                        }`}>
                        {level.label}
                      </p>
                      <p className={`text-xs text-center ${isSelected ? 'text-[#8A8EA0]' : 'text-[#4e4e4e]'
                        }`}>
                        {level.desc}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className={`block text-[#F2F2F3] mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.categoryLabel} <span className="text-[#ef4444]">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(t.categories).map(([key, label]) => {
                  const isSelected = category === key;
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
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

            {/* Bug Title */}
            <InputField
              label={t.titleLabel}
              type="text"
              value={bugTitle}
              onChange={(e) => setBugTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              required
              isRTL={isRTL}
            />

            {/* Bug Description */}
            <TextareaField
              label={t.descriptionLabel}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.descriptionPlaceholder}
              rows={4}
              required
              isRTL={isRTL}
            />

            {/* Device/Browser Info */}
            <InputField
              label={t.deviceLabel}
              type="text"
              value={deviceInfo}
              onChange={(e) => setDeviceInfo(e.target.value)}
              placeholder={t.devicePlaceholder}
              icon={Monitor}
              isRTL={isRTL}
            />

            {/* Screenshot Upload */}
            <FileUploadField
              label={t.screenshotLabel}
              accept="image/*"
              onFileChange={(file) => setScreenshotFile(file)}
              value={screenshotFile}
              buttonText={t.screenshotButton}
              isRTL={isRTL}
            />

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
                disabled={isSubmitting || isReportingBug}
                className={`w-full bg-gradient-to-r from-[#ef4444] to-[#f97316] text-white hover:opacity-90 transition-opacity h-12 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''
                  }`}
              >
                {isSubmitting || isReportingBug ? (
                  <span>{t.submitting}</span>
                ) : (
                  <>
                    <Bug className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
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
              <div className="w-10 h-10 bg-[#ef4444]/20 rounded-lg flex items-center justify-center shrink-0">
                <Bug className="w-5 h-5 text-[#ef4444]" />
              </div>
              <div>
                <h3 className="text-[#F2F2F3] mb-1">
                  {language === 'en' ? 'Quick Response' : 'استجابة سريعة'}
                </h3>
                <p className="text-sm text-[#8A8EA0]">
                  {language === 'en'
                    ? 'Critical bugs are prioritized and addressed within 24 hours.'
                    : 'يتم إعطاء الأولوية للأخطاء الحرجة ومعالجتها خلال 24 ساعة.'}
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-[#45e3d3]/20 rounded-lg flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-[#45e3d3]" />
              </div>
              <div>
                <h3 className="text-[#F2F2F3] mb-1">
                  {language === 'en' ? 'Track Progress' : 'تتبع التقدم'}
                </h3>
                <p className="text-sm text-[#8A8EA0]">
                  {language === 'en'
                    ? 'Receive updates on the status of your reported bugs via email.'
                    : 'احصل على تحديثات حول حالة الأخطاء المبلغ عنها عبر البريد الإلكتروني.'}
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 bg-[#8b5cf6]/20 rounded-lg flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <h3 className="text-[#F2F2F3] mb-1">
                  {language === 'en' ? 'Detailed Reports' : 'تقارير مفصلة'}
                </h3>
                <p className="text-sm text-[#8A8EA0]">
                  {language === 'en'
                    ? 'The more details you provide, the faster we can fix the issue.'
                    : 'كلما قدمت تفاصيل أكثر، كلما تمكنا من حل المشكلة بشكل أسرع.'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

