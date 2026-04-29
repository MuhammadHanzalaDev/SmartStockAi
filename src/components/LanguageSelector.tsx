import React from 'react';
import { Languages, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function LanguageSelector() {
  const { profile, updateLanguagePreference } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const currentLang = profile?.languagePreference || 'english';

  const languages = [
    { id: 'english', label: 'English', sub: 'Professional' },
    { id: 'roman_urdu', label: 'Roman Urdu', sub: 'Pakistani Local' }
  ] as const;

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm group"
      >
        <Languages size={14} className="text-slate-400 group-hover:text-indigo-500" />
        {languages.find(l => l.id === currentLang)?.label}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-2 space-y-1">
              <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Insight Language</p>
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    updateLanguagePreference(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentLang === lang.id 
                      ? 'bg-indigo-50 text-indigo-700 font-medium' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold">{lang.label}</p>
                    <p className="text-[10px] opacity-70">{lang.sub}</p>
                  </div>
                  {currentLang === lang.id && <Check size={14} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
