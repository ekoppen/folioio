import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactModal } from '@/components/ContactModal';
import { getBackendAdapter } from '@/config/backend-config';
import { Palette, Camera, Laptop, Heart, Mail } from 'lucide-react';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useTranslation } from '@/hooks/useTranslation';

interface AboutSettings {
  main_title: string;
  intro_text: string;
  description_text: string;
  skills: string[];
  services: Array<{
    icon: string;
    title: string;
    description: string;
    url?: string;
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
  Heart
};

const About = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AboutSettings>({
    main_title: 'Over Mij',
    intro_text: 'Hallo! Ik ben een gepassioneerde creatieve professional die graag verhalen vertelt door middel van visuele kunst, fotografie en digitaal ontwerp. Met meer dan 5 jaar ervaring help ik klanten hun visie tot leven te brengen.',
    description_text: 'Mijn werk wordt gedreven door nieuwsgierigheid en de wens om betekenisvolle verbindingen te maken tussen mensen en merken. Elke project is een nieuwe kans om iets unieks te creëren.',
    skills: ['Fotografie', 'Grafisch Ontwerp', 'Web Development', 'Digitale Kunst', 'UI/UX Design'],
    services: [
      {
        icon: 'Palette',
        title: 'Creatief Ontwerp',
        description: 'Van concept tot uitvoering, ik creëer visuele identiteiten die impact maken.'
      },
      {
        icon: 'Camera',
        title: 'Fotografie',
        description: 'Professionele fotografie voor portretten, evenementen en commerciële doeleinden.'
      },
      {
        icon: 'Laptop',
        title: 'Digitale Oplossingen',
        description: 'Websites en digitale ervaringen die gebruikers boeien en converteren.'
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
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  
  useAccentColor(); // Initialize dynamic accent color

  // Auto-cycle through quotes if multiple
  useEffect(() => {
    if (settings.quotes.length > 1) {
      const interval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % settings.quotes.length);
      }, 5000); // Change quote every 5 seconds
      return () => clearInterval(interval);
    }
  }, [settings.quotes.length]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('about_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      // Extract first record if array
      const record = data && Array.isArray(data) ? data[0] : data;

      if (error) throw error;
      
      if (record) {
        console.log('About settings record:', record);
        console.log('Profile photo URL from DB:', record.profile_photo_url);

        // Handle backward compatibility: convert old quote format to new quotes array
        let quotes = (record.quotes as AboutSettings['quotes']) || [];
        if (quotes.length === 0 && record.quote_text) {
          quotes = [{ text: record.quote_text, author: record.quote_author || '' }];
        }

        setSettings({
          main_title: record.main_title,
          intro_text: record.intro_text,
          description_text: record.description_text,
          skills: (record.skills as string[]) || [],
          services: (record.services as AboutSettings['services']) || [],
          stats: (record.stats as AboutSettings['stats']) || [],
          quotes: quotes,
          profile_photo_url: record.profile_photo_url
        });
      }
    } catch (error) {
      console.error('Error fetching about settings:', error);
    }
  };

  return (
    <section id="about" className="section-padding bg-muted/30 snap-section">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="animate-slide-in-left">
            <div className="flex items-start gap-6 mb-6">
              {settings.profile_photo_url ? (
                <img
                  src={settings.profile_photo_url}
                  alt="Profielfoto"
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0 shadow-lg"
                  onError={(e) => console.log('Image failed to load:', e)}
                  onLoad={() => console.log('Image loaded successfully:', settings.profile_photo_url)}
                />
              ) : (
                console.log('No profile photo URL found:', settings.profile_photo_url)
              )}
              <div className="flex-1">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 font-title">
                  {t('about_settings.main_title', settings.main_title).split(' ')[0]}{' '}
                  <span style={{ color: 'hsl(var(--dynamic-accent))' }}>
                    {t('about_settings.main_title', settings.main_title).split(' ').slice(1).join(' ')}
                  </span>
                </h2>
                
                <p className="text-lg text-muted-foreground font-content">
                  {t('about_settings.intro_text', settings.intro_text)}
                </p>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground mb-8 font-content">
              {t('about_settings.description_text', settings.description_text)}
            </p>

            {/* Skills */}
            {settings.skills.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 font-title">{t('about.expertise', 'Expertise')}</h3>
                <div className="flex flex-wrap gap-2">
                  {settings.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {t(`skills.${skill.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_')}`, skill)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {settings.stats.filter(stat => stat.number && stat.label).map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold mb-1" style={{ color: 'hsl(var(--dynamic-accent))' }}>
                    {stat.number}
                  </div>
                   <div className="text-sm text-muted-foreground">
                     {t(`stats.${stat.label.toLowerCase().replace(/\s+/g, '_')}`, stat.label)}
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Services */}
          <div className="animate-slide-in-right">
            <div className="space-y-6">
              {settings.services.map((service, index) => {
                const IconComponent = iconMap[service.icon] || Palette;
                const hasValidUrl = service.url && service.url.trim() !== '';

                const serviceContent = (
                  <Card
                    key={service.title}
                    className={`border-portfolio-border transition-all duration-300 animate-scale-in ${
                      hasValidUrl ? 'hover:shadow-lg cursor-pointer' : 'hover:shadow-md'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => {
                      if (hasValidUrl) {
                        if (service.url!.startsWith('#')) {
                          const targetElement = document.getElementById(service.url!.substring(1));
                          if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
                        } else if (service.url!.startsWith('http')) {
                          window.open(service.url!, '_blank', 'noopener,noreferrer');
                        } else {
                          window.location.href = service.url!;
                        }
                      }
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg" style={{ color: 'hsl(var(--dynamic-accent))', backgroundColor: 'hsl(var(--dynamic-accent) / 0.1)' }}>
                          <IconComponent className="w-8 h-8" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2 font-title">
                            {service.title && service.title.trim() !== '' ?
                              t(`service.${service.title.toLowerCase().replace(/ /g, '_')}`, service.title) :
                              null
                            }
                          </h3>
                          <p className="text-muted-foreground font-content">
                            {service.description && service.description.trim() !== '' ?
                              t(`service.${service.title.toLowerCase().replace(/ /g, '_')}_desc`, service.description) :
                              null
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );

                return serviceContent;
              })}
            </div>

            {/* Quote */}
            {settings.quotes.length > 0 && (
              <Card className="mt-8" style={{ backgroundColor: 'hsl(var(--dynamic-accent) / 0.05)', borderColor: 'hsl(var(--dynamic-accent) / 0.2)' }}>
                <CardContent className="p-6 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: 'hsl(var(--dynamic-accent))' }} />
                  <div className="min-h-[80px]">
                    <blockquote className="text-lg font-medium mb-2 font-content transition-opacity duration-500">
                      "{t('about_settings.quote_text', settings.quotes[currentQuoteIndex].text)}"
                    </blockquote>
                    <cite className="text-sm text-muted-foreground font-content">- {t('about_settings.quote_author', settings.quotes[currentQuoteIndex].author)}</cite>
                  </div>
                  {settings.quotes.length > 1 && (
                    <div className="flex justify-center gap-1 mt-4">
                      {settings.quotes.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentQuoteIndex(index)}
                          className="w-2 h-2 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor: index === currentQuoteIndex
                              ? 'hsl(var(--dynamic-accent))'
                              : 'hsl(var(--dynamic-accent) / 0.3)'
                          }}
                          aria-label={`Go to quote ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contact Button */}
            <div className="mt-8 text-center">
              <Button
                onClick={() => setIsContactModalOpen(true)}
                size="lg"
                className="text-white font-content"
                style={{ backgroundColor: 'hsl(var(--dynamic-accent))', borderColor: 'hsl(var(--dynamic-accent))' }}
              >
                <Mail className="w-5 h-5 mr-2" />
                {t('about.contact_button', 'Neem Contact Op')}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <ContactModal 
        open={isContactModalOpen} 
        onOpenChange={setIsContactModalOpen} 
      />
    </section>
  );
};

export default About;