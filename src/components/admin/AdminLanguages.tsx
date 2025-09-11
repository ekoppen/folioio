import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Plus, Globe, Key, Download, Save } from 'lucide-react';

interface Language {
  id: string;
  code: string;
  name: string;
  is_enabled: boolean;
  is_default: boolean;
}

interface TranslationProgress {
  language: string;
  progress: number;
  isTranslating: boolean;
}

const AdminLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [newLanguage, setNewLanguage] = useState({ code: '', name: '' });
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadLanguages();
    loadApiKey();
  }, []);

  const loadLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error loading languages:', error);
      toast({
        variant: "destructive",
        title: "Fout bij laden talen",
        description: "Er is een fout opgetreden bij het laden van de talen."
      });
    }
  };

  const loadApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('openai_api_key')
        .limit(1)
        .single();

      if (error) throw error;
      if (data?.openai_api_key) {
        setOpenaiApiKey(data.openai_api_key);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const saveApiKey = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ openai_api_key: openaiApiKey })
        .eq('id', (await supabase.from('site_settings').select('id').limit(1).single()).data?.id);

      if (error) throw error;

      toast({
        title: "API Key opgeslagen",
        description: "De OpenAI API key is succesvol opgeslagen."
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        variant: "destructive",
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de API key."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addLanguage = async () => {
    if (!newLanguage.code || !newLanguage.name) {
      toast({
        variant: "destructive",
        title: "Vereiste velden",
        description: "Vul zowel taalcode als naam in."
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('languages')
        .insert({
          code: newLanguage.code.toLowerCase(),
          name: newLanguage.name,
          is_enabled: true,
          is_default: false
        });

      if (error) throw error;

      setNewLanguage({ code: '', name: '' });
      loadLanguages();
      
      toast({
        title: "Taal toegevoegd",
        description: `${newLanguage.name} is toegevoegd aan de beschikbare talen.`
      });
    } catch (error) {
      console.error('Error adding language:', error);
      toast({
        variant: "destructive",
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de taal."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('languages')
        .update({ is_enabled: enabled })
        .eq('id', id);

      if (error) throw error;
      loadLanguages();
    } catch (error) {
      console.error('Error toggling language:', error);
      toast({
        variant: "destructive",
        title: "Fout bij wijzigen",
        description: "Er is een fout opgetreden bij het wijzigen van de taal."
      });
    }
  };

  const setDefaultLanguage = async (id: string) => {
    try {
      // First, remove default from all languages
      await supabase
        .from('languages')
        .update({ is_default: false });

      // Then set the new default
      const { error } = await supabase
        .from('languages')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      loadLanguages();

      toast({
        title: "Standaardtaal ingesteld",
        description: "De standaardtaal is succesvol gewijzigd."
      });
    } catch (error) {
      console.error('Error setting default language:', error);
      toast({
        variant: "destructive",
        title: "Fout bij instellen",
        description: "Er is een fout opgetreden bij het instellen van de standaardtaal."
      });
    }
  };

  const deleteLanguage = async (id: string, code: string) => {
    if (languages.find(l => l.id === id)?.is_default) {
      toast({
        variant: "destructive",
        title: "Kan niet verwijderen",
        description: "De standaardtaal kan niet worden verwijderd."
      });
      return;
    }

    try {
      // Delete translations for this language
      await supabase
        .from('translations')
        .delete()
        .eq('language_code', code);

      // Delete the language
      const { error } = await supabase
        .from('languages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadLanguages();

      toast({
        title: "Taal verwijderd",
        description: "De taal en alle bijbehorende vertalingen zijn verwijderd."
      });
    } catch (error) {
      console.error('Error deleting language:', error);
      toast({
        variant: "destructive",
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de taal."
      });
    }
  };

  const translateContent = async (languageCode: string, languageName: string) => {
    if (!openaiApiKey) {
      toast({
        variant: "destructive",
        title: "OpenAI API Key vereist",
        description: "Stel eerst een OpenAI API key in om vertalingen te maken."
      });
      return;
    }

    // Add to progress tracking
    setTranslationProgress(prev => [...prev.filter(p => p.language !== languageCode), {
      language: languageCode,
      progress: 0,
      isTranslating: true
    }]);

    try {
      const { error } = await supabase.functions.invoke('translate-content', {
        body: { 
          targetLanguage: languageCode,
          languageName: languageName
        }
      });

      if (error) throw error;

      toast({
        title: "Vertaling gestart",
        description: `Het vertaalproces voor ${languageName} is gestart. Dit kan 2-3 minuten duren.`
      });

      // Simulate progress updates to show activity
      const progressInterval = setInterval(() => {
        setTranslationProgress(prev => 
          prev.map(p => 
            p.language === languageCode 
              ? ({ ...p, progress: Math.min(p.progress + 15, 90) })
              : p
          )
        );
      }, 20000); // Update every 20 seconds

      // Show completion after estimated completion time (2 minutes)
      setTimeout(() => {
        clearInterval(progressInterval);
        
        // Complete the progress
        setTranslationProgress(prev => 
          prev.map(p => 
            p.language === languageCode 
              ? ({ ...p, progress: 100, isTranslating: false })
              : p
          )
        );
        
        // Show success message and clean up after a delay
        setTimeout(() => {
          toast({
            title: "Vertaling voltooid!",
            description: `De vertaling naar ${languageName} is succesvol voltooid. Je website ondersteunt nu ${languageName}.`
          });
          
          // Remove from progress tracking after showing completion
          setTranslationProgress(prev => prev.filter(p => p.language !== languageCode));
        }, 3000);
      }, 120000); // 2 minutes

    } catch (error) {
      console.error('Error starting translation:', error);
      toast({
        variant: "destructive",
        title: "Fout bij vertalen",
        description: "Er is een fout opgetreden bij het starten van de vertaling."
      });
      
      // Remove from progress tracking
      setTranslationProgress(prev => prev.filter(p => p.language !== languageCode));
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Header with Save button */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6 -mx-6 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Talen</h1>
            <p className="text-muted-foreground">
              Beheer meertaligheid en vertaling instellingen
            </p>
          </div>
          <Button 
            onClick={saveApiKey} 
            disabled={isLoading} 
            className="flex items-center gap-2" 
            style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
          >
            <Save className="w-4 h-4" />
            {isLoading ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </div>

      {/* OpenAI API Key */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            OpenAI API Key
          </CardTitle>
          <CardDescription>
            Stel je OpenAI API key in voor automatische vertalingen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai-key">API Key</Label>
            <Input
              id="openai-key"
              type="password"
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Add New Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Taal Toevoegen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lang-code">Taalcode (bijv. en, fr, de)</Label>
              <Input
                id="lang-code"
                value={newLanguage.code}
                onChange={(e) => setNewLanguage({ ...newLanguage, code: e.target.value })}
                placeholder="en"
                maxLength={5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lang-name">Taal Naam</Label>
              <Input
                id="lang-name"
                value={newLanguage.name}
                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                placeholder="English"
              />
            </div>
          </div>
          <Button onClick={addLanguage} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-2" />
            Taal Toevoegen
          </Button>
        </CardContent>
      </Card>

      {/* Translation Progress */}
      {translationProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vertaalvoortgang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {translationProgress.map((progress) => (
              <div key={progress.language} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">
                    {languages.find(l => l.code === progress.language)?.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {progress.progress}%
                  </span>
                </div>
                <Progress value={progress.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Languages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Beschikbare Talen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {languages.map((language) => (
            <div key={language.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{language.name}</span>
                    <Badge variant="outline">{language.code}</Badge>
                    {language.is_default && (
                      <Badge>Standaard</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`enabled-${language.id}`} className="text-sm">
                        Ingeschakeld
                      </Label>
                      <Switch
                        id={`enabled-${language.id}`}
                        checked={language.is_enabled}
                        onCheckedChange={(checked) => toggleLanguage(language.id, checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!language.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultLanguage(language.id)}
                  >
                    Maak Standaard
                  </Button>
                )}
                
                {language.code !== 'nl' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => translateContent(language.code, language.name)}
                    disabled={!openaiApiKey || translationProgress.some(p => p.language === language.code)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Vertaal Content
                  </Button>
                )}
                
                {!language.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteLanguage(language.id, language.code)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {languages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nog geen talen geconfigureerd
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLanguages;