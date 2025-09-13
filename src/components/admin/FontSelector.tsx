import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getBackendAdapter } from '@/config/backend-config';

interface Font {
  name: string;
  type: 'google' | 'custom';
  url?: string;
  displayName: string;
}

interface FontSelectorProps {
  label: string;
  value?: string;
  onFontChange: (fontFamily: string, fontUrl?: string) => void;
  placeholder?: string;
}

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Source Sans Pro', 
  'Raleway', 'Poppins', 'Merriweather', 'Lora', 'Playfair Display', 'Nunito', 'PT Sans',
  'Ubuntu', 'Roboto Slab', 'Crimson Text', 'Work Sans', 'Fira Sans', 'Libre Baskerville'
];

export const FontSelector = ({ label, value, onFontChange, placeholder }: FontSelectorProps) => {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loadedFonts, setLoadedFonts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAvailableFonts();
  }, []);

  const fetchAvailableFonts = async () => {
    try {
      // Get all custom fonts from database
      const backend = getBackendAdapter();
      const { data: settingsData, error } = await backend
        .from('site_settings')
        .select('title_font_family, title_font_url, content_font_family, content_font_url')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      const customFonts: Font[] = [];
      
      if (settingsData) {
        // Add title font if it exists and has URL (indicating it's custom)
        if (settingsData.title_font_family && settingsData.title_font_url) {
          customFonts.push({
            name: settingsData.title_font_family,
            type: 'custom',
            url: settingsData.title_font_url,
            displayName: settingsData.title_font_family
          });
        }
        
        // Add content font if it exists and has URL (indicating it's custom)
        if (settingsData.content_font_family && 
            settingsData.content_font_url && 
            settingsData.content_font_family !== settingsData.title_font_family) {
          customFonts.push({
            name: settingsData.content_font_family,
            type: 'custom',
            url: settingsData.content_font_url,
            displayName: settingsData.content_font_family
          });
        }
      }

      // Combine Google fonts and custom fonts
      const googleFonts: Font[] = GOOGLE_FONTS.map(font => ({
        name: font,
        type: 'google',
        displayName: font
      }));

      setFonts([...googleFonts, ...customFonts]);
    } catch (error) {
      console.error('Error fetching fonts:', error);
      // Fallback to just Google fonts
      const googleFonts: Font[] = GOOGLE_FONTS.map(font => ({
        name: font,
        type: 'google',
        displayName: font
      }));
      setFonts(googleFonts);
    }
  };

  const loadFont = (font: Font) => {
    if (loadedFonts.has(font.name)) return;

    if (font.type === 'google') {
      // Load Google Font
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${font.name.replace(/ /g, '+')}:wght@400;600&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    } else if (font.type === 'custom' && font.url) {
      // Load Custom Font
      const style = document.createElement('style');
      style.textContent = `
        @font-face {
          font-family: '${font.name}';
          src: url('${font.url}') format('woff2'),
               url('${font.url}') format('woff'),
               url('${font.url}') format('truetype');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    }

    setLoadedFonts(prev => new Set([...prev, font.name]));
  };

  const handleFontSelection = (fontName: string) => {
    const selectedFont = fonts.find(f => f.name === fontName);
    if (selectedFont) {
      loadFont(selectedFont);
      if (selectedFont.type === 'custom') {
        onFontChange(selectedFont.name, selectedFont.url);
      } else {
        onFontChange(selectedFont.name, '');
      }
    }
  };

  const getFontIcon = (type: 'google' | 'custom') => {
    return type === 'google' ? '🌐' : '📁';
  };

  const getFontTypeLabel = (type: 'google' | 'custom') => {
    return type === 'google' ? 'Google Font' : 'Custom Font';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || ''} onValueChange={handleFontSelection}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || 'Kies een font'} />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {/* Google Fonts Section */}
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b">
            🌐 Google Fonts
          </div>
          {fonts
            .filter(font => font.type === 'google')
            .map((font) => (
              <SelectItem 
                key={`google-${font.name}`} 
                value={font.name}
                className="py-3"
                onFocus={() => loadFont(font)}
              >
                <div className="flex items-center justify-between w-full">
                  <span 
                    style={{ 
                      fontFamily: loadedFonts.has(font.name) ? `'${font.name}', sans-serif` : 'inherit',
                      fontSize: '14px'
                    }}
                  >
                    {font.displayName}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {getFontIcon(font.type)}
                  </span>
                </div>
              </SelectItem>
            ))}
          
          {/* Custom Fonts Section */}
          {fonts.some(font => font.type === 'custom') && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-t mt-2">
                📁 Custom Fonts
              </div>
              {fonts
                .filter(font => font.type === 'custom')
                .map((font) => (
                  <SelectItem 
                    key={`custom-${font.name}`} 
                    value={font.name}
                    className="py-3"
                    onFocus={() => loadFont(font)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span 
                        style={{ 
                          fontFamily: loadedFonts.has(font.name) ? `'${font.name}', sans-serif` : 'inherit',
                          fontSize: '14px'
                        }}
                      >
                        {font.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {getFontIcon(font.type)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};