import React from 'react';
import { useTranslation, Language } from '../hooks/useTranslation';
import { Select } from './ui/Select';

const LanguageSelector: React.FC = () => {
  const { language, changeLanguage, availableLanguages } = useTranslation();

  const languageOptions = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇺🇸' }
  ];

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage as Language);
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {language === 'fr' ? 'Langue' : 'Language'}:
      </span>
      <Select
        value={language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        options={languageOptions.map(option => ({
          value: option.value,
          label: `${option.flag} ${option.label}`
        }))}
        className="w-32"
      />
    </div>
  );
};

export default LanguageSelector;
