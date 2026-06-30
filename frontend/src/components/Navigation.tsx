import { useState } from 'react';
import { motion } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/useLanguage';
import { ROUTES } from '@/routes/paths';
import fannLogo from 'figma:asset/3b0b3b085f063d168ed55b6b769b2fbf5143db61.png';

interface NavigationProps {
  onNavigateToSignIn?: () => void;
}

const content = {
  en: {
    nav: [
      { label: "How It Works", href: "#how" },
      { label: "Rewards", href: "#rewards" },
      { label: "Referrals", href: "#referrals" },
      { label: "FAQ", href: "#faq" }
    ],
    login: "Sign In",
    signup: "Start Journey"
  },
  ar: {
    nav: [
      { label: "كيف يعمل", href: "#how" },
      { label: "المكافآت", href: "#rewards" },
      { label: "الإحالات", href: "#referrals" },
      { label: "الأسئلة الشائعة", href: "#faq" }
    ],
    login: "ربط المحفظة",
    signup: "ابدأ الرحلة"
  }
};

export function Navigation({ onNavigateToSignIn }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const t = content[language];
  const isRTL = language === 'ar';

  const handleNavigateToSignIn = () => {
    if (onNavigateToSignIn) {
      onNavigateToSignIn();
    } else {
      navigate(ROUTES.SIGN_IN);
    }
  };

  const handleNavigateToSignUp = () => {
    navigate(ROUTES.SIGN_UP);
  };

  const scrollToSection = (sectionId: string) => {
    const navbarHeight = 80; // h-20 = 80px
    if (window.location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      navigate(ROUTES.HOME);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  const handleNavClick = (href: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const sectionId = href.replace('#', '');
    scrollToSection(sectionId);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#121217]/95 backdrop-blur-xl border-b border-[#2A2A3A] w-full max-w-full overflow-x-hidden"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to={ROUTES.HOME}>
            <motion.div 
              className="flex items-center gap-3 cursor-pointer"
              whileHover={{ scale: 1.05 }}
            >
              <motion.img 
                src={fannLogo}
                alt="FANN"
                className="h-8 w-auto"
                animate={{
                  filter: [
                    'drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))',
                    'drop-shadow(0 0 16px rgba(234, 179, 8, 0.8))',
                    'drop-shadow(0 0 8px rgba(234, 179, 8, 0.5))',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {t.nav.map((item, index) => (
              <motion.a
                key={index}
                href={item.href}
                onClick={(e) => handleNavClick(item.href, e)}
                whileHover={{ scale: 1.05, y: -2 }}
                className="text-[#B9BBC6] hover:text-[#F2F2F3] transition-colors relative group font-body font-normal cursor-pointer"
              >
                {item.label}
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-yellow-500 origin-left"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <LanguageToggle language={language} onToggle={setLanguage} />
            
            <div className="hidden md:flex items-center gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleNavigateToSignIn}
                  variant="ghost" 
                  className="relative px-4 py-2 glass transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.6 }}
                  />
                  <span className="relative z-10">{t.login}</span>
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleNavigateToSignUp}
                  className="relative px-5 py-2 border-0 overflow-hidden group shadow-lg shadow-primary/30 hover:shadow-primary/60 transition-all duration-300 cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                  <span className="relative z-10">{t.signup}</span>
                </Button>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white p-2 glass rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:hidden border-t border-white/10 glass"
        >
          <div className="container mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col gap-4">
              {t.nav.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  onClick={(e) => {
                    handleNavClick(item.href, e);
                    setMobileMenuOpen(false);
                  }}
                  whileHover={{ x: 10 }}
                  className="text-white/70 hover:text-white transition-colors py-2 font-body cursor-pointer"
                >
                  {item.label}
                </motion.a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
                <Button 
                  onClick={handleNavigateToSignIn}
                  variant="ghost" 
                  className="relative glass w-full transition-all duration-300 overflow-hidden group cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="relative z-10">{t.login}</span>
                </Button>
                <Button 
                  onClick={handleNavigateToSignUp}
                  className="relative w-full border-0 shadow-lg shadow-primary/30 overflow-hidden group cursor-pointer"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <span className="relative z-10">{t.signup}</span>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
