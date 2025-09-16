import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactModal } from '@/components/ContactModal';
import { ContentGridRenderer } from '@/components/ContentGridRenderer';
import { getBackendAdapter } from '@/config/backend-config';
import { ContentElement } from '@/types/content-grid';
import { Palette, Camera, Laptop, Heart, Mail } from 'lucide-react';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useTranslation } from '@/hooks/useTranslation';

interface AboutSettings {
  main_title: string;
  intro_text: string;
  description_text: string;
  content_elements?: ContentElement[];  // New grid-based content
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
  background_color?: string;  // New background color field
}

const iconMap: Record<string, any> = {
  Palette,
  Camera,
  Laptop,
  Heart
};

interface AboutProps {
  onContactClick?: () => void;
}

const About = ({ onContactClick }: AboutProps = {}) => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AboutSettings>({
    main_title: 'Over Mij',
    intro_text: 'Hallo! Ik ben een gepassioneerde creatieve professional die graag verhalen vertelt door middel van visuele kunst, fotografie en digitaal ontwerp. Met meer dan 5 jaar ervaring help ik klanten hun visie tot leven te brengen.',
    description_text: 'Mijn werk wordt gedreven door nieuwsgierigheid en de wens om betekenisvolle verbindingen te maken tussen mensen en merken. Elke project is een nieuwe kans om iets unieks te creëren.',
    content_elements: [],  // Initialize grid content
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
    profile_photo_url: undefined,
    background_color: undefined
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
          content_elements: (record.content_elements as ContentElement[]) || [],
          skills: (record.skills as string[]) || [],
          services: (record.services as AboutSettings['services']) || [],
          stats: (record.stats as AboutSettings['stats']) || [],
          quotes: quotes,
          profile_photo_url: record.profile_photo_url,
          background_color: record.background_color
        });
      }
    } catch (error) {
      console.error('Error fetching about settings:', error);
    }
  };

  // Generate inline style for background color
  const sectionStyle = settings.background_color && settings.background_color !== 'transparent'
    ? { backgroundColor: settings.background_color }
    : {};

  // Determine if we should use default background class
  const shouldUseDefaultBg = !settings.background_color || settings.background_color === 'transparent';

  return (
    <section
      id="about"
      className={`section-padding snap-section ${shouldUseDefaultBg ? 'bg-muted/30' : ''}`}
      style={sectionStyle}
    >
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="animate-slide-in-left mb-12">
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

              {(!settings.content_elements || settings.content_elements.length === 0) && (
                <p className="text-lg text-muted-foreground font-content">
                  {t('about_settings.intro_text', settings.intro_text)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Grid Content Section - Full Width */}
        {settings.content_elements && settings.content_elements.length > 0 ? (
          <div className="animate-slide-in-up mb-12">
            <ContentGridRenderer elements={settings.content_elements} />
          </div>
        ) : (
          <div className="animate-slide-in-up mb-12">
            <p className="text-lg text-muted-foreground font-content max-w-4xl mx-auto text-center">
              {t('about_settings.description_text', settings.description_text)}
            </p>
          </div>
        )}

        {/* Skills and Stats Section */}
        <div className="animate-slide-in-up mb-12">
          {/* Skills */}
          {settings.skills.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 font-title text-center">{t('about.expertise', 'Expertise')}</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {settings.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="px-3 py-1">
                    {t(`skills.${skill.toLowerCase().replace(/\s+/g, '_').replace(/\//g, '_')}`, skill)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
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

        {/* Services Section */}
        <div className="animate-slide-in-up">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                        if (service.url === '#contact') {
                          // Open contact modal
                          if (onContactClick) {
                            onContactClick();
                          } else {
                            setIsContactModalOpen(true);
                          }
                        } else if (service.url!.startsWith('#')) {
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
              <Card className="max-w-2xl mx-auto" style={{ backgroundColor: 'hsl(var(--dynamic-accent) / 0.05)', borderColor: 'hsl(var(--dynamic-accent) / 0.2)' }}>
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
                onClick={() => {
                  if (onContactClick) {
                    onContactClick();
                  } else {
                    setIsContactModalOpen(true);
                  }
                }}
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
      
      {!onContactClick && (
        <ContactModal
          open={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
        />
      )}
    </section>
  );
};

export default About;