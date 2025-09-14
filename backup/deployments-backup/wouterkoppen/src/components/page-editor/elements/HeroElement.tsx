import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import heroBackground from '@/assets/hero-background.jpg';

interface SiteSettings {
  site_title: string;
  site_tagline: string;
}

interface HeroElementProps {
  settings?: {
    siteTitle?: string;
    siteTagline?: string;
    showButtons?: boolean;
  };
}

export const HeroElement: React.FC<HeroElementProps> = ({ settings }) => {
  const { t } = useTranslation();
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_title: settings?.siteTitle || 'Creatieve Portfolio',
    site_tagline: settings?.siteTagline || 'Ontdek mijn werk, verhalen en creatieve visie'
  });

  useEffect(() => {
    if (!settings?.siteTitle && !settings?.siteTagline) {
      fetchSettings();
    }
  }, [settings]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('site_title, site_tagline')
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data) {
        setSiteSettings({
          site_title: data.site_title || 'Creatieve Portfolio',
          site_tagline: data.site_tagline || 'Ontdek mijn werk, verhalen en creatieve visie'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const { showButtons = true } = settings || {};
  const title = settings?.siteTitle || siteSettings.site_title;
  const tagline = settings?.siteTagline || siteSettings.site_tagline;

  return (
    <section className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 overlay-gradient" />
      
      {/* Content */}
      <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in text-white">
          {title.split(' ')[0]}
          {title.split(' ').length > 1 && (
            <span className="block text-portfolio-accent animate-slide-in-right">
              {title.split(' ').slice(1).join(' ')}
            </span>
          )}
        </h1>
        
        <p className="text-lg md:text-xl mb-8 text-white/90 animate-fade-in max-w-2xl mx-auto">
          {tagline}
        </p>
        
        {showButtons && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <Button size="lg" className="accent-gradient text-portfolio-dark font-semibold">
              {t('hero.view_portfolio', 'Bekijk Portfolio')}
            </Button>
            <Button variant="outline" size="lg" className="glass-effect text-white border-white/30 hover:bg-white/10">
              {t('hero.learn_more', 'Meer Over Mij')}
            </Button>
          </div>
        )}
      </div>
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-float">
        <ChevronDown className="text-white/70 w-6 h-6" />
      </div>
    </section>
  );
};