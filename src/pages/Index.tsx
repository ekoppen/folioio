import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Slideshow from '@/components/Slideshow';
import PortfolioGallery from '@/components/PortfolioGallery';
import About from '@/components/About';
import SimplifiedFooter from '@/components/SimplifiedFooter';
import { useAccentColor } from '@/hooks/useAccentColor';

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
}

const Index = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  
  // Initialize accent color on page load
  useAccentColor();

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album);
    // Scroll to top to show the slideshow
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToHome = () => {
    setSelectedAlbum(null);
  };

  return (
    <div className="min-h-screen relative">
      <Navigation />
      <Hero selectedAlbum={selectedAlbum} onBackToHome={handleBackToHome} />
      <Slideshow />
      <PortfolioGallery onAlbumSelect={handleAlbumSelect} />
      <About />
      {/* Add padding bottom when footer is in overlay mode to prevent content being hidden */}
      <div className="pb-20" />
      <SimplifiedFooter />
    </div>
  );
};

export default Index;
