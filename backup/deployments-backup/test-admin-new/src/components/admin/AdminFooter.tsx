import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { getBackendAdapter } from '@/config/backend-config';
import { useToast } from '@/hooks/use-toast';
import { FontSelector } from './FontSelector';

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
}

const AdminFooter = () => {
  const [settings, setSettings] = useState<FooterSettings>({
    footer_enabled: true,
    footer_text: '© 2025 Portfolio. Alle rechten voorbehouden.',
    footer_height: 80,
    footer_font_family: 'site',
    footer_font_size: 14,
    footer_color: '#ffffff',
    footer_text_align: 'center',
    footer_overlay: false,
    footer_hover_opacity: 0.95
  });
  const [siteSettings, setSiteSettings] = useState({
    title_font_family: 'Playfair Display',
    content_font_family: 'Roboto'
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
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
          title_font_family,
          content_font_family
        `)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

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
          footer_hover_opacity: data.footer_hover_opacity ?? 0.95
        });
        
        setSiteSettings({
          title_font_family: data.title_font_family ?? 'Playfair Display',
          content_font_family: data.content_font_family ?? 'Roboto'
        });
      }
    } catch (error) {
      console.error('Error loading footer settings:', error);
      toast({
        title: "Fout bij laden",
        description: "Kon footer instellingen niet laden.",
        variant: "destructive"
      });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Get or create site settings entry
      const backend = getBackendAdapter();
      let { data: existingSettings } = await backend
        .from('site_settings')
        .select('id')
        .limit(1)
        .single();

      if (existingSettings) {
        // Update existing settings
        const { error } = await backend
          .from('site_settings')
          .update({
            footer_enabled: settings.footer_enabled,
            footer_text: settings.footer_text,
            footer_height: settings.footer_height,
            footer_font_family: settings.footer_font_family,
            footer_font_size: settings.footer_font_size,
            footer_color: settings.footer_color,
            footer_text_align: settings.footer_text_align,
            footer_overlay: settings.footer_overlay,
            footer_hover_opacity: settings.footer_hover_opacity
          })
          .eq('id', existingSettings.id);

        if (error) throw error;
      } else {
        // Create new settings entry
        const { error } = await backend
          .from('site_settings')
          .insert([{
            footer_enabled: settings.footer_enabled,
            footer_text: settings.footer_text,
            footer_height: settings.footer_height,
            footer_font_family: settings.footer_font_family,
            footer_font_size: settings.footer_font_size,
            footer_color: settings.footer_color,
            footer_text_align: settings.footer_text_align,
            footer_overlay: settings.footer_overlay,
            footer_hover_opacity: settings.footer_hover_opacity
          }]);

        if (error) throw error;
      }

      toast({
        title: "Footer instellingen opgeslagen",
        description: "Je footer instellingen zijn succesvol bijgewerkt."
      });
    } catch (error) {
      console.error('Error saving footer settings:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Kon footer instellingen niet opslaan.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof FooterSettings>(key: K, value: FooterSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Get font family for preview
  const getPreviewFontFamily = () => {
    if (settings.footer_font_family === 'site') {
      return siteSettings.content_font_family;
    }
    return settings.footer_font_family;
  };

  // Preview now follows navigation background settings
  const getPreviewBackgroundColor = () => {
    // Footer background now controlled by navigation settings
    return 'rgba(0, 0, 0, 0.8)'; // Default fallback
  };

  return (
    <div className="space-y-6">
      {/* Sticky Save Button Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Footer Instellingen</h1>
          <Button
            onClick={saveSettings}
            disabled={loading}
            style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
            className="text-white hover:opacity-90"
            size="lg"
          >
            {loading ? 'Opslaan...' : 'Footer Instellingen Opslaan'}
          </Button>
        </div>
      </div>
      
      <div className="px-4">
      <Card>
        <CardHeader>
          <CardTitle>Footer Instellingen</CardTitle>
          <CardDescription>
            Beheer de tekst, styling en positie van je footer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Footer Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Footer weergeven</Label>
              <p className="text-sm text-muted-foreground">Toon of verberg de footer</p>
            </div>
            <Switch
              checked={settings.footer_enabled}
              onCheckedChange={(checked) => updateSetting('footer_enabled', checked)}
            />
          </div>

          <Separator />

          {/* Footer Text */}
          <div className="space-y-2">
            <Label>Footer tekst</Label>
            <Textarea
              value={settings.footer_text}
              onChange={(e) => updateSetting('footer_text', e.target.value)}
              placeholder="Voer je footer tekst in..."
              className="min-h-[100px]"
            />
          </div>

          {/* Layout Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Hoogte (px)</Label>
              <Input
                type="number"
                value={settings.footer_height}
                onChange={(e) => updateSetting('footer_height', parseInt(e.target.value) || 80)}
                min="40"
                max="300"
              />
            </div>

            <div className="space-y-2">
              <Label>Tekstuitlijning</Label>
              <Select value={settings.footer_text_align} onValueChange={(value: 'left' | 'center' | 'right') => updateSetting('footer_text_align', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Links</SelectItem>
                  <SelectItem value="center">Midden</SelectItem>
                  <SelectItem value="right">Rechts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Over content</Label>
                <p className="text-xs text-muted-foreground">Footer over slideshow</p>
              </div>
              <Switch
                checked={settings.footer_overlay}
                onCheckedChange={(checked) => updateSetting('footer_overlay', checked)}
              />
            </div>
          </div>

          {/* Typography Settings */}
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <FontSelector
                label="Lettertype"
                value={settings.footer_font_family}
                onFontChange={(fontFamily, fontUrl) => updateSetting('footer_font_family', fontFamily)}
                allowSiteFont={true}
                siteFont={siteSettings.content_font_family}
              />
            </div>

            <div className="space-y-2">
              <Label>Lettergrootte (px)</Label>
              <Input
                type="number"
                value={settings.footer_font_size}
                onChange={(e) => updateSetting('footer_font_size', parseInt(e.target.value) || 14)}
                min="10"
                max="24"
              />
            </div>
          </div>

          {/* Text Color Settings */}
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tekstkleur</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.footer_color}
                  onChange={(e) => updateSetting('footer_color', e.target.value)}
                  className="w-20"
                />
                <Input
                  type="text"
                  value={settings.footer_color}
                  onChange={(e) => updateSetting('footer_color', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Hover transparantie</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.footer_hover_opacity}
                  onChange={(e) => updateSetting('footer_hover_opacity', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground w-12">
                  {Math.round(settings.footer_hover_opacity * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Achtergrond volgt nu de navigatie instellingen
              </p>
            </div>
          </div>

          {/* Preview */}
          <Separator />
          
          <div className="space-y-2">
            <Label>Voorbeeldweergave</Label>
            <div 
              className="border rounded-lg p-4 flex items-center justify-center transition-all duration-300"
              style={{
                height: `${settings.footer_height}px`,
                backgroundColor: getPreviewBackgroundColor(),
                color: settings.footer_color,
                fontFamily: getPreviewFontFamily(),
                fontSize: `${settings.footer_font_size}px`,
                textAlign: settings.footer_text_align,
                backdropFilter: 'none' // Background effects now controlled by navigation
              }}
              onMouseEnter={(e) => {
                // Hover effect now follows navigation settings
                e.currentTarget.style.opacity = settings.footer_hover_opacity.toString();
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              <div className="whitespace-pre-line">
                {settings.footer_text}
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default AdminFooter;