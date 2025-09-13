import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getBackendAdapter } from '@/config/backend-config';
import { Upload, Type, Palette, Save } from 'lucide-react';
import { FontSelector } from './FontSelector';

interface SiteSettings {
  id?: string;
  site_title: string;
  site_tagline: string;
  logo_url?: string;
  logo_height?: number;
  logo_position?: 'left' | 'center' | 'right';
  logo_margin_top?: number;
  logo_margin_left?: number;
  logo_shadow?: boolean;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  title_font_family?: string;
  title_font_url?: string;
  content_font_family?: string;
  content_font_url?: string;
  custom_font_family?: string;
  custom_font_url?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_linkedin?: string;
  // Header/Navigation settings
  show_site_title?: boolean;
  header_transparent?: boolean;
  header_blur?: boolean;
  header_background_opacity?: number;
  nav_title_visible?: boolean;
  nav_tagline_visible?: boolean;
  nav_title_font_family?: string;
  nav_title_font_url?: string;
  nav_tagline_font_family?: string;
  nav_tagline_font_url?: string;
  nav_title_font_size?: number;
  nav_tagline_font_size?: number;
  nav_title_color?: string;
  nav_tagline_color?: string;
  nav_title_margin_top?: number;
  nav_title_margin_left?: number;
  nav_tagline_margin_top?: number;
  nav_tagline_margin_left?: number;
  nav_text_shadow?: boolean;
  // Footer settings
  footer_enabled?: boolean;
  // Home settings
  home_show_title_overlay?: boolean;
  home_show_buttons?: boolean;
  // Title styling
  title_visible?: boolean;
  title_font_family?: string;
  title_font_size?: number;
  title_color?: string;
  title_position?: 'left' | 'center' | 'right';
  // Tagline styling
  tagline_visible?: boolean;
  tagline_font_family?: string;
  tagline_font_size?: number;
  tagline_color?: string;
  tagline_position?: 'left' | 'center' | 'right';
  // Portfolio settings
  portfolio_title?: string;
  portfolio_description?: string;
  portfolio_enabled?: boolean;
  // Slideshow settings
  slideshow_interval?: number;
  slideshow_transition?: string;
  slideshow_info_card_enabled?: boolean;
  slideshow_info_card_radius?: number;
  slideshow_info_card_opacity?: number;
  slideshow_info_card_position?: string;
  slideshow_info_card_text_size?: number;
  slideshow_show_arrows?: boolean;
  slideshow_show_dots?: boolean;
}

