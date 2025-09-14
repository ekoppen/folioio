import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Palette, Camera, Laptop, Heart, Monitor, Smartphone, User, Save, Upload, X } from 'lucide-react';
import { getBackendAdapter } from '@/config/backend-config';
import { useToast } from '@/hooks/use-toast';

interface AboutSettings {
  id: string;
  main_title: string;
  intro_text: string;
  description_text: string;
  skills: string[];
  services: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  stats: Array<{
    number: string;
    label: string;
  }>;
  quotes: Array<{
    text: string;
    author: string;
  }>;
  quote_text?: string;  // Keep for backward compatibility
  quote_author?: string; // Keep for backward compatibility
  profile_photo_url?: string;
}

const iconMap: Record<string, any> = {
  Palette,
  Camera,
  Laptop,
  Monitor,
  Smartphone,
  User,
  Heart
};

const AdminAbout = () => {
  const [settings, setSettings] = useState<AboutSettings>({
    id: '',
    main_title: 'Over Mij',
    intro_text: 'Hallo! Ik ben een gepassioneerde creatieve professional die graag verhalen vertelt door middel van visuele kunst, fotografie en digitaal ontwerp.',
    description_text: 'Mijn werk wordt gedreven door nieuwsgierigheid en de wens om betekenisvolle verbindingen te maken tussen mensen en merken.',
    skills: ['Fotografie', 'Grafisch Ontwerp', 'Web Development'],
    services: [
      {
        icon: 'Palette',
        title: 'Creatief Ontwerp',
        description: 'Van concept tot uitvoering, ik creëer visuele identiteiten die impact maken.'
      }
    ],
    stats: [
      { number: '50+', label: 'Projecten' },
      { number: '25+', label: 'Tevreden Klanten' },
      { number: '5+', label: 'Jaar Ervaring' }
    ],
    quotes: [
      { text: 'Creativiteit is niet wat je ziet, maar wat je anderen laat zien.', author: 'Edgar Degas' }
    ],
    profile_photo_url: undefined
  });
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('about_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Handle backward compatibility: convert old quote format to new quotes array
        let quotes = (data.quotes as AboutSettings['quotes']) || [];
        if (quotes.length === 0 && data.quote_text) {
          quotes = [{ text: data.quote_text, author: data.quote_author || '' }];
        }

        setSettings({
          id: data.id,
          main_title: data.main_title,
          intro_text: data.intro_text,
          description_text: data.description_text,
          skills: (data.skills as string[]) || [],
          services: (data.services as AboutSettings['services']) || [],
          stats: (data.stats as AboutSettings['stats']) || [],
          quotes: quotes,
          profile_photo_url: data.profile_photo_url
        });
      }
    } catch (error) {
      console.error('Error loading about settings:', error);
      toast({
        title: "Fout bij laden",
        description: "Kon de Over Mij instellingen niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      let upsertData = {
        main_title: settings.main_title,
        intro_text: settings.intro_text,
        description_text: settings.description_text,
        skills: settings.skills,
        services: settings.services,
        stats: settings.stats,
        quotes: settings.quotes,
        // Keep backward compatibility: also save first quote as quote_text/quote_author
        quote_text: settings.quotes.length > 0 ? settings.quotes[0].text : '',
        quote_author: settings.quotes.length > 0 ? settings.quotes[0].author : '',
        profile_photo_url: settings.profile_photo_url
      };

      // Only include id if it exists
      if (settings.id) {
        upsertData.id = settings.id;
      }

      const backend = getBackendAdapter();
      const { error } = await backend
        .from('about_settings')
        .upsert(upsertData);

      if (error) throw error;
      
      toast({
        title: "Opgeslagen!",
        description: "Over Mij instellingen zijn succesvol opgeslagen.",
      });
      
      await loadSettings();
    } catch (error) {
      console.error('Error saving about settings:', error);
      toast({
        title: "Fout bij opslaan",
        description: "Kon de instellingen niet opslaan. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  };

  const addSkill = () => {
    setSettings(prev => ({
      ...prev,
      skills: [...prev.skills, 'Nieuwe Skill']
    }));
  };

  const updateSkill = (index: number, value: string) => {
    setSettings(prev => ({
      ...prev,
      skills: prev.skills.map((skill, i) => i === index ? value : skill)
    }));
  };

  const removeSkill = (index: number) => {
    setSettings(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addService = () => {
    setSettings(prev => ({
      ...prev,
      services: [...prev.services, { icon: 'Palette', title: 'Nieuwe Service', description: 'Beschrijving van de service' }]
    }));
  };

  const updateService = (index: number, field: keyof typeof settings.services[0], value: string) => {
    setSettings(prev => ({
      ...prev,
      services: prev.services.map((service, i) => 
        i === index ? { ...service, [field]: value } : service
      )
    }));
  };

  const removeService = (index: number) => {
    setSettings(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ongeldig bestand",
        description: "Selecteer een geldige afbeelding.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Bestand te groot",
        description: "Selecteer een afbeelding kleiner dan 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `profile-photo-${Date.now()}.${fileExt}`;

      // Upload to backend storage
      const backend = getBackendAdapter();
      const { data, error } = await backend.storage
        .from('gallery-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = backend.storage
        .from('gallery-images')
        .getPublicUrl(fileName);

      // Update settings with new photo URL
      setSettings(prev => ({
        ...prev,
        profile_photo_url: publicUrl
      }));

      toast({
        title: "Foto geüpload!",
        description: "Je profielfoto is succesvol geüpload.",
      });

    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload fout",
        description: "Kon de foto niet uploaden. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = () => {
    setSettings(prev => ({
      ...prev,
      profile_photo_url: undefined
    }));
  };

  const addStat = () => {
    setSettings(prev => ({
      ...prev,
      stats: [...prev.stats, { number: '0', label: 'Nieuw Item' }]
    }));
  };

  const updateStat = (index: number, field: 'number' | 'label', value: string) => {
    setSettings(prev => ({
      ...prev,
      stats: prev.stats.map((stat, i) =>
        i === index ? { ...stat, [field]: value } : stat
      )
    }));
  };

  const removeStat = (index: number) => {
    setSettings(prev => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index)
    }));
  };

  const addQuote = () => {
    setSettings(prev => ({
      ...prev,
      quotes: [...prev.quotes, { text: 'Nieuwe quote...', author: 'Auteur' }]
    }));
  };

  const updateQuote = (index: number, field: 'text' | 'author', value: string) => {
    setSettings(prev => ({
      ...prev,
      quotes: prev.quotes.map((quote, i) =>
        i === index ? { ...quote, [field]: value } : quote
      )
    }));
  };

  const removeQuote = (index: number) => {
    setSettings(prev => ({
      ...prev,
      quotes: prev.quotes.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Instellingen laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 -mx-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Over Mij</h2>
            <p className="text-muted-foreground">
              Bewerk de inhoud van je Over Mij sectie
            </p>
          </div>
          <Button 
            onClick={saveSettings} 
            className="flex items-center gap-2" 
            style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
          >
            <Save className="w-4 h-4" />
            Opslaan
          </Button>
        </div>
      </div>


      <div className="grid gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basis Informatie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Photo */}
            <div>
              <label className="text-sm font-medium mb-2 block">Profielfoto</label>
              <div className="flex items-start gap-4">
                {settings.profile_photo_url ? (
                  <div className="relative">
                    <img
                      src={settings.profile_photo_url}
                      alt="Profielfoto"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      onClick={removePhoto}
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <label htmlFor="photo-upload">
                    <Button
                      asChild
                      variant="outline"
                      disabled={uploading}
                      className="cursor-pointer"
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploaden...' : settings.profile_photo_url ? 'Wijzig foto' : 'Upload foto'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Aanbevolen: vierkante foto, max 5MB (JPG, PNG, WebP)
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Hoofdtitel</label>
              <Input
                value={settings.main_title}
                onChange={(e) => setSettings(prev => ({ ...prev, main_title: e.target.value }))}
                placeholder="Over Mij"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Intro Tekst</label>
              <Textarea
                value={settings.intro_text}
                onChange={(e) => setSettings(prev => ({ ...prev, intro_text: e.target.value }))}
                rows={4}
                placeholder="Vertel kort over jezelf..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Beschrijving</label>
              <Textarea
                value={settings.description_text}
                onChange={(e) => setSettings(prev => ({ ...prev, description_text: e.target.value }))}
                rows={4}
                placeholder="Uitgebreidere beschrijving..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Skills & Expertise</CardTitle>
              <Button onClick={addSkill} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Voeg Skill Toe
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settings.skills.map((skill, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={skill}
                    onChange={(e) => updateSkill(index, e.target.value)}
                    className="flex-1"
                    placeholder="Skill naam"
                  />
                  <Button
                    onClick={() => removeSkill(index)}
                    size="sm"
                    variant="outline"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {settings.skills.length === 0 && (
                <p className="text-muted-foreground text-sm">Nog geen skills toegevoegd.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Services</CardTitle>
              <Button onClick={addService} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Voeg Service Toe
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.services.map((service, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Select
                        value={service.icon}
                        onValueChange={(value) => updateService(index, 'icon', value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Palette">🎨 Palette</SelectItem>
                          <SelectItem value="Camera">📷 Camera</SelectItem>
                          <SelectItem value="Laptop">💻 Laptop</SelectItem>
                          <SelectItem value="Monitor">🖥️ Monitor</SelectItem>
                          <SelectItem value="Smartphone">📱 Smartphone</SelectItem>
                          <SelectItem value="User">👤 User</SelectItem>
                          <SelectItem value="Heart">❤️ Heart</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        value={service.title}
                        onChange={(e) => updateService(index, 'title', e.target.value)}
                        placeholder="Service Titel"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => removeService(index)}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={service.description}
                      onChange={(e) => updateService(index, 'description', e.target.value)}
                      placeholder="Service Beschrijving"
                      rows={2}
                    />
                  </div>
                </Card>
              ))}
              {settings.services.length === 0 && (
                <p className="text-muted-foreground text-sm">Nog geen services toegevoegd.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Statistieken</CardTitle>
              <Button onClick={addStat} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Voeg Statistiek Toe
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.stats.map((stat, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Statistiek {index + 1}</label>
                      <Button
                        onClick={() => removeStat(index)}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={stat.number}
                        onChange={(e) => updateStat(index, 'number', e.target.value)}
                        placeholder="50+"
                      />
                      <Input
                        value={stat.label}
                        onChange={(e) => updateStat(index, 'label', e.target.value)}
                        placeholder="Projecten"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              {settings.stats.length === 0 && (
                <p className="text-muted-foreground text-sm">Nog geen statistieken toegevoegd.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quotes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Inspiratie Quotes</CardTitle>
              <Button onClick={addQuote} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Voeg Quote Toe
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {settings.quotes.map((quote, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Quote {index + 1}</label>
                      <Button
                        onClick={() => removeQuote(index)}
                        size="sm"
                        variant="outline"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={quote.text}
                      onChange={(e) => updateQuote(index, 'text', e.target.value)}
                      placeholder="Inspirerende quote..."
                      rows={3}
                    />
                    <Input
                      value={quote.author}
                      onChange={(e) => updateQuote(index, 'author', e.target.value)}
                      placeholder="Naam van de auteur"
                    />
                  </div>
                </Card>
              ))}
              {settings.quotes.length === 0 && (
                <p className="text-muted-foreground text-sm">Nog geen quotes toegevoegd.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAbout;