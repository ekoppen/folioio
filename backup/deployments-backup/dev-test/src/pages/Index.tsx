import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Slideshow from '@/components/Slideshow';
import PortfolioGallery from '@/components/PortfolioGallery';
import About from '@/components/About';
import CustomSection from '@/components/CustomSection';
import SimplifiedFooter from '@/components/SimplifiedFooter';
import { useAccentColor } from '@/hooks/useAccentColor';
import { supabase } from '@/integrations/supabase/client';

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

interface CustomSectionData {
  id: string;
  name: string;
  slug: string;
  title: string;
  is_active: boolean;
  show_in_navigation: boolean;
  show_hero_button: boolean;
  menu_order: number;
  header_image_url?: string;
  content_left: string;
  content_right: Array<{
    type: 'stat' | 'service' | 'skill';
    label?: string;
    value?: string;
    title?: string;
    description?: string;
    icon?: string;
  }>;
  button_text?: string;
  button_link?: string;
}

const Index = () => {
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [customSections, setCustomSections] = useState<CustomSectionData[]>([]);
  
  // Initialize accent color on page load
  useAccentColor();

  // Fetch custom sections
  useEffect(() => {
    fetchCustomSections();
  }, []);

  const fetchCustomSections = async () => {
    try {
      const response = await fetch('/api/custom-sections');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCustomSections(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching custom sections:', error);
    }
  };

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
      
      {/* Custom Sections */}
      {customSections.map((section) => (
        <CustomSection key={section.id} sectionData={section} />
      ))}
      
      {/* Add padding bottom when footer is in overlay mode to prevent content being hidden */}
      <div className="pb-20" />
      <SimplifiedFooter />
    </div>
  );
};

export default Index;
