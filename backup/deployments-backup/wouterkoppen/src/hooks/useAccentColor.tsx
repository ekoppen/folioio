import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Helper function to convert hex to HSL
const hexToHsl = (hex: string): string => {
  // Remove the hash if present
  hex = hex.replace('#', '');
  
  // Parse r, g, b values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const useAccentColor = () => {
  const [accentColor, setAccentColor] = useState<string>('#F6D55C');

  useEffect(() => {
    const fetchAccentColor = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('accent_color')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        
        if (data?.accent_color) {
          setAccentColor(data.accent_color);
          // Convert hex to HSL and update CSS custom property for accent color
          const hslColor = hexToHsl(data.accent_color);
          document.documentElement.style.setProperty('--dynamic-accent', hslColor);
        }
      } catch (error) {
        console.error('Error fetching accent color:', error);
      }
    };

    fetchAccentColor();
  }, []);

  return accentColor;
};