import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getBackendAdapter } from '@/config/backend-config';
import { Shield, Search, Globe, Eye, EyeOff, AlertTriangle, CheckCircle, Save } from 'lucide-react';

interface SEOSettings {
  id?: string;
  // General SEO
  seo_enabled: boolean;
  site_description: string;
  site_keywords: string;
  // Meta Tags
  title_pattern: string;
  default_title: string;
  default_description: string;
  // Open Graph
  og_enabled: boolean;
  og_type: string;
  og_image_url: string;
  og_site_name: string;
  // Twitter Cards
  twitter_enabled: boolean;
  twitter_card_type: string;
  twitter_site: string;
  twitter_creator: string;
  twitter_image_url: string;
  // Anti-Crawling Protection
  crawling_protection_enabled: boolean;
  block_ai_training: boolean;
  custom_robots_txt: string;
  allowed_crawlers: string[];
  blocked_crawlers: string[];
  // Schema.org
  schema_enabled: boolean;
  schema_type: string;
  schema_name: string;
  schema_description: string;
  schema_url: string;
  schema_same_as: string[];
  // Advanced
  canonical_urls_enabled: boolean;
  sitemap_enabled: boolean;
  noindex_when_disabled: boolean;
}

const AdminSEO = () => {
  const [settings, setSettings] = useState<SEOSettings>({
    seo_enabled: true,
    site_description: 'Creatieve portfolio met fotografie, digitale kunst en ontwerpen. Bekijk mijn nieuwste projecten en verhalen.',
    site_keywords: 'portfolio, fotografie, digitale kunst, creatief ontwerp, grafisch design',
    title_pattern: '%page% | %site%',
    default_title: 'Creatieve Portfolio',
    default_description: 'Professioneel creatief portfolio met fotografie, digitale kunst en ontwerpen.',
    og_enabled: true,
    og_type: 'website',
    og_image_url: '/placeholder.svg',
    og_site_name: 'Portfolio',
    twitter_enabled: true,
    twitter_card_type: 'summary_large_image',
    twitter_site: '@portfolio',
    twitter_creator: '@portfolio',
    twitter_image_url: '/placeholder.svg',
    crawling_protection_enabled: false,
    block_ai_training: false,
    custom_robots_txt: '',
    allowed_crawlers: ['googlebot', 'bingbot'],
    blocked_crawlers: ['gptbot', 'google-extended', 'ccbot', 'anthropic-ai', 'claude-web'],
    schema_enabled: true,
    schema_type: 'Person',
    schema_name: 'Portfolio',
    schema_description: 'Creative professional specializing in photography and digital art',
    schema_url: '',
    schema_same_as: [],
    canonical_urls_enabled: true,
    sitemap_enabled: true,
    noindex_when_disabled: true
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/seo');
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (result.data) {
        setSettings({
          ...result.data,
          allowed_crawlers: result.data.allowed_crawlers || ['googlebot', 'bingbot'],
          blocked_crawlers: result.data.blocked_crawlers || ['gptbot', 'google-extended', 'ccbot', 'anthropic-ai', 'claude-web'],
          schema_same_as: result.data.schema_same_as || []
        });
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kan SEO instellingen niet laden"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/seo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Succes",
        description: "SEO instellingen succesvol opgeslagen"
      });

      // Refresh settings to get latest data
      await fetchSettings();
    } catch (error) {
      console.error('Error saving SEO settings:', error);
      toast({
        variant: "destructive",
        title: "Fout",
        description: "Kan SEO instellingen niet opslaan"
      });
    } finally {
      setSaving(false);
    }
  };

  const updateArrayField = (field: 'allowed_crawlers' | 'blocked_crawlers' | 'schema_same_as', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
    setSettings({ ...settings, [field]: items });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-2 text-muted-foreground">SEO instellingen laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 -mx-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield
              className={`w-6 h-6 ${
                settings.seo_enabled
                  ? settings.crawling_protection_enabled
                    ? 'text-yellow-500'
                    : 'text-green-500'
                  : 'text-red-500'
              }`}
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">SEO & Beveiliging</h1>
              <p className="text-muted-foreground">
                Beheer zoekmachine optimalisatie en bescherming tegen crawlers
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
            style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Opslaan...' : 'Instellingen Opslaan'}
          </Button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4 mt-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            settings.seo_enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {settings.seo_enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            SEO: {settings.seo_enabled ? 'Ingeschakeld' : 'Uitgeschakeld'}
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            settings.crawling_protection_enabled ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
          }`}>
            <Shield className="w-4 h-4" />
            Bescherming: {settings.crawling_protection_enabled ? 'Actief' : 'Standaard'}
          </div>

          {settings.block_ai_training && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
              <AlertTriangle className="w-4 h-4" />
              AI Training Geblokkeerd
            </div>
          )}
        </div>
      </div>

      {/* General SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Algemene SEO Instellingen
          </CardTitle>
          <CardDescription>
            Beheer de basis SEO instellingen voor je website
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">SEO Inschakelen</Label>
              <p className="text-sm text-muted-foreground">
                Schakel alle SEO functionaliteit in of uit
              </p>
            </div>
            <Switch
              checked={settings.seo_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, seo_enabled: checked })}
            />
          </div>

          {!settings.seo_enabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">SEO Uitgeschakeld</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Wanneer SEO is uitgeschakeld, wordt automatisch "noindex" toegevoegd aan alle pagina's
                    en worden zoekmachines geblokkeerd via robots.txt.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="site_description">Website Beschrijving</Label>
              <Textarea
                id="site_description"
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                placeholder="Korte beschrijving van je website voor zoekmachines"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_keywords">Zoekwoorden</Label>
              <Input
                id="site_keywords"
                value={settings.site_keywords}
                onChange={(e) => setSettings({ ...settings, site_keywords: e.target.value })}
                placeholder="portfolio, fotografie, digitale kunst, ontwerp"
              />
              <p className="text-xs text-muted-foreground">
                Komma-gescheiden lijst van relevante zoekwoorden
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meta Tags Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Meta Tags Instellingen</CardTitle>
          <CardDescription>
            Configureer hoe pagina titels en beschrijvingen worden gegenereerd
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title_pattern">Titel Patroon</Label>
              <Input
                id="title_pattern"
                value={settings.title_pattern}
                onChange={(e) => setSettings({ ...settings, title_pattern: e.target.value })}
                placeholder="%page% | %site%"
              />
              <p className="text-xs text-muted-foreground">
                Gebruik %page% voor pagina naam en %site% voor website titel
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_title">Standaard Titel</Label>
              <Input
                id="default_title"
                value={settings.default_title}
                onChange={(e) => setSettings({ ...settings, default_title: e.target.value })}
                placeholder="Portfolio"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default_description">Standaard Beschrijving</Label>
            <Textarea
              id="default_description"
              value={settings.default_description}
              onChange={(e) => setSettings({ ...settings, default_description: e.target.value })}
              placeholder="Standaard meta beschrijving voor pagina's zonder specifieke beschrijving"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Anti-Crawling Protection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Anti-Crawling Bescherming
          </CardTitle>
          <CardDescription>
            Bescherm je website tegen ongewenste crawlers en AI training
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Bescherming Inschakelen</Label>
              <p className="text-sm text-muted-foreground">
                Activeert uitgebreide bescherming tegen crawlers
              </p>
            </div>
            <Switch
              checked={settings.crawling_protection_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, crawling_protection_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">AI Training Blokkeren</Label>
              <p className="text-sm text-muted-foreground">
                Blokkeert specifiek AI training bots zoals GPTBot, CCBot, etc.
              </p>
            </div>
            <Switch
              checked={settings.block_ai_training}
              onCheckedChange={(checked) => setSettings({ ...settings, block_ai_training: checked })}
            />
          </div>

          {(settings.crawling_protection_enabled || settings.block_ai_training) && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blocked_crawlers">Geblokkeerde Crawlers</Label>
                <Input
                  id="blocked_crawlers"
                  value={settings.blocked_crawlers.join(', ')}
                  onChange={(e) => updateArrayField('blocked_crawlers', e.target.value)}
                  placeholder="gptbot, google-extended, ccbot, anthropic-ai, claude-web"
                />
                <p className="text-xs text-muted-foreground">
                  Komma-gescheiden lijst van crawler namen die geblokkeerd moeten worden
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowed_crawlers">Toegestane Crawlers</Label>
                <Input
                  id="allowed_crawlers"
                  value={settings.allowed_crawlers.join(', ')}
                  onChange={(e) => updateArrayField('allowed_crawlers', e.target.value)}
                  placeholder="googlebot, bingbot"
                />
                <p className="text-xs text-muted-foreground">
                  Crawlers die altijd toegestaan zijn (alleen bij bescherming actief)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_robots_txt">Custom Robots.txt</Label>
                <Textarea
                  id="custom_robots_txt"
                  value={settings.custom_robots_txt}
                  onChange={(e) => setSettings({ ...settings, custom_robots_txt: e.target.value })}
                  placeholder="Optioneel: schrijf je eigen robots.txt inhoud"
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Laat leeg voor automatische generatie op basis van instellingen
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Media Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Social Media Cards
          </CardTitle>
          <CardDescription>
            Configureer hoe je website wordt weergegeven op social media
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Open Graph */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Open Graph (Facebook, LinkedIn)</h4>
              <Switch
                checked={settings.og_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, og_enabled: checked })}
              />
            </div>

            {settings.og_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                <div className="space-y-2">
                  <Label htmlFor="og_site_name">Site Naam</Label>
                  <Input
                    id="og_site_name"
                    value={settings.og_site_name}
                    onChange={(e) => setSettings({ ...settings, og_site_name: e.target.value })}
                    placeholder="Portfolio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="og_type">Content Type</Label>
                  <Select
                    value={settings.og_type}
                    onValueChange={(value) => setSettings({ ...settings, og_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="article">Article</SelectItem>
                      <SelectItem value="profile">Profile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="og_image_url">Afbeelding URL</Label>
                  <Input
                    id="og_image_url"
                    value={settings.og_image_url}
                    onChange={(e) => setSettings({ ...settings, og_image_url: e.target.value })}
                    placeholder="/placeholder.svg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Twitter Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Twitter Cards</h4>
              <Switch
                checked={settings.twitter_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, twitter_enabled: checked })}
              />
            </div>

            {settings.twitter_enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter_card_type">Card Type</Label>
                  <Select
                    value={settings.twitter_card_type}
                    onValueChange={(value) => setSettings({ ...settings, twitter_card_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_site">Site Handle</Label>
                  <Input
                    id="twitter_site"
                    value={settings.twitter_site}
                    onChange={(e) => setSettings({ ...settings, twitter_site: e.target.value })}
                    placeholder="@portfolio"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_creator">Creator Handle</Label>
                  <Input
                    id="twitter_creator"
                    value={settings.twitter_creator}
                    onChange={(e) => setSettings({ ...settings, twitter_creator: e.target.value })}
                    placeholder="@creator"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_image_url">Afbeelding URL</Label>
                  <Input
                    id="twitter_image_url"
                    value={settings.twitter_image_url}
                    onChange={(e) => setSettings({ ...settings, twitter_image_url: e.target.value })}
                    placeholder="/placeholder.svg"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Schema.org Structured Data */}
      <Card>
        <CardHeader>
          <CardTitle>Schema.org Gestructureerde Data</CardTitle>
          <CardDescription>
            Gestructureerde data helpt zoekmachines je content beter te begrijpen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Schema.org Inschakelen</Label>
              <p className="text-sm text-muted-foreground">
                Voegt gestructureerde data toe voor betere zoekresultaten
              </p>
            </div>
            <Switch
              checked={settings.schema_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, schema_enabled: checked })}
            />
          </div>

          {settings.schema_enabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schema_type">Schema Type</Label>
                <Select
                  value={settings.schema_type}
                  onValueChange={(value) => setSettings({ ...settings, schema_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Person">Person</SelectItem>
                    <SelectItem value="Organization">Organization</SelectItem>
                    <SelectItem value="CreativeWork">CreativeWork</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schema_name">Naam</Label>
                <Input
                  id="schema_name"
                  value={settings.schema_name}
                  onChange={(e) => setSettings({ ...settings, schema_name: e.target.value })}
                  placeholder="Je naam of bedrijfsnaam"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="schema_description">Beschrijving</Label>
                <Textarea
                  id="schema_description"
                  value={settings.schema_description}
                  onChange={(e) => setSettings({ ...settings, schema_description: e.target.value })}
                  placeholder="Korte beschrijving van jezelf of je bedrijf"
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="schema_url">Website URL</Label>
                <Input
                  id="schema_url"
                  value={settings.schema_url}
                  onChange={(e) => setSettings({ ...settings, schema_url: e.target.value })}
                  placeholder="https://jouwdomain.com"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="schema_same_as">Social Media Profielen</Label>
                <Input
                  id="schema_same_as"
                  value={settings.schema_same_as.join(', ')}
                  onChange={(e) => updateArrayField('schema_same_as', e.target.value)}
                  placeholder="https://twitter.com/handle, https://instagram.com/handle"
                />
                <p className="text-xs text-muted-foreground">
                  Komma-gescheiden lijst van social media profiel URL's
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Geavanceerde Instellingen</CardTitle>
          <CardDescription>
            Aanvullende SEO configuratie opties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Canonical URLs</Label>
                <p className="text-sm text-muted-foreground">
                  Voorkomt duplicate content problemen
                </p>
              </div>
              <Switch
                checked={settings.canonical_urls_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, canonical_urls_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base font-medium">Sitemap</Label>
                <p className="text-sm text-muted-foreground">
                  Toont sitemap locatie in robots.txt
                </p>
              </div>
              <Switch
                checked={settings.sitemap_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, sitemap_enabled: checked })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Noindex wanneer SEO uitgeschakeld</Label>
              <p className="text-sm text-muted-foreground">
                Voegt automatisch noindex toe wanneer SEO is uitgeschakeld
              </p>
            </div>
            <Switch
              checked={settings.noindex_when_disabled}
              onCheckedChange={(checked) => setSettings({ ...settings, noindex_when_disabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Current Robots.txt Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Robots.txt Voorbeeld</CardTitle>
          <CardDescription>
            Bekijk hoe je robots.txt er momenteel uitziet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Toegankelijk via: /robots.txt</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/robots.txt', '_blank')}
              >
                Bekijk Live
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-xs">
              {settings.crawling_protection_enabled || !settings.seo_enabled
                ? `# Block all crawlers
User-agent: *
Disallow: /

# Specifically block AI training bots
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

# No sitemap when protection is enabled`
                : `# Allow search engine crawlers
User-agent: *
Allow: /

${settings.block_ai_training ? `# Block AI training bots
User-agent: GPTBot
Disallow: /

User-agent: Google-Extended
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /

` : ''}${settings.sitemap_enabled ? 'Sitemap: /sitemap.xml' : ''}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSEO;