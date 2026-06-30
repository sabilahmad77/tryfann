import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { Footer } from '@/components/Footer';
import { Navigation } from '@/components/Navigation';
import { FAQ } from '@/components/FAQ';
import { useLanguage } from '@/contexts/useLanguage';
import bgImage from 'figma:asset/3fa9b9de7e4b1421a708a7c88cd0672cee3504e2.png';
import { Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { toast } from 'sonner@2.0.3';

const content = {
  en: {
    title: "Contact Us",
    subtitle: "Get in touch with the FANN team",
    form: {
      name: "Name",
      email: "Email",
      subject: "Subject",
      message: "Message",
      submit: "Send Message",
      sending: "Sending...",
      success: "Message sent successfully!",
      error: "Failed to send message. Please try again.",
    },
  },
  ar: {
    title: "اتصل بنا",
    subtitle: "تواصل مع فريق FANN",
    form: {
      name: "الاسم",
      email: "البريد الإلكتروني",
      subject: "الموضوع",
      message: "الرسالة",
      submit: "إرسال الرسالة",
      sending: "جاري الإرسال...",
      success: "تم إرسال الرسالة بنجاح!",
      error: "فشل إرسال الرسالة. يرجى المحاولة مرة أخرى.",
    },
  },
};

export function ContactUsPage() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const t = content[language];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast.success(t.form.success);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#0B0B0D]">
      <Navigation onNavigateToSignIn={() => { }} />

      <main>
        {/* Contact Form Section */}
        <section className="relative py-24 mt-12 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="absolute inset-0">
            <ImageWithFallback
              src={bgImage}
              alt="Background"
              className="w-full h-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0D]/60 via-transparent to-[#0B0B0D]/60" />
          </div>

          <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl md:text-5xl mb-4 font-heading">
                <span className="text-white font-heading">{t.title}</span>
              </h1>
              <p className="text-[#B9BBC6] text-lg font-body">{t.subtitle}</p>
            </motion.div>

            <div className="max-w-2xl mx-auto">
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="backdrop-blur-xl bg-gradient-to-br from-[#191922]/80 via-[#191922]/70 to-[#0B0B0D]/80 rounded-2xl border-2 border-[#C59B48]/22 p-8 shadow-2xl"
              >
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 mb-2 font-body">{t.form.name}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#C59B48]/50 transition-colors font-body"
                      placeholder={t.form.name}
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2 font-body">{t.form.email}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#C59B48]/50 transition-colors font-body"
                      placeholder={t.form.email}
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2 font-body">{t.form.subject}</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#C59B48]/50 transition-colors font-body"
                      placeholder={t.form.subject}
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 mb-2 font-body">{t.form.message}</label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#C59B48]/50 transition-colors resize-none font-body"
                      placeholder={t.form.message}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-[#C59B48] to-[#D6AE5A] text-[#0B0B0D] shadow-xl shadow-[#C59B48]/30 hover:shadow-2xl hover:shadow-[#C59B48]/50 transition-all duration-300 inline-flex items-center justify-center gap-2 cursor-pointer font-body font-medium disabled:bg-disabled disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#0B0B0D]/30 border-t-[#0B0B0D] rounded-full animate-spin" />
                        {t.form.sending}
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {t.form.submit}
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            </div>
          </div>
        </section>

        {/* FAQ Section - Reusing FAQ component */}
        <div id="faq" className="scroll-mt-20">
          <FAQ language={language} showAll={true} showViewAllCTA={false} />
        </div>
      </main>

      <Footer language={language} />
    </div>
  );
}

