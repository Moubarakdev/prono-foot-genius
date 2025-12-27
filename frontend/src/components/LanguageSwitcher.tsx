import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const languages = [
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
    ];

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    return (
        <div className="relative group">
            <button className="flex items-center space-x-2 px-3 py-2 rounded-lg glass hover:bg-white/10 transition-all cursor-pointer">
                <Globe size={16} className="text-gray-400" />
                <span className="text-sm font-bold">{currentLanguage.flag}</span>
            </button>

            <div className="absolute right-0 top-full mt-2 w-40 glass rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {languages.map((lang) => (
                    <button
                        key={lang.code}
                        onClick={() => i18n.changeLanguage(lang.code)}
                        className={`w-full px-4 py-3 text-left text-sm font-bold hover:bg-white/10 transition-colors flex items-center space-x-3 cursor-pointer ${i18n.language === lang.code ? 'text-emerald' : 'text-gray-400'
                            }`}
                    >
                        <span className="text-lg">{lang.flag}</span>
                        <span>{lang.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};
