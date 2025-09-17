import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContactModal } from '@/components/ContactModal';
import { ContentGridRenderer } from '@/components/ContentGridRenderer';
import ProtectedImage from '@/components/ProtectedImage';
import { getBackendAdapter } from '@/config/backend-config';
import { ContentElement } from '@/types/content-grid';
import {
  Palette, Camera, Laptop, Heart, Mail, Monitor,
  Smartphone, Globe, Users, Star, Award,
  TrendingUp, Target, Coffee, Code, Brush
} from 'lucide-react';
import { useAccentColor } from '@/hooks/useAccentColor';
import { useTranslation } from '@/hooks/useTranslation';
import { useFonts } from '@/hooks/useFonts';

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
  content_elements?: ContentElement[];  // New grid-based content
  button_text?: string;
  button_link?: string;
  buttons?: Array<{
    text: string;
    link: string;
    style?: 'primary' | 'secondary' | 'outline';
  }>;
  background_color?: string;  // New background color field
}

interface CustomSectionProps {
  sectionData: CustomSectionData;
  onContactClick?: () => void;
}

const iconMap: Record<string, any> = {
  Palette, Camera, Laptop, Heart, Mail, Monitor,
  Smartphone, Globe, Users, Star, Award,
  TrendingUp, Target, Coffee, Code, Brush
};

const CustomSection = ({ sectionData, onContactClick }: CustomSectionProps) => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { t } = useTranslation();
  const { fontSettings } = useFonts();

  const accentColor = useAccentColor(); // Initialize and get dynamic accent color

  const handleButtonClick = () => {
    if (!sectionData.button_link) return;

    // Handle different types of links
    if (sectionData.button_link.startsWith('#')) {
      // Internal anchor link - smooth scroll
      const targetId = sectionData.button_link.substring(1);
      let targetElement = document.getElementById(targetId);

      // If not found, try with 'custom-' prefix
      if (!targetElement) {
        targetElement = document.getElementById(`custom-${targetId}`);
      }

      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (sectionData.button_link === 'contact' || sectionData.button_link === '#contact') {
      // Open contact modal
      if (onContactClick) {
        onContactClick();
      } else {
        setIsContactModalOpen(true);
      }
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
                const targetId = item.stat_link.substring(1);
                let targetElement = document.getElementById(targetId);

                // If not found, try with 'custom-' prefix
                if (!targetElement) {
                  targetElement = document.getElementById(`custom-${targetId}`);
                }

                if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
              } else if (item.stat_link === 'contact' || item.stat_link === '#contact') {
                if (onContactClick) {
                  onContactClick();
                } else {
                  setIsContactModalOpen(true);
                }
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
                <h3
                  className="font-semibold"
                  style={{
                    fontFamily: fontSettings.title_font_family ?
                      `'${fontSettings.title_font_family}', serif` :
                      'var(--font-title, "Playfair Display", serif)',
                    color: accentColor
                  }}
                >
                  {item.title}
                </h3>
              </div>
              <p
                className="text-muted-foreground text-sm leading-relaxed"
                style={{
                  fontFamily: fontSettings.content_font_family ?
                    `'${fontSettings.content_font_family}', sans-serif` :
                    'var(--font-content, "Roboto", sans-serif)'
                }}
              >
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
                  const targetId = item.button_link.substring(1);
                  let targetElement = document.getElementById(targetId);

                  // If not found, try with 'custom-' prefix
                  if (!targetElement) {
                    targetElement = document.getElementById(`custom-${targetId}`);
                  }

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

  // Generate inline style for background color
  const sectionStyle = sectionData.background_color && sectionData.background_color !== 'transparent'
    ? { backgroundColor: sectionData.background_color }
    : {};

  // Determine if we should use default background class
  const shouldUseDefaultBg = !sectionData.background_color || sectionData.background_color === 'transparent';

  return (
    <>
      <section
        id={`custom-${sectionData.slug}`}
        className={`section-padding snap-section min-h-screen ${shouldUseDefaultBg ? 'bg-background' : ''}`}
        style={sectionStyle}
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
            <h2
              className="text-4xl md:text-5xl font-bold mb-6"
              style={{
                fontFamily: fontSettings.title_font_family ?
                  `'${fontSettings.title_font_family}', serif` :
                  'var(--font-title, "Playfair Display", serif)',
                color: accentColor,
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {sectionData.title}
            </h2>
          </div>

          {/* Content Section - Use grid renderer if available, otherwise legacy layout */}
          {sectionData.content_elements && sectionData.content_elements.length > 0 ? (
            <div className="mb-12">
              <ContentGridRenderer elements={sectionData.content_elements} />
            </div>
          ) : (
            /* Legacy Two-column content */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Left Column - Text Content */}
              <div className="space-y-6">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <p
                    className="text-muted-foreground leading-relaxed"
                    style={{
                      fontFamily: fontSettings.content_font_family ?
                        `'${fontSettings.content_font_family}', sans-serif` :
                        'var(--font-content, "Roboto", sans-serif)'
                    }}
                  >
                    {sectionData.content_left}
                  </p>
                </div>
              </div>

              {/* Right Column - Elements */}
              <div className="space-y-6">
                {/* Stats - displayed in a grid */}
                {sectionData.content_right.filter(item => item.type === 'stat').length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-8">
                    {sectionData.content_right
                      .filter(item => item.type === 'stat')
                      .map((item, index) => renderContentRightItem(item, index))}
                  </div>
                )}

                {/* Services - displayed as cards */}
                {sectionData.content_right.filter(item => item.type === 'service').length > 0 && (
                  <div className="grid grid-cols-1 gap-4 mb-8">
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
          )}

          {/* Buttons - show multiple buttons or legacy single button */}
          {(sectionData.buttons && sectionData.buttons.length > 0) ? (
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center mt-8">
              {sectionData.buttons.map((button, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    // Handle different types of links (same as legacy button)
                    if (button.link.startsWith('#')) {
                      const targetId = button.link.substring(1);
                      let targetElement = document.getElementById(targetId);

                      // If not found, try with 'custom-' prefix
                      if (!targetElement) {
                        targetElement = document.getElementById(`custom-${targetId}`);
                      }

                      if (targetElement) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    } else if (button.link === 'contact' || button.link === '#contact') {
                      if (onContactClick) {
                        onContactClick();
                      } else {
                        setIsContactModalOpen(true);
                      }
                    } else if (button.link.startsWith('http')) {
                      window.open(button.link, '_blank', 'noopener,noreferrer');
                    } else {
                      window.location.href = button.link;
                    }
                  }}
                  variant={
                    button.style === 'secondary' ? 'secondary' :
                    button.style === 'outline' ? 'outline' : 'default'
                  }
                  className={
                    button.style === 'primary' || !button.style
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-2 sm:px-8 sm:py-3 text-base sm:text-lg w-full sm:w-auto"
                      : "font-semibold px-6 py-2 sm:px-8 sm:py-3 text-base sm:text-lg w-full sm:w-auto"
                  }
                >
                  {button.text}
                </Button>
              ))}
            </div>
          ) : sectionData.button_text && (
            /* Legacy single button */
            <div className="text-center mt-8">
              <Button
                onClick={handleButtonClick}
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 py-2 sm:px-8 sm:py-3 text-base sm:text-lg w-full sm:w-auto max-w-xs sm:max-w-none"
              >
                {sectionData.button_text}
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Contact Modal - only show if no global handler */}
      {!onContactClick && (
        <ContactModal
          open={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
        />
      )}
    </>
  );
};

export default CustomSection;