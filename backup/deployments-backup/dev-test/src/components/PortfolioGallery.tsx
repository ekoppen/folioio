import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Eye, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProtectedImage from './ProtectedImage';
import { useTranslation } from '@/hooks/useTranslation';

interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_visible: boolean;
  photos: Photo[];
}

interface Photo {
  id: string;
  filename: string;
  file_url: string;
  alt_text?: string;
  caption?: string;
  sort_order: number;
  is_visible: boolean;
}

interface PortfolioGalleryProps {
  onAlbumSelect: (album: Album) => void;
}

const PortfolioGallery = ({ onAlbumSelect }: PortfolioGalleryProps) => {
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const [portfolioSettings, setPortfolioSettings] = useState({
    title: 'Mijn Portfolio',
    description: 'Ontdek verschillende projecten en albums die mijn creatieve reis weerspiegelen.',
    enabled: true,
    accent_color: ''
  });

  useEffect(() => {
    fetchAlbums();
    fetchPortfolioSettings();
  }, []);

  const fetchPortfolioSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('portfolio_title, portfolio_description, portfolio_enabled, accent_color')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setPortfolioSettings({
          title: data.portfolio_title || 'Mijn Portfolio',
          description: data.portfolio_description || 'Ontdek verschillende projecten en albums die mijn creatieve reis weerspiegelen.',
          enabled: data.portfolio_enabled ?? true,
          accent_color: data.accent_color || ''
        });
      }
    } catch (error) {
      console.error('Error fetching portfolio settings:', error);
    }
  };

  const fetchAlbums = async () => {
    try {
      // Fetch visible albums with their photos
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*, show_title_in_slideshow, show_description_in_slideshow')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (albumsError) throw albumsError;

      // Fetch photos for each album
      const albumsWithPhotos = await Promise.all(
        (albumsData || []).map(async (album) => {
          const { data: photosData, error: photosError } = await supabase
            .from('photos')
            .select('*')
            .eq('album_id', album.id)
            .eq('is_visible', true)
            .order('sort_order', { ascending: true });

          if (photosError) {
            console.error('Error fetching photos for album:', album.id, photosError);
            return { ...album, photos: [] };
          }

          return { ...album, photos: photosData || [] };
        })
      );

      setAlbums(albumsWithPhotos);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all categories from albums (excluding home)
  const categories = ['Alle', ...new Set(albums.filter(album => album.slug !== 'home').map(album => album.name))];

  const filteredAlbums = selectedCategory === 'Alle' 
    ? albums.filter(album => album.slug !== 'home') // Exclude home album
    : albums.filter(album => album.name === selectedCategory && album.slug !== 'home');

  if (loading) {
    return (
      <section id="portfolio" className="section-padding bg-background">
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground font-content">
              {t('portfolio.loading', 'Portfolio laden...')}
            </p>
          </div>
      </section>
    );
  }

  if (!portfolioSettings.enabled) {
    return null;
  }

  return (
    <section id="portfolio" className="section-padding bg-background snap-section">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 animate-slide-up font-title">
            {t('site_settings.portfolio_title', portfolioSettings.title).split(' ')[0]}{' '}
            <span style={portfolioSettings.accent_color ? { color: portfolioSettings.accent_color } : {}}>
              {t('site_settings.portfolio_title', portfolioSettings.title).split(' ').slice(1).join(' ')}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in font-content">
            {t('site_settings.portfolio_description', portfolioSettings.description)}
          </p>
        </div>


        {/* Gallery Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAlbums.map((album, index) => {
            // Skip albums without photos
            if (!album.photos || album.photos.length === 0) return null;
            
            return (
              <Card 
                key={album.id} 
                className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-500 animate-scale-in h-[30rem] flex flex-col"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-0 flex flex-col h-full">
                  <div 
                    className="cursor-pointer flex flex-col h-full"
                    onClick={() => onAlbumSelect(album)}
                  >
                    <div className="relative overflow-hidden h-48 flex-shrink-0">
                      {/* Main Image */}
                      <ProtectedImage
                        src={album.photos[0].file_url}
                        alt={album.photos[0].alt_text || album.photos[0].filename}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Eye size={20} />
                          <span>{t('portfolio.view_album', 'Bekijk Album')}</span>
                        </div>
                      </div>
                      
                      {/* Image Count Badge */}
                      <Badge className="absolute top-4 right-4 bg-black/50 text-white">
                        {album.photos.length} {t('portfolio.photos', 'foto\'s')}
                      </Badge>
                    </div>

                    {/* Gallery Details */}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold mb-3 transition-colors font-title">
                          {t(`albums.name.${album.id}`, album.name)}
                        </h3>
                        <p className="text-muted-foreground font-content">
                          {t(`albums.description.${album.id}`, album.description || t('portfolio.default_description', 'Bekijk de foto\'s in dit album'))}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAlbums.length === 0 && !loading && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground font-content">
              {selectedCategory === 'Alle' 
                ? t('portfolio.no_albums', 'Nog geen zichtbare albums met foto\'s gevonden.') 
                : t('portfolio.no_albums_category', `Geen albums gevonden in de categorie "${selectedCategory}".`)}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PortfolioGallery;