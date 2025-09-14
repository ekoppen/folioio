import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { getBackendAdapter } from '@/config/backend-config';
import SlideshowInfoCard from './SlideshowInfoCard';
import ProtectedImage from './ProtectedImage';
import heroBackground from '@/assets/hero-background.jpg';
import { useTranslation } from '@/hooks/useTranslation';

interface Photo {
  id: string;
  filename: string;
  file_url: string;
  alt_text?: string;
  caption?: string;
  sort_order: number;
  is_visible: boolean;
}

interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string;
  photos: Photo[];
  show_title_in_slideshow?: boolean;
  show_description_in_slideshow?: boolean;
  title_display_duration?: number;
  description_display_duration?: number;
}

interface SiteSettings {
  site_title: string;
  site_tagline: string;
  home_show_title_overlay?: boolean;
  home_show_buttons?: boolean;
  accent_color?: string;
  footer_background_color?: string;
  footer_opacity?: number;
  logo_margin_left?: number;
  content_font_family?: string;
  title_font_family?: string;
  header_title?: string;
  header_subtitle?: string;
  header_description?: string;
  header_font_family?: string;
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

interface HeroProps {
  selectedAlbum?: Album | null;
  onBackToHome?: () => void;
}

interface AlbumInfoProps {
  album: Album;
  currentSlide: number;
}

const AlbumInfo = ({ album, currentSlide }: AlbumInfoProps) => {
  const [showTitle, setShowTitle] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [titleFading, setTitleFading] = useState(false);
  const [descriptionFading, setDescriptionFading] = useState(false);

  // Handle title display timer with fade effect
  useEffect(() => {
    if (album.title_display_duration === 0) {
      // Never show
      setShowTitle(false);
      setTitleFading(false);
    } else if (album.title_display_duration === -1 || !album.title_display_duration) {
      // Always show
      setShowTitle(album.show_title_in_slideshow ?? false);
      setTitleFading(false);
    } else {
      // Show for X seconds with fade
      setShowTitle(album.show_title_in_slideshow ?? false);
      setTitleFading(false);
      
      if (album.show_title_in_slideshow) {
        const fadeTimer = setTimeout(() => {
          setTitleFading(true);
          // Hide after fade animation completes
          setTimeout(() => {
            setShowTitle(false);
          }, 1000); // Match the transition duration
        }, (album.title_display_duration - 1) * 1000); // Start fade 1 second early
        
        return () => clearTimeout(fadeTimer);
      }
    }
  }, [album.id, album.title_display_duration, album.show_title_in_slideshow]);

  // Handle description display timer with fade effect
  useEffect(() => {
    if (album.description_display_duration === 0) {
      // Never show
      setShowDescription(false);
      setDescriptionFading(false);
    } else if (album.description_display_duration === -1 || !album.description_display_duration) {
      // Always show
      setShowDescription(album.show_description_in_slideshow ?? false);
      setDescriptionFading(false);
    } else {
      // Show for X seconds with fade
      setShowDescription(album.show_description_in_slideshow ?? false);
      setDescriptionFading(false);
      
      if (album.show_description_in_slideshow) {
        const fadeTimer = setTimeout(() => {
          setDescriptionFading(true);
          // Hide after fade animation completes
          setTimeout(() => {
            setShowDescription(false);
          }, 1000); // Match the transition duration
        }, (album.description_display_duration - 1) * 1000); // Start fade 1 second early
        
        return () => clearTimeout(fadeTimer);
      }
    }
  }, [album.id, album.description_display_duration, album.show_description_in_slideshow]);

  return (
    <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
      {showTitle && album.name && (
        <h1 
          className={`text-4xl md:text-6xl font-bold mb-6 text-white font-title transition-all duration-1000 ease-out transform ${
            titleFading 
              ? 'opacity-0 translate-y-2 scale-95' 
              : 'opacity-100 translate-y-0 scale-100 animate-fade-in'
          }`}
        >
          {album.name}
        </h1>
      )}
      
      {showDescription && album.description && (
        <p 
          className={`text-lg md:text-xl text-white/90 mb-6 font-content transition-all duration-1000 ease-out transform ${
            descriptionFading 
              ? 'opacity-0 translate-y-2 scale-95' 
              : 'opacity-100 translate-y-0 scale-100 animate-fade-in'
          }`}
        >
          {album.description}
        </p>
      )}
    </div>
  );
};

const Hero = ({ selectedAlbum, onBackToHome }: HeroProps) => {
  const [homePhotos, setHomePhotos] = useState<Photo[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: 'Creatieve Portfolio',
    site_tagline: 'Ontdek mijn werk, verhalen en creatieve visie',
    home_show_title_overlay: true,
    home_show_buttons: true
  });
  const [customSections, setCustomSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    console.log('Hero: useEffect starting...');
    try {
      fetchHomePhotos();
      fetchSettings();
      fetchCustomSections();
    } catch (error) {
      console.error('Hero: useEffect error:', error);
    }
  }, []);

  const fetchCustomSections = async () => {
    try {
      const response = await fetch('/api/custom-sections');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomSections(data.data.filter((section: any) => section.show_hero_button));
        }
      }
    } catch (error) {
      console.error('Error fetching custom sections:', error);
    }
  };

  const fetchHomePhotos = async () => {
    try {
      // Get the home album
      const backend = getBackendAdapter();
      const { data: homeAlbum, error: albumError } = await backend
        .from('albums')
        .select('id')
        .eq('slug', 'home')
        .single();

      if (albumError || !homeAlbum) {
        console.log('No home album found');
        setLoading(false);
        return;
      }

      // Get photos from home album
      const { data: photos, error: photosError } = await backend
        .from('photos')
        .select('*')
        .eq('album_id', homeAlbum.id)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (photosError) throw photosError;

      setHomePhotos(photos || []);
    } catch (error) {
      console.error('Error fetching home photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      console.log('Hero: Starting to fetch settings...');
      console.log('Hero: Backend config:', {
        backendType: import.meta.env.VITE_BACKEND_TYPE,
        localApiUrl: import.meta.env.VITE_LOCAL_API_URL
      });
      const backend = getBackendAdapter();
      console.log('Hero: Backend adapter:', backend);
      const { data, error } = await backend
        .from('site_settings')
        .select('site_title, site_tagline, home_show_title_overlay, home_show_buttons, accent_color, footer_background_color, logo_margin_left, content_font_family, title_font_family, title_visible, title_font_size, title_color, title_position, tagline_visible, tagline_font_family, tagline_font_size, tagline_color, tagline_position, slideshow_interval, slideshow_transition, slideshow_info_card_enabled, slideshow_info_card_radius, slideshow_info_card_opacity, slideshow_info_card_position, slideshow_info_card_text_size, slideshow_show_arrows, slideshow_show_dots')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('Hero: Database query result:', { data, error });
      console.log('Hero: Raw response data:', data);
      console.log('Hero: Error details:', error);
      if (error) {
        console.error('Hero: Query failed:', error);
        throw error;
      }
      
      if (data) {
        console.log('Hero loaded settings:', {
          slideshow_transition: data.slideshow_transition,
          slideshow_interval: data.slideshow_interval,
          slideshow_show_arrows: data.slideshow_show_arrows,
          slideshow_show_dots: data.slideshow_show_dots
        });
        
        setSettings({
          site_title: data.site_title || 'Creatieve Portfolio',
          site_tagline: data.site_tagline || 'Ontdek mijn werk, verhalen en creatieve visie',
          home_show_title_overlay: data.home_show_title_overlay ?? true,
          home_show_buttons: data.home_show_buttons ?? true,
          accent_color: data.accent_color,
          footer_background_color: data.footer_background_color || '#2D3748',
          logo_margin_left: data.logo_margin_left || 0,
          content_font_family: data.content_font_family,
          title_visible: data.title_visible ?? true,
          title_font_size: data.title_font_size || 56,
          title_color: data.title_color || '#ffffff',
          title_position: data.title_position || 'center',
          tagline_visible: data.tagline_visible ?? true,
          tagline_font_family: data.tagline_font_family || 'Roboto',
          tagline_font_size: data.tagline_font_size || 20,
          tagline_color: data.tagline_color || '#ffffff',
          tagline_position: data.tagline_position || 'center',
          title_font_family: data.title_font_family,
          slideshow_interval: data.slideshow_interval || 6000,
          slideshow_transition: data.slideshow_transition || 'fade',
          slideshow_info_card_enabled: data.slideshow_info_card_enabled ?? true,
          slideshow_info_card_radius: data.slideshow_info_card_radius || 8,
          slideshow_info_card_opacity: data.slideshow_info_card_opacity || 0.8,
          slideshow_info_card_position: data.slideshow_info_card_position || 'bottom-left',
          slideshow_info_card_text_size: data.slideshow_info_card_text_size || 14,
          slideshow_show_arrows: data.slideshow_show_arrows,
          slideshow_show_dots: data.slideshow_show_dots
        });
      }
    } catch (error) {
      console.error('Hero: Error fetching settings:', error);
    }
  };

  // Use album photos if provided, otherwise use home photos
  const photosToShow = selectedAlbum ? selectedAlbum.photos : homePhotos;
  const showOverlay = !selectedAlbum && settings.home_show_title_overlay;

  // Auto-advance slideshow
  useEffect(() => {
    if (photosToShow.length > 1) {
      const interval = settings?.slideshow_interval || 6000;
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % photosToShow.length);
      }, interval);

      return () => clearInterval(timer);
    }
  }, [photosToShow.length, settings?.slideshow_interval]);

  // Reset slide when album changes
  useEffect(() => {
    setCurrentSlide(0);
  }, [selectedAlbum]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % photosToShow.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + photosToShow.length) % photosToShow.length);
  };

  // Dynamic styles for accent color
  const accentStyle = settings.accent_color ? { backgroundColor: settings.accent_color } : {};
  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden snap-section">
      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        {photosToShow.length > 0 ? (
          photosToShow.map((photo, index) => {
            if (index === 0) { // Only log for first photo to avoid spam
              console.log('Rendering transition:', {
                transition: settings?.slideshow_transition,
                isSlide: settings?.slideshow_transition === 'slide',
                currentSlide,
                interval: settings?.slideshow_interval
              });
            }
            
            const transitionType = settings?.slideshow_transition || 'fade';
            const transitionClass = transitionType === 'slide' 
              ? 'transform transition-transform duration-1000' 
              : 'transition-opacity duration-1000';
            
            const activeClass = transitionType === 'slide'
              ? (index === currentSlide ? 'translate-x-0' : index < currentSlide ? '-translate-x-full' : 'translate-x-full')
              : (index === currentSlide ? 'opacity-100' : 'opacity-0');
              
            return (
              <div
                key={photo.id}
                className={`absolute inset-0 ${transitionClass} ${activeClass}`}
              >
                <ProtectedImage
                  src={photo.file_url}
                  alt={photo.alt_text || photo.filename}
                  className=""
                />
              </div>
            );
          })
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-700" />
        )}
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 z-10 overlay-gradient" />
      
      {/* Content - Show overlay for home or when album allows it */}
      {(!selectedAlbum && showOverlay) && (
        <div className="relative z-20 px-6 max-w-4xl mx-auto" style={{ textAlign: settings.title_position || 'center' }}>
          {settings.title_visible !== false && (
            <h1 
              className="font-bold mb-6 animate-fade-in"
              style={{ 
                fontFamily: settings.title_font_family || 'Playfair Display',
                fontSize: `${settings.title_font_size || 56}px`,
                color: settings.title_color || '#ffffff',
                lineHeight: '1.2'
              }}
            >
              {t('site_settings.site_title', settings.site_title).split(' ')[0]}
              {t('site_settings.site_title', settings.site_title).split(' ').length > 1 && (
                <span 
                  className="block animate-slide-in-right"
                  style={{ 
                    color: settings.accent_color || settings.title_color || '#ffffff',
                    fontFamily: settings.title_font_family || 'Playfair Display'
                  }}
                >
                  {t('site_settings.site_title', settings.site_title).split(' ').slice(1).join(' ')}
                </span>
              )}
            </h1>
          )}
          
          {settings.tagline_visible !== false && (
            <p 
              className="mb-8 animate-fade-in max-w-2xl"
              style={{ 
                fontFamily: settings.tagline_font_family === 'site' 
                  ? (settings.content_font_family || 'Roboto')
                  : (settings.tagline_font_family || 'Roboto'),
                fontSize: `${settings.tagline_font_size || 20}px`,
                color: settings.tagline_color || '#ffffff',
                textAlign: settings.tagline_position || 'center',
                margin: settings.tagline_position === 'left' ? '0' : settings.tagline_position === 'right' ? '0 0 0 auto' : '0 auto'
              }}
            >
              {t('site_settings.site_tagline', settings.site_tagline)}
            </p>
          )}
          
          {/* Show current photo caption if available */}
          {photosToShow.length > 0 && photosToShow[currentSlide]?.caption && (
            <p className="text-lg text-white/80 mb-8 animate-fade-in italic font-content">
              {photosToShow[currentSlide].caption}
            </p>
          )}
          
          {settings.home_show_buttons && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in flex-wrap">
              <Button 
                size="lg" 
                onClick={() => {
                  document.getElementById('portfolio')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className="text-white font-semibold hover:opacity-90 transition-opacity"
                style={accentStyle}
              >
                {t('hero.view_portfolio', 'Bekijk Portfolio')}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => {
                  document.getElementById('about')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }}
                className="glass-effect text-white border-white/30 bg-white/20 hover:bg-white/10"
              >
                {t('hero.learn_more', 'Meer Over Mij')}
              </Button>
              
              {/* Custom section buttons */}
              {customSections.map((section) => (
                <Button 
                  key={section.id}
                  variant="outline"
                  size="lg" 
                  onClick={() => {
                    document.getElementById(`custom-${section.slug}`)?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }}
                  className="glass-effect text-white border-white/30 bg-white/20 hover:bg-white/10"
                >
                  {section.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Content for selected albums */}
      {selectedAlbum && (selectedAlbum.show_title_in_slideshow || selectedAlbum.show_description_in_slideshow || (photosToShow.length > 0 && photosToShow[currentSlide]?.caption)) && (
        <AlbumInfo
          album={selectedAlbum}
          currentSlide={currentSlide}
        />
      )}
      
      {/* Navigation Arrows - only show if there are multiple photos */}
      {photosToShow.length > 1 && (settings?.slideshow_show_arrows === true || settings?.slideshow_show_arrows === undefined) && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 glass-effect"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white hover:bg-white/20 glass-effect"
            onClick={nextSlide}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      {photosToShow.length > 1 && (settings?.slideshow_show_dots === true || settings?.slideshow_show_dots === undefined) && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {photosToShow.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/70'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}

      {/* Slideshow Info Card */}
      {selectedAlbum && photosToShow.length > 0 && (
        <SlideshowInfoCard
          title={photosToShow[currentSlide]?.alt_text}
          description={photosToShow[currentSlide]?.caption}
          enabled={settings?.slideshow_info_card_enabled !== false}
          position={settings?.slideshow_info_card_position || 'bottom-left'}
          radius={settings?.slideshow_info_card_radius || 8}
          opacity={settings?.slideshow_info_card_opacity || 0.8}
          backgroundColor={settings?.footer_background_color || '#2D3748'}
          backgroundOpacity={settings?.footer_opacity || 0.8}
          marginLeft={settings?.logo_margin_left || 0}
          textSize={settings?.slideshow_info_card_text_size || 14}
          contentFontFamily={settings?.content_font_family || 'inherit'}
        />
      )}
      
      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-float">
        <ChevronDown className="text-white/70 w-8 h-8" />
      </div>
    </section>
  );
};

export default Hero;