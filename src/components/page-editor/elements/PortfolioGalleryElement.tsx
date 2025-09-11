import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Eye, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

interface PortfolioGalleryElementProps {
  settings?: {
    showAllCategories?: boolean;
    gridColumns?: number;
  };
}

export const PortfolioGalleryElement: React.FC<PortfolioGalleryElementProps> = ({ settings }) => {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  const { showAllCategories = true, gridColumns = 3 } = settings || {};

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      // Fetch visible albums with their photos
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
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
  const categories = showAllCategories 
    ? ['Alle', ...new Set(albums.filter(album => album.slug !== 'home').map(album => album.name))]
    : [];

  const filteredAlbums = selectedCategory === 'Alle' 
    ? albums.filter(album => album.slug !== 'home') // Exclude home album
    : albums.filter(album => album.name === selectedCategory && album.slug !== 'home');

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-lg text-muted-foreground">Portfolio laden...</div>
      </div>
    );
  }

  return (
    <section className="w-full h-full bg-background p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Mijn <span className="text-portfolio-accent">Portfolio</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Ontdek verschillende projecten en albums die mijn creatieve reis weerspiegelen.
        </p>
      </div>

      {/* Category Filter */}
      {showAllCategories && categories.length > 1 && (
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? "default" : "secondary"}
              className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all duration-300 ${
                selectedCategory === category 
                  ? 'accent-gradient text-portfolio-dark' 
                  : 'hover:bg-secondary'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Badge>
          ))}
        </div>
      )}

      {/* Gallery Grid */}
      <div 
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${Math.min(gridColumns, 4)}, 1fr)`
        }}
      >
        {filteredAlbums.map((album, index) => {
          // Skip albums without photos
          if (!album.photos || album.photos.length === 0) return null;
          
          return (
            <Card 
              key={album.id} 
              className="group cursor-pointer overflow-hidden border-portfolio-border hover:shadow-xl transition-all duration-500"
            >
              <CardContent className="p-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative overflow-hidden">
                      {/* Main Image */}
                      <img
                        src={album.photos[0].file_url}
                        alt={album.photos[0].alt_text || album.photos[0].filename}
                        className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Eye size={18} />
                          <span>{t('portfolio.view_gallery', 'Bekijk Album')}</span>
                        </div>
                      </div>
                      
                      {/* Image Count Badge */}
                      <Badge className="absolute top-3 right-3 bg-black/50 text-white text-xs">
                        {album.photos.length} foto's
                      </Badge>
                    </div>
                  </DialogTrigger>

                  {/* Gallery Details */}
                  <div className="p-4">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {album.name}
                    </Badge>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-portfolio-accent transition-colors">
                      {t(`albums.name.${album.id}`, album.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {t(`albums.description.${album.id}`, album.description || 'Bekijk de foto\'s in dit album')}
                    </p>
                    <div className="flex items-center text-portfolio-accent font-medium text-sm">
                      <span>{t('portfolio.view_full_album', 'Bekijk volledig album')}</span>
                      <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Full Gallery Modal */}
                  <DialogContent className="max-w-4xl">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{t(`albums.name.${album.id}`, album.name)}</h3>
                        <p className="text-muted-foreground">{t(`albums.description.${album.id}`, album.description || 'Foto album')}</p>
                      </div>
                      
                      <Carousel className="w-full">
                        <CarouselContent>
                          {album.photos.map((photo) => (
                            <CarouselItem key={photo.id}>
                              <div className="space-y-4">
                                <img
                                  src={photo.file_url}
                                  alt={photo.alt_text || photo.filename}
                                  className="w-full h-80 object-cover rounded-lg"
                                />
                                {photo.caption && (
                                  <p className="text-sm text-muted-foreground text-center">
                                    {photo.caption}
                                  </p>
                                )}
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                      </Carousel>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAlbums.length === 0 && !loading && (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            {selectedCategory === 'Alle' 
              ? 'Nog geen zichtbare albums met foto\'s gevonden.' 
              : `Geen albums gevonden in de categorie "${selectedCategory}".`}
          </p>
        </div>
      )}
    </section>
  );
};