import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Slideshow from '@/components/Slideshow';
import PortfolioGallery from '@/components/PortfolioGallery';
import About from '@/components/About';
import CustomSection from '@/components/CustomSection';
import SimplifiedFooter from '@/components/SimplifiedFooter';
import { ContactModal } from '@/components/ContactModal';
import { SEOMetaTags } from '@/components/SEOMetaTags';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useScrollPosition } from '@/hooks/useScrollPosition';
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
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);

  // Initialize accent color on page load
  useAccentColor();

  // Initialize scroll position management
  useScrollPosition();

  // Fetch custom sections and albums
  useEffect(() => {
    fetchCustomSections();
    fetchAlbums();
  }, []);

  // Handle hash navigation for contact modal, album deep links, and smart combinations
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;

      if (hash === '#contact') {
        setIsContactModalOpen(true);
        // Remove hash from URL after opening modal
        window.history.replaceState(null, '', window.location.pathname);
      } else if (hash.startsWith('#album-')) {
        // Handle album deep links
        const albumSlug = hash.substring(7); // Remove '#album-'
        const targetAlbum = albums.find(album => album.slug === albumSlug);

        if (targetAlbum) {
          setSelectedAlbum(targetAlbum);
          // Scroll to top to show the slideshow
          window.scrollTo({ top: 0, behavior: 'smooth' });
          // Remove hash from URL after selecting album
          window.history.replaceState(null, '', window.location.pathname);
        }
      } else if (hash.includes('&')) {
        // Handle smart URL combinations like #portfolio&album=nature or #about&contact
        handleSmartCombination(hash);
      } else if (hash.startsWith('#')) {
        // Handle standard section scrolling
        const targetId = hash.substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    // Check initial hash on mount (only if albums are loaded)
    if (albums.length > 0) {
      handleHashChange();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [albums]); // Depend on albums so it runs when albums are loaded

  // Additional hash handler for custom sections - runs independently
  useEffect(() => {
    const handleCustomSectionHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#') && !hash.startsWith('#album-') && hash !== '#contact') {
        const targetId = hash.substring(1);
        let targetElement = document.getElementById(targetId);

        // If not found, try with 'custom-' prefix for custom sections
        if (!targetElement) {
          targetElement = document.getElementById(`custom-${targetId}`);
        }

        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    // Check initial hash on mount
    handleCustomSectionHash();

    // Listen for hash changes
    window.addEventListener('hashchange', handleCustomSectionHash);

    return () => {
      window.removeEventListener('hashchange', handleCustomSectionHash);
    };
  }, [customSections]); // Depend on custom sections so it runs when they are loaded

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

  const fetchAlbums = async () => {
    try {
      const backend = getBackendAdapter();
      const { data: albumsData, error: albumsError } = await backend
        .from('albums')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (albumsError) throw albumsError;

      // For deep linking, we only need basic album info (not photos)
      setAlbums(albumsData || []);
    } catch (error) {
      console.error('Error fetching albums for deep linking:', error);
    }
  };

  const handleSmartCombination = (hash: string) => {
    // Parse combinations like #portfolio&album=nature or #about&contact
    const [sectionPart, ...actionParts] = hash.substring(1).split('&');

    // First, scroll to the section
    const targetElement = document.getElementById(sectionPart);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }

    // Then, handle additional actions with a delay to allow scrolling
    setTimeout(() => {
      actionParts.forEach(actionPart => {
        if (actionPart === 'contact') {
          setIsContactModalOpen(true);
        } else if (actionPart.startsWith('album=')) {
          const albumSlug = actionPart.substring(6); // Remove 'album='
          const targetAlbum = albums.find(album => album.slug === albumSlug);
          if (targetAlbum) {
            setSelectedAlbum(targetAlbum);
            // If we're on portfolio section, just select the album
            // If we're elsewhere, scroll to top to show slideshow
            if (sectionPart !== 'portfolio') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }
      });

      // Clean up URL after processing
      window.history.replaceState(null, '', window.location.pathname);
    }, 500); // Small delay for smooth UX
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
      <SEOMetaTags
        title={selectedAlbum ? selectedAlbum.name : undefined}
        description={selectedAlbum ? selectedAlbum.description : undefined}
        type={selectedAlbum ? 'article' : 'website'}
      />
      <Navigation />
      <Hero selectedAlbum={selectedAlbum} onBackToHome={handleBackToHome} />
      <Slideshow />
      <PortfolioGallery onAlbumSelect={handleAlbumSelect} />
      <About onContactClick={() => setIsContactModalOpen(true)} />

      {/* Custom Sections */}
      {customSections.map((section) => (
        <CustomSection
          key={section.id}
          sectionData={section}
          onContactClick={() => setIsContactModalOpen(true)}
        />
      ))}

      {/* Add padding bottom when footer is in overlay mode to prevent content being hidden */}
      <div className="pb-20" />
      <SimplifiedFooter />

      {/* Contact Modal */}
      <ContactModal
        open={isContactModalOpen}
        onOpenChange={setIsContactModalOpen}
      />
    </div>
  );
};

export default Index;
