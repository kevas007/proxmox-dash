import { useState, useEffect } from 'react';

export type Language = 'fr' | 'en';

interface TranslationData {
  [key: string]: any;
}

const translations: Record<Language, TranslationData> = {
  fr: {},
  en: {}
};

// Charger les traductions
const loadTranslations = async (language: Language): Promise<TranslationData> => {
  try {
    const response = await fetch(`/locales/${language}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${language} translations`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading ${language} translations:`, error);
    return {};
  }
};

// Initialiser les traductions
const initializeTranslations = async () => {
  try {
    translations.fr = await loadTranslations('fr');
    translations.en = await loadTranslations('en');
  } catch (error) {
    console.error('Error initializing translations:', error);
  }
};

// Initialiser au chargement du module
initializeTranslations();

export const useTranslation = (language: Language = 'fr') => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(language);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLanguage = async () => {
      setIsLoading(true);
      try {
        if (!translations[currentLanguage] || Object.keys(translations[currentLanguage]).length === 0) {
          translations[currentLanguage] = await loadTranslations(currentLanguage);
        }
      } catch (error) {
        console.error(`Error loading ${currentLanguage} translations:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, [currentLanguage]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    if (isLoading) {
      return key; // Retourner la clé pendant le chargement
    }

    const keys = key.split('.');
    let value: any = translations[currentLanguage];

    // Naviguer dans l'objet de traduction
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback vers l'anglais si la clé n'existe pas
        value = translations.en;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            return key; // Retourner la clé si pas trouvée
          }
        }
        break;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Remplacer les paramètres
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  const changeLanguage = (newLanguage: Language) => {
    setCurrentLanguage(newLanguage);
    // Sauvegarder la préférence
    localStorage.setItem('nexboard-language', newLanguage);
  };

  // Charger la langue depuis localStorage au démarrage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('nexboard-language') as Language;
    if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  return {
    t,
    language: currentLanguage,
    changeLanguage,
    isLoading,
    availableLanguages: ['fr', 'en'] as Language[]
  };
};

export default useTranslation;
