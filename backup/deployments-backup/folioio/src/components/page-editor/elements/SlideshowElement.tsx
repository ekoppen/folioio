import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getBackendAdapter } from '@/config/backend-config';

interface Photo {
  id: string;
  filename: string;
  file_url: string;
  alt_text?: string;
  caption?: string;
  sort_order: number;
  is_visible: boolean;
}

interface SlideshowElementProps {
  settings?: {
    slideshowAlbum?: string;
    autoAdvance?: boolean;
    transitionDuration?: number;
    transitionEffect?: 'fade' | 'slide' | 'scale';
    showNavigation?: boolean;
    showIndicators?: boolean;
    overlay?: boolean;
    overlayOpacity?: number;
  };
}

export const SlideshowElement: React.FC<SlideshowElementProps> = ({ settings }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  const {
    slideshowAlbum = 'home',
    autoAdvance = true,
    transitionDuration = 6000,
    transitionEffect = 'fade',
    showNavigation = true,
    showIndicators = true,
    overlay = true,
    overlayOpacity = 40,
  } = settings || {};

  useEffect(() => {
    fetchPhotos();
  }, [slideshowAlbum]);

  const fetchPhotos = async () => {
    try {
      const backend = getBackendAdapter();
      // Get the album
      const { data: album, error: albumError } = await backend
        .from('albums')
        .select('id')
        .eq('slug', slideshowAlbum)
        .single();

      if (albumError || !album) {
        console.log(`No album found with slug: ${slideshowAlbum}`);
        setLoading(false);
        return;
      }

      // Get photos from album
      const { data: photosData, error: photosError } = await backend
        .from('photos')
        .select('*')
        .eq('album_id', album.id)
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (photosError) throw photosError;

      setPhotos(photosData || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance slideshow
  useEffect(() => {
    if (autoAdvance && photos.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % photos.length);
      }, transitionDuration);

      return () => clearInterval(timer);
    }
  }, [photos.length, autoAdvance, transitionDuration]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % photos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-muted-foreground">Slideshow laden...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-muted-foreground">Geen foto's gevonden in album: {slideshowAlbum}</div>
      </div>
    );
  }

  const getTransitionClass = () => {
    switch (transitionEffect) {
      case 'slide':
        return 'transition-transform duration-1000';
      case 'scale':
        return 'transition-all duration-1000';
      default:
        return 'transition-opacity duration-1000';
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Background Images */}
      <div className="absolute inset-0">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className={`absolute inset-0 ${getTransitionClass()} ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={photo.file_url}
              alt={photo.alt_text || photo.filename}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      
      {/* Overlay */}
      {overlay && (
        <div 
          className="absolute inset-0"
          style={{ 
            background: `linear-gradient(rgba(0,0,0,${overlayOpacity/100}), rgba(0,0,0,${overlayOpacity/100}))` 
          }} 
        />
      )}
      
      {/* Navigation Arrows */}
      {showNavigation && photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
            onClick={prevSlide}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
            onClick={nextSlide}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      {showIndicators && photos.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {photos.map((_, index) => (
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
      
      {/* Caption */}
      {photos[currentSlide]?.caption && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 text-center">
          <p className="text-white/90 text-lg italic px-4">
            {photos[currentSlide].caption}
          </p>
        </div>
      )}
    </div>
  );
};