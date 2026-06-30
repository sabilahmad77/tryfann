import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, ChevronLeft, Shield, Check } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useLanguage } from '@/contexts/useLanguage';

interface ForgotPasswordProps {
  onNavigateToSignIn: () => void;
  onNavigateToHome: () => void;
}

export function ForgotPassword({ onNavigateToSignIn, onNavigateToHome }: ForgotPasswordProps) {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');

  const t = {
    en: {
      title: 'Reset Password',
      subtitle: 'Enter your email to receive a password reset link',
      successTitle: 'Check Your Email',
      successSubtitle: "We've sent password reset instructions to",
      email: 'Email Address',
      emailPlaceholder: 'your.email@example.com',
      sendButton: 'Send Reset Link',
      sending: 'Sending...',
      backToSignIn: 'Back to Sign In',
      backToHome: 'Back to Home',
      resendLink: "Didn't receive the email?",
      resend: 'Resend',
      checkSpam: "Check your spam folder if you don't see the email",
      instructions: [
        'Check your email inbox',
        'Click the reset link we sent you',
        'Create a new password',
        'Sign in with your new credentials'
      ]
    },
    ar: {
      title: 'إعادة تعيين كلمة المرور',
      subtitle: 'أدخل بريدك الإلكتروني لتلقي رابط إعادة تعيين كلمة المرور',
      successTitle: 'تحقق من بريدك الإلكتروني',
      successSubtitle: "لقد أرسلنا تعليمات إعادة تعيين كلمة المرور إلى",
      email: 'البريد الإلكتروني',
      emailPlaceholder: 'your.email@example.com',
      sendButton: 'إرسال رابط إعادة التعيين',
      sending: 'جارٍ الإرسال...',
      backToSignIn: 'العودة لتسجيل الدخول',
      backToHome: 'العودة للرئيسية',
      resendLink: "لم تتلق البريد الإلكتروني؟",
      resend: 'إعادة الإرسال',
      checkSpam: "تحقق من مجلد البريد العشوائي إذا لم تجد البريد الإلكتروني",
      instructions: [
        'تحقق من صندوق بريدك الإلكتروني',
        'انقر على رابط إعادة التعيين الذي أرسلناه لك',
        'أنشئ كلمة مرور جديدة',
        'سجّل الدخول باستخدام بيانات الاعتماد الجديدة'
      ]
    }
  };

  const content = t[language];
  const isRTL = language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    setEmailSent(true);
  };

  const handleResend = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
  };

  return (
    <div className="fann-landing min-h-screen flex" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* LEFT PANEL - Branding & Info */}
      <motion.div
        initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-[40%] relative overflow-hidden"
        style={{
          background: 'var(--ink-panel)',
          borderInlineEnd: '1px solid var(--hairline)',
        }}
      >
        {/* Backdrop — one quiet gold wash */}
        <div className="absolute inset-0" aria-hidden="true">
          <div
            className="absolute -top-32 -left-32 h-96 w-96 rounded-full blur-3xl"
            style={{ background: 'var(--gold-soft)' }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo/Brand */}
          <div className="mb-12">
            <motion.button
              onClick={onNavigateToHome}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 text-[#8A8EA0] hover:text-[#C59B48] transition-colors group mb-8"
            >
              <ChevronLeft className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              <span className="text-sm">{content.backToHome}</span>
            </motion.button>

            <h1 className="fann-display mb-2" style={{ fontSize: '2.25rem', color: 'var(--bone)' }}>
              FANN<span style={{ color: 'var(--gold)' }}>.</span>
            </h1>
            <p className="text-sm" style={{ color: 'var(--bone-2)' }}>{content.subtitle}</p>
          </div>

          {/* Features Section */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-lg bg-[#C59B48]/10 border border-[#C59B48]/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#C59B48]" />
                </div>
                <div>
                  <h2 className="fann-display mb-1" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--bone)' }}>
                    {language === 'en' ? 'Secure Reset Process' : 'عملية إعادة تعيين آمنة'}
                  </h2>
                  <p className="text-[#8A8EA0] text-sm">
                    {language === 'en' ? 'Your security is our priority' : 'أمانك هو أولويتنا'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-6 rounded-xl bg-[#191922]/50 border border-[#C59B48]/20">
                {content.instructions.map((instruction, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#C59B48]/20 border border-[#C59B48]/40 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[#C59B48] text-xs">{idx + 1}</span>
                    </div>
                    <p className="text-[#8A8EA0] text-sm">{instruction}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* RIGHT PANEL - Form */}
      <div className="flex-1 relative overflow-hidden">
        {/* Form Container */}
        <div className="h-full overflow-y-auto">
          <div className="min-h-full flex items-center justify-center p-6 lg:p-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-xl"
            >
              {!emailSent ? (
                <>
                  {/* Header */}
                  <div className="mb-8">
                    <h2 className="fann-display mb-2" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: 'var(--bone)' }}>
                      {content.title}
                    </h2>
                    <p style={{ color: 'var(--bone-2)' }}>{content.subtitle}</p>
                  </div>

                  {/* Form */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#F2F2F3]/80">{content.email}</Label>
                        <div className="relative">
                          <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-[#8A8EA0] ${isRTL ? 'right-3' : 'left-3'}`} />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={content.emailPlaceholder}
                            className={`bg-[#0B0B0D] border border-[#C59B48]/20 text-[#F2F2F3] placeholder:text-[#8A8EA0] h-11 focus:border-[#C59B48]/50 focus:ring-[#C59B48]/20 ${isRTL ? 'pr-10' : 'pl-10'}`}
                            required
                          />
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="fann-focus h-12 w-full font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40"
                          style={{
                            background: 'var(--gold)',
                            color: 'var(--ink-void)',
                            borderRadius: 'var(--r-md)',
                          }}
                          onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = 'var(--gold-hi)'; }}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gold)')}
                        >
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            {isLoading ? content.sending : content.sendButton}
                            {!isLoading && <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />}
                          </span>
                        </button>
                      </div>
                    </form>

                    {/* Back to Sign In Link */}
                    <div className="mt-6 text-center">
                      <button
                        type="button"
                        onClick={onNavigateToSignIn}
                        className="text-[#C59B48] hover:text-[#D6AE5A] transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
                      >
                        <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
                        {content.backToSignIn}
                      </button>
                    </div>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-center"
                  >
                    {/* Success Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                      style={{ background: 'var(--gold)' }}
                    >
                      <Check className="h-10 w-10" style={{ color: 'var(--ink-void)' }} />
                    </motion.div>

                    {/* Success Message */}
                    <h2 className="fann-display mb-3" style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', color: 'var(--bone)' }}>
                      {content.successTitle}
                    </h2>
                    <p className="text-[#8A8EA0] mb-2">{content.successSubtitle}</p>
                    <p className="text-[#C59B48] mb-8">{email}</p>

                    {/* Info Box */}
                    <div className="p-6 rounded-xl bg-[#191922]/50 border border-[#C59B48]/20 mb-6">
                      <p className="text-[#8A8EA0] text-sm mb-4">{content.checkSpam}</p>
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <span className="text-[#8A8EA0]">{content.resendLink}</span>
                        <button
                          onClick={handleResend}
                          disabled={isLoading}
                          className="text-[#C59B48] hover:text-[#D6AE5A] transition-colors disabled:opacity-50 disabled:bg-disabled disabled:cursor-not-allowed"
                        >
                          {content.resend}
                        </button>
                      </div>
                    </div>

                    {/* Back to Sign In Button */}
                    <button
                      onClick={onNavigateToSignIn}
                      className="fann-focus h-12 w-full font-semibold transition-all"
                      style={{
                        background: 'var(--gold)',
                        color: 'var(--ink-void)',
                        borderRadius: 'var(--r-md)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gold-hi)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gold)')}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <ChevronLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                        {content.backToSignIn}
                      </span>
                    </button>
                  </motion.div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

