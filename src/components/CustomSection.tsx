import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactModal } from '@/components/ContactModal';
import ProtectedImage from '@/components/ProtectedImage';
import { getBackendAdapter } from '@/config/backend-config';
import { 
  Palette, Camera, Laptop, Heart, Mail, Monitor, 
  Smartphone, Globe, Users, Star, Award, 
  TrendingUp, Target, Coffee, Code, Brush
} from 'lucide-react';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useTranslation } from '@/hooks/useTranslation';

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
    type: 'stat' | 'service' | 'skill' | 'button';
    label?: string;
    value?: string;
    title?: string;
    description?: string;
    icon?: string;
    button_text?: string;
    button_link?: string;
    stat_link?: string;
  }>;
  button_text?: string;
  button_link?: string;
}

interface CustomSectionProps {
  sectionData: CustomSectionData;
}

const iconMap: Record<string, any> = {
  Palette, Camera, Laptop, Heart, Mail, Monitor,
  Smartphone, Globe, Users, Star, Award,
  TrendingUp, Target, Coffee, Code, Brush
};

const CustomSection = ({ sectionData }: CustomSectionProps) => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { t } = useTranslation();
  
  useAccentColor(); // Initialize dynamic accent color

  const handleButtonClick = () => {
    if (!sectionData.button_link) return;

    // Handle different types of links
    if (sectionData.button_link.startsWith('#')) {
      // Internal anchor link - smooth scroll
      const targetId = sectionData.button_link.substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (sectionData.button_link === 'contact') {
      // Open contact modal
      setIsContactModalOpen(true);
    } else if (sectionData.button_link.startsWith('http')) {
      // External link
      window.open(sectionData.button_link, '_blank', 'noopener,noreferrer');
    } else {
      // Internal navigation
      window.location.href = sectionData.button_link;
    }
  };

  const renderContentRightItem = (item: CustomSectionData['content_right'][0], index: number) => {
    switch (item.type) {
      case 'stat':
        const StatContent = (
          <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
            <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {item.value}
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {item.label}
            </div>
          </div>
        );

        if (item.stat_link) {
          return (
            <div key={index} className="cursor-pointer transition-transform hover:scale-105" onClick={() => {
              if (item.stat_link?.startsWith('#')) {
                const targetElement = document.getElementById(item.stat_link.substring(1));
                if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
              } else if (item.stat_link === 'contact') {
                setIsContactModalOpen(true);
              } else if (item.stat_link?.startsWith('http')) {
                window.open(item.stat_link, '_blank', 'noopener,noreferrer');
              } else if (item.stat_link) {
                window.location.href = item.stat_link;
              }
            }}>
              {StatContent}
            </div>
          );
        }

        return <div key={index}>{StatContent}</div>;
      
      case 'service':
        const ServiceIcon = item.icon ? iconMap[item.icon] : Heart;
        return (
          <Card key={index} className="h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <ServiceIcon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.description}
              </p>
            </CardContent>
          </Card>
        );
      
      case 'skill':
        return (
          <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
            {item.label}
          </Badge>
        );

      case 'button':
        return (
          <div key={index} className="mb-4">
            <Button
              onClick={() => {
                if (!item.button_link) return;
                if (item.button_link.startsWith('#')) {
                  const targetElement = document.getElementById(item.button_link.substring(1));
                  if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
                } else if (item.button_link === 'contact') {
                  setIsContactModalOpen(true);
                } else if (item.button_link.startsWith('http')) {
                  window.open(item.button_link, '_blank', 'noopener,noreferrer');
                } else {
                  window.location.href = item.button_link;
                }
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-2"
            >
              {item.button_text || item.label}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <section 
        id={`custom-${sectionData.slug}`}
        className="section-padding bg-background snap-section min-h-screen"
      >
        <div className="container mx-auto max-w-7xl">
          {/* Header Image */}
          {sectionData.header_image_url && (
            <div className="mb-12 relative">
              <div className="h-[350px] max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg">
                <ProtectedImage
                  src={sectionData.header_image_url}
                  alt={sectionData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              {sectionData.title}
            </h2>
          </div>

          {/* Two-column content */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Text Content */}
            <div className="space-y-6">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <p className="text-muted-foreground leading-relaxed">
                  {sectionData.content_left}
                </p>
              </div>

              {/* Button */}
              {sectionData.button_text && (
                <div className="pt-4">
                  <Button 
                    onClick={handleButtonClick}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-3 text-lg"
                  >
                    {sectionData.button_text}
                  </Button>
                </div>
              )}
            </div>

            {/* Right Column - Elements */}
            <div className="space-y-6">
              {/* Stats - displayed in a grid */}
              {sectionData.content_right.filter(item => item.type === 'stat').length > 0 && (
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {sectionData.content_right
                    .filter(item => item.type === 'stat')
                    .map((item, index) => renderContentRightItem(item, index))}
                </div>
              )}

              {/* Services - displayed as cards */}
              {sectionData.content_right.filter(item => item.type === 'service').length > 0 && (
                <div className="grid gap-4 mb-8">
                  {sectionData.content_right
                    .filter(item => item.type === 'service')
                    .map((item, index) => renderContentRightItem(item, index))}
                </div>
              )}

              {/* Skills - displayed as badges */}
              {sectionData.content_right.filter(item => item.type === 'skill').length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {sectionData.content_right
                    .filter(item => item.type === 'skill')
                    .map((item, index) => renderContentRightItem(item, index))}
                </div>
              )}

              {/* Buttons - displayed as individual buttons */}
              {sectionData.content_right.filter(item => item.type === 'button').length > 0 && (
                <div className="space-y-3">
                  {sectionData.content_right
                    .filter(item => item.type === 'button')
                    .map((item, index) => renderContentRightItem(item, index))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
};

export default CustomSection;