import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Translation {
  [key: string]: string;
}

interface TranslationContextType {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
  t: (key: string, fallback?: string) => string;
  translations: Translation;
  isLoading: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: ReactNode;
}

export const TranslationProvider = ({ children }: TranslationProviderProps) => {
  const [currentLanguage, setCurrentLanguage] = useState('nl');
  const [translations, setTranslations] = useState<Translation>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load default language from settings
    loadDefaultLanguage();
    
    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    if (currentLanguage !== 'nl') {
      loadTranslations(currentLanguage);
    } else {
      setTranslations({});
    }
    
    // Save language preference
    localStorage.setItem('selectedLanguage', currentLanguage);
  }, [currentLanguage]);

  const loadDefaultLanguage = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('default_language')
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data?.default_language && !localStorage.getItem('selectedLanguage')) {
        setCurrentLanguage(data.default_language);
      }
    } catch (error) {
      console.error('Error loading default language:', error);
    }
  };

  const loadTranslations = async (languageCode: string) => {
    if (languageCode === 'nl') {
      setTranslations({});
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('translations')
        .select('translation_key, translation_value')
        .eq('language_code', languageCode);

      if (error) throw error;

      const translationMap: Translation = {};
      data?.forEach((item) => {
        translationMap[item.translation_key] = item.translation_value;
      });

      setTranslations(translationMap);
    } catch (error) {
      console.error('Error loading translations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string, fallback?: string) => {
    if (currentLanguage === 'nl') {
      return fallback || key;
    }
    
    return translations[key] || fallback || key;
  };

  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        setCurrentLanguage,
        t,
        translations,
        isLoading,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};