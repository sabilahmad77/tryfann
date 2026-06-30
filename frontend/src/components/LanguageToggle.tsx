import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  language: 'en' | 'ar';
  onToggle: (lang: 'en' | 'ar') => void;
}

export function LanguageToggle({ language, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={() => onToggle(language === 'en' ? 'ar' : 'en')}
      className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 cursor-pointer"
    >
      <Globe className="w-4 h-4 text-amber-400" />
      <span className="text-white/70">{language === 'en' ? 'العربية' : 'English'}</span>
    </button>
  );
}
