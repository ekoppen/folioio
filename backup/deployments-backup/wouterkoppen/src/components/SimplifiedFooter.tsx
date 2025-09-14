import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';

interface FooterSettings {
  footer_enabled: boolean;
  footer_text: string;
  footer_height: number;
  footer_font_family: string;
  footer_font_size: number;
  footer_color: string;
  footer_text_align: 'left' | 'center' | 'right';
  footer_overlay: boolean;
  footer_hover_opacity: number;
  // Navigation background settings (shared)
  header_background_color: string;
  header_background_opacity: number;
  header_blur: boolean;
  // Site fonts
  title_font_family: string;
  content_font_family: string;
}

const SimplifiedFooter = () => {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<FooterSettings>({
    footer_enabled: true,
    footer_text: '© 2025 Portfolio. Alle rechten voorbehouden.',
    footer_height: 80,
    footer_font_family: 'site', // Use site settings
    footer_font_size: 14,
    footer_color: '#ffffff',
    footer_text_align: 'center',
    footer_overlay: false,
    footer_hover_opacity: 0.95,
    // Navigation background settings (shared)
    header_background_color: '#000000',
    header_background_opacity: 0.8,
    header_blur: false,
    title_font_family: 'Playfair Display',
    content_font_family: 'Roboto'
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select(`
            footer_enabled,
            footer_text,
            footer_height,
            footer_font_family,
            footer_font_size,
            footer_color,
            footer_text_align,
            footer_overlay,
            footer_hover_opacity,
            header_background_color,
            header_background_opacity,
            header_blur,
            title_font_family,
            content_font_family
          `)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setSettings({
            footer_enabled: data.footer_enabled ?? true,
            footer_text: data.footer_text ?? '© 2025 Portfolio. Alle rechten voorbehouden.',
            footer_height: data.footer_height ?? 80,
            footer_font_family: data.footer_font_family ?? 'site',
            footer_font_size: data.footer_font_size ?? 14,
            footer_color: data.footer_color ?? '#ffffff',
            footer_text_align: (data.footer_text_align as 'left' | 'center' | 'right') ?? 'center',
            footer_overlay: data.footer_overlay ?? false,
            footer_hover_opacity: data.footer_hover_opacity ?? 0.95,
            // Navigation background settings (shared)
            header_background_color: data.header_background_color ?? '#000000',
            header_background_opacity: data.header_background_opacity ?? 0.8,
            header_blur: data.header_blur ?? false,
            title_font_family: data.title_font_family ?? 'Playfair Display',
            content_font_family: data.content_font_family ?? 'Roboto'
          });
        }
      } catch (error) {
        console.error('Error loading footer settings:', error);
      }
    };

    loadSettings();
  }, []);

  if (!settings.footer_enabled) {
    return null;
  }

  // Get the font family based on settings
  const getFontFamily = () => {
    if (settings.footer_font_family === 'site') {
      return settings.content_font_family;
    }
    return settings.footer_font_family;
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const footerStyle = {
    height: `${settings.footer_height}px`,
    color: settings.footer_color,
    fontFamily: getFontFamily(),
    fontSize: `${settings.footer_font_size}px`,
    backgroundColor: (() => {
      const rgb = hexToRgb(settings.header_background_color);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${settings.header_background_opacity})`;
    })(),
    backdropFilter: settings.header_blur ? 'blur(10px)' : 'none',
    transition: 'all 0.3s ease-in-out',
  };

  const footerHoverStyle = {
    backgroundColor: (() => {
      const rgb = hexToRgb(settings.header_background_color);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${settings.footer_hover_opacity})`;
    })(),
  };

  return (
    <footer 
      className={`w-full flex items-center justify-center transition-all duration-300 ${
        settings.footer_overlay ? 'fixed bottom-0 z-50' : 'relative'
      }`}
      style={footerStyle}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, footerHoverStyle);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = footerStyle.backgroundColor;
      }}
    >
      <div className="container mx-auto px-6" style={{ textAlign: settings.footer_text_align }}>
        <p className="whitespace-pre-line">{t('site_settings.footer_text', settings.footer_text)}</p>
      </div>
    </footer>
  );
};

export default SimplifiedFooter;