export const AdminSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: '',
    site_tagline: '',
    logo_height: 32,
    logo_position: 'left',
    logo_margin_top: 0,
    logo_margin_left: 0,
    logo_shadow: false,
    primary_color: '#2D3748',
    secondary_color: '#F7FAFC',
    accent_color: '#F6D55C',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    social_instagram: '',
    social_facebook: '',
    social_linkedin: '',
    // Header/Navigation defaults
    show_site_title: true,
    header_transparent: true,
    header_blur: true,
    header_background_opacity: 0.8,
    nav_title_visible: false,
    nav_tagline_visible: false,
    nav_title_font_family: 'Playfair Display',
    nav_tagline_font_family: 'Roboto',
    nav_title_font_size: 24,
    nav_tagline_font_size: 14,
    nav_title_color: '#ffffff',
    nav_tagline_color: '#ffffff',
    nav_title_margin_top: 0,
    nav_title_margin_left: 0,
    nav_tagline_margin_top: 0,
    nav_tagline_margin_left: 0,
    nav_text_shadow: false,
    // Footer defaults
    footer_enabled: true,
    // Home defaults
    home_show_title_overlay: true,
    home_show_buttons: true,
    // Title defaults
    title_visible: true,
    title_font_family: 'Playfair Display',
    title_font_size: 56,
    title_color: '#ffffff',
    title_position: 'center',
    // Tagline defaults
    tagline_visible: true,
    tagline_font_family: 'Roboto',
    tagline_font_size: 20,
    tagline_color: '#ffffff',
    tagline_position: 'center',
    // Portfolio defaults
    portfolio_title: 'Mijn Portfolio',
    portfolio_description: 'Ontdek verschillende projecten en albums die mijn creatieve reis weerspiegelen.',
    portfolio_enabled: true,
    // Slideshow defaults
    slideshow_interval: 6000, // 6 seconds in milliseconds
    slideshow_transition: 'fade',
    slideshow_info_card_enabled: true,
    slideshow_info_card_radius: 8,
    slideshow_info_card_opacity: 0.8,
    slideshow_info_card_position: 'bottom-left',
    slideshow_info_card_text_size: 14,
    slideshow_show_arrows: true,
    slideshow_show_dots: true
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFont, setUploadingFont] = useState<'title' | 'content' | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('site_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      
      if (data) {
        setSettings({
          ...data,
          logo_position: (data.logo_position as 'left' | 'center' | 'right') ?? 'left',
          logo_height: data.logo_height ?? 32,
          logo_margin_top: data.logo_margin_top ?? 0,
          logo_margin_left: data.logo_margin_left ?? 0,
          logo_shadow: data.logo_shadow ?? false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load settings"
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const backend = getBackendAdapter();
      
      // Get the current database settings first to compare
      const { data: currentData } = await backend
        .from('site_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!currentData) {
        throw new Error('No settings found to update');
      }

      // Filter settings to only include columns that exist in the database
      const validColumns = [
        'id', 'site_title', 'site_tagline', 'logo_url', 'primary_color', 'secondary_color', 'accent_color',
        'custom_font_family', 'custom_font_url', 'contact_email', 'contact_phone', 'contact_address',
        'social_instagram', 'social_facebook', 'social_linkedin', 'title_font_family', 'title_font_url',
        'content_font_family', 'content_font_url', 'slideshow_show_arrows', 'slideshow_show_dots',
        'slideshow_interval', 'slideshow_transition', 'slideshow_info_card_enabled', 'slideshow_info_card_position',
        'slideshow_info_card_opacity', 'slideshow_info_card_radius', 'slideshow_info_card_text_size',
        'home_show_buttons', 'home_show_title_overlay', 'portfolio_enabled', 'portfolio_title', 'portfolio_description',
        'logo_position', 'logo_height', 'logo_margin_top', 'logo_margin_left', 'logo_shadow',
        'header_transparent', 'header_blur', 'header_background_opacity', 'show_site_title', 'footer_enabled',
        'footer_height', 'footer_text', 'footer_color', 'footer_background_color', 'footer_font_family',
        'footer_font_size', 'footer_text_align', 'footer_opacity', 'footer_blur', 'footer_hover_opacity',
        'footer_overlay', 'openai_api_key', 'default_language', 'nav_title_visible', 'nav_title_font_family',
        'nav_title_font_url', 'nav_title_font_size', 'nav_title_color', 'nav_title_margin_top', 'nav_title_margin_left',
        'nav_tagline_visible', 'nav_tagline_font_family', 'nav_tagline_font_url', 'nav_tagline_font_size',
        'nav_tagline_color', 'nav_tagline_margin_top', 'nav_tagline_margin_left', 'nav_text_shadow',
        'show_logo', 'nav_logo_visible', 'header_background_color', 'title_visible', 'tagline_visible',
        'title_font_size', 'title_color', 'title_position', 'tagline_font_size', 'tagline_color', 'tagline_position'
      ];
      
      // Only include fields that have actually changed and exist in the database
      const changedFields: any = { id: currentData.id };
      
      for (const [key, value] of Object.entries(settings)) {
        if (validColumns.includes(key) && key !== 'id') {
          // Only include if the value has actually changed from what's in the database
          if (currentData[key] !== value) {
            changedFields[key] = value;
          }
        }
      }
      
      // Only update if there are actually changes
      if (Object.keys(changedFields).length === 1) {
        toast({
          title: "Info",
          description: "No changes to save"
        });
        return;
      }
      
      const { data, error } = await backend
        .from('site_settings')
        .upsert(changedFields, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;

      // Update our state with the fresh database data
      setSettings({
        ...data,
        logo_position: (data.logo_position as 'left' | 'center' | 'right') ?? 'left',
        logo_height: data.logo_height ?? 32,
        logo_margin_top: data.logo_margin_top ?? 0,
        logo_margin_left: data.logo_margin_left ?? 0,
        logo_shadow: data.logo_shadow ?? false
      });
      
      toast({
        title: "Success",
        description: `Settings saved successfully (${Object.keys(changedFields).length - 1} changes)`
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const backend = getBackendAdapter();
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await backend.storage
        .from('logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = backend.storage
        .from('logos')
        .getPublicUrl(fileName);

      setSettings({ ...settings, logo_url: publicUrl });
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload logo"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFontUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'title' | 'content') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFont(type);
    try {
      const backend = getBackendAdapter();
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-font-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await backend.storage
        .from('custom-fonts')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = backend.storage
        .from('custom-fonts')
        .getPublicUrl(fileName);

      setSettings({ 
        ...settings, 
        [`${type}_font_url`]: publicUrl,
        [`${type}_font_family`]: file.name.split('.')[0]
      });
      
      toast({
        title: "Success",
        description: `${type === 'title' ? 'Titel' : 'Inhoud'} font geüpload. Klik 'Instellingen Opslaan' om de font beschikbaar te maken in de dropdown.`
      });
    } catch (error) {
      console.error('Error uploading font:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload font"
      });
    } finally {
      setUploadingFont(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header with Save button */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 -mx-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instellingen</h1>
            <p className="text-muted-foreground">
              Configureer je website instellingen
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="flex items-center gap-2" 
            style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
          >
            <Save className="w-4 h-4" />
            {loading ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Website Branding
          </CardTitle>
          <CardDescription>
            Configureer je website's visuele identiteit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_title">Website Titel</Label>
              <Input
                id="site_title"
                value={settings.site_title}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                placeholder="Mijn Portfolio"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_tagline">Tagline</Label>
              <Input
                id="site_tagline"
                value={settings.site_tagline}
                onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })}
                placeholder="Momenten vastleggen, herinneringen creëren"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <div className="flex items-center gap-4">
              {settings.logo_url && (
                <img 
                  src={settings.logo_url} 
                  alt="Logo" 
                  className="w-16 h-16 object-contain bg-white rounded p-2 border"
                />
              )}
              <Button
                style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
                disabled={uploading}
                onClick={() => document.getElementById('logo-upload')?.click()}
                className="text-white hover:opacity-90"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploaden...' : 'Logo Uploaden'}
              </Button>
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
            {settings.logo_url && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="logo_height">Logo Hoogte (pixels)</Label>
                  <Input
                    id="logo_height"
                    type="number"
                    min="16"
                    max="100"
                    value={settings.logo_height || 32}
                    onChange={(e) => setSettings({ ...settings, logo_height: parseInt(e.target.value) })}
                    placeholder="32"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_position">Logo Positie</Label>
                  <Select 
                    value={settings.logo_position || 'left'} 
                    onValueChange={(value: 'left' | 'center' | 'right') => setSettings({ ...settings, logo_position: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kies positie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Links</SelectItem>
                      <SelectItem value="center">Centraal</SelectItem>
                      <SelectItem value="right">Rechts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_margin_top">Marge Boven (pixels)</Label>
                  <Input
                    id="logo_margin_top"
                    type="number"
                    min="-50"
                    max="50"
                    value={settings.logo_margin_top || 0}
                    onChange={(e) => setSettings({ ...settings, logo_margin_top: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo_margin_left">Marge Links (pixels)</Label>
                  <Input
                    id="logo_margin_left"
                    type="number"
                    min="-50"
                    max="50"
                    value={settings.logo_margin_left || 0}
                    onChange={(e) => setSettings({ ...settings, logo_margin_left: parseInt(e.target.value) })}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
            {settings.logo_url && (
              <div className="flex items-center space-x-2 mt-2">
                <input
                  id="logo_shadow"
                  type="checkbox"
                  checked={settings.logo_shadow || false}
                  onChange={(e) => setSettings({ ...settings, logo_shadow: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="logo_shadow">Drop Shadow Toevoegen</Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Typografie Instellingen
          </CardTitle>
          <CardDescription>
            Kies of upload fonts voor titels en inhoud
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title Font Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Titel Font</h4>
              <FontSelector
                key={`title-${settings.title_font_family}-${settings.title_font_url}`}
                label="Font voor titels"
                value={settings.title_font_family}
                onFontChange={(fontFamily, fontUrl) => 
                  setSettings({ 
                    ...settings, 
                    title_font_family: fontFamily, 
                    title_font_url: fontUrl || '' 
                  })
                }
                placeholder="Kies een font voor titels"
              />
              
              <div className="text-center text-sm text-muted-foreground">of</div>
              
              <div className="space-y-2">
                <Label>Custom Font Uploaden</Label>
                <Button
                  style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
                  disabled={uploadingFont === 'title'}
                  onClick={() => document.getElementById('title-font-upload')?.click()}
                  className="w-full text-white hover:opacity-90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFont === 'title' ? 'Uploaden...' : 'Titel Font Uploaden'}
                </Button>
                <input
                  id="title-font-upload"
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf"
                  onChange={(e) => handleFontUpload(e, 'title')}
                  className="hidden"
                />
                {settings.title_font_url && (
                  <p className="text-xs text-muted-foreground">
                    Custom font: {settings.title_font_family}
                  </p>
                )}
              </div>
            </div>

            {/* Content Font Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Inhoud Font</h4>
              <FontSelector
                key={`content-${settings.content_font_family}-${settings.content_font_url}`}
                label="Font voor inhoud"
                value={settings.content_font_family}
                onFontChange={(fontFamily, fontUrl) => 
                  setSettings({ 
                    ...settings, 
                    content_font_family: fontFamily, 
                    content_font_url: fontUrl || '' 
                  })
                }
                placeholder="Kies een font voor inhoud"
              />
              
              <div className="text-center text-sm text-muted-foreground">of</div>
              
              <div className="space-y-2">
                <Label>Custom Font Uploaden</Label>
                <Button
                  style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
                  disabled={uploadingFont === 'content'}
                  onClick={() => document.getElementById('content-font-upload')?.click()}
                  className="w-full text-white hover:opacity-90"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadingFont === 'content' ? 'Uploaden...' : 'Inhoud Font Uploaden'}
                </Button>
                <input
                  id="content-font-upload"
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf"
                  onChange={(e) => handleFontUpload(e, 'content')}
                  className="hidden"
                />
                {settings.content_font_url && (
                  <p className="text-xs text-muted-foreground">
                    Custom font: {settings.content_font_family}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kleurenschema</CardTitle>
          <CardDescription>
            Pas je website's kleurenpalet aan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary_color">Primaire Kleur</Label>
              <div className="flex gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  placeholder="#2D3748"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color">Secundaire Kleur</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary_color"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  placeholder="#F7FAFC"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent_color">Accent Kleur</Label>
              <div className="flex gap-2">
                <Input
                  id="accent_color"
                  type="color"
                  value={settings.accent_color}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  className="w-16 h-10"
                />
                <Input
                  value={settings.accent_color}
                  onChange={(e) => setSettings({ ...settings, accent_color: e.target.value })}
                  placeholder="#F6D55C"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contactinformatie</CardTitle>
          <CardDescription>
            Werk je contactgegevens bij
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={settings.contact_email || ''}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                placeholder="hallo@portfolio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Telefoon</Label>
              <Input
                id="contact_phone"
                value={settings.contact_phone || ''}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                placeholder="+31 6 1234 5678"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_address">Adres</Label>
            <Textarea
              id="contact_address"
              value={settings.contact_address || ''}
              onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
              placeholder="Straatnaam 123, 1234 AB Stad"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Home Pagina Instellingen</CardTitle>
          <CardDescription>
            Configureer hoe de home pagina wordt weergegeven
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titel overlay weergeven</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="home_show_title_overlay"
                  checked={settings.home_show_title_overlay ?? true}
                  onChange={(e) => setSettings({ ...settings, home_show_title_overlay: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="home_show_title_overlay">Toon titel en tagline over slideshow</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Knoppen weergeven</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="home_show_buttons"
                  checked={settings.home_show_buttons ?? true}
                  onChange={(e) => setSettings({ ...settings, home_show_buttons: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="home_show_buttons">Toon 'Bekijk Portfolio' en 'Meer Over Mij' knoppen</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Sectie Instellingen</CardTitle>
          <CardDescription>
            Configureer de portfolio sectie op de home pagina
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Portfolio sectie weergeven</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="portfolio_enabled"
                checked={settings.portfolio_enabled ?? true}
                onChange={(e) => setSettings({ ...settings, portfolio_enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="portfolio_enabled">Toon portfolio albums op home pagina</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio_title">Portfolio Titel</Label>
              <Input
                id="portfolio_title"
                value={settings.portfolio_title || ''}
                onChange={(e) => setSettings({ ...settings, portfolio_title: e.target.value })}
                placeholder="Mijn Portfolio"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="portfolio_description">Portfolio Beschrijving</Label>
            <Textarea
              id="portfolio_description"
              value={settings.portfolio_description || ''}
              onChange={(e) => setSettings({ ...settings, portfolio_description: e.target.value })}
              placeholder="Ontdek verschillende projecten en albums die mijn creatieve reis weerspiegelen."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Hero Title & Tagline Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Titel & Tagline Instellingen</CardTitle>
          <CardDescription>
            Configureer de titel en tagline styling in de Hero sectie
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b pb-2">Titel Instellingen</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="title_visible"
                checked={settings.title_visible ?? true}
                onChange={(e) => setSettings({ ...settings, title_visible: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="title_visible">Titel weergeven</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FontSelector
                  label="Titel Font"
                  value={settings.title_font_family || 'Playfair Display'}
                  onFontChange={(fontFamily, fontUrl) => {
                    setSettings({ 
                      ...settings, 
                      title_font_family: fontFamily
                    });
                  }}
                  placeholder="Selecteer een font voor de titel"
                  allowSiteFont={true}
                  siteFont={settings.content_font_family || 'Roboto'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title_font_size">Titel Grootte (px)</Label>
                <Input
                  id="title_font_size"
                  type="number"
                  min="12"
                  max="120"
                  value={settings.title_font_size || 56}
                  onChange={(e) => setSettings({ ...settings, title_font_size: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title_color">Titel Kleur</Label>
                <Input
                  id="title_color"
                  type="color"
                  value={settings.title_color || '#ffffff'}
                  onChange={(e) => setSettings({ ...settings, title_color: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Titel Positie</Label>
                <Select 
                  value={settings.title_position || 'center'} 
                  onValueChange={(value) => setSettings({ ...settings, title_position: value as 'left' | 'center' | 'right' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer positie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Links</SelectItem>
                    <SelectItem value="center">Midden</SelectItem>
                    <SelectItem value="right">Rechts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tagline Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b pb-2">Tagline Instellingen</h4>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="tagline_visible"
                checked={settings.tagline_visible ?? true}
                onChange={(e) => setSettings({ ...settings, tagline_visible: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="tagline_visible">Tagline weergeven</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FontSelector
                  label="Tagline Font"
                  value={settings.tagline_font_family || 'Roboto'}
                  onFontChange={(fontFamily, fontUrl) => {
                    setSettings({ 
                      ...settings, 
                      tagline_font_family: fontFamily
                    });
                  }}
                  placeholder="Selecteer een font voor de tagline"
                  allowSiteFont={true}
                  siteFont={settings.content_font_family || 'Roboto'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline_font_size">Tagline Grootte (px)</Label>
                <Input
                  id="tagline_font_size"
                  type="number"
                  min="12"
                  max="48"
                  value={settings.tagline_font_size || 20}
                  onChange={(e) => setSettings({ ...settings, tagline_font_size: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tagline_color">Tagline Kleur</Label>
                <Input
                  id="tagline_color"
                  type="color"
                  value={settings.tagline_color || '#ffffff'}
                  onChange={(e) => setSettings({ ...settings, tagline_color: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tagline Positie</Label>
                <Select 
                  value={settings.tagline_position || 'center'} 
                  onValueChange={(value) => setSettings({ ...settings, tagline_position: value as 'left' | 'center' | 'right' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer positie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Links</SelectItem>
                    <SelectItem value="center">Midden</SelectItem>
                    <SelectItem value="right">Rechts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Navigatiebalk Instellingen</CardTitle>
          <CardDescription>
            Configureer de navigatiebalk, logo, titel en tagline weergave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Visibility Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b pb-2">Weergave Instellingen</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show_site_title"
                  checked={settings.show_site_title ?? true}
                  onChange={(e) => setSettings({ ...settings, show_site_title: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="show_site_title">Logo weergeven</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nav_title_visible"
                  checked={settings.nav_title_visible ?? false}
                  onChange={(e) => setSettings({ ...settings, nav_title_visible: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="nav_title_visible">Titel weergeven</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nav_tagline_visible"
                  checked={settings.nav_tagline_visible ?? false}
                  onChange={(e) => setSettings({ ...settings, nav_tagline_visible: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="nav_tagline_visible">Tagline weergeven</Label>
              </div>
            </div>
          </div>

          {/* Title Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b pb-2">Navigatie Titel</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FontSelector
                  label="Titel Font"
                  value={settings.nav_title_font_family || 'Playfair Display'}
                  onFontChange={(fontFamily, fontUrl) => {
                    setSettings({ 
                      ...settings, 
                      nav_title_font_family: fontFamily,
                      nav_title_font_url: fontUrl
                    });
                  }}
                  placeholder="Kies een font voor de titel"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nav_title_font_size">Titel Grootte (px)</Label>
                <Input
                  id="nav_title_font_size"
                  type="number"
                  min="12"
                  max="48"
                  value={settings.nav_title_font_size || 24}
                  onChange={(e) => setSettings({ ...settings, nav_title_font_size: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nav_title_color">Titel Kleur</Label>
                <Input
                  id="nav_title_color"
                  type="color"
                  value={settings.nav_title_color || '#ffffff'}
                  onChange={(e) => setSettings({ ...settings, nav_title_color: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nav_title_margin_top">Titel Marge Boven (px)</Label>
                <Input
                  id="nav_title_margin_top"
                  type="number"
                  min="-50"
                  max="50"
                  value={settings.nav_title_margin_top || 0}
                  onChange={(e) => setSettings({ ...settings, nav_title_margin_top: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nav_title_margin_left">Titel Marge Links (px)</Label>
              <Input
                id="nav_title_margin_left"
                type="number"
                min="-100"
                max="100"
                value={settings.nav_title_margin_left || 0}
                onChange={(e) => setSettings({ ...settings, nav_title_margin_left: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Tagline Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b pb-2">Navigatie Tagline</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <FontSelector
                  label="Tagline Font"
                  value={settings.nav_tagline_font_family || 'Roboto'}
                  onFontChange={(fontFamily, fontUrl) => {
                    setSettings({ 
                      ...settings, 
                      nav_tagline_font_family: fontFamily,
                      nav_tagline_font_url: fontUrl
                    });
                  }}
                  placeholder="Kies een font voor de tagline"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nav_tagline_font_size">Tagline Grootte (px)</Label>
                <Input
                  id="nav_tagline_font_size"
                  type="number"
                  min="10"
                  max="24"
                  value={settings.nav_tagline_font_size || 14}
                  onChange={(e) => setSettings({ ...settings, nav_tagline_font_size: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nav_tagline_color">Tagline Kleur</Label>
                <Input
                  id="nav_tagline_color"
                  type="color"
                  value={settings.nav_tagline_color || '#ffffff'}
                  onChange={(e) => setSettings({ ...settings, nav_tagline_color: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nav_tagline_margin_top">Tagline Marge Boven (px)</Label>
                <Input
                  id="nav_tagline_margin_top"
                  type="number"
                  min="-50"
                  max="50"
                  value={settings.nav_tagline_margin_top || 0}
                  onChange={(e) => setSettings({ ...settings, nav_tagline_margin_top: parseInt(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nav_tagline_margin_left">Tagline Marge Links (px)</Label>
              <Input
                id="nav_tagline_margin_left"
                type="number"
                min="-100"
                max="100"
                value={settings.nav_tagline_margin_left || 0}
                onChange={(e) => setSettings({ ...settings, nav_tagline_margin_left: parseInt(e.target.value) })}
              />
            </div>
          </div>

          {/* Style Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground border-b pb-2">Styling & Effecten</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nav_text_shadow"
                  checked={settings.nav_text_shadow ?? false}
                  onChange={(e) => setSettings({ ...settings, nav_text_shadow: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="nav_text_shadow">Tekst schaduw</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="header_transparent"
                  checked={settings.header_transparent ?? true}
                  onChange={(e) => setSettings({ ...settings, header_transparent: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="header_transparent">Transparante achtergrond</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="header_blur"
                  checked={settings.header_blur ?? true}
                  onChange={(e) => setSettings({ ...settings, header_blur: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="header_blur">Blur effect</Label>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="header_opacity">Achtergrond ondoorzichtigheid</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  id="header_opacity"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.header_background_opacity ?? 0.8}
                  onChange={(e) => setSettings({ ...settings, header_background_opacity: parseFloat(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground min-w-[3rem]">
                  {Math.round((settings.header_background_opacity ?? 0.8) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Instellingen</CardTitle>
          <CardDescription>
            Configureer de footer weergave en functionaliteit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Footer weergave</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="footer_enabled"
                checked={settings.footer_enabled ?? true}
                onChange={(e) => setSettings({ ...settings, footer_enabled: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="footer_enabled">Footer weergeven op alle pagina's</Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Gebruik de 'Footer' tab om de footer inhoud aan te passen
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Media</CardTitle>
          <CardDescription>
            Voeg je social media links toe
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="social_instagram">Instagram</Label>
              <Input
                id="social_instagram"
                value={settings.social_instagram || ''}
                onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                placeholder="https://instagram.com/gebruikersnaam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_facebook">Facebook</Label>
              <Input
                id="social_facebook"
                value={settings.social_facebook || ''}
                onChange={(e) => setSettings({ ...settings, social_facebook: e.target.value })}
                placeholder="https://facebook.com/gebruikersnaam"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="social_linkedin">LinkedIn</Label>
              <Input
                id="social_linkedin"
                value={settings.social_linkedin || ''}
                onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/gebruikersnaam"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Slideshow Instellingen</CardTitle>
          <CardDescription>
            Configureer slideshow gedrag en weergave
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="slideshow_interval">Interval (seconden)</Label>
              <Input
                id="slideshow_interval"
                type="number"
                min="1"
                max="30"
                step="1"
                value={Math.round((settings.slideshow_interval || 6000) / 1000)}
                onChange={(e) => setSettings({...settings, slideshow_interval: parseInt(e.target.value) * 1000})}
              />
            </div>
            <div>
              <Label htmlFor="slideshow_transition">Transitie Effect</Label>
              <Select value={settings.slideshow_transition || 'fade'} onValueChange={(value) => setSettings({...settings, slideshow_transition: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fade">Fade</SelectItem>
                  <SelectItem value="slide">Slide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Info Kaart</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  id="slideshow_info_card_enabled"
                  type="checkbox"
                  checked={settings.slideshow_info_card_enabled !== false}
                  onChange={(e) => setSettings({...settings, slideshow_info_card_enabled: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="slideshow_info_card_enabled">Info kaart tonen</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="slideshow_info_card_position">Positie</Label>
                  <Select value={settings.slideshow_info_card_position || 'bottom-left'} onValueChange={(value) => setSettings({...settings, slideshow_info_card_position: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-left">Links onderin</SelectItem>
                      <SelectItem value="bottom-right">Rechts onderin</SelectItem>
                      <SelectItem value="top-left">Links bovenin</SelectItem>
                      <SelectItem value="top-right">Rechts bovenin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="slideshow_info_card_radius">Border Radius (px)</Label>
                  <Input
                    id="slideshow_info_card_radius"
                    type="number"
                    min="0"
                    max="20"
                    value={settings.slideshow_info_card_radius || 8}
                    onChange={(e) => setSettings({...settings, slideshow_info_card_radius: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="slideshow_info_card_opacity">Transparantie</Label>
                  <Input
                    id="slideshow_info_card_opacity"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.slideshow_info_card_opacity || 0.8}
                    onChange={(e) => setSettings({...settings, slideshow_info_card_opacity: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="slideshow_info_card_text_size">Tekstgrootte (px)</Label>
                  <Input
                    id="slideshow_info_card_text_size"
                    type="number"
                    min="10"
                    max="24"
                    value={settings.slideshow_info_card_text_size || 14}
                    onChange={(e) => setSettings({...settings, slideshow_info_card_text_size: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-4">Navigatie</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  id="slideshow_show_arrows"
                  type="checkbox"
                  checked={settings.slideshow_show_arrows !== false}
                  onChange={(e) => setSettings({...settings, slideshow_show_arrows: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="slideshow_show_arrows">Pijlen tonen</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  id="slideshow_show_dots"
                  type="checkbox"
                  checked={settings.slideshow_show_dots !== false}
                  onChange={(e) => setSettings({...settings, slideshow_show_dots: e.target.checked})}
                  className="rounded"
                />
                <Label htmlFor="slideshow_show_dots">Punten tonen</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};