import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FontSettings {
  title_font_family?: string;
  title_font_url?: string;
  content_font_family?: string;
  content_font_url?: string;
}

export const useFonts = () => {
  const [fontSettings, setFontSettings] = useState<FontSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndApplyFonts = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('title_font_family, title_font_url, content_font_family, content_font_url')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setFontSettings(data);
          await loadFonts(data);
          applyCSSVariables(data);
        }
      } catch (error) {
        console.error('Error fetching font settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndApplyFonts();
  }, []);

  const loadFonts = async (settings: FontSettings) => {
    // Load title font
    if (settings.title_font_family) {
      if (settings.title_font_url) {
        // Load custom font
        loadCustomFont(settings.title_font_family, settings.title_font_url);
      } else {
        // Load Google font
        loadGoogleFont(settings.title_font_family);
      }
    }

    // Load content font
    if (settings.content_font_family) {
      if (settings.content_font_url) {
        // Load custom font
        loadCustomFont(settings.content_font_family, settings.content_font_url);
      } else {
        // Load Google font
        loadGoogleFont(settings.content_font_family);
      }
    }
  };

  const loadGoogleFont = (fontFamily: string) => {
    // Check if font is already loaded
    const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/ /g, '+')}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  };

  const loadCustomFont = (fontFamily: string, fontUrl: string) => {
    // Check if font is already loaded
    const existingStyle = document.querySelector(`style[data-font="${fontFamily}"]`);
    if (existingStyle) return;

    const style = document.createElement('style');
    style.setAttribute('data-font', fontFamily);
    style.textContent = `
      @font-face {
        font-family: '${fontFamily}';
        src: url('${fontUrl}') format('woff2'),
             url('${fontUrl}') format('woff'),
             url('${fontUrl}') format('truetype');
        font-weight: 300 700;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  };

  const applyCSSVariables = (settings: FontSettings) => {
    const root = document.documentElement;
    
    if (settings.title_font_family) {
      root.style.setProperty('--font-title', `'${settings.title_font_family}', serif`);
    }
    
    if (settings.content_font_family) {
      root.style.setProperty('--font-content', `'${settings.content_font_family}', sans-serif`);
    }
  };

  return { fontSettings, isLoading };
};