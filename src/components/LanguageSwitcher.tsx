import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

interface Language {
  id: string;
  code: string;
  name: string;
  is_enabled: boolean;
  is_default: boolean;
}

const LanguageSwitcher = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const { currentLanguage, setCurrentLanguage } = useTranslation();

  useEffect(() => {
    loadLanguages();
  }, []);

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_enabled', true)
        .order('is_default', { ascending: false });

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  if (languages.length <= 1) {
    return null; // Don't show switcher if only one language is available
  }

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2 text-white/90 hover:text-white hover:bg-white/20">
          <Globe className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.id}
            onClick={() => setCurrentLanguage(language.code)}
            className={`flex items-center justify-between ${currentLanguage === language.code ? 'bg-muted' : ''}`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3 h-3 opacity-60" />
              <span className="text-sm">{language.name}</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {language.code.toUpperCase()}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;