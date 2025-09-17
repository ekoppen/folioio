import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBackendAdapter } from '@/config/backend-config';

interface SlideItem {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
}

const Slideshow = () => {
  const [slides, setSlides] = useState<SlideItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [objectFit, setObjectFit] = useState<string>('contain');

  useEffect(() => {
    fetchSlides();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const backend = getBackendAdapter();
      const { data: settings, error } = await backend
        .from('site_settings')
        .select('slideshow_object_fit')
        .single();

      if (error) throw error;

      // Default to 'contain' to show full image, or use the setting if available
      const fitMode = settings?.slideshow_object_fit || 'contain';
      console.log('Slideshow object-fit setting:', fitMode);
      setObjectFit(fitMode);
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Default to 'contain' if settings fetch fails
      setObjectFit('contain');
    }
  };

  const fetchSlides = async () => {
    try {
      const backend = getBackendAdapter();
      const { data, error } = await backend
        .from('slideshow')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      setSlides(data || []);
    } catch (error) {
      console.error('Error fetching slides:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(timer);
    }
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  if (loading) {
    return (
      <section className="relative h-[70vh] bg-gradient-to-br from-portfolio-dark to-portfolio-muted overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-portfolio-light">Loading slideshow...</div>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section className="relative h-[70vh] overflow-hidden">
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image_url}
              alt={slide.title}
              className="w-full h-full"
              style={{ objectFit: objectFit as any }}
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        ))}
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 z-10 flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              {currentSlideData.title}
            </h1>
            {currentSlideData.description && (
              <p className="text-xl md:text-2xl mb-8 animate-slide-up">
                {currentSlideData.description}
              </p>
            )}
            {currentSlideData.link_url && (
              <Button 
                size="lg" 
                className="animate-scale-in accent-gradient border-0 hover:scale-105 transition-transform"
                onClick={() => window.open(currentSlideData.link_url, '_blank')}
              >
                Learn More
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
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
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Slideshow;