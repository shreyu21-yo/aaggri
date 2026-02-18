
import React from 'react';
import { LANGUAGES } from '../constants';
import { Language } from '../types';

interface Props {
  currentLang: Language;
  onSelect: (lang: Language) => void;
}

export const LanguageSelector: React.FC<Props> = ({ currentLang, onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center mb-6">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onSelect(lang.code)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            currentLang === lang.code
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-gray-600 border hover:border-emerald-500'
          }`}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};